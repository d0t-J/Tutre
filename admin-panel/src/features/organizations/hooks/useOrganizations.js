import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';

const CODE_COLUMNS = 'id, code, org_id, role, max_uses, uses, expires_at, revoked, created_at';

// Every school on Tutre, for platform admins. RLS lets platform admins read all
// organisations, memberships, sections, profiles and codes; for anyone else these
// queries return nothing, and the page is not offered to them.
export const useOrganizations = () => {
  const { user, studioRole } = useAuth();

  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const [orgs, memberships, sections, codes] = await Promise.all([
        supabase.from('organizations').select('id, name, slug, status, created_at').order('name'),
        supabase.from('org_memberships').select('id, org_id, user_id, role, status, created_at'),
        supabase.from('sections').select('id, org_id, archived'),
        supabase
          .from('invite_codes')
          .select(CODE_COLUMNS)
          .eq('role', 'org_admin')
          .order('created_at', { ascending: false }),
      ]);
      for (const result of [orgs, memberships, sections, codes]) {
        if (result.error) throw new Error(result.error.message);
      }

      const adminIds = [...new Set(memberships.data.filter(m => m.role === 'org_admin').map(m => m.user_id))];
      let names = {};
      if (adminIds.length > 0) {
        const { data, error } = await supabase.from('profiles').select('id, display_name').in('id', adminIds);
        if (error) throw new Error(error.message);
        names = Object.fromEntries(data.map(p => [p.id, p.display_name]));
      }

      return orgs.data.map(org => {
        const members = memberships.data.filter(m => m.org_id === org.id);
        const activeCount = (role) => members.filter(m => m.role === role && m.status === 'active').length;
        return {
          ...org,
          counts: {
            students: activeCount('student'),
            teachers: activeCount('teacher'),
            sections: sections.data.filter(s => s.org_id === org.id && !s.archived).length,
          },
          admins: members
            .filter(m => m.role === 'org_admin')
            .map(m => ({ id: m.id, userId: m.user_id, name: names[m.user_id] || 'Unknown', status: m.status })),
          adminCodes: codes.data.filter(c => c.org_id === org.id),
        };
      });
    },
    enabled: !!user && studioRole === 'platform_admin',
  });
};

const useOrganizationMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });
};

const rpc = async (name, args) => {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
};

// Returns { org_id, name, slug, admin_code, admin_code_expires_at }.
export const useCreateOrganization = () =>
  useOrganizationMutation(({ name, slug }) => rpc('create_organization', { p_name: name, p_slug: slug }));

export const useSetOrganizationStatus = () =>
  useOrganizationMutation(({ orgId, status }) => rpc('set_organization_status', { p_org: orgId, p_status: status }));

export const useCreateAdminCode = () =>
  useOrganizationMutation(({ orgId }) =>
    rpc('create_invite_code', { p_org: orgId, p_role: 'org_admin', p_section: null, p_max_uses: 1, p_valid_days: 14 }));

export const useRevokeCode = () =>
  useOrganizationMutation((codeId) => rpc('revoke_invite_code', { p_id: codeId }));

// Removing an org admin is for platform admins only (enforced by a trigger), and
// a school must keep at least one.
export const useSetAdminStatus = () =>
  useOrganizationMutation(async ({ membershipId, status }) => {
    const { data, error } = await supabase
      .from('org_memberships')
      .update({ status })
      .eq('id', membershipId)
      .select('id');
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("You don't have permission to do that.");
  });

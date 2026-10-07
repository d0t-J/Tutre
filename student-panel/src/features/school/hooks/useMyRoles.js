import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';

// Which school screens the signed-in user can open. A suspended school's row is
// not readable, so its memberships count towards hasSchool but grant nothing.
export const useMyRoles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_memberships')
        .select('org_id, role, organizations(id, name, status)')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) throw new Error(error.message);

      const active = data.filter(m => m.organizations?.status === 'active');
      return {
        adminOrgs: active.filter(m => m.role === 'org_admin').map(m => m.organizations),
        isTeacher: active.some(m => m.role === 'teacher'),
        hasSchool: data.length > 0,
        hasSuspendedSchool: data.some(m => m.organizations?.status !== 'active'),
      };
    },
    enabled: !!user,
  });
};

// Every school screen reads through these keys; refresh them all after a change.
export const invalidateSchoolQueries = (queryClient) => {
  for (const key of ['my-roles', 'my-school', 'teaching', 'school-admin']) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

export const useRedeemCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code) => {
      const { data, error } = await supabase.rpc('redeem_invite_code', { p_code: code });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => invalidateSchoolQueries(queryClient),
  });
};

// What a code is for, without using it (Phase 5a): staff codes are redeemed in
// the staff portal, not here.
export const peekInviteCode = async (code) => {
  const { data, error } = await supabase.rpc('peek_invite_code', { p_code: code });
  if (error) throw new Error(error.message);
  return data;
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import { byName } from '../utils/school';

// Class codes (Phase 5f) are shown on their own card, not in these lists.
const CODE_COLUMNS = 'id, code, role, section_id, max_uses, uses, expires_at, revoked, created_by, created_at, is_class_code';

// Everything the org admin screen shows for one school: the school, its members
// (with names, including removed members), its sections with their members, and
// its invite codes.
export const useSchoolAdmin = (orgId) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['school-admin', orgId],
    queryFn: async () => {
      const [school, memberships, sections, codes] = await Promise.all([
        supabase.from('organizations').select('id, name, slug, status').eq('id', orgId).single(),
        supabase
          .from('org_memberships')
          .select('id, user_id, role, status, is_head, created_at')
          .eq('org_id', orgId)
          .order('created_at'),
        supabase
          .from('sections')
          .select('id, name, class_id, academic_year, archived, created_at, classes(name)')
          .eq('org_id', orgId),
        supabase
          .from('invite_codes')
          .select(CODE_COLUMNS)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false }),
      ]);
      for (const result of [school, memberships, sections, codes]) {
        if (result.error) throw new Error(result.error.message);
      }

      const sectionIds = sections.data.map(s => s.id);
      const userIds = [...new Set(memberships.data.map(m => m.user_id))];

      const [sectionMembers, profiles] = await Promise.all([
        sectionIds.length > 0
          ? supabase.from('section_members').select('section_id, user_id, role').in('section_id', sectionIds)
          : Promise.resolve({ data: [], error: null }),
        userIds.length > 0
          ? supabase.from('profiles').select('id, display_name').in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (sectionMembers.error) throw new Error(sectionMembers.error.message);
      if (profiles.error) throw new Error(profiles.error.message);

      const names = Object.fromEntries(profiles.data.map(p => [p.id, p.display_name]));
      const nameOf = (userId) => names[userId] || 'Unknown';

      return {
        school: school.data,
        members: memberships.data
          .map(m => ({
            id: m.id,
            userId: m.user_id,
            name: nameOf(m.user_id),
            role: m.role,
            status: m.status,
            isHead: m.is_head,
            joinedAt: m.created_at,
            isMe: m.user_id === user.id,
          }))
          .sort(byName),
        sections: sections.data
          .map(s => ({
            id: s.id,
            name: s.name,
            classId: s.class_id,
            className: s.classes?.name ?? null,
            academicYear: s.academic_year,
            archived: s.archived,
            members: sectionMembers.data
              .filter(sm => sm.section_id === s.id)
              .map(sm => ({ userId: sm.user_id, role: sm.role, name: nameOf(sm.user_id) }))
              .sort(byName),
          }))
          .sort(byName),
        codes: codes.data.filter(c => !c.is_class_code),
      };
    },
    enabled: !!user && !!orgId,
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';
import { byName } from '../utils/school';

const CODE_COLUMNS = 'id, code, role, section_id, max_uses, uses, expires_at, revoked, created_by, created_at';

// The sections the signed-in user teaches, with their students and the student
// codes tied to each section.
export const useTeaching = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teaching', user?.id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('section_members')
        .select('sections(id, org_id, name, academic_year, archived, classes(id, name), organizations(name))')
        .eq('user_id', user.id)
        .eq('role', 'teacher');
      if (error) throw new Error(error.message);

      const sections = rows.map(r => r.sections).filter(s => s && !s.archived);
      const sectionIds = sections.map(s => s.id);
      if (sectionIds.length === 0) return [];

      const [{ data: students, error: studentError }, { data: codes, error: codeError }] = await Promise.all([
        supabase
          .from('section_members')
          .select('section_id, user_id, created_at')
          .in('section_id', sectionIds)
          .eq('role', 'student'),
        supabase
          .from('invite_codes')
          .select(CODE_COLUMNS)
          .in('section_id', sectionIds)
          .eq('role', 'student')
          .order('created_at', { ascending: false }),
      ]);
      if (studentError) throw new Error(studentError.message);
      if (codeError) throw new Error(codeError.message);

      const studentIds = [...new Set(students.map(s => s.user_id))];
      let names = {};
      if (studentIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', studentIds);
        if (profileError) throw new Error(profileError.message);
        names = Object.fromEntries(profiles.map(p => [p.id, p.display_name]));
      }

      return sections
        .map(s => ({
          id: s.id,
          orgId: s.org_id,
          orgName: s.organizations?.name ?? '',
          name: s.name,
          classId: s.classes?.id ?? null,
          className: s.classes?.name ?? null,
          academicYear: s.academic_year,
          students: students
            .filter(st => st.section_id === s.id)
            .map(st => ({ userId: st.user_id, name: names[st.user_id] ?? 'Unknown', joinedAt: st.created_at }))
            .sort(byName),
          codes: codes.filter(c => c.section_id === s.id),
        }))
        .sort(byName);
    },
    enabled: !!user,
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../auth';

// The schools and sections the signed-in user belongs to, with the names of the
// teachers of each section. RLS decides what is visible: a user reads their own
// memberships, their organisations and sections, and the profiles of the
// teachers of sections they belong to.
export const useMySchool = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-school', user?.id],
    queryFn: async () => {
      const { data: memberships, error: membershipError } = await supabase
        .from('org_memberships')
        .select('org_id, role, organizations(id, name, status)')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (membershipError) throw new Error(membershipError.message);

      const { data: mySections, error: sectionError } = await supabase
        .from('section_members')
        .select('role, sections(id, org_id, name, academic_year, archived, classes(id, name))')
        .eq('user_id', user.id);
      if (sectionError) throw new Error(sectionError.message);

      const sections = mySections.filter(row => row.sections && !row.sections.archived);
      const sectionIds = sections.map(row => row.sections.id);

      let teacherRows = [];
      let teacherNames = {};
      if (sectionIds.length > 0) {
        const { data, error } = await supabase
          .from('section_members')
          .select('section_id, user_id')
          .in('section_id', sectionIds)
          .eq('role', 'teacher');
        if (error) throw new Error(error.message);
        teacherRows = data;

        const teacherIds = [...new Set(teacherRows.map(row => row.user_id))];
        if (teacherIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', teacherIds);
          if (profileError) throw new Error(profileError.message);
          teacherNames = Object.fromEntries(profiles.map(p => [p.id, p.display_name]));
        }
      }

      // One entry per school, with the user's roles there and their sections.
      const schools = new Map();
      for (const membership of memberships) {
        if (!membership.organizations) continue;
        const school = schools.get(membership.org_id) ?? {
          ...membership.organizations,
          roles: [],
          sections: [],
        };
        school.roles.push(membership.role);
        schools.set(membership.org_id, school);
      }

      for (const row of sections) {
        const school = schools.get(row.sections.org_id);
        if (!school) continue;
        const teachers = teacherRows
          .filter(t => t.section_id === row.sections.id && t.user_id !== user.id)
          .map(t => teacherNames[t.user_id])
          .filter(Boolean);
        school.sections.push({
          id: row.sections.id,
          name: row.sections.name,
          classId: row.sections.classes?.id ?? null,
          className: row.sections.classes?.name ?? null,
          academicYear: row.sections.academic_year,
          role: row.role,
          teachers,
        });
      }

      return [...schools.values()];
    },
    enabled: !!user,
  });
};

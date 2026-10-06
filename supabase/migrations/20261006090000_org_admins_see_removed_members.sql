-- Phase 2d: org admins can see the names of removed members of their school.
--
-- The school management screen lists removed teachers and students so an org
-- admin can restore the right person. Until now the org-admin branch of
-- can_view_profile only covered *active* members, so removed members showed up
-- without a name.
--
-- Only that branch changes: an org admin (active, in an active school) now sees
-- every member of their school whatever the member's status. Teachers, students
-- and other schools see exactly what they saw before.
CREATE OR REPLACE FUNCTION "private"."can_view_profile"("p_user" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT p_user = (SELECT auth.uid())
        OR private.is_platform_admin()
        -- an org admin sees the members of their school, including removed ones
        OR EXISTS (
            SELECT 1
            FROM public.org_memberships viewer
            JOIN public.org_memberships target ON target.org_id = viewer.org_id
            JOIN public.organizations o ON o.id = viewer.org_id
            WHERE viewer.user_id = (SELECT auth.uid())
              AND viewer.role = 'org_admin'
              AND viewer.status = 'active'
              AND target.user_id = p_user
              AND o.status = 'active'
        )
        -- a teacher sees the students in sections they teach
        OR EXISTS (
            SELECT 1
            FROM public.section_members teacher
            JOIN public.section_members student ON student.section_id = teacher.section_id
            JOIN public.sections s ON s.id = teacher.section_id
            JOIN public.organizations o ON o.id = s.org_id
            WHERE teacher.user_id = (SELECT auth.uid())
              AND teacher.role = 'teacher'
              AND student.user_id = p_user
              AND student.role = 'student'
              AND o.status = 'active'
        )
        -- any section member sees the teachers of that section
        OR EXISTS (
            SELECT 1
            FROM public.section_members viewer
            JOIN public.section_members teacher ON teacher.section_id = viewer.section_id
            JOIN public.sections s ON s.id = viewer.section_id
            JOIN public.organizations o ON o.id = s.org_id
            WHERE viewer.user_id = (SELECT auth.uid())
              AND teacher.user_id = p_user
              AND teacher.role = 'teacher'
              AND o.status = 'active'
        );
$$;

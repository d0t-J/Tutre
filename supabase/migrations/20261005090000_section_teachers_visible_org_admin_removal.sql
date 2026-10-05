-- Phase 2a follow-up, agreed after the 2a review (2026-10-05):
--
-- 1. Members of a section can see who teaches it. Students see their teachers'
--    profiles and section rows (so the app can show "9-A, taught by Ms Ayesha"),
--    and co-teachers of a section see each other. Nothing else about other
--    students becomes visible to students.
--
-- 2. Only platform admins can remove an org admin. Org admins can still appoint
--    more org admins with invite codes, and restore a removed one, but cannot
--    remove one, so a newly added org admin cannot lock out the principal. The
--    "a school keeps at least one org admin" rule still applies to platform admins.

-- 1a. Profiles: add "a teacher of a section the viewer belongs to".
CREATE OR REPLACE FUNCTION "private"."can_view_profile"("p_user" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT p_user = (SELECT auth.uid())
        OR private.is_platform_admin()
        -- an org admin sees the active members of their school
        OR EXISTS (
            SELECT 1
            FROM public.org_memberships viewer
            JOIN public.org_memberships target ON target.org_id = viewer.org_id
            JOIN public.organizations o ON o.id = viewer.org_id
            WHERE viewer.user_id = (SELECT auth.uid())
              AND viewer.role = 'org_admin'
              AND viewer.status = 'active'
              AND target.user_id = p_user
              AND target.status = 'active'
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

-- 1b. Section rows: members see the teacher rows of their sections.
CREATE POLICY "Section members can see their section's teachers" ON "public"."section_members"
    FOR SELECT TO "authenticated"
    USING (("role" = 'teacher' AND "private"."is_section_member"("section_id", NULL)));

-- 2. Removing an org admin is for platform admins only. A trigger rather than a
--    policy change, so an org admin who tries gets a clear error instead of a
--    silent "0 rows updated". Restoring (removed -> active) is still allowed.
CREATE FUNCTION "private"."restrict_org_admin_removal"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF OLD.role = 'org_admin' AND OLD.status = 'active' AND NEW.status <> 'active'
       AND NOT private.is_platform_admin() THEN
        RAISE EXCEPTION 'Only Tutre platform admins can remove an org admin.' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

-- Postgres fires BEFORE triggers in alphabetical order of name. This name sorts
-- before "org_memberships_protect_last_admin", so an org admin trying to remove
-- the last org admin is told the real reason (only platform admins may), not
-- "a school must keep one".
CREATE TRIGGER "org_memberships_admin_removal_platform_only"
    BEFORE UPDATE OF "status" ON "public"."org_memberships"
    FOR EACH ROW EXECUTE FUNCTION "private"."restrict_org_admin_removal"();

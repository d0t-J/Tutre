-- Phase 2d access tests: who can see the names of removed members.
-- Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(9);

CREATE SCHEMA test_helpers;
CREATE FUNCTION test_helpers.login(p uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', p::text, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
END $$;
CREATE FUNCTION test_helpers.logout() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claims', '', true);
END $$;
GRANT USAGE ON SCHEMA test_helpers TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test_helpers TO authenticated;

-- People. School A: principal d1, teacher d2, students d3 (stays) and d4 (removed).
-- School B: principal e1 and student e2 (removed).
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-0000000000d1', 'principal.a@tutre.test', '{"full_name":"Principal A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000d2', 'teacher.a@tutre.test', '{"full_name":"Teacher A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000d3', 'student.a1@tutre.test', '{"full_name":"Student A1"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000d4', 'student.a2@tutre.test', '{"full_name":"Student A2"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e1', 'principal.b@tutre.test', '{"full_name":"Principal B"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e2', 'student.b@tutre.test', '{"full_name":"Student B"}', 'authenticated', 'authenticated');

INSERT INTO organizations (id, name, slug) VALUES
    ('00000000-0000-0000-0000-00000000aaaa', 'School A', 'school-a'),
    ('00000000-0000-0000-0000-00000000bbbb', 'School B', 'school-b');
INSERT INTO org_memberships (org_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000d1', 'org_admin'),
    ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000d2', 'teacher'),
    ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000d3', 'student'),
    ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000d4', 'student'),
    ('00000000-0000-0000-0000-00000000bbbb', '00000000-0000-0000-0000-0000000000e1', 'org_admin'),
    ('00000000-0000-0000-0000-00000000bbbb', '00000000-0000-0000-0000-0000000000e2', 'student');
INSERT INTO sections (id, org_id, name) VALUES
    ('00000000-0000-0000-0000-00000000a9a9', '00000000-0000-0000-0000-00000000aaaa', '9-A');
INSERT INTO section_members (section_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000a9a9', '00000000-0000-0000-0000-0000000000d2', 'teacher'),
    ('00000000-0000-0000-0000-00000000a9a9', '00000000-0000-0000-0000-0000000000d3', 'student'),
    ('00000000-0000-0000-0000-00000000a9a9', '00000000-0000-0000-0000-0000000000d4', 'student');

-- Principal A removes student A2; principal B removes student B.
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000d1');
UPDATE org_memberships SET status = 'removed'
WHERE user_id = '00000000-0000-0000-0000-0000000000d4' AND org_id = '00000000-0000-0000-0000-00000000aaaa';
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e1');
UPDATE org_memberships SET status = 'removed'
WHERE user_id = '00000000-0000-0000-0000-0000000000e2' AND org_id = '00000000-0000-0000-0000-00000000bbbb';
SELECT test_helpers.logout();

-- ===========================================================================
-- Org admin of the same school
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000d1');
SELECT is((SELECT display_name FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000d4'), 'Student A2',
    'an org admin sees the name of a removed member of their school');
SELECT is((SELECT count(*)::int FROM profiles), 4,
    'an org admin sees every member of their school, active or removed, and nobody else');
SELECT is((SELECT count(*)::int FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000e2'), 0,
    'an org admin does not see a removed member of another school');
SELECT lives_ok($$UPDATE org_memberships SET status = 'active'
    WHERE user_id = '00000000-0000-0000-0000-0000000000d4' AND org_id = '00000000-0000-0000-0000-00000000aaaa'$$,
    'an org admin can restore a removed member');
UPDATE org_memberships SET status = 'removed'
WHERE user_id = '00000000-0000-0000-0000-0000000000d4' AND org_id = '00000000-0000-0000-0000-00000000aaaa';
SELECT test_helpers.logout();

-- ===========================================================================
-- Everyone else sees no more than before
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000d2');
SELECT is((SELECT count(*)::int FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000d4'), 0,
    'a teacher does not see a student who was removed from the school');
SELECT is((SELECT display_name FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000d3'), 'Student A1',
    'a teacher still sees the students in their section');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000d3');
SELECT is((SELECT count(*)::int FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000d4'), 0,
    'a student does not see a removed classmate');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e1');
SELECT is((SELECT count(*)::int FROM profiles WHERE id IN ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000d3')), 0,
    'another school''s org admin sees nobody from School A');
SELECT test_helpers.logout();

-- A removed org admin loses the wider view.
INSERT INTO org_memberships (org_id, user_id, role, status) VALUES
    ('00000000-0000-0000-0000-00000000aaaa', '00000000-0000-0000-0000-0000000000e1', 'org_admin', 'removed');
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e1');
SELECT is((SELECT count(*)::int FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000d4'), 0,
    'a removed org admin no longer sees the school''s removed members');
SELECT test_helpers.logout();

SELECT * FROM finish();
ROLLBACK;

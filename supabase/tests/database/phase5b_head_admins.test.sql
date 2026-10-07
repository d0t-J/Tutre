-- Phase 5a/5b access tests: head admins, appointing admins, Tutre as an admin
-- of every school, get_my_context() and peek_invite_code().
-- Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(47);

CREATE SCHEMA test_helpers;
CREATE FUNCTION test_helpers.login(p uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', p::text, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
END $$;
CREATE FUNCTION test_helpers.anon() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    EXECUTE 'SET LOCAL ROLE anon';
END $$;
CREATE FUNCTION test_helpers.logout() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claims', '', true);
END $$;
GRANT USAGE ON SCHEMA test_helpers TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test_helpers TO authenticated, anon;

-- People. f0 Tutre platform admin. School A: f1 principal (head), f2 and f3
-- org admins, f4 and f5 teachers, f6 student, f7 not in any school yet.
-- School B: f8 principal.
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-0000000000f0', 'tutre.admin@tutre.test', '{"full_name":"Tutre Admin"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f1', 'principal.a@tutre.test', '{"full_name":"Principal A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f2', 'vice.a@tutre.test', '{"full_name":"Vice Principal A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f3', 'office.a@tutre.test', '{"full_name":"Office Admin A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f4', 'teacher.a@tutre.test', '{"full_name":"Teacher A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f5', 'teacher.a2@tutre.test', '{"full_name":"Teacher A2"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f6', 'student.a@tutre.test', '{"full_name":"Student A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f7', 'newcomer@tutre.test', '{"full_name":"Newcomer"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f8', 'principal.b@tutre.test', '{"full_name":"Principal B"}', 'authenticated', 'authenticated');
INSERT INTO admin_users (id, studio_role) VALUES ('00000000-0000-0000-0000-0000000000f0', 'platform_admin');

INSERT INTO organizations (id, name, slug) VALUES
    ('00000000-0000-0000-0000-00000000fa00', 'School A', 'school-a'),
    ('00000000-0000-0000-0000-00000000fb00', 'School B', 'school-b');
INSERT INTO org_memberships (org_id, user_id, role, created_at) VALUES
    ('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f1', 'org_admin', now() - interval '5 days'),
    ('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f2', 'org_admin', now() - interval '4 days'),
    ('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f3', 'org_admin', now() - interval '3 days'),
    ('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f4', 'teacher', now() - interval '2 days'),
    ('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f5', 'teacher', now() - interval '2 days'),
    ('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f6', 'student', now() - interval '1 day'),
    ('00000000-0000-0000-0000-00000000fb00', '00000000-0000-0000-0000-0000000000f8', 'org_admin', now() - interval '5 days'),
    ('00000000-0000-0000-0000-00000000fb00', '00000000-0000-0000-0000-0000000000f8', 'teacher', now() - interval '5 days');
INSERT INTO sections (id, org_id, name, archived) VALUES
    ('00000000-0000-0000-0000-00000000fa09', '00000000-0000-0000-0000-00000000fa00', '9-A', false),
    ('00000000-0000-0000-0000-00000000fa0f', '00000000-0000-0000-0000-00000000fa00', '8-Z', true),
    ('00000000-0000-0000-0000-00000000fb09', '00000000-0000-0000-0000-00000000fb00', '9-B', false);
INSERT INTO section_members (section_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000fa09', '00000000-0000-0000-0000-0000000000f4', 'teacher'),
    ('00000000-0000-0000-0000-00000000fa0f', '00000000-0000-0000-0000-0000000000f4', 'teacher'),
    ('00000000-0000-0000-0000-00000000fa09', '00000000-0000-0000-0000-0000000000f6', 'student'),
    ('00000000-0000-0000-0000-00000000fb09', '00000000-0000-0000-0000-0000000000f8', 'teacher');

CREATE FUNCTION test_helpers.is_head(p uuid) RETURNS boolean LANGUAGE sql AS $$
    SELECT is_head FROM public.org_memberships
    WHERE user_id = p AND org_id = '00000000-0000-0000-0000-00000000fa00' AND role = 'org_admin';
$$;
CREATE FUNCTION test_helpers.admin_status(p uuid) RETURNS text LANGUAGE sql AS $$
    SELECT status FROM public.org_memberships
    WHERE user_id = p AND org_id = '00000000-0000-0000-0000-00000000fa00' AND role = 'org_admin';
$$;

-- ===========================================================================
-- The head flag
-- ===========================================================================
SELECT is(test_helpers.is_head('00000000-0000-0000-0000-0000000000f1'), true, 'the first org admin of a school becomes its head');
SELECT is(test_helpers.is_head('00000000-0000-0000-0000-0000000000f2'), false, 'later org admins are not head');
SELECT throws_ok($$UPDATE org_memberships SET is_head = true WHERE user_id = '00000000-0000-0000-0000-0000000000f2'$$, '23505', NULL,
    'a school cannot have two heads');
SELECT throws_ok($$UPDATE org_memberships SET is_head = true WHERE user_id = '00000000-0000-0000-0000-0000000000f4'$$, '23514', NULL,
    'only an active org admin can be head');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f2');
SELECT throws_ok($$UPDATE org_memberships SET is_head = true WHERE user_id = '00000000-0000-0000-0000-0000000000f2' AND role = 'org_admin'$$,
    '42501', NULL, 'nobody can set the head flag through the API');

-- ===========================================================================
-- Removing admins
-- ===========================================================================
SELECT throws_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f3' AND role = 'org_admin'$$,
    '42501', 'Only the school''s head admin or Tutre can remove an org admin.', 'an ordinary org admin cannot remove another admin');
SELECT throws_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f1' AND role = 'org_admin'$$,
    '42501', 'The head admin cannot be removed. Make another admin the head first.', 'an ordinary org admin cannot remove the head');
SELECT lives_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f6'$$,
    'an ordinary org admin can still remove a student');
SELECT lives_ok($$UPDATE org_memberships SET status = 'active' WHERE user_id = '00000000-0000-0000-0000-0000000000f6'$$,
    'and restore them');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f8');
UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f3' AND role = 'org_admin';
SELECT test_helpers.logout();
SELECT is(test_helpers.admin_status('00000000-0000-0000-0000-0000000000f3'), 'active', 'another school''s head cannot remove School A''s admins');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f1');
SELECT throws_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f1' AND role = 'org_admin'$$,
    '42501', 'The head admin cannot be removed. Make another admin the head first.', 'the head cannot remove themselves');
SELECT lives_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f3' AND role = 'org_admin'$$,
    'the head can remove another org admin');
SELECT test_helpers.logout();
SELECT is(test_helpers.admin_status('00000000-0000-0000-0000-0000000000f3'), 'removed', 'the removal was saved');

-- ===========================================================================
-- Appointing admins
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f2');
SELECT is((make_org_admin('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f4') ->> 'is_head')::boolean, false,
    'an ordinary org admin can make a teacher an admin, who is not head');
SELECT throws_ok($$SELECT make_org_admin('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f6')$$, '22023', NULL,
    'a student cannot be made an admin');
SELECT throws_ok($$SELECT make_org_admin('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f7')$$, '22023', NULL,
    'someone outside the school cannot be made an admin');
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM org_memberships WHERE user_id = '00000000-0000-0000-0000-0000000000f4' AND status = 'active'), 2,
    'the new admin keeps their teacher role');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f5');
SELECT throws_ok($$SELECT make_org_admin('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f5')$$, '42501', NULL,
    'a teacher cannot make themselves an admin');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f8');
SELECT throws_ok($$SELECT make_org_admin('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f5')$$, '42501', NULL,
    'another school''s head cannot appoint admins here');
SELECT test_helpers.logout();

-- ===========================================================================
-- Handing over the head role
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f2');
SELECT throws_ok($$SELECT transfer_head_admin('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f2')$$, '42501', NULL,
    'an ordinary org admin cannot take the head role');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f1');
SELECT throws_ok($$SELECT transfer_head_admin('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f5')$$, '22023', NULL,
    'the head role can only go to an admin');
SELECT lives_ok($$SELECT transfer_head_admin('00000000-0000-0000-0000-00000000fa00', '00000000-0000-0000-0000-0000000000f2')$$,
    'the head can hand the head role to another admin');
SELECT test_helpers.logout();
SELECT is(test_helpers.is_head('00000000-0000-0000-0000-0000000000f2'), true, 'the new head is head');
SELECT is(test_helpers.is_head('00000000-0000-0000-0000-0000000000f1'), false, 'the old head is an ordinary admin');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f1');
SELECT throws_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f4' AND role = 'org_admin'$$,
    '42501', 'Only the school''s head admin or Tutre can remove an org admin.', 'the old head can no longer remove admins');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f2');
SELECT lives_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f1' AND role = 'org_admin'$$,
    'the new head can remove the old head''s admin role');
SELECT test_helpers.logout();

-- ===========================================================================
-- Tutre is an admin of every school
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f0');
SELECT lives_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f2' AND role = 'org_admin'$$,
    'a platform admin can remove the head');
SELECT test_helpers.logout();
SELECT is(test_helpers.is_head('00000000-0000-0000-0000-0000000000f4'), true,
    'the longest-serving remaining admin becomes head');
SELECT is(test_helpers.is_head('00000000-0000-0000-0000-0000000000f2'), false, 'a removed admin is not head');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f0');
SELECT lives_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000f4' AND role = 'org_admin'$$,
    'a platform admin can remove a school''s last org admin');
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM org_memberships WHERE org_id = '00000000-0000-0000-0000-00000000fa00' AND is_head), 0,
    'the school has no head of its own; Tutre acts for it');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f0');
SELECT lives_ok($$UPDATE org_memberships SET status = 'active' WHERE user_id = '00000000-0000-0000-0000-0000000000f1' AND role = 'org_admin'$$,
    'a platform admin can restore an admin');
SELECT test_helpers.logout();
SELECT is(test_helpers.is_head('00000000-0000-0000-0000-0000000000f1'), true, 'an admin restored to a school without a head becomes head');

-- ===========================================================================
-- get_my_context()
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f1');
SELECT is((SELECT get_my_context() -> 'memberships' -> 0 ->> 'is_head')::boolean, true, 'the context says the head is head');
SELECT is(get_my_context() -> 'studio_role', 'null'::jsonb, 'a school admin has no Studio role');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f4');
SELECT is((SELECT array_agg(e ->> 'role' ORDER BY e ->> 'role') FROM jsonb_array_elements(get_my_context() -> 'memberships') e),
    ARRAY['teacher'], 'a removed role is not in the context');
SELECT is((SELECT array_agg(e ->> 'name') FROM jsonb_array_elements(get_my_context() -> 'sections') e),
    ARRAY['9-A'], 'a teacher''s context lists their sections, not archived ones');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f0');
SELECT is(get_my_context() ->> 'studio_role', 'platform_admin', 'a platform admin''s context has their Studio role');
SELECT test_helpers.logout();

UPDATE organizations SET status = 'suspended' WHERE id = '00000000-0000-0000-0000-00000000fb00';
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f8');
SELECT is(get_my_context() -> 'memberships' -> 0 ->> 'org_status', 'suspended', 'a suspended school still shows, marked suspended');
SELECT is(jsonb_array_length(get_my_context() -> 'sections'), 0, 'but its sections do not');
SELECT test_helpers.logout();

SELECT test_helpers.anon();
SELECT throws_ok($$SELECT get_my_context()$$, '42501', NULL, 'anonymous visitors have no context');
SELECT test_helpers.logout();

-- ===========================================================================
-- peek_invite_code()
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f1');
SELECT set_config('test.code', create_invite_code('00000000-0000-0000-0000-00000000fa00', 'student',
    '00000000-0000-0000-0000-00000000fa09') ->> 'code', true);
WITH c AS (SELECT create_invite_code('00000000-0000-0000-0000-00000000fa00', 'teacher') AS j)
SELECT set_config('test.revoked_id', j ->> 'id', true), set_config('test.revoked', j ->> 'code', true) FROM c;
SELECT revoke_invite_code(current_setting('test.revoked_id')::uuid);
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f7');
SELECT is(peek_invite_code(lower(current_setting('test.code'))),
    jsonb_build_object('valid', true, 'role', 'student', 'org_name', 'School A', 'section_name', '9-A', 'already_member', false),
    'a code shows its school, role and section before it is used');
SELECT is(peek_invite_code('ZZZZZZZZZZ'), '{"valid": false}'::jsonb, 'an unknown code is just "not valid"');
SELECT is(peek_invite_code(current_setting('test.revoked')), '{"valid": false}'::jsonb,
    'a revoked code is just "not valid"');
SELECT test_helpers.logout();
SELECT is((SELECT uses FROM invite_codes WHERE code = current_setting('test.code')), 0, 'peeking does not use the code');

-- Student A was removed and restored above, which took them out of 9-A; put them back.
INSERT INTO section_members (section_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000fa09', '00000000-0000-0000-0000-0000000000f6', 'student');
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f6');
SELECT is((peek_invite_code(current_setting('test.code')) ->> 'already_member')::boolean, true, 'a member is told they already joined');
SELECT test_helpers.logout();

SELECT test_helpers.anon();
SELECT throws_ok($$SELECT peek_invite_code('ZZZZZZZZZZ')$$, '42501', NULL, 'anonymous visitors cannot peek at codes');
SELECT test_helpers.logout();

SELECT * FROM finish();
ROLLBACK;

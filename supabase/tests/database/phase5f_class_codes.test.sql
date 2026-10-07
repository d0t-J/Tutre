-- Phase 5f access tests: a standing class code per section.
-- Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(14);

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

-- School A: e1 principal, e2 teacher of 9-A, e3 teacher of 9-B, e4 student
-- (joins with the class code). School B: e5 principal.
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-0000000000e1', 'principal@tutre.test', '{"full_name":"Principal A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e2', 'teacher1@tutre.test', '{"full_name":"Teacher One"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e3', 'teacher2@tutre.test', '{"full_name":"Teacher Two"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e4', 'student@tutre.test', '{"full_name":"Student"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e5', 'principal.b@tutre.test', '{"full_name":"Principal B"}', 'authenticated', 'authenticated');
INSERT INTO organizations (id, name, slug) VALUES
    ('00000000-0000-0000-0000-00000000ea00', 'School A', 'school-a'),
    ('00000000-0000-0000-0000-00000000eb00', 'School B', 'school-b');
INSERT INTO org_memberships (org_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000ea00', '00000000-0000-0000-0000-0000000000e1', 'org_admin'),
    ('00000000-0000-0000-0000-00000000ea00', '00000000-0000-0000-0000-0000000000e2', 'teacher'),
    ('00000000-0000-0000-0000-00000000ea00', '00000000-0000-0000-0000-0000000000e3', 'teacher'),
    ('00000000-0000-0000-0000-00000000eb00', '00000000-0000-0000-0000-0000000000e5', 'org_admin');
INSERT INTO sections (id, org_id, name, archived) VALUES
    ('00000000-0000-0000-0000-00000000ea09', '00000000-0000-0000-0000-00000000ea00', '9-A', false),
    ('00000000-0000-0000-0000-00000000ea0b', '00000000-0000-0000-0000-00000000ea00', '9-B', false),
    ('00000000-0000-0000-0000-00000000ea0f', '00000000-0000-0000-0000-00000000ea00', 'Old', true);
INSERT INTO section_members (section_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000ea09', '00000000-0000-0000-0000-0000000000e2', 'teacher'),
    ('00000000-0000-0000-0000-00000000ea0b', '00000000-0000-0000-0000-0000000000e3', 'teacher');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e2');
SELECT set_config('test.code1', class_code('00000000-0000-0000-0000-00000000ea09') ->> 'code', true);
SELECT is(class_code('00000000-0000-0000-0000-00000000ea09') ->> 'code', current_setting('test.code1'),
    'a section keeps the same class code');
SELECT throws_ok($$SELECT class_code('00000000-0000-0000-0000-00000000ea0b')$$, 'P0002', NULL,
    'a teacher cannot see the class code of a section they do not teach');
SELECT test_helpers.logout();

SELECT is((SELECT role || ' ' || max_uses || ' ' || is_class_code FROM invite_codes WHERE code = current_setting('test.code1')),
    'student 1000 true', 'it is a student code for up to 1000 students');
SELECT ok((SELECT expires_at > now() + interval '360 days' FROM invite_codes WHERE code = current_setting('test.code1')),
    'it lasts a year');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e4');
SELECT is(redeem_invite_code(current_setting('test.code1')) ->> 'section_name', '9-A', 'a student joins the section with it');
SELECT throws_ok($$SELECT class_code('00000000-0000-0000-0000-00000000ea09')$$, 'P0002', NULL,
    'a student cannot read the class code');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e1');
SELECT is(class_code('00000000-0000-0000-0000-00000000ea09') ->> 'code', current_setting('test.code1'),
    'the principal sees the same code');
SELECT set_config('test.code2', class_code('00000000-0000-0000-0000-00000000ea09', true) ->> 'code', true);
SELECT isnt(current_setting('test.code2'), current_setting('test.code1'), 'replacing makes a new code');
SELECT throws_ok($$SELECT class_code('00000000-0000-0000-0000-00000000ea0f')$$, '22023', NULL,
    'an archived section has no class code');
SELECT test_helpers.logout();

SELECT is((SELECT revoked FROM invite_codes WHERE code = current_setting('test.code1')), true, 'the old code is revoked at once');
SELECT is((SELECT count(*)::int FROM invite_codes WHERE section_id = '00000000-0000-0000-0000-00000000ea09' AND is_class_code AND NOT revoked), 1,
    'there is one live class code per section');
SELECT throws_ok($$INSERT INTO invite_codes (code, org_id, section_id, role, max_uses, expires_at, is_class_code)
    VALUES ('ABCDEFGHJK', '00000000-0000-0000-0000-00000000ea00', '00000000-0000-0000-0000-00000000ea09', 'student', 1, now() + interval '1 day', true)$$,
    '23505', NULL, 'a second live class code for a section is impossible');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e5');
SELECT throws_ok($$SELECT class_code('00000000-0000-0000-0000-00000000ea09')$$, 'P0002', NULL,
    'another school''s principal cannot see it');
SELECT test_helpers.logout();

SELECT test_helpers.anon();
SELECT throws_ok($$SELECT class_code('00000000-0000-0000-0000-00000000ea09')$$, '42501', NULL, 'anonymous visitors cannot call it');
SELECT test_helpers.logout();

SELECT * FROM finish();
ROLLBACK;

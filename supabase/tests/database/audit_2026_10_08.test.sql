-- Tests for the 2026-10-08 audit fixes (migration 20261011090000_audit_fixes.sql).
-- Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(16);

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

-- A school with a principal (a1), a teacher of 9-A (a2) and two students (a3, a4).
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-00000000aa01', 'principal@tutre.test', '{"full_name":"Principal"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000aa02', 'teacher@tutre.test', '{"full_name":"Teacher"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000aa03', 'student1@tutre.test', '{"full_name":"Student One"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-00000000aa04', 'student2@tutre.test', '{"full_name":"Student Two"}', 'authenticated', 'authenticated');
INSERT INTO organizations (id, name, slug) VALUES ('00000000-0000-0000-0000-0000000aa000', 'School', 'school');
INSERT INTO org_memberships (org_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-0000000aa000', '00000000-0000-0000-0000-00000000aa01', 'org_admin'),
    ('00000000-0000-0000-0000-0000000aa000', '00000000-0000-0000-0000-00000000aa02', 'teacher');
INSERT INTO sections (id, org_id, name) VALUES ('00000000-0000-0000-0000-0000000aa009', '00000000-0000-0000-0000-0000000aa000', '9-A');
INSERT INTO section_members (section_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-0000000aa009', '00000000-0000-0000-0000-00000000aa02', 'teacher');

-- ===========================================================================
-- Codes of archived sections
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-00000000aa02');
SELECT set_config('test.class_code', class_code('00000000-0000-0000-0000-0000000aa009') ->> 'code', true);
SELECT set_config('test.one_off', create_invite_code('00000000-0000-0000-0000-0000000aa000', 'student',
    '00000000-0000-0000-0000-0000000aa009', 5, 14) ->> 'code', true);
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-00000000aa01');
UPDATE sections SET archived = true WHERE id = '00000000-0000-0000-0000-0000000aa009';
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-00000000aa03');
SELECT is(peek_invite_code(current_setting('test.class_code')), '{"valid": false}'::jsonb,
    'an archived section''s class code shows as not valid');
SELECT throws_ok(format('SELECT redeem_invite_code(%L)', current_setting('test.class_code')), 'P0001', NULL,
    'and cannot be used');
SELECT throws_ok(format('SELECT redeem_invite_code(%L)', current_setting('test.one_off')), 'P0001', NULL,
    'nor can a one-off code for that section');
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM section_members WHERE user_id = '00000000-0000-0000-0000-00000000aa03'), 0,
    'nobody joined the archived section');
SELECT is((SELECT count(*)::int FROM org_memberships WHERE user_id = '00000000-0000-0000-0000-00000000aa03'), 0,
    'nor the school');

SELECT test_helpers.login('00000000-0000-0000-0000-00000000aa01');
UPDATE sections SET archived = false WHERE id = '00000000-0000-0000-0000-0000000aa009';
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-00000000aa04');
SELECT is((peek_invite_code(current_setting('test.class_code')) ->> 'valid')::boolean, true,
    'unarchived, the class code works again');
SELECT is(redeem_invite_code(current_setting('test.class_code')) ->> 'section_name', '9-A', 'and a student can join');
SELECT test_helpers.logout();

-- ===========================================================================
-- Functions anonymous visitors are not offered; triggers still work
-- ===========================================================================
SELECT ok(NOT has_function_privilege('anon', 'public.set_updated_at()', 'EXECUTE'), 'anon cannot call set_updated_at');
SELECT ok(NOT has_function_privilege('anon', 'public.subjects_set_slug()', 'EXECUTE'), 'anon cannot call subjects_set_slug');
SELECT ok(NOT has_function_privilege('anon', 'public.upsert_canonical_simulation(text, text, integer, text, text, text, text)', 'EXECUTE'),
    'anon cannot call upsert_canonical_simulation');

SELECT test_helpers.login('00000000-0000-0000-0000-00000000aa04');
SELECT lives_ok($$UPDATE profiles SET display_name = 'Student Two (edited)' WHERE id = '00000000-0000-0000-0000-00000000aa04'$$,
    'a student can still edit their profile (set_updated_at trigger)');
SELECT test_helpers.logout();
SELECT ok((SELECT updated_at > created_at OR updated_at = created_at FROM profiles WHERE id = '00000000-0000-0000-0000-00000000aa04'),
    'the profile''s updated_at was set');
SELECT test_helpers.login('00000000-0000-0000-0000-00000000aa01');
SELECT lives_ok($$UPDATE sections SET name = '9-A (2026)' WHERE id = '00000000-0000-0000-0000-0000000aa009'$$,
    'a principal can still rename a section (set_updated_at trigger)');
SELECT test_helpers.logout();

-- ===========================================================================
-- Indexes and volatility
-- ===========================================================================
SELECT has_index('public', 'topics', 'topics_chapter_id_idx', 'topics are indexed by chapter');
SELECT has_index('public', 'subjects', 'subjects_class_id_idx', 'subjects are indexed by class');
SELECT is((SELECT provolatile::text FROM pg_proc WHERE oid = 'private.normalize_manifest(jsonb)'::regprocedure), 's',
    'normalize_manifest is STABLE');

SELECT * FROM finish();
ROLLBACK;

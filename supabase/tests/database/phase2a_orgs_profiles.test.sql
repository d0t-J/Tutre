-- Phase 2a access tests: profiles, Studio roles, organisations, memberships,
-- sections and invite codes. Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(79);

-- ---------------------------------------------------------------------------
-- Helpers: act as a user, as an anonymous visitor, or as the test runner again.
-- ---------------------------------------------------------------------------
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

-- People. "a" = School A, "b" = School B, "c" = no school.
--   ...a1 platform admin      ...a2 principal A     ...b2 principal B
--   ...a3 teacher A (9-A)     ...a4 student A (9-A) ...a5 student A (9-B)
--   ...b4 student B           ...c1 independent learner (no full_name given)
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-0000000000a1', 'platform@tutre.test', '{"full_name":"Platform Admin"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000a2', 'principal.a@tutre.test', '{"full_name":"Principal A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000b2', 'principal.b@tutre.test', '{"full_name":"Principal B"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000a3', 'teacher.a@tutre.test', '{"full_name":"Teacher A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000a4', 'student.a1@tutre.test', '{"full_name":"Student A1"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000a5', 'student.a2@tutre.test', '{"full_name":"Student A2"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000b4', 'student.b@tutre.test', '{"full_name":"Student B"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000c1', 'independent.learner@tutre.test', '{}', 'authenticated', 'authenticated');
INSERT INTO public.admin_users (id, studio_role) VALUES ('00000000-0000-0000-0000-0000000000a1', 'platform_admin');

-- ===========================================================================
-- Profiles
-- ===========================================================================
SELECT is((SELECT display_name FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000a4'), 'Student A1',
    'a profile is created at sign-up from full_name');
SELECT is((SELECT display_name FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000c1'), 'independent.learner',
    'without full_name the profile uses the e-mail name');
SELECT is((SELECT preferred_language FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000a4'), 'en',
    'new profiles default to English');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c1');
SELECT is((SELECT count(*)::int FROM profiles), 1, 'an independent learner sees only their own profile');
SELECT lives_ok($$UPDATE profiles SET display_name = 'Indie', preferred_language = 'ur' WHERE id = '00000000-0000-0000-0000-0000000000c1'$$,
    'a user can edit their own name and language');
UPDATE profiles SET display_name = 'Hacked' WHERE id = '00000000-0000-0000-0000-0000000000a4';
SELECT throws_ok($$UPDATE profiles SET id = gen_random_uuid() WHERE id = '00000000-0000-0000-0000-0000000000c1'$$,
    '42501', NULL, 'a user cannot change their profile id');
SELECT throws_ok($$UPDATE profiles SET preferred_language = 'fr' WHERE id = '00000000-0000-0000-0000-0000000000c1'$$,
    '23514', NULL, 'only en and ur are accepted as languages');
SELECT throws_ok($$INSERT INTO profiles (id) VALUES (gen_random_uuid())$$,
    '42501', NULL, 'users cannot insert profiles directly');
SELECT test_helpers.logout();
SELECT is((SELECT display_name FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000a4'), 'Student A1',
    'a user cannot edit someone else''s profile');
SELECT is((SELECT display_name || '/' || preferred_language FROM profiles WHERE id = '00000000-0000-0000-0000-0000000000c1'), 'Indie/ur',
    'the own-profile edit was saved');

-- ===========================================================================
-- Creating schools
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a2');
SELECT throws_ok($$SELECT create_organization('Sneaky School', 'sneaky')$$, '42501', NULL,
    'only platform admins can create schools');
SELECT throws_ok($$INSERT INTO organizations (name, slug) VALUES ('Sneaky', 'sneaky')$$, '42501', NULL,
    'schools cannot be inserted directly');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a1');
WITH r AS (SELECT create_organization('School A', 'school-a') AS j)
SELECT set_config('test.org_a', j ->> 'org_id', true), set_config('test.code_admin_a', j ->> 'admin_code', true) FROM r;
WITH r AS (SELECT create_organization('School B', 'school-b') AS j)
SELECT set_config('test.org_b', j ->> 'org_id', true), set_config('test.code_admin_b', j ->> 'admin_code', true) FROM r;
SELECT is((SELECT count(*)::int FROM organizations), 2, 'a platform admin sees every school');
SELECT throws_ok($$SELECT create_organization('Dup', 'school-a')$$, '23505', NULL, 'school slugs are unique');
SELECT test_helpers.logout();
SELECT matches(current_setting('test.code_admin_a'), '^[A-HJKMNP-Z2-9]{10}$', 'codes are 10 unambiguous characters');

-- ===========================================================================
-- Principals redeem their org-admin codes
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a2');
SELECT is((redeem_invite_code(lower(substr(current_setting('test.code_admin_a'), 1, 5)) || '-' || substr(current_setting('test.code_admin_a'), 6)) ->> 'role'),
    'org_admin', 'a principal joins as org admin; case and hyphen do not matter');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000b2');
SELECT throws_ok(format('SELECT redeem_invite_code(%L)', current_setting('test.code_admin_a')), 'P0001',
    'This code is not valid. Ask your school for a new one.', 'a single-use code cannot be used twice');
SELECT is((redeem_invite_code(current_setting('test.code_admin_b')) ->> 'org_name'), 'School B', 'principal B joins School B');
SELECT throws_ok($$SELECT redeem_invite_code('ZZZZZZZZZZ')$$, 'P0001',
    'This code is not valid. Ask your school for a new one.', 'an unknown code gives the same message as a used one');
SELECT test_helpers.logout();

-- ===========================================================================
-- Principal A sets up sections and codes
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a2');
WITH s AS (INSERT INTO sections (org_id, name, academic_year) VALUES (current_setting('test.org_a')::uuid, '9-A', '2026-27') RETURNING id)
SELECT set_config('test.sec_9a', id::text, true) FROM s;
WITH s AS (INSERT INTO sections (org_id, name, academic_year) VALUES (current_setting('test.org_a')::uuid, '9-B', '2026-27') RETURNING id)
SELECT set_config('test.sec_9b', id::text, true) FROM s;
SELECT is((SELECT count(*)::int FROM sections), 2, 'an org admin sees their sections');
SELECT set_config('test.code_teacher_9a', create_invite_code(current_setting('test.org_a')::uuid, 'teacher', current_setting('test.sec_9a')::uuid) ->> 'code', true);
SELECT set_config('test.code_student_9a', create_invite_code(current_setting('test.org_a')::uuid, 'student', current_setting('test.sec_9a')::uuid, 40, 30) ->> 'code', true);
SELECT set_config('test.code_student_9b', create_invite_code(current_setting('test.org_a')::uuid, 'student', current_setting('test.sec_9b')::uuid, 40, 30) ->> 'code', true);
SELECT is((SELECT count(*)::int FROM invite_codes), 4, 'an org admin sees all of their school''s codes');
SELECT throws_ok(format('SELECT create_invite_code(%L, %L, %L)', current_setting('test.org_b'), 'teacher', NULL), '42501', NULL,
    'an org admin cannot create codes for another school');
SELECT throws_ok(format('SELECT create_invite_code(%L, %L, %L)', current_setting('test.org_a'), 'org_admin', current_setting('test.sec_9a')), '22023', NULL,
    'org admin codes cannot be tied to a section');
SELECT throws_ok(format('SELECT create_invite_code(%L, %L, NULL, 1, 365)', current_setting('test.org_a'), 'student'), '22023', NULL,
    'codes cannot be valid for more than 90 days');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000b2');
SELECT throws_ok(format('INSERT INTO sections (org_id, name) VALUES (%L, %L)', current_setting('test.org_a'), 'Intruder'), '42501', NULL,
    'principal B cannot create a section in School A');
SELECT is((SELECT count(*)::int FROM sections), 0, 'principal B sees none of School A''s sections');
SELECT is((SELECT count(*)::int FROM organizations), 1, 'principal B sees only School B');
SELECT throws_ok(format('SELECT create_invite_code(%L, %L, %L)', current_setting('test.org_a'), 'student', current_setting('test.sec_9b')), '42501', NULL,
    'principal B cannot create codes for School A''s sections');
SELECT set_config('test.code_student_b', create_invite_code(current_setting('test.org_b')::uuid, 'student', NULL, 10, 7) ->> 'code', true);
SELECT test_helpers.logout();

-- ===========================================================================
-- Teachers and students join
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a3');
SELECT is((redeem_invite_code(current_setting('test.code_teacher_9a')) ->> 'section_name'), '9-A', 'a teacher joins section 9-A');
SELECT test_helpers.logout();
SELECT is((SELECT role FROM org_memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a3'), 'teacher',
    'the teacher is also a teacher of the school');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a4');
SELECT is((redeem_invite_code(current_setting('test.code_student_9a')) ->> 'already_member')::boolean, false, 'student A1 joins 9-A');
SELECT is((redeem_invite_code(current_setting('test.code_student_9a')) ->> 'already_member')::boolean, true,
    'redeeming the same code again reports already_member');
SELECT test_helpers.logout();
SELECT is((SELECT uses FROM invite_codes WHERE code = current_setting('test.code_student_9a')), 1,
    'a repeat redemption does not use up the code');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a5');
SELECT lives_ok(format('SELECT redeem_invite_code(%L)', current_setting('test.code_student_9b')), 'student A2 joins 9-B');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000b4');
SELECT lives_ok(format('SELECT redeem_invite_code(%L)', current_setting('test.code_student_b')), 'student B joins School B');
SELECT test_helpers.logout();

-- Expired and revoked codes
UPDATE invite_codes SET expires_at = now() - interval '1 second' WHERE code = current_setting('test.code_student_9b');
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c1');
SELECT throws_ok(format('SELECT redeem_invite_code(%L)', current_setting('test.code_student_9b')), 'P0001', NULL, 'an expired code is refused');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a2');
SELECT lives_ok(format('SELECT revoke_invite_code(%L)', (SELECT id FROM invite_codes WHERE code = current_setting('test.code_student_9a'))),
    'an org admin can revoke a code');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c1');
SELECT throws_ok(format('SELECT redeem_invite_code(%L)', current_setting('test.code_student_9a')), 'P0001', NULL, 'a revoked code is refused');
SELECT is((SELECT count(*)::int FROM org_memberships), 0, 'the independent learner joined nothing');
SELECT test_helpers.logout();

-- ===========================================================================
-- What a teacher can see and do
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a3');
SELECT bag_eq($$SELECT display_name FROM profiles$$, ARRAY['Teacher A', 'Student A1'],
    'a teacher sees their own profile and their section''s students, nobody else');
SELECT is((SELECT count(*)::int FROM sections), 1, 'a teacher sees only the sections they teach');
SELECT is((SELECT count(*)::int FROM section_members), 2, 'a teacher sees their section''s members');
SELECT lives_ok(format('SELECT create_invite_code(%L, %L, %L, 40, 7)', current_setting('test.org_a'), 'student', current_setting('test.sec_9a')),
    'a teacher can create student codes for their own section');
SELECT throws_ok(format('SELECT create_invite_code(%L, %L, %L)', current_setting('test.org_a'), 'student', current_setting('test.sec_9b')), '42501', NULL,
    'a teacher cannot create codes for a section they do not teach');
SELECT throws_ok(format('SELECT create_invite_code(%L, %L, %L)', current_setting('test.org_a'), 'teacher', current_setting('test.sec_9a')), '42501', NULL,
    'a teacher cannot create teacher codes');
SELECT throws_ok(format('INSERT INTO sections (org_id, name) VALUES (%L, %L)', current_setting('test.org_a'), '9-C'), '42501', NULL,
    'a teacher cannot create sections');
SELECT test_helpers.logout();

-- ===========================================================================
-- What a student can see and do
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a4');
SELECT is((SELECT count(*)::int FROM profiles), 1, 'a student sees only their own profile');
SELECT is((SELECT name FROM sections), '9-A', 'a student sees only their own section');
SELECT is((SELECT count(*)::int FROM invite_codes), 0, 'a student cannot read invite codes');
SELECT throws_ok(format('SELECT create_invite_code(%L, %L, %L)', current_setting('test.org_a'), 'student', current_setting('test.sec_9a')), '42501', NULL,
    'a student cannot create codes');
SELECT throws_ok(format('INSERT INTO section_members (section_id, user_id, role) VALUES (%L, %L, %L)', current_setting('test.sec_9b'), '00000000-0000-0000-0000-0000000000a4', 'student'), '42501', NULL,
    'a student cannot add themselves to another section');
SELECT throws_ok($$UPDATE org_memberships SET role = 'org_admin' WHERE user_id = '00000000-0000-0000-0000-0000000000a4'$$, '42501', NULL,
    'a student cannot promote themselves');
UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000a5';
SELECT test_helpers.logout();
SELECT is((SELECT status FROM org_memberships WHERE user_id = '00000000-0000-0000-0000-0000000000a5'), 'active',
    'a student cannot remove another student');

-- ===========================================================================
-- What org admins can see and do
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a2');
SELECT bag_eq($$SELECT display_name FROM profiles$$, ARRAY['Principal A', 'Teacher A', 'Student A1', 'Student A2'],
    'org admin A sees exactly the members of School A');
SELECT is((SELECT count(*)::int FROM org_memberships), 4, 'org admin A sees School A''s memberships');
SELECT lives_ok($$UPDATE organizations SET name = 'School A (renamed)' WHERE slug = 'school-a'$$, 'an org admin can rename their school');
SELECT throws_ok($$UPDATE organizations SET status = 'suspended' WHERE slug = 'school-a'$$, '42501', NULL,
    'an org admin cannot change their school''s status');
SELECT throws_ok($$UPDATE organizations SET slug = 'other' WHERE slug = 'school-a'$$, '42501', NULL,
    'an org admin cannot change their school''s slug');
SELECT throws_ok(format('INSERT INTO section_members (section_id, user_id, role) VALUES (%L, %L, %L)', current_setting('test.sec_9a'), '00000000-0000-0000-0000-0000000000b4', 'student'), '23514', NULL,
    'a student of another school cannot be put in a section');
SELECT lives_ok(format('INSERT INTO section_members (section_id, user_id, role) VALUES (%L, %L, %L)', current_setting('test.sec_9b'), '00000000-0000-0000-0000-0000000000a3', 'teacher'),
    'an org admin can assign a teacher to another section');
SELECT throws_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000a2'$$, '23514', NULL,
    'a school cannot lose its last org admin');
SELECT lives_ok($$UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000a5'$$,
    'an org admin can remove a student from the school');
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM section_members WHERE user_id = '00000000-0000-0000-0000-0000000000a5'), 0,
    'removing a student from the school removes them from its sections');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000b2');
SELECT bag_eq($$SELECT display_name FROM profiles$$, ARRAY['Principal B', 'Student B'],
    'org admin B sees only School B''s members');
SELECT is((SELECT count(*)::int FROM section_members), 0, 'org admin B sees none of School A''s section members');
SELECT test_helpers.logout();

-- A teacher removes a student from their own section, but cannot remove teachers.
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a3');
DELETE FROM section_members WHERE role = 'teacher';
SELECT lives_ok(format('DELETE FROM section_members WHERE section_id = %L AND user_id = %L', current_setting('test.sec_9a'), '00000000-0000-0000-0000-0000000000a4'),
    'a teacher can remove a student from their section');
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM section_members WHERE role = 'teacher'), 2, 'a teacher cannot remove teachers');
SELECT is((SELECT count(*)::int FROM section_members WHERE user_id = '00000000-0000-0000-0000-0000000000a4'), 0, 'the student was removed');

-- ===========================================================================
-- Suspension, anonymous visitors, cascades
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a1');
SELECT lives_ok(format('SELECT set_organization_status(%L, %L)', current_setting('test.org_a'), 'suspended'), 'a platform admin can suspend a school');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000a2');
SELECT is((SELECT count(*)::int FROM sections), 0, 'members of a suspended school lose access to it');
SELECT is((SELECT count(*)::int FROM profiles), 1, 'an org admin of a suspended school sees only their own profile');
SELECT test_helpers.logout();
SELECT set_config('test.live_code_a', (SELECT code FROM invite_codes WHERE org_id = current_setting('test.org_a')::uuid
    AND role = 'student' AND NOT revoked AND expires_at > now() AND uses < max_uses LIMIT 1), true);
SELECT isnt(current_setting('test.live_code_a'), '', 'School A still has a usable student code');
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c1');
SELECT throws_ok(format('SELECT redeem_invite_code(%L)', current_setting('test.live_code_a')),
    'P0001', NULL, 'codes of a suspended school cannot be used');
SELECT test_helpers.logout();

SELECT test_helpers.anon();
SELECT throws_ok($$SELECT * FROM organizations$$, '42501', NULL, 'anonymous visitors cannot read schools');
SELECT throws_ok($$SELECT * FROM profiles$$, '42501', NULL, 'anonymous visitors cannot read profiles');
SELECT throws_ok($$SELECT redeem_invite_code('ABCDEFGHJK')$$, '42501', NULL, 'anonymous visitors cannot redeem codes');
SELECT test_helpers.logout();

SELECT lives_ok($$DELETE FROM organizations WHERE slug = 'school-b'$$,
    'deleting a whole school is not blocked by the last-admin rule');
SELECT is((SELECT count(*)::int FROM org_memberships WHERE org_id = current_setting('test.org_b')::uuid), 0,
    'deleting a school removes its memberships');
SELECT is((SELECT studio_role FROM admin_users WHERE id = '00000000-0000-0000-0000-0000000000a1'), 'platform_admin',
    'Studio roles are stored on admin_users');

SELECT * FROM finish();
ROLLBACK;

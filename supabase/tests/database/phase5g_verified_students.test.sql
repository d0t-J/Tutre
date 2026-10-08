-- Phase 5g access tests: verified schools, join requests, class lists and slip
-- codes, and password reset without email.
-- Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(65);

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
CREATE FUNCTION test_helpers.service() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    PERFORM set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
    EXECUTE 'SET LOCAL ROLE service_role';
END $$;
CREATE FUNCTION test_helpers.logout() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    EXECUTE 'RESET ROLE';
    PERFORM set_config('request.jwt.claims', '', true);
END $$;
GRANT USAGE ON SCHEMA test_helpers TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test_helpers TO authenticated, anon, service_role;

-- People. 90 Tutre admin. School A (verified, head 91): teachers 92 (9-A) and
-- 93 (9-B), students-to-be 94, 95, 96, 97. School U: not verified (head 98).
-- School N: verified but no admin at all.
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-000000000090', 'tutre@tutre.test', '{"full_name":"Tutre Admin"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000091', 'principal@tutre.test', '{"full_name":"Principal"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000092', 'teacher1@tutre.test', '{"full_name":"Teacher One"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000093', 'teacher2@tutre.test', '{"full_name":"Teacher Two"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000094', 'ali@tutre.test', '{"full_name":"Ali"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000095', 'sara@tutre.test', '{"full_name":"Sara"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000096', 'zain@tutre.test', '{"full_name":"Zain"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000097', 'hira@tutre.test', '{"full_name":"Hira"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000000098', 'principal.u@tutre.test', '{"full_name":"Principal U"}', 'authenticated', 'authenticated');
INSERT INTO admin_users (id, studio_role) VALUES ('00000000-0000-0000-0000-000000000090', 'platform_admin');

INSERT INTO organizations (id, name, slug) VALUES
    ('00000000-0000-0000-0000-00000000a000', 'School A', 'school-a'),
    ('00000000-0000-0000-0000-00000000b000', 'School U', 'school-u'),
    ('00000000-0000-0000-0000-00000000c000', 'School N', 'school-n');
UPDATE organizations SET verified_at = now() WHERE slug IN ('school-a', 'school-n');
INSERT INTO org_memberships (org_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000a000', '00000000-0000-0000-0000-000000000091', 'org_admin'),
    ('00000000-0000-0000-0000-00000000a000', '00000000-0000-0000-0000-000000000092', 'teacher'),
    ('00000000-0000-0000-0000-00000000a000', '00000000-0000-0000-0000-000000000093', 'teacher'),
    ('00000000-0000-0000-0000-00000000b000', '00000000-0000-0000-0000-000000000098', 'org_admin');
INSERT INTO sections (id, org_id, name) VALUES
    ('00000000-0000-0000-0000-00000000a009', '00000000-0000-0000-0000-00000000a000', '9-A'),
    ('00000000-0000-0000-0000-00000000a00b', '00000000-0000-0000-0000-00000000a000', '9-B');
INSERT INTO section_members (section_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000a009', '00000000-0000-0000-0000-000000000092', 'teacher'),
    ('00000000-0000-0000-0000-00000000a00b', '00000000-0000-0000-0000-000000000093', 'teacher');

-- Codes, made as the owner: a class code for 9-A, a teacher code, and student
-- codes for the unverified and the headless school.
SELECT set_config('test.code_9a', (private.insert_invite_code('00000000-0000-0000-0000-00000000a000', 'student', '00000000-0000-0000-0000-00000000a009', 100, 30)).code, true);
SELECT set_config('test.code_teacher', (private.insert_invite_code('00000000-0000-0000-0000-00000000a000', 'teacher', NULL, 5, 30)).code, true);
SELECT set_config('test.code_u', (private.insert_invite_code('00000000-0000-0000-0000-00000000b000', 'student', NULL, 5, 30)).code, true);
SELECT set_config('test.code_n', (private.insert_invite_code('00000000-0000-0000-0000-00000000c000', 'student', NULL, 5, 30)).code, true);

-- ===========================================================================
-- Verified schools
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-000000000098');
SELECT throws_ok($$SELECT set_school_verification('00000000-0000-0000-0000-00000000b000', true)$$, '42501', NULL,
    'a principal cannot verify their own school');
SELECT throws_ok($$UPDATE organizations SET verified_at = now() WHERE id = '00000000-0000-0000-0000-00000000b000'$$, '42501', NULL,
    'nor mark it verified directly');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-000000000090');
SELECT throws_ok($$SELECT set_school_verification('00000000-0000-0000-0000-00000000a000', true, 'not a code!')$$, '23514', NULL,
    'an EMIS code has letters, digits and hyphens only');
SELECT lives_ok($$SELECT set_school_verification('00000000-0000-0000-0000-00000000a000', true, '35110123')$$,
    'Tutre verifies a school with its EMIS code');
SELECT test_helpers.logout();
SELECT is((SELECT emis_code FROM organizations WHERE slug = 'school-a'), '35110123', 'the EMIS code is saved');

-- ===========================================================================
-- Asking to join
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-000000000094');
SELECT throws_ok(format('SELECT redeem_invite_code(%L)', current_setting('test.code_9a')), '22023', NULL,
    'a student code can no longer be redeemed directly');
SELECT throws_ok(format('SELECT request_to_join(%L, %L, %L)', current_setting('test.code_u'), 'Ali Khan', '12'), '22023',
    'This school is not open to students on Tutre yet.', 'an unverified school takes no requests');
SELECT throws_ok(format('SELECT request_to_join(%L, %L, %L)', current_setting('test.code_n'), 'Ali Khan', '12'), '22023',
    'This school is not open to students on Tutre yet.', 'nor does a school without a head admin');
SELECT throws_ok(format('SELECT request_to_join(%L, %L, %L)', current_setting('test.code_teacher'), 'Ali Khan', '12'), '22023', NULL,
    'a staff code cannot be used to ask');
SELECT throws_ok(format('SELECT request_to_join(%L, %L, %L)', current_setting('test.code_9a'), 'Ali Khan', ' '), '22023',
    'Write your roll number.', 'the roll number is required');
SELECT is(request_to_join(current_setting('test.code_9a'), 'Ali Khan', '12') ->> 'status', 'pending', 'a student asks to join 9-A');
SELECT is(request_to_join(current_setting('test.code_9a'), 'Ali Khan', '12') ->> 'status', 'pending', 'asking again changes nothing');
SELECT is((SELECT count(*)::int FROM join_requests), 1, 'the student sees their one request');
SELECT is((SELECT org_name || ' ' || section_name FROM my_join_requests()), 'School A 9-A', 'with the school and section names');
SELECT is((SELECT count(*)::int FROM section_members), 0, 'but is not in the section yet');
SELECT throws_ok($$SELECT decide_join_requests(ARRAY(SELECT id FROM join_requests), true)$$, '42501', NULL,
    'a student cannot approve their own request');
SELECT test_helpers.logout();
SELECT is((SELECT uses FROM invite_codes WHERE code = current_setting('test.code_9a')), 1, 'asking uses the code once');
SELECT is((SELECT count(*)::int FROM org_memberships WHERE user_id = '00000000-0000-0000-0000-000000000094'), 0,
    'nor the school');

SELECT test_helpers.login('00000000-0000-0000-0000-000000000095');
SELECT is((SELECT count(*)::int FROM join_requests), 0, 'another student cannot see it');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-000000000093');
SELECT is((SELECT count(*)::int FROM join_requests), 0, 'a teacher of another section cannot see it');
SELECT test_helpers.logout();

-- The teacher of 9-B tries with the request's id.
SELECT set_config('test.req_ali', (SELECT id::text FROM join_requests WHERE user_id = '00000000-0000-0000-0000-000000000094'), true);
SELECT test_helpers.login('00000000-0000-0000-0000-000000000093');
SELECT throws_ok(format('SELECT decide_join_requests(ARRAY[%L]::uuid[], true)', current_setting('test.req_ali')), '42501', NULL,
    'nor decide it');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-000000000092');
SELECT is((SELECT full_name || ' #' || roll_number FROM join_requests), 'Ali Khan #12', 'the section''s teacher sees it, with name and roll number');
SELECT is(decide_join_requests(ARRAY[current_setting('test.req_ali')]::uuid[], true), 1, 'and approves it');
SELECT is(decide_join_requests(ARRAY[current_setting('test.req_ali')]::uuid[], true), 0, 'a decided request is not decided twice');
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM section_members WHERE user_id = '00000000-0000-0000-0000-000000000094' AND role = 'student'), 1,
    'the approved student is in the section');
SELECT is((SELECT status FROM org_memberships WHERE user_id = '00000000-0000-0000-0000-000000000094'), 'active', 'and the school');

SELECT test_helpers.login('00000000-0000-0000-0000-000000000094');
SELECT is(request_to_join(current_setting('test.code_9a'), 'Ali Khan', '12') ->> 'status', 'already_member',
    'a member asking again is told so');
SELECT test_helpers.logout();

-- Rejecting and cancelling.
SELECT test_helpers.login('00000000-0000-0000-0000-000000000095');
SELECT set_config('test.req_sara', request_to_join(current_setting('test.code_9a'), 'Sara Ahmed', '13') ->> 'request_id', true);
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-000000000091');
SELECT is(decide_join_requests(ARRAY[current_setting('test.req_sara')]::uuid[], false, 'Not in this section'), 1,
    'the principal can decide requests of any section');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-000000000095');
SELECT is((SELECT status || ': ' || reason FROM my_join_requests()), 'rejected: Not in this section', 'the student sees the rejection and why');
SELECT is((SELECT count(*)::int FROM section_members), 0, 'and is not in the section');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-000000000096');
SELECT set_config('test.req_zain', request_to_join(current_setting('test.code_9a'), 'Zain', '14') ->> 'request_id', true);
SELECT lives_ok(format('SELECT cancel_join_request(%L)', current_setting('test.req_zain')), 'a student can cancel their request');
SELECT throws_ok(format('SELECT cancel_join_request(%L)', current_setting('test.req_zain')), 'P0002', NULL, 'only once');
SELECT test_helpers.logout();

-- Too many requests in a day.
INSERT INTO join_requests (user_id, org_id, full_name, roll_number, status)
SELECT '00000000-0000-0000-0000-000000000097', '00000000-0000-0000-0000-00000000a000', 'Hira', 'x', 'cancelled'
FROM generate_series(1, 10);
SELECT test_helpers.login('00000000-0000-0000-0000-000000000097');
SELECT throws_ok(format('SELECT request_to_join(%L, %L, %L)', current_setting('test.code_9a'), 'Hira', '15'), '54000', NULL,
    'ten requests a day at most');
SELECT test_helpers.logout();
DELETE FROM join_requests WHERE user_id = '00000000-0000-0000-0000-000000000097';

-- ===========================================================================
-- Class lists and slip codes
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-000000000092');
SELECT lives_ok($$INSERT INTO class_list_entries (section_id, full_name, roll_number) VALUES
    ('00000000-0000-0000-0000-00000000a009', 'Hira Bibi', '15'), ('00000000-0000-0000-0000-00000000a009', 'Bilal', 'R-7')$$,
    'a teacher adds students to their class list');
SELECT throws_ok($$INSERT INTO class_list_entries (section_id, full_name, roll_number) VALUES ('00000000-0000-0000-0000-00000000a00b', 'Someone', '1')$$,
    '42501', NULL, 'but not to another teacher''s section');
SELECT throws_ok($$INSERT INTO class_list_entries (section_id, full_name, roll_number) VALUES ('00000000-0000-0000-0000-00000000a009', 'Copy', ' r-7 ')$$,
    '23505', NULL, 'roll numbers are unique in a section');
SELECT throws_ok($$UPDATE class_list_entries SET student_id = '00000000-0000-0000-0000-000000000095'$$, '42501', NULL,
    'nobody marks an entry as joined by hand');
SELECT set_config('test.slip', slip_code((SELECT id FROM class_list_entries WHERE roll_number = '15')) ->> 'code', true);
SELECT test_helpers.logout();
SELECT is((SELECT max_uses || ' ' || role || ' ' || (class_list_entry_id IS NOT NULL) FROM invite_codes WHERE code = current_setting('test.slip')),
    '1 student true', 'a slip is a one-time student code for one entry');

SELECT test_helpers.login('00000000-0000-0000-0000-000000000093');
SELECT throws_ok(format('SELECT slip_code(%L)', (SELECT id FROM class_list_entries WHERE roll_number = '15')), 'P0002', NULL,
    'another section''s teacher cannot make a slip for it');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-000000000094');
SELECT is((SELECT count(*)::int FROM class_list_entries), 0, 'students do not see class lists');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-000000000097');
SELECT is((peek_invite_code(current_setting('test.slip')) ->> 'slip_name'), 'Hira Bibi', 'a slip shows whose it is');
SELECT is((request_to_join(current_setting('test.slip'), 'Hira Bibi', '15') ->> 'matched')::boolean, true, 'a slip request is matched to its entry');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-000000000096');
SELECT throws_ok(format('SELECT request_to_join(%L, %L, %L)', current_setting('test.slip'), 'Zain', '14'), 'P0001', NULL,
    'a used slip works for nobody else');
SELECT is((request_to_join(current_setting('test.code_9a'), 'Zain', 'r-7') ->> 'matched')::boolean, true,
    'a class-code request is matched by roll number');
SELECT test_helpers.logout();
SELECT is((SELECT from_slip FROM join_requests WHERE user_id = '00000000-0000-0000-0000-000000000097'), true, 'the request says it came from a slip');

SELECT test_helpers.login('00000000-0000-0000-0000-000000000092');
SELECT is(decide_join_requests(ARRAY(SELECT id FROM join_requests WHERE status = 'pending' AND class_list_entry_id IS NOT NULL), true), 2,
    'the teacher approves all matched requests at once');
SELECT is((SELECT count(*)::int FROM class_list_entries WHERE student_id IS NOT NULL), 2, 'their entries are marked as joined');
SELECT throws_ok(format('SELECT slip_code(%L)', (SELECT id FROM class_list_entries WHERE roll_number = '15')), '22023', NULL,
    'a joined student needs no slip');
SELECT test_helpers.logout();

-- ===========================================================================
-- Password reset without email
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-000000000092');
SELECT set_config('test.reset', create_password_reset_code('00000000-0000-0000-0000-000000000094') ->> 'code', true);
SELECT matches(current_setting('test.reset'), '^[A-HJKMNP-Z2-9]{8}$', 'a teacher makes a reset code for their student');
SELECT throws_ok($$SELECT create_password_reset_code('00000000-0000-0000-0000-000000000093')$$, '42501', NULL,
    'a teacher cannot reset another teacher');
SELECT throws_ok($$SELECT * FROM password_reset_codes$$, '42501', NULL, 'nobody reads reset codes through the API');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-000000000093');
SELECT throws_ok($$SELECT create_password_reset_code('00000000-0000-0000-0000-000000000094')$$, '42501', NULL,
    'a teacher of another section cannot reset that student');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-000000000094');
SELECT throws_ok($$SELECT create_password_reset_code('00000000-0000-0000-0000-000000000095')$$, '42501', NULL,
    'a student cannot reset anyone');
SELECT throws_ok(format('SELECT use_password_reset_code(%L, %L)', 'ali@tutre.test', current_setting('test.reset')), '42501', NULL,
    'only the server can check a reset code');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-000000000091');
SELECT lives_ok($$SELECT create_password_reset_code('00000000-0000-0000-0000-000000000092')$$, 'the principal can reset a teacher');
SELECT throws_ok($$SELECT create_password_reset_code('00000000-0000-0000-0000-000000000090')$$, '42501', NULL,
    'but not a member of the Tutre team');
SELECT throws_ok($$SELECT support_password_reset_code('ali@tutre.test')$$, '42501', NULL, 'support resets are for Tutre only');
SELECT test_helpers.logout();

SELECT is((SELECT count(*)::int FROM password_reset_codes WHERE code_hash = current_setting('test.reset')), 0,
    'the code itself is not stored');

SELECT test_helpers.service();
SELECT is(use_password_reset_code('ali@tutre.test', 'WRONGCOD'), NULL, 'a wrong code is refused');
SELECT is(use_password_reset_code('ALI@tutre.test ', lower(current_setting('test.reset'))), '00000000-0000-0000-0000-000000000094'::uuid,
    'the right code (any case) gives the account');
SELECT is(use_password_reset_code('ali@tutre.test', current_setting('test.reset')), NULL, 'and works only once');
SELECT test_helpers.logout();

-- Five wrong tries use a code up; a newer code replaces an older one.
SELECT test_helpers.login('00000000-0000-0000-0000-000000000092');
SELECT set_config('test.reset2', create_password_reset_code('00000000-0000-0000-0000-000000000094') ->> 'code', true);
SELECT set_config('test.reset3', create_password_reset_code('00000000-0000-0000-0000-000000000094') ->> 'code', true);
SELECT test_helpers.logout();
SELECT test_helpers.service();
SELECT is(use_password_reset_code('ali@tutre.test', current_setting('test.reset2')), NULL, 'a replaced code no longer works');
SELECT use_password_reset_code('ali@tutre.test', 'WRONG001') FROM generate_series(1, 5);
SELECT is(use_password_reset_code('ali@tutre.test', current_setting('test.reset3')), NULL, 'five wrong tries use the code up');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-000000000090');
SELECT ok(support_password_reset_code('sara@tutre.test') ? 'code', 'Tutre can reset a private learner by email');
SELECT test_helpers.logout();

SELECT test_helpers.anon();
SELECT throws_ok(format('SELECT request_to_join(%L, %L, %L)', current_setting('test.code_9a'), 'x', '1'), '42501', NULL,
    'anonymous visitors cannot ask to join');
SELECT test_helpers.logout();

SELECT * FROM finish();
ROLLBACK;

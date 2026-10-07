-- Phase 5c access tests: teachers' own simulations and notes.
-- Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(54);

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

-- People. c0 Tutre platform admin. School A: c1 principal, c2 teacher of 9-A,
-- c3 teacher of 9-B, c4 student in 9-A, c5 student in 9-B. School B: c6 teacher
-- of 9-X, c7 student in 9-X. c8 belongs to no school.
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-0000000000c0', 'tutre@tutre.test', '{"full_name":"Tutre Admin"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000c1', 'principal@tutre.test', '{"full_name":"Principal A"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000c2', 'teacher1@tutre.test', '{"full_name":"Teacher One"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000c3', 'teacher2@tutre.test', '{"full_name":"Teacher Two"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000c4', 'student1@tutre.test', '{"full_name":"Student One"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000c5', 'student2@tutre.test', '{"full_name":"Student Two"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000c6', 'teacherb@tutre.test', '{"full_name":"Teacher B"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000c7', 'studentb@tutre.test', '{"full_name":"Student B"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000c8', 'outsider@tutre.test', '{"full_name":"Outsider"}', 'authenticated', 'authenticated');
INSERT INTO admin_users (id, studio_role) VALUES ('00000000-0000-0000-0000-0000000000c0', 'platform_admin');

INSERT INTO organizations (id, name, slug) VALUES
    ('00000000-0000-0000-0000-00000000ca00', 'School A', 'school-a'),
    ('00000000-0000-0000-0000-00000000cb00', 'School B', 'school-b');
INSERT INTO org_memberships (org_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000ca00', '00000000-0000-0000-0000-0000000000c1', 'org_admin'),
    ('00000000-0000-0000-0000-00000000ca00', '00000000-0000-0000-0000-0000000000c2', 'teacher'),
    ('00000000-0000-0000-0000-00000000ca00', '00000000-0000-0000-0000-0000000000c3', 'teacher'),
    ('00000000-0000-0000-0000-00000000ca00', '00000000-0000-0000-0000-0000000000c4', 'student'),
    ('00000000-0000-0000-0000-00000000ca00', '00000000-0000-0000-0000-0000000000c5', 'student'),
    ('00000000-0000-0000-0000-00000000cb00', '00000000-0000-0000-0000-0000000000c6', 'teacher'),
    ('00000000-0000-0000-0000-00000000cb00', '00000000-0000-0000-0000-0000000000c7', 'student');
INSERT INTO sections (id, org_id, name) VALUES
    ('00000000-0000-0000-0000-00000000ca09', '00000000-0000-0000-0000-00000000ca00', '9-A'),
    ('00000000-0000-0000-0000-00000000ca0b', '00000000-0000-0000-0000-00000000ca00', '9-B'),
    ('00000000-0000-0000-0000-00000000cb09', '00000000-0000-0000-0000-00000000cb00', '9-X');
INSERT INTO section_members (section_id, user_id, role) VALUES
    ('00000000-0000-0000-0000-00000000ca09', '00000000-0000-0000-0000-0000000000c2', 'teacher'),
    ('00000000-0000-0000-0000-00000000ca0b', '00000000-0000-0000-0000-0000000000c3', 'teacher'),
    ('00000000-0000-0000-0000-00000000ca09', '00000000-0000-0000-0000-0000000000c4', 'student'),
    ('00000000-0000-0000-0000-00000000ca0b', '00000000-0000-0000-0000-0000000000c5', 'student'),
    ('00000000-0000-0000-0000-00000000cb09', '00000000-0000-0000-0000-0000000000c6', 'teacher'),
    ('00000000-0000-0000-0000-00000000cb09', '00000000-0000-0000-0000-0000000000c7', 'student');

-- Curriculum: chapter 1 has topic "Binary" with a published simulation and
-- notes, and topic "Draft" with only a draft simulation; chapter 2 has "Logic".
INSERT INTO classes (id, name) VALUES ('00000000-0000-0000-0000-0000000c1a55', 'Class 9');
INSERT INTO subjects (id, class_id, name) VALUES ('00000000-0000-0000-0000-0000000c5b00', '00000000-0000-0000-0000-0000000c1a55', 'Computer Science');
INSERT INTO chapters (id, name, subject_id, chapter_no) VALUES
    ('00000000-0000-0000-0000-0000000c0001', 'Number Systems', '00000000-0000-0000-0000-0000000c5b00', 1),
    ('00000000-0000-0000-0000-0000000c0002', 'Logic Gates', '00000000-0000-0000-0000-0000000c5b00', 2);
INSERT INTO topics (id, subject_id, chapter_id, name, description, study_guide) VALUES
    ('00000000-0000-0000-0000-0000000c7001', '00000000-0000-0000-0000-0000000c5b00', '00000000-0000-0000-0000-0000000c0001', 'Binary', '<p>Binary numbers</p>', '<h1>Tutre notes</h1>'),
    ('00000000-0000-0000-0000-0000000c7002', '00000000-0000-0000-0000-0000000c5b00', '00000000-0000-0000-0000-0000000c0001', 'Draft', '<p>Draft</p>', '<p>Draft notes</p>'),
    ('00000000-0000-0000-0000-0000000c7003', '00000000-0000-0000-0000-0000000c5b00', '00000000-0000-0000-0000-0000000c0002', 'Logic', '<p>Gates</p>', NULL);
INSERT INTO simulations (id, topic_id, code_payload, status, published_at) VALUES
    ('00000000-0000-0000-0000-0000000c5101', '00000000-0000-0000-0000-0000000c7001', '<html>tutre binary</html>', 'published', now()),
    ('00000000-0000-0000-0000-0000000c5102', '00000000-0000-0000-0000-0000000c7002', '<html>draft</html>', 'draft', NULL);

CREATE FUNCTION test_helpers.material(p_title text) RETURNS uuid LANGUAGE sql AS $$
    SELECT id FROM public.teacher_materials WHERE title = p_title;
$$;

-- ===========================================================================
-- Creating material
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c2');
SELECT lives_ok($$INSERT INTO teacher_materials (org_id, kind, chapter_id, topic_id, title, summary, content)
    VALUES ('00000000-0000-0000-0000-00000000ca00', 'simulation', '00000000-0000-0000-0000-0000000c0001',
            '00000000-0000-0000-0000-0000000c7001', 'My binary sim', '<p>Mine</p>', '<html>mine</html>')$$,
    'a teacher creates a simulation in their school');
SELECT throws_ok($$INSERT INTO teacher_materials (org_id, kind, chapter_id, topic_id, title)
    VALUES ('00000000-0000-0000-0000-00000000ca00', 'notes', '00000000-0000-0000-0000-0000000c0001',
            '00000000-0000-0000-0000-0000000c7003', 'Wrong topic')$$, '22023', NULL,
    'the topic must belong to the chapter');
SELECT throws_ok($$INSERT INTO teacher_materials (org_id, kind, chapter_id, title)
    VALUES ('00000000-0000-0000-0000-00000000cb00', 'notes', '00000000-0000-0000-0000-0000000c0001', 'Other school')$$,
    '42501', NULL, 'a teacher cannot create material in another school');
SELECT throws_ok($$INSERT INTO teacher_materials (org_id, owner_id, kind, chapter_id, title)
    VALUES ('00000000-0000-0000-0000-00000000ca00', '00000000-0000-0000-0000-0000000000c3', 'notes', '00000000-0000-0000-0000-0000000c0001', 'Forged owner')$$,
    '42501', NULL, 'nobody can choose the owner');
SELECT throws_ok($$INSERT INTO teacher_materials (org_id, kind, chapter_id, title, based_on_simulation_id)
    VALUES ('00000000-0000-0000-0000-00000000ca00', 'simulation', '00000000-0000-0000-0000-0000000c0001', 'Forged origin', '00000000-0000-0000-0000-0000000c5101')$$,
    '42501', NULL, 'nobody can claim a Tutre origin by hand');
SELECT is((SELECT owner_id FROM teacher_materials WHERE title = 'My binary sim'), '00000000-0000-0000-0000-0000000000c2'::uuid,
    'the author is the caller');
SELECT lives_ok($$INSERT INTO teacher_materials (org_id, kind, chapter_id, title, content, visibility)
    VALUES ('00000000-0000-0000-0000-00000000ca00', 'notes', '00000000-0000-0000-0000-0000000c0002', 'Gate notes', '<p>AND, OR</p>', 'school')$$,
    'a teacher creates notes for the school library');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c4');
SELECT throws_ok($$INSERT INTO teacher_materials (org_id, kind, chapter_id, title)
    VALUES ('00000000-0000-0000-0000-00000000ca00', 'notes', '00000000-0000-0000-0000-0000000c0001', 'Student notes')$$,
    '42501', NULL, 'a student cannot create material');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c8');
SELECT throws_ok($$INSERT INTO teacher_materials (org_id, kind, chapter_id, title)
    VALUES ('00000000-0000-0000-0000-00000000ca00', 'notes', '00000000-0000-0000-0000-0000000c0001', 'Outsider notes')$$,
    '42501', NULL, 'someone outside the school cannot create material');
SELECT test_helpers.logout();

-- ===========================================================================
-- Who sees it before sharing
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c3');
SELECT is((SELECT count(*)::int FROM teacher_materials), 1, 'another teacher sees only what is in the school library');
SELECT is((SELECT array_agg(title || ' by ' || owner_name) FROM school_library('00000000-0000-0000-0000-00000000ca00')),
    ARRAY['Gate notes by Teacher One'], 'the school library lists it with its author');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c6');
SELECT is((SELECT count(*)::int FROM teacher_materials), 0, 'another school''s teacher sees nothing');
SELECT is((SELECT count(*)::int FROM school_library('00000000-0000-0000-0000-00000000ca00')), 0,
    'nor anything in another school''s library');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c4');
SELECT is((SELECT count(*)::int FROM teacher_materials), 0, 'a student sees nothing that is not shared with them');
SELECT test_helpers.logout();

-- ===========================================================================
-- Sharing
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c2');
SELECT lives_ok(format('INSERT INTO material_shares (material_id, section_id) VALUES (%L, %L)',
    test_helpers.material('My binary sim'), '00000000-0000-0000-0000-00000000ca09'), 'a teacher shares with a section they teach');
SELECT throws_ok(format('INSERT INTO material_shares (material_id, section_id) VALUES (%L, %L)',
    test_helpers.material('My binary sim'), '00000000-0000-0000-0000-00000000ca0b'), '42501', NULL,
    'but not with a section they do not teach');
SELECT throws_ok(format('INSERT INTO material_shares (material_id, section_id) VALUES (%L, %L)',
    test_helpers.material('My binary sim'), '00000000-0000-0000-0000-00000000cb09'), '42501', NULL,
    'nor with another school''s section');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c3');
SELECT throws_ok(format('INSERT INTO material_shares (material_id, section_id) VALUES (%L, %L)',
    test_helpers.material('Gate notes'), '00000000-0000-0000-0000-00000000ca0b'), '42501', NULL,
    'nobody shares another teacher''s material');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c4');
SELECT is((SELECT array_agg(title) FROM teacher_materials), ARRAY['My binary sim'], 'a student in the section sees the shared material');
SELECT is((SELECT content FROM teacher_materials), '<html>mine</html>', 'including its content');
SELECT is((SELECT owner_name FROM shared_materials('00000000-0000-0000-0000-0000000c0001')), 'Teacher One',
    'shared_materials names the teacher');
SELECT is((SELECT count(*)::int FROM shared_materials('00000000-0000-0000-0000-0000000c0002')), 0, 'and filters by chapter');
SELECT is((SELECT count(*)::int FROM material_shares), 0, 'a student does not read the share list');
UPDATE teacher_materials SET title = 'Hacked' WHERE title = 'My binary sim';
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM teacher_materials WHERE title = 'Hacked'), 0, 'a student cannot edit shared material');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c5');
SELECT is((SELECT count(*)::int FROM teacher_materials), 0, 'a student in another section does not see it');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c7');
SELECT is((SELECT count(*)::int FROM shared_materials()), 0, 'a student of another school does not see it');
SELECT test_helpers.logout();

-- ===========================================================================
-- Editing: only the author; school admins archive and unshare
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c3');
UPDATE teacher_materials SET title = 'Taken over' WHERE title = 'Gate notes';
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM teacher_materials WHERE title = 'Taken over'), 0, 'another teacher cannot edit library material');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c2');
SELECT lives_ok($$UPDATE teacher_materials SET content = '<html>mine v2</html>' WHERE title = 'My binary sim'$$, 'the author edits their material');
SELECT throws_ok($$UPDATE teacher_materials SET org_id = '00000000-0000-0000-0000-00000000cb00' WHERE title = 'My binary sim'$$,
    '42501', NULL, 'the school cannot be changed');
SELECT test_helpers.logout();
SELECT is((SELECT version FROM teacher_materials WHERE title = 'My binary sim'), 2, 'changing the content raises the version');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c1');
SELECT is((SELECT count(*)::int FROM teacher_materials), 2, 'the principal sees all of the school''s material');
SELECT throws_ok($$UPDATE teacher_materials SET title = 'Principal edit' WHERE title = 'My binary sim'$$, '42501',
    'Only the author can edit this material. School admins can archive it.', 'the principal cannot edit a teacher''s work');
SELECT lives_ok($$UPDATE teacher_materials SET status = 'archived' WHERE title = 'My binary sim'$$, 'the principal can archive it');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c4');
SELECT is((SELECT count(*)::int FROM teacher_materials), 0, 'archived material disappears for students');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c2');
SELECT lives_ok($$UPDATE teacher_materials SET status = 'active' WHERE title = 'My binary sim'$$, 'the author can restore it');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c1');
SELECT lives_ok(format('DELETE FROM material_shares WHERE material_id = %L', test_helpers.material('My binary sim')),
    'the principal can unshare it');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c4');
SELECT is((SELECT count(*)::int FROM teacher_materials), 0, 'unshared material disappears for students');
SELECT test_helpers.logout();

-- ===========================================================================
-- Copying from Tutre's library and the school library
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c3');
SELECT set_config('test.copy', copy_library_simulation('00000000-0000-0000-0000-0000000c5101', '00000000-0000-0000-0000-00000000ca00')::text, true);
SELECT is((SELECT content || ' / ' || title FROM teacher_materials WHERE id = current_setting('test.copy')::uuid), '<html>tutre binary</html> / Binary',
    'a teacher copies a Tutre simulation into their materials');
SELECT lives_ok(format('UPDATE teacher_materials SET content = %L WHERE id = %L', '<html>changed copy</html>', current_setting('test.copy')),
    'and edits the copy');
SELECT throws_ok($$SELECT copy_library_simulation('00000000-0000-0000-0000-0000000c5102', '00000000-0000-0000-0000-00000000ca00')$$, 'P0002', NULL,
    'a draft cannot be copied');
SELECT ok(copy_library_notes('00000000-0000-0000-0000-0000000c7001', '00000000-0000-0000-0000-00000000ca00') IS NOT NULL,
    'a teacher copies Tutre''s notes');
SELECT throws_ok($$SELECT copy_library_notes('00000000-0000-0000-0000-0000000c7002', '00000000-0000-0000-0000-00000000ca00')$$, 'P0002', NULL,
    'notes of a topic without a published simulation cannot be copied');
SELECT set_config('test.libcopy', copy_teacher_material(test_helpers.material('Gate notes'))::text, true);
SELECT is((SELECT owner_id::text || ' ' || visibility FROM teacher_materials WHERE id = current_setting('test.libcopy')::uuid),
    '00000000-0000-0000-0000-0000000000c3 private', 'a teacher copies from the school library; the copy is theirs and private');
SELECT test_helpers.logout();

SELECT is((SELECT code_payload FROM simulations WHERE id = '00000000-0000-0000-0000-0000000c5101'), '<html>tutre binary</html>',
    'the Tutre original is untouched');
SELECT is((SELECT based_on_simulation_id FROM teacher_materials WHERE id = current_setting('test.copy')::uuid),
    '00000000-0000-0000-0000-0000000c5101'::uuid, 'the copy records where it came from');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c4');
SELECT throws_ok($$SELECT copy_library_simulation('00000000-0000-0000-0000-0000000c5101', '00000000-0000-0000-0000-00000000ca00')$$, '42501', NULL,
    'a student cannot copy');
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c6');
SELECT throws_ok(format('SELECT copy_teacher_material(%L)', test_helpers.material('Gate notes')), 'P0002', NULL,
    'another school''s teacher cannot copy from this library');
SELECT test_helpers.logout();

-- ===========================================================================
-- Deleting, leaving the school, Tutre, anonymous visitors
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c3');
DELETE FROM teacher_materials WHERE title = 'My binary sim';
SELECT lives_ok(format('DELETE FROM teacher_materials WHERE id = %L', current_setting('test.libcopy')), 'an author deletes their own material');
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM teacher_materials WHERE title = 'My binary sim'), 1, 'but not someone else''s');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c1');
UPDATE org_memberships SET status = 'removed' WHERE user_id = '00000000-0000-0000-0000-0000000000c2';
SELECT test_helpers.logout();
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c2');
SELECT is((SELECT count(*)::int FROM teacher_materials), 0, 'a teacher who leaves the school loses access to its material');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000c0');
SELECT is((SELECT count(*)::int FROM teacher_materials), 4, 'Tutre sees every school''s material');
SELECT test_helpers.logout();

SELECT test_helpers.anon();
SELECT throws_ok($$SELECT count(*) FROM teacher_materials$$, '42501', NULL, 'anonymous visitors cannot read material');
SELECT throws_ok($$SELECT count(*) FROM shared_materials()$$, '42501', NULL, 'nor list it');
SELECT test_helpers.logout();

SELECT is((SELECT array_agg(daily_limit ORDER BY scope) FROM ai_quota_limits WHERE scope LIKE 'teacher_%'), ARRAY[50, 30, 10],
    'teachers have their own AI limits');

SELECT * FROM finish();
ROLLBACK;

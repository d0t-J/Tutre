-- Phase 3c access tests: Urdu translations of the curriculum and the glossary.
-- Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(43);

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

-- People: f1 platform admin, f2 reviewer, f3 author, f4 second author, f5 student.
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-0000000000f1', 'platform@tutre.test', '{"full_name":"Platform"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f2', 'reviewer@tutre.test', '{"full_name":"Reviewer"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f3', 'author@tutre.test', '{"full_name":"Author"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f4', 'author2@tutre.test', '{"full_name":"Author Two"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000f5', 'student@tutre.test', '{"full_name":"Student"}', 'authenticated', 'authenticated');
INSERT INTO admin_users (id, studio_role) VALUES
    ('00000000-0000-0000-0000-0000000000f1', 'platform_admin'),
    ('00000000-0000-0000-0000-0000000000f2', 'reviewer'),
    ('00000000-0000-0000-0000-0000000000f3', 'author'),
    ('00000000-0000-0000-0000-0000000000f4', 'author');

-- Curriculum: one class, subject, chapter (with a description) and topic.
INSERT INTO classes (id, name) VALUES ('00000000-0000-0000-0000-00000000c001', 'Test Class 9');
INSERT INTO subjects (id, class_id, name) VALUES ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000c001', 'Test Physics');
INSERT INTO chapters (id, subject_id, name, chapter_no, description)
    VALUES ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-00000000c002', 'Test Kinematics', 1, 'Motion');
INSERT INTO chapters (id, subject_id, name, chapter_no)
    VALUES ('00000000-0000-0000-0000-00000000c013', '00000000-0000-0000-0000-00000000c002', 'Test Dynamics', 2);
INSERT INTO topics (id, subject_id, chapter_id, name, description)
    VALUES ('00000000-0000-0000-0000-00000000c004', '00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000c003', 'Test Speed', '<p>Speed</p>');

-- ===========================================================================
-- Authors write drafts only
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f3');
SELECT lives_ok($$INSERT INTO content_translations (entity_type, entity_id, field, text)
    VALUES ('class', '00000000-0000-0000-0000-00000000c001', 'name', 'جماعت نہم')$$,
    'an author can add a draft translation');
SELECT throws_ok($$INSERT INTO content_translations (entity_type, entity_id, field, text, status)
    VALUES ('subject', '00000000-0000-0000-0000-00000000c002', 'name', 'طبیعیات', 'verified')$$,
    '42501', 'Only a reviewer can verify a translation.', 'an author cannot add a verified translation');
SELECT throws_ok($$UPDATE content_translations SET status = 'verified' WHERE entity_id = '00000000-0000-0000-0000-00000000c001'$$,
    '42501', 'Only a reviewer can verify a translation.', 'an author cannot verify their own draft');
SELECT throws_ok($$UPDATE content_translations SET verified_by = auth.uid() WHERE entity_id = '00000000-0000-0000-0000-00000000c001'$$,
    '42501', NULL, 'bookkeeping columns cannot be written directly');
SELECT throws_ok($$INSERT INTO content_translations (entity_type, entity_id, field, text)
    VALUES ('class', '00000000-0000-0000-0000-00000000c001', 'description', 'x')$$,
    '23514', NULL, 'a class has no description to translate');
SELECT throws_ok($$INSERT INTO content_translations (entity_type, entity_id, field, text)
    VALUES ('topic', gen_random_uuid(), 'name', 'x')$$,
    '23503', NULL, 'a translation needs an existing item');
SELECT throws_ok($$INSERT INTO content_translations (entity_type, entity_id, field, text)
    VALUES ('chapter', '00000000-0000-0000-0000-00000000c013', 'description', 'x')$$,
    '23503', 'There is no English description to translate for that chapter.', 'a field with no English text cannot be translated');
SELECT throws_ok($$INSERT INTO content_translations (entity_type, entity_id, field, text)
    VALUES ('class', '00000000-0000-0000-0000-00000000c001', 'name', 'دوبارہ')$$,
    '23505', NULL, 'one translation per item, field and language');
SELECT throws_ok($$INSERT INTO content_translations (entity_type, entity_id, field, text)
    VALUES ('class', '00000000-0000-0000-0000-00000000c001', 'name', '   ')$$,
    '23514', NULL, 'a translation cannot be blank');
SELECT lives_ok($$INSERT INTO content_translations (entity_type, entity_id, field, text)
    VALUES ('topic', '00000000-0000-0000-0000-00000000c004', 'name', 'رفتار')$$,
    'an author adds a second draft');
SELECT test_helpers.logout();

SELECT is((SELECT edited_by::text FROM content_translations WHERE entity_type = 'class'),
    '00000000-0000-0000-0000-0000000000f3', 'the editor is recorded');
SELECT is((SELECT source_md5 FROM content_translations WHERE entity_type = 'class'),
    md5('Test Class 9'), 'the English source is fingerprinted');

-- ===========================================================================
-- Students and visitors see verified translations only
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f5');
SELECT is((SELECT count(*)::int FROM content_translations), 0, 'a student sees no drafts');
SELECT throws_ok($$INSERT INTO content_translations (entity_type, entity_id, field, text)
    VALUES ('subject', '00000000-0000-0000-0000-00000000c002', 'name', 'طبیعیات')$$,
    '42501', NULL, 'a student cannot add translations');
SELECT is((SELECT count(*)::int FROM translation_overview WHERE urdu IS NOT NULL), 0,
    'the overview shows a student no draft text');
SELECT test_helpers.logout();

SELECT test_helpers.anon();
SELECT throws_ok($$SELECT count(*) FROM content_translations$$, '42501', NULL, 'anonymous visitors cannot read translations');
SELECT throws_ok($$SELECT count(*) FROM translation_overview$$, '42501', NULL, 'anonymous visitors cannot read the overview');
SELECT test_helpers.logout();

-- ===========================================================================
-- Reviewers verify
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f2');
SELECT is((SELECT count(*)::int FROM content_translations), 2, 'a reviewer sees drafts');
SELECT lives_ok($$UPDATE content_translations SET status = 'verified' WHERE entity_type = 'class'$$,
    'a reviewer verifies a translation');
SELECT test_helpers.logout();
SELECT is((SELECT verified_by::text FROM content_translations WHERE entity_type = 'class'),
    '00000000-0000-0000-0000-0000000000f2', 'the verifier is recorded');
SELECT isnt((SELECT verified_at FROM content_translations WHERE entity_type = 'class'), NULL, 'the verification time is recorded');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f5');
SELECT is((SELECT text FROM content_translations), 'جماعت نہم', 'a student sees the verified translation');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f3');
SELECT throws_ok($$UPDATE content_translations SET text = 'جماعت ۹' WHERE entity_type = 'class'$$,
    '42501', 'Only a reviewer can change a verified translation.', 'an author cannot change a verified translation');
DELETE FROM content_translations WHERE entity_type = 'class';
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM content_translations WHERE entity_type = 'class'), 1,
    'an author cannot delete a verified translation');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f2');
SELECT lives_ok($$UPDATE content_translations SET text = 'نہم جماعت' WHERE entity_type = 'class'$$,
    'a reviewer can edit a verified translation');
SELECT is((SELECT status FROM content_translations WHERE entity_type = 'class'), 'verified',
    'a reviewer''s edit stays verified');
SELECT lives_ok($$UPDATE content_translations SET status = 'draft' WHERE entity_type = 'class'$$,
    'a reviewer can send a translation back to draft');
SELECT is((SELECT verified_by FROM content_translations WHERE entity_type = 'class'), NULL,
    'back to draft clears the verification');
UPDATE content_translations SET status = 'verified' WHERE entity_type = 'class';
SELECT test_helpers.logout();

-- ===========================================================================
-- Deleting drafts
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f4');
DELETE FROM content_translations WHERE entity_type = 'topic';
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM content_translations WHERE entity_type = 'topic'), 1,
    'an author cannot delete another author''s draft');
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f3');
DELETE FROM content_translations WHERE entity_type = 'topic';
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM content_translations WHERE entity_type = 'topic'), 0,
    'an author can delete their own draft');

-- ===========================================================================
-- Outdated translations, and cleanup with the item
-- ===========================================================================
SELECT is((SELECT outdated FROM translation_overview WHERE entity_type = 'class' AND entity_id = '00000000-0000-0000-0000-00000000c001'),
    false, 'a fresh translation is not outdated');
UPDATE classes SET name = 'Test Class Nine' WHERE id = '00000000-0000-0000-0000-00000000c001';
SELECT is((SELECT outdated FROM translation_overview WHERE entity_type = 'class' AND entity_id = '00000000-0000-0000-0000-00000000c001'),
    true, 'changing the English marks the translation outdated');
UPDATE content_translations SET status = 'draft' WHERE entity_type = 'class';
SELECT is((SELECT outdated FROM translation_overview WHERE entity_type = 'class' AND entity_id = '00000000-0000-0000-0000-00000000c001'),
    true, 'sending it back to draft does not clear the outdated mark');
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f2');
UPDATE content_translations SET status = 'verified' WHERE entity_type = 'class';
SELECT test_helpers.logout();
SELECT is((SELECT outdated FROM translation_overview WHERE entity_type = 'class' AND entity_id = '00000000-0000-0000-0000-00000000c001'),
    false, 'a reviewer confirming it again clears the outdated mark');
SELECT is((SELECT count(*)::int FROM translation_overview WHERE entity_type = 'chapter' AND field = 'description'
    AND subject_id = '00000000-0000-0000-0000-00000000c002'), 1,
    'fields with no English text are left out of the overview');
DELETE FROM topics WHERE id = '00000000-0000-0000-0000-00000000c004';
INSERT INTO content_translations (entity_type, entity_id, field, text)
    VALUES ('chapter', '00000000-0000-0000-0000-00000000c003', 'name', 'حرکیات');
DELETE FROM chapters WHERE id = '00000000-0000-0000-0000-00000000c003';
SELECT is((SELECT count(*)::int FROM content_translations WHERE entity_type = 'chapter'), 0,
    'translations are deleted with their item');

-- ===========================================================================
-- Glossary
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f3');
SELECT lives_ok($$INSERT INTO glossary_terms (subject_slug, term_en, term_ur, roman_ur) VALUES ('physics', 'velocity', 'سمتی رفتار', 'samti raftar')$$,
    'an author can add a draft term');
SELECT throws_ok($$INSERT INTO glossary_terms (subject_slug, term_en, term_ur) VALUES ('physics', 'Velocity ', 'رفتار')$$,
    '23505', NULL, 'a term is unique per subject, ignoring case and spaces');
SELECT lives_ok($$INSERT INTO glossary_terms (subject_slug, term_en, term_ur) VALUES ('computer_science', 'velocity', 'رفتار')$$,
    'the same term can differ between subjects');
SELECT throws_ok($$UPDATE glossary_terms SET status = 'verified' WHERE subject_slug = 'physics'$$,
    '42501', 'Only a reviewer can verify a translation.', 'an author cannot verify a term');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f1');
SELECT lives_ok($$UPDATE glossary_terms SET status = 'verified' WHERE subject_slug = 'physics'$$,
    'a platform admin can verify a term');
SELECT test_helpers.logout();

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000f5');
SELECT is((SELECT count(*)::int FROM glossary_terms), 1, 'a student sees verified terms only');
SELECT test_helpers.logout();

-- ===========================================================================
-- Quota
-- ===========================================================================
SELECT is((SELECT daily_limit FROM ai_quota_limits WHERE scope = 'translation'), 300,
    'AI translation drafts are limited to 300 per user per day');

SELECT * FROM finish();
ROLLBACK;

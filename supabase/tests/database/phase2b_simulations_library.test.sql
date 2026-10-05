-- Phase 2b tests: the single simulations table, its review workflow, version
-- history, the all_simulations view, and the canonical publish function.
-- Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(50);

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

-- People: ...e1 platform admin, ...e2 reviewer, ...e3 author, ...e4 second author, ...e5 student
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-0000000000e1', 'platform@lib.test', '{"full_name":"Platform"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e2', 'reviewer@lib.test', '{"full_name":"Reviewer"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e3', 'author@lib.test', '{"full_name":"Author"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e4', 'author2@lib.test', '{"full_name":"Author Two"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-0000000000e5', 'student@lib.test', '{"full_name":"Student"}', 'authenticated', 'authenticated');
INSERT INTO admin_users (id, studio_role) VALUES
    ('00000000-0000-0000-0000-0000000000e1', 'platform_admin'),
    ('00000000-0000-0000-0000-0000000000e2', 'reviewer'),
    ('00000000-0000-0000-0000-0000000000e3', 'author'),
    ('00000000-0000-0000-0000-0000000000e4', 'author');

-- Curriculum and topics, created as the database owner.
WITH c AS (INSERT INTO classes (name) VALUES ('Test Class') RETURNING id),
     s AS (INSERT INTO subjects (name, class_id, slug) SELECT 'Test Subject', id, 'test_subject' FROM c RETURNING id),
     ch AS (INSERT INTO chapters (name, subject_id, chapter_no) SELECT 'Test Chapter', id, 1 FROM s RETURNING id, subject_id)
SELECT set_config('test.subject', subject_id::text, true), set_config('test.chapter', id::text, true) FROM ch;
WITH t AS (INSERT INTO topics (subject_id, chapter_id, name) VALUES
    (current_setting('test.subject')::uuid, current_setting('test.chapter')::uuid, 'Live topic'),
    (current_setting('test.subject')::uuid, current_setting('test.chapter')::uuid, 'Draft topic'),
    (current_setting('test.subject')::uuid, current_setting('test.chapter')::uuid, 'Scratch topic') RETURNING id, name)
SELECT set_config('test.topic_' || split_part(name, ' ', 1), id::text, true) FROM t;

-- ===========================================================================
-- The view keeps its 14 columns in order and appends status, kind, version
-- ===========================================================================
SELECT is(
    (SELECT array_agg(column_name::text ORDER BY ordinal_position) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'all_simulations'),
    ARRAY['topic_id', 'topic', 'description', 'chapter_id', 'subject_id', 'subject', 'icon_name', 'class_id', 'class_name',
          'sim_id', 'code_payload', 'created_at', 'study_guide', 'subject_slug', 'status', 'kind', 'version'],
    'all_simulations keeps its columns in order and appends status, kind and version');
SELECT ok((SELECT 'security_invoker=on' = ANY (reloptions) FROM pg_class WHERE oid = 'public.all_simulations'::regclass),
    'all_simulations still runs with the caller''s permissions (security_invoker)');
SELECT has_table('public', 'physics_simulations', 'the old per-subject tables are kept as a backup');

-- A published simulation inserted by the owner, as the copy does.
WITH s AS (INSERT INTO simulations (topic_id, code_payload, status) VALUES (current_setting('test.topic_Live')::uuid, '<p>live v1</p>', 'published') RETURNING id)
SELECT set_config('test.sim_live', id::text, true) FROM s;
SELECT isnt((SELECT published_at FROM simulations WHERE id = current_setting('test.sim_live')::uuid), NULL,
    'publishing sets published_at');

-- ===========================================================================
-- Author
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e3');
WITH s AS (INSERT INTO simulations (topic_id, code_payload) VALUES (current_setting('test.topic_Draft')::uuid, '<p>draft v1</p>') RETURNING id, status)
SELECT set_config('test.sim_draft', id::text, true), set_config('test.sim_draft_status', status, true) FROM s;
SELECT throws_ok(format('INSERT INTO simulations (topic_id, code_payload, status) VALUES (%L, %L, %L)', current_setting('test.topic_Scratch'), 'x', 'published'),
    '42501', 'Authors can save drafts and submit them for review; a reviewer publishes.', 'an author cannot create a published simulation');
SELECT throws_ok(format('INSERT INTO simulations (topic_id, code_payload, kind) VALUES (%L, %L, %L)', current_setting('test.topic_Scratch'), 'x', 'canonical'),
    '42501', 'Only a reviewer can mark a simulation as canonical.', 'an author cannot create a canonical simulation');
SELECT lives_ok(format('UPDATE simulations SET code_payload = %L WHERE id = %L', '<p>draft v2</p>', current_setting('test.sim_draft')),
    'an author can edit their draft');
SELECT throws_ok(format('UPDATE simulations SET version = 99 WHERE id = %L', current_setting('test.sim_draft')), '42501', NULL,
    'nobody sets the version number by hand');
SELECT throws_ok(format('UPDATE simulations SET published_at = now() WHERE id = %L', current_setting('test.sim_draft')), '42501', NULL,
    'nobody sets published_at by hand');
SELECT throws_ok(format('UPDATE simulations SET created_by = %L WHERE id = %L', '00000000-0000-0000-0000-0000000000e4', current_setting('test.sim_draft')), '42501', NULL,
    'nobody changes who created a simulation');
SELECT lives_ok(format('UPDATE simulations SET status = %L WHERE id = %L', 'in_review', current_setting('test.sim_draft')),
    'an author can submit a draft for review');
SELECT throws_ok(format('UPDATE simulations SET status = %L WHERE id = %L', 'published', current_setting('test.sim_draft')),
    '42501', 'Authors can save drafts and submit them for review; a reviewer publishes.', 'an author cannot publish');
SELECT throws_ok(format('UPDATE simulations SET code_payload = %L WHERE id = %L', 'vandalised', current_setting('test.sim_live')),
    '42501', 'Only a reviewer can change a published simulation.', 'an author cannot change a published simulation');
SELECT throws_ok(format('UPDATE topics SET description = %L WHERE id = %L', 'rewritten live', current_setting('test.topic_Live')),
    '42501', 'Only a reviewer can change a published simulation.', 'an author cannot change the description of a published simulation');
SELECT throws_ok(format('DELETE FROM topics WHERE id = %L', current_setting('test.topic_Live')),
    '42501', 'Only a reviewer can change a published simulation.', 'an author cannot delete the topic of a published simulation');
SELECT lives_ok(format('UPDATE topics SET description = %L WHERE id = %L', 'draft notes', current_setting('test.topic_Draft')),
    'an author can edit the topic of their own draft');
SELECT is((SELECT count(*)::int FROM all_simulations), 2, 'Studio members see drafts and published simulations');
SELECT is((SELECT count(*)::int FROM simulation_versions), 1, 'Studio members can read version history');
-- A scratch draft to delete
WITH s AS (INSERT INTO simulations (topic_id, code_payload) VALUES (current_setting('test.topic_Scratch')::uuid, 'scratch') RETURNING id)
SELECT set_config('test.sim_scratch', id::text, true) FROM s;
DELETE FROM simulations WHERE id = current_setting('test.sim_live')::uuid;
SELECT test_helpers.logout();

SELECT is(current_setting('test.sim_draft_status'), 'draft', 'a new simulation starts as a draft');
SELECT is((SELECT created_by FROM simulations WHERE id = current_setting('test.sim_draft')::uuid), '00000000-0000-0000-0000-0000000000e3'::uuid,
    'created_by records the author');
SELECT is((SELECT version FROM simulations WHERE id = current_setting('test.sim_draft')::uuid), 2,
    'editing the payload bumps the version');
SELECT is((SELECT code_payload || ' / ' || status || ' / ' || replaced_by FROM simulation_versions WHERE simulation_id = current_setting('test.sim_draft')::uuid AND version = 1),
    '<p>draft v1</p> / draft / 00000000-0000-0000-0000-0000000000e3', 'the previous payload is kept, with who replaced it');
SELECT is((SELECT count(*)::int FROM simulations WHERE id = current_setting('test.sim_live')::uuid), 1,
    'an author cannot delete a published simulation');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e4');
DELETE FROM simulations WHERE id = current_setting('test.sim_scratch')::uuid;
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM simulations WHERE id = current_setting('test.sim_scratch')::uuid), 1,
    'an author cannot delete someone else''s draft');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e3');
SELECT lives_ok(format('DELETE FROM simulations WHERE id = %L', current_setting('test.sim_scratch')), 'an author can delete their own draft');
SELECT throws_ok(format('SELECT restore_simulation_version(%L, 1)', current_setting('test.sim_draft')),
    '42501', 'Only a reviewer can restore an earlier version.', 'an author cannot restore an old version');
SELECT test_helpers.logout();
SELECT is((SELECT count(*)::int FROM simulations WHERE id = current_setting('test.sim_scratch')::uuid), 0, 'the own draft was deleted');

-- ===========================================================================
-- Student, before anything else is published
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e5');
SELECT bag_eq($$SELECT topic FROM all_simulations$$, ARRAY['Live topic'], 'a student sees only published simulations');
SELECT is((SELECT count(*)::int FROM simulations WHERE status <> 'published'), 0, 'a student cannot read drafts from the table either');
SELECT is((SELECT count(*)::int FROM simulation_versions), 0, 'a student cannot read version history');
SELECT throws_ok(format('INSERT INTO simulations (topic_id, code_payload) VALUES (%L, %L)', current_setting('test.topic_Scratch'), 'x'), '42501', NULL,
    'a student cannot create simulations');
UPDATE simulations SET code_payload = 'hacked' WHERE id = current_setting('test.sim_live')::uuid;
DELETE FROM simulations WHERE id = current_setting('test.sim_live')::uuid;
SELECT throws_ok(format('SELECT restore_simulation_version(%L, 1)', current_setting('test.sim_draft')), '42501', NULL,
    'a student cannot restore versions');
SELECT test_helpers.logout();
SELECT is((SELECT code_payload FROM simulations WHERE id = current_setting('test.sim_live')::uuid), '<p>live v1</p>',
    'a student cannot change or delete a published simulation');

-- ===========================================================================
-- Reviewer
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e2');
SELECT lives_ok(format('UPDATE simulations SET status = %L WHERE id = %L', 'published', current_setting('test.sim_draft')),
    'a reviewer can publish');
SELECT lives_ok(format('UPDATE simulations SET code_payload = %L WHERE id = %L', '<p>live v2</p>', current_setting('test.sim_live')),
    'a reviewer can edit a published simulation');
SELECT lives_ok(format('UPDATE topics SET description = %L WHERE id = %L', 'reviewed description', current_setting('test.topic_Live')),
    'a reviewer can edit the description of a published simulation');
SELECT is(restore_simulation_version(current_setting('test.sim_live')::uuid, 1), 3,
    'a reviewer can restore an old version, which becomes the newest version');
SELECT lives_ok(format('UPDATE simulations SET status = %L WHERE id = %L', 'draft', current_setting('test.sim_live')),
    'a reviewer can unpublish');
SELECT test_helpers.logout();
SELECT is((SELECT reviewed_by FROM simulations WHERE id = current_setting('test.sim_draft')::uuid), '00000000-0000-0000-0000-0000000000e2'::uuid,
    'publishing records the reviewer');
SELECT is((SELECT code_payload FROM simulations WHERE id = current_setting('test.sim_live')::uuid), '<p>live v1</p>',
    'the restore put the old payload back');
SELECT is((SELECT count(*)::int FROM simulation_versions WHERE simulation_id = current_setting('test.sim_live')::uuid), 2,
    'both replaced payloads are in the history, so the restore can be undone too');
SELECT is((SELECT version FROM simulations WHERE id = current_setting('test.sim_live')::uuid), 3,
    'a status change alone does not create a version');

SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e5');
SELECT bag_eq($$SELECT topic FROM all_simulations$$, ARRAY['Draft topic'],
    'after publish and unpublish, students see exactly the published set');
SELECT test_helpers.logout();

-- ===========================================================================
-- Anonymous visitors: no rows, as before 2b, and no writes
-- ===========================================================================
SELECT test_helpers.anon();
SELECT is((SELECT count(*)::int FROM all_simulations), 0, 'an anonymous read of all_simulations returns no rows');
SELECT throws_ok(format('INSERT INTO simulations (topic_id, code_payload) VALUES (%L, %L)', current_setting('test.topic_Scratch'), 'x'), '42501', NULL,
    'anonymous visitors cannot create simulations');
SELECT test_helpers.logout();

-- ===========================================================================
-- upsert_canonical_simulation writes to the new table
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e2');
SELECT set_config('test.canon', upsert_canonical_simulation('Test Class', 'test_subject', 1, 'Canonical topic', '<p>d</p>', '<p>g</p>', '<p>c1</p>')::text, true);
SELECT is(upsert_canonical_simulation('Test Class', 'test_subject', 1, 'Canonical topic', '<p>d2</p>', '<p>g2</p>', '<p>c2</p>')::text,
    current_setting('test.canon'), 're-running the publish function updates the same simulation');
SELECT test_helpers.logout();
SELECT is((SELECT status || '/' || kind || '/' || version || '/' || code_payload FROM simulations WHERE id = current_setting('test.canon')::uuid),
    'published/canonical/2/<p>c2</p>', 'the publish function creates a published canonical simulation and versions updates');
SELECT test_helpers.login('00000000-0000-0000-0000-0000000000e3');
SELECT throws_ok($$SELECT upsert_canonical_simulation('Test Class', 'test_subject', 1, 'Author canonical', 'd', 'g', 'c')$$, '42501', NULL,
    'an author cannot publish canonical content');
SELECT test_helpers.logout();
SELECT lives_ok($$SELECT upsert_canonical_simulation('Test Class', 'test_subject', 1, 'Owner canonical', 'd', 'g', 'c')$$,
    'the SQL editor (database owner) can still publish canonical content');
SELECT is((SELECT count(*)::int FROM simulations s JOIN topics t ON t.id = s.topic_id WHERE t.name = 'Author canonical'), 0,
    'the refused author attempt left nothing behind');

SELECT * FROM finish();
ROLLBACK;

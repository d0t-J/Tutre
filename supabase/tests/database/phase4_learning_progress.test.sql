-- Phase 4 tests: simulation manifests and learning progress.
-- Run with:  npx supabase test db
-- Everything runs in one transaction and is rolled back at the end.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(37);

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

-- People: 01 student, 02 second student, 03 Studio author.
INSERT INTO auth.users (id, email, raw_user_meta_data, aud, role) VALUES
    ('00000000-0000-0000-0000-000000004001', 'student1@tutre.test', '{"full_name":"Student One"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000004002', 'student2@tutre.test', '{"full_name":"Student Two"}', 'authenticated', 'authenticated'),
    ('00000000-0000-0000-0000-000000004003', 'author@tutre.test', '{"full_name":"Author"}', 'authenticated', 'authenticated');
INSERT INTO admin_users (id, studio_role) VALUES ('00000000-0000-0000-0000-000000004003', 'author');

INSERT INTO classes (id, name) VALUES ('00000000-0000-0000-0000-00000000d001', 'P4 Class');
INSERT INTO subjects (id, class_id, name) VALUES ('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-00000000d001', 'P4 Subject');
INSERT INTO topics (id, subject_id, name) VALUES
    ('00000000-0000-0000-0000-00000000d0a1', '00000000-0000-0000-0000-00000000d002', 'Bridge-ready topic'),
    ('00000000-0000-0000-0000-00000000d0b1', '00000000-0000-0000-0000-00000000d002', 'Legacy topic'),
    ('00000000-0000-0000-0000-00000000d0c1', '00000000-0000-0000-0000-00000000d002', 'Draft topic');

-- A: Bridge-ready and published. B: legacy (no manifest), published. C: draft.
INSERT INTO simulations (id, topic_id, status, published_at, code_payload) VALUES
    ('00000000-0000-0000-0000-00000000e00a', '00000000-0000-0000-0000-00000000d0a1', 'published', now(),
     '<html><head><script type="application/json" id="tutre-manifest">
        {"protocol": 1,
         "checkpoints": [{"id": "start"}, {"id": "convert"}],
         "challenges": ["to-binary", {"id": "to-hex", "label": "Decimal to hex"}],
         "practice": {"attempts": 3}, "mastery": {"correct": 3, "challengeTypes": 2}}
      </script></head><body>A</body></html>'),
    ('00000000-0000-0000-0000-00000000e00b', '00000000-0000-0000-0000-00000000d0b1', 'published', now(), '<html><body>Legacy</body></html>'),
    ('00000000-0000-0000-0000-00000000e00c', '00000000-0000-0000-0000-00000000d0c1', 'draft', NULL,
     '<script type="application/json" id="tutre-manifest">{"protocol": 1, "checkpoints": ["start"]}</script>');

-- ===========================================================================
-- Manifests
-- ===========================================================================
SELECT is((SELECT manifest FROM simulations WHERE id = '00000000-0000-0000-0000-00000000e00a'),
    '{"protocol": 1, "checkpoints": ["start", "convert"], "challenges": ["to-binary", "to-hex"],
      "practice_attempts": 3, "mastery_correct": 3, "mastery_types": 2}'::jsonb,
    'the manifest is read from the simulation code and normalised');
SELECT is((SELECT manifest FROM simulations WHERE id = '00000000-0000-0000-0000-00000000e00b'), NULL,
    'a simulation without a manifest is explore-only');
SELECT is((SELECT manifest ->> 'mastery_correct' FROM simulations WHERE id = '00000000-0000-0000-0000-00000000e00c'), '5',
    'defaults apply when the manifest sets no numbers');
SELECT is((SELECT manifest ->> 'mastery_types' FROM simulations WHERE id = '00000000-0000-0000-0000-00000000e00c'), '1',
    'mastery never asks for more challenge types than exist');

INSERT INTO simulations (id, topic_id, code_payload) VALUES ('00000000-0000-0000-0000-00000000e00d', '00000000-0000-0000-0000-00000000d0c1',
    '<script>var a = 1;</script><script type="application/json" id="tutre-manifest">{"protocol": 1, "checkpoints": ["one"]}</script>
     <script>var b = "</p>";</script><script>var c = 3;</script>');
SELECT is((SELECT manifest -> 'checkpoints' FROM simulations WHERE id = '00000000-0000-0000-0000-00000000e00d'), '["one"]'::jsonb,
    'the manifest is found among several scripts in a real simulation');
SELECT throws_ok($$INSERT INTO simulations (topic_id, code_payload) VALUES ('00000000-0000-0000-0000-00000000d0c1',
    '<script type="application/json" id="tutre-manifest">{not json</script>')$$,
    '22023', 'The simulation''s tutre-manifest is not valid JSON.', 'invalid JSON is refused');
SELECT throws_ok($$INSERT INTO simulations (topic_id, code_payload) VALUES ('00000000-0000-0000-0000-00000000d0c1',
    '<script type="application/json" id="tutre-manifest">{"protocol": 2}</script>')$$,
    '22023', NULL, 'an unknown protocol version is refused');
SELECT throws_ok($$INSERT INTO simulations (topic_id, code_payload) VALUES ('00000000-0000-0000-0000-00000000d0c1',
    '<script type="application/json" id="tutre-manifest">{"protocol": 1, "checkpoints": ["Bad Id"]}</script>')$$,
    '22023', NULL, 'ids must be lower-case kebab case');
SELECT throws_ok($$INSERT INTO simulations (topic_id, code_payload) VALUES ('00000000-0000-0000-0000-00000000d0c1',
    '<script type="application/json" id="tutre-manifest">{"protocol": 1, "challenges": ["a", "a"]}</script>')$$,
    '22023', 'Duplicate challenge id a.', 'ids must be unique');
SELECT throws_ok($$INSERT INTO simulations (topic_id, code_payload) VALUES ('00000000-0000-0000-0000-00000000d0c1',
    '<script type="application/json" id="tutre-manifest">{"protocol": 1, "mastery": {"correct": "many"}}</script>')$$,
    '22023', NULL, 'practice and mastery numbers must be whole numbers');

UPDATE simulations SET status = 'in_review' WHERE id = '00000000-0000-0000-0000-00000000e00c';
SELECT isnt((SELECT manifest FROM simulations WHERE id = '00000000-0000-0000-0000-00000000e00c'), NULL,
    'changing only the status keeps the manifest');
UPDATE simulations SET manifest = '{"protocol": 1, "checkpoints": ["forged"]}' WHERE id = '00000000-0000-0000-0000-00000000e00c';
SELECT is((SELECT manifest -> 'checkpoints' FROM simulations WHERE id = '00000000-0000-0000-0000-00000000e00c'), '["start"]'::jsonb,
    'the manifest cannot be written directly, even by the owner');
UPDATE simulations SET code_payload = '<html>no manifest any more</html>' WHERE id = '00000000-0000-0000-0000-00000000e00c';
SELECT is((SELECT manifest FROM simulations WHERE id = '00000000-0000-0000-0000-00000000e00c'), NULL,
    'removing the manifest from the code removes it from the row');

SELECT test_helpers.login('00000000-0000-0000-0000-000000004003');
SELECT throws_ok($$UPDATE simulations SET manifest = '{}' WHERE id = '00000000-0000-0000-0000-00000000e00c'$$,
    '42501', NULL, 'Studio users cannot write the manifest column');
SELECT test_helpers.logout();

-- ===========================================================================
-- Recording progress
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-000000004001');
SELECT is(record_learning_event('00000000-0000-0000-0000-00000000e00b', 'explored') ->> 'level', 'explored',
    'opening a legacy simulation counts as explored');
SELECT throws_ok($$SELECT record_learning_event('00000000-0000-0000-0000-00000000e00b', 'checkpoint', 'start')$$,
    '22023', 'Unknown checkpoint for this simulation.', 'a legacy simulation cannot report checkpoints');
SELECT throws_ok($$SELECT record_learning_event('00000000-0000-0000-0000-00000000e00c', 'explored')$$,
    'P0002', 'No such simulation.', 'unpublished simulations do not count');
SELECT throws_ok($$SELECT record_learning_event('00000000-0000-0000-0000-00000000e00a', 'checkpoint', 'forged')$$,
    '22023', 'Unknown checkpoint for this simulation.', 'checkpoint ids must be in the manifest');
SELECT throws_ok($$SELECT record_learning_event('00000000-0000-0000-0000-00000000e00a', 'challenge', 'to-binary')$$,
    '22023', 'Unknown challenge for this simulation.', 'a challenge report says whether it was correct');
SELECT throws_ok($$SELECT record_learning_event('00000000-0000-0000-0000-00000000e00a', 'mastered')$$,
    '22023', 'Unknown report type.', 'students cannot report a level directly');

SELECT is(record_learning_event('00000000-0000-0000-0000-00000000e00a', 'checkpoint', 'start') ->> 'level', 'explored',
    'one checkpoint of two is still explored');
SELECT is(record_learning_event('00000000-0000-0000-0000-00000000e00a', 'checkpoint', 'start') ->> 'changed', 'false',
    'a repeated checkpoint changes nothing');
SELECT is(record_learning_event('00000000-0000-0000-0000-00000000e00a', 'checkpoint', 'convert') ->> 'level', 'practised',
    'reaching every checkpoint is practised');
SELECT is((SELECT count(*)::int FROM learning_events WHERE kind = 'checkpoint'), 2, 'each checkpoint is stored once');

SELECT record_learning_event('00000000-0000-0000-0000-00000000e00a', 'challenge', 'to-binary', true);
SELECT record_learning_event('00000000-0000-0000-0000-00000000e00a', 'challenge', 'to-binary', true);
SELECT is(record_learning_event('00000000-0000-0000-0000-00000000e00a', 'challenge', 'to-binary', true) ->> 'level', 'practised',
    'three correct answers of one type are not yet mastery');
SELECT is(record_learning_event('00000000-0000-0000-0000-00000000e00a', 'challenge', 'to-hex', true) ->> 'level', 'mastered',
    'enough correct answers across two challenge types is mastered');
SELECT is(record_learning_event('00000000-0000-0000-0000-00000000e00a', 'challenge', 'to-hex', false) ->> 'level', 'mastered',
    'a wrong answer later never lowers the level');
SELECT isnt((SELECT mastered_at FROM topic_progress WHERE topic_id = '00000000-0000-0000-0000-00000000d0a1'), NULL,
    'the time of mastery is recorded');
SELECT is((SELECT count(*)::int FROM topic_progress), 2, 'a student reads their own progress');
SELECT throws_ok($$INSERT INTO topic_progress (user_id, topic_id, level) VALUES (auth.uid(), '00000000-0000-0000-0000-00000000d0c1', 'mastered')$$,
    '42501', NULL, 'progress cannot be written directly');
SELECT throws_ok($$INSERT INTO learning_events (user_id, simulation_id, topic_id, kind) VALUES
    (auth.uid(), '00000000-0000-0000-0000-00000000e00a', '00000000-0000-0000-0000-00000000d0a1', 'explored')$$,
    '42501', NULL, 'learning events cannot be written directly');
SELECT test_helpers.logout();

-- ===========================================================================
-- Other students, visitors, and the rate limit
-- ===========================================================================
SELECT test_helpers.login('00000000-0000-0000-0000-000000004002');
SELECT is((SELECT count(*)::int FROM topic_progress) + (SELECT count(*)::int FROM learning_events), 0,
    'a student cannot see another student''s progress');
DO $$
BEGIN
    FOR i IN 1..59 LOOP
        PERFORM record_learning_event('00000000-0000-0000-0000-00000000e00a', 'challenge', 'to-binary', false);
    END LOOP;
END $$;
SELECT is((SELECT level FROM topic_progress WHERE topic_id = '00000000-0000-0000-0000-00000000d0a1'), 'practised',
    'enough attempts are practised, even without correct answers');
SELECT lives_ok($$SELECT record_learning_event('00000000-0000-0000-0000-00000000e00a', 'challenge', 'to-hex', false)$$,
    'the 60th report in a minute is accepted');
SELECT throws_ok($$SELECT record_learning_event('00000000-0000-0000-0000-00000000e00a', 'challenge', 'to-hex', false)$$,
    '54000', 'Too many progress reports. Try again in a minute.', 'the 61st report in a minute is refused');
SELECT test_helpers.logout();

SELECT test_helpers.anon();
SELECT throws_ok($$SELECT record_learning_event('00000000-0000-0000-0000-00000000e00b', 'explored')$$,
    '42501', NULL, 'visitors cannot record progress');
SELECT throws_ok($$SELECT count(*) FROM topic_progress$$, '42501', NULL, 'visitors cannot read progress');
SELECT test_helpers.logout();

SELECT * FROM finish();
ROLLBACK;

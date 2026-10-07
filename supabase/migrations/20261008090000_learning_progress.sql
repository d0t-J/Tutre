-- Phase 4: the Simulation Bridge (database side) and learning progress.
--
-- 1. simulations.manifest  What a simulation can report, read from its own code.
--    A Bridge-ready simulation carries
--      <script type="application/json" id="tutre-manifest">{ ... }</script>
--    and the manifest_from_payload trigger copies it into this column whenever
--    the payload changes, so the manifest can never drift from the code.
--    Simulations without one (all 137 today) keep NULL and are "explore only".
--
-- 2. learning_events  An append-only log of what a student did in a simulation.
--    topic_progress   One row per student and topic: explored, practised or
--                     mastered. It only ever goes up.
--    Both are written only by record_learning_event(), which checks every
--    report against the simulation's manifest and rate-limits it. Students read
--    their own rows; nobody else reads them yet (teachers come in Phase 5).
--
-- This is self-reported learning progress from code running in the student's
-- browser. It is never a grade.

-- ---------------------------------------------------------------------------
-- 1. Manifest
-- ---------------------------------------------------------------------------
ALTER TABLE "public"."simulations" ADD COLUMN "manifest" "jsonb";

-- Checks a manifest and returns it in a fixed shape:
--   { "protocol": 1, "checkpoints": [ids], "challenges": [ids],
--     "practice_attempts": n, "mastery_correct": n, "mastery_types": n }
-- Ids are short kebab-case strings, unique within their list, at most 50 each.
CREATE FUNCTION "private"."normalize_manifest"("p_manifest" "jsonb") RETURNS "jsonb"
LANGUAGE "plpgsql" IMMUTABLE
SET "search_path" = ''
AS $$
DECLARE
    v_checkpoints jsonb := '[]'::jsonb;
    v_challenges jsonb := '[]'::jsonb;
    v_item jsonb;
    v_id text;
    v_list text;
    v_practice int;
    v_correct int;
    v_types int;
BEGIN
    IF jsonb_typeof(p_manifest) <> 'object' THEN
        RAISE EXCEPTION 'The simulation manifest must be a JSON object.' USING ERRCODE = '22023';
    END IF;
    IF p_manifest -> 'protocol' IS DISTINCT FROM '1'::jsonb THEN
        RAISE EXCEPTION 'The simulation manifest must say "protocol": 1.' USING ERRCODE = '22023';
    END IF;

    FOREACH v_list IN ARRAY ARRAY['checkpoints', 'challenges'] LOOP
        IF p_manifest ? v_list THEN
            IF jsonb_typeof(p_manifest -> v_list) <> 'array' OR jsonb_array_length(p_manifest -> v_list) > 50 THEN
                RAISE EXCEPTION 'The manifest''s % must be a list of at most 50 items.', v_list USING ERRCODE = '22023';
            END IF;
            FOR v_item IN SELECT * FROM jsonb_array_elements(p_manifest -> v_list) LOOP
                v_id := CASE jsonb_typeof(v_item) WHEN 'string' THEN v_item #>> '{}' WHEN 'object' THEN v_item ->> 'id' END;
                IF v_id IS NULL OR v_id !~ '^[a-z0-9][a-z0-9-]{0,59}$' THEN
                    RAISE EXCEPTION 'Manifest % ids must be lower-case letters, digits and hyphens (got %).', v_list, coalesce(v_item::text, 'null')
                        USING ERRCODE = '22023';
                END IF;
                IF v_list = 'checkpoints' THEN
                    IF v_checkpoints ? v_id THEN RAISE EXCEPTION 'Duplicate checkpoint id %.', v_id USING ERRCODE = '22023'; END IF;
                    v_checkpoints := v_checkpoints || to_jsonb(v_id);
                ELSE
                    IF v_challenges ? v_id THEN RAISE EXCEPTION 'Duplicate challenge id %.', v_id USING ERRCODE = '22023'; END IF;
                    v_challenges := v_challenges || to_jsonb(v_id);
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    -- Defaults approved with Phase 4: practised after 3 challenge attempts (or
    -- every checkpoint), mastered after 5 correct answers across 2 challenge types.
    v_practice := COALESCE((p_manifest #>> '{practice,attempts}')::int, 3);
    v_correct := COALESCE((p_manifest #>> '{mastery,correct}')::int, 5);
    v_types := COALESCE((p_manifest #>> '{mastery,challengeTypes}')::int, 2);
    IF v_practice NOT BETWEEN 1 AND 100 OR v_correct NOT BETWEEN 1 AND 100 OR v_types NOT BETWEEN 1 AND 50 THEN
        RAISE EXCEPTION 'Manifest practice and mastery numbers are out of range.' USING ERRCODE = '22023';
    END IF;

    RETURN jsonb_build_object(
        'protocol', 1,
        'checkpoints', v_checkpoints,
        'challenges', v_challenges,
        'practice_attempts', v_practice,
        'mastery_correct', v_correct,
        -- Cannot ask for more challenge types than the simulation has.
        'mastery_types', LEAST(v_types, GREATEST(jsonb_array_length(v_challenges), 1))
    );
EXCEPTION
    WHEN invalid_text_representation THEN
        RAISE EXCEPTION 'Manifest practice and mastery values must be whole numbers.' USING ERRCODE = '22023';
END;
$$;

CREATE FUNCTION "private"."manifest_from_payload"() RETURNS "trigger"
LANGUAGE "plpgsql"
SET "search_path" = ''
AS $$
DECLARE
    v_open text[];
    v_rest text;
    v_end int;
    v_json jsonb;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.code_payload IS NOT DISTINCT FROM OLD.code_payload THEN
            NEW.manifest := OLD.manifest;
            RETURN NEW;
        END IF;
    END IF;

    -- Find the opening tag, then the first </script> after it. (A single regex
    -- with a lazy (.*?) does not work here: Postgres takes a whole regex's
    -- greediness from its first quantifier, so the capture would run to the
    -- last </script> in a simulation with several scripts.)
    v_open := regexp_match(COALESCE(NEW.code_payload, ''),
        '(<script[^>]*\mid\s*=\s*["'']tutre-manifest["''][^>]*>)', 'i');
    IF v_open IS NULL THEN
        NEW.manifest := NULL;
        RETURN NEW;
    END IF;
    v_rest := substr(NEW.code_payload, strpos(NEW.code_payload, v_open[1]) + length(v_open[1]));
    v_end := strpos(lower(v_rest), '</script>');
    IF v_end = 0 THEN
        RAISE EXCEPTION 'The simulation''s tutre-manifest has no closing </script>.' USING ERRCODE = '22023';
    END IF;

    BEGIN
        v_json := substr(v_rest, 1, v_end - 1)::jsonb;
    EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'The simulation''s tutre-manifest is not valid JSON.' USING ERRCODE = '22023';
    END;
    NEW.manifest := private.normalize_manifest(v_json);
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION "private"."normalize_manifest"("jsonb") FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "private"."manifest_from_payload"() FROM PUBLIC, "anon", "authenticated";

-- Fires before simulations_workflow and simulations_zz_keep_version (name order).
CREATE TRIGGER "simulations_manifest"
    BEFORE INSERT OR UPDATE ON "public"."simulations"
    FOR EACH ROW EXECUTE FUNCTION "private"."manifest_from_payload"();

-- The column is derived. API callers have no INSERT or UPDATE privilege on it
-- (simulations only grants code_payload, status, kind and topic_id), and the
-- trigger above overwrites any value the owner might set.

-- ---------------------------------------------------------------------------
-- 2. Learning progress
-- ---------------------------------------------------------------------------
CREATE TABLE "public"."learning_events" (
    "id" bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "simulation_id" "uuid" NOT NULL REFERENCES "public"."simulations"("id") ON DELETE CASCADE,
    "topic_id" "uuid" NOT NULL REFERENCES "public"."topics"("id") ON DELETE CASCADE,
    "kind" "text" NOT NULL CHECK ("kind" IN ('explored', 'checkpoint', 'challenge')),
    "ref" "text" CHECK ("ref" IS NULL OR "ref" ~ '^[a-z0-9][a-z0-9-]{0,59}$'),
    "correct" boolean,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    CHECK (("kind" = 'explored' AND "ref" IS NULL AND "correct" IS NULL)
        OR ("kind" = 'checkpoint' AND "ref" IS NOT NULL AND "correct" IS NULL)
        OR ("kind" = 'challenge' AND "ref" IS NOT NULL AND "correct" IS NOT NULL))
);
CREATE INDEX "learning_events_user_created_idx" ON "public"."learning_events" ("user_id", "created_at" DESC);
CREATE INDEX "learning_events_user_simulation_idx" ON "public"."learning_events" ("user_id", "simulation_id");
-- Exploring and each checkpoint count once per student and simulation.
CREATE UNIQUE INDEX "learning_events_once_key" ON "public"."learning_events" ("user_id", "simulation_id", "kind", COALESCE("ref", ''))
    WHERE "kind" IN ('explored', 'checkpoint');

CREATE TABLE "public"."topic_progress" (
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "topic_id" "uuid" NOT NULL REFERENCES "public"."topics"("id") ON DELETE CASCADE,
    "level" "text" NOT NULL CHECK ("level" IN ('explored', 'practised', 'mastered')),
    "explored_at" timestamp with time zone,
    "practised_at" timestamp with time zone,
    "mastered_at" timestamp with time zone,
    "updated_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    PRIMARY KEY ("user_id", "topic_id")
);

ALTER TABLE "public"."learning_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."topic_progress" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read their own learning events" ON "public"."learning_events"
    FOR SELECT TO "authenticated" USING ("user_id" = (SELECT "auth"."uid"()));
CREATE POLICY "Students read their own progress" ON "public"."topic_progress"
    FOR SELECT TO "authenticated" USING ("user_id" = (SELECT "auth"."uid"()));

-- Written only through record_learning_event().
REVOKE ALL ON TABLE "public"."learning_events", "public"."topic_progress" FROM "anon";
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "public"."learning_events", "public"."topic_progress" FROM "authenticated";

-- Records one report from the student app and returns the topic's level:
--   explored    the student used the simulation (sent by the app itself, after
--               a minute in view or a click into the simulation)
--   checkpoint  the simulation says a named step was reached
--   challenge   the simulation says a named challenge was answered (correct or not)
-- Only published simulations count, checkpoint and challenge ids must be in the
-- manifest, and each student may send at most 60 reports a minute.
CREATE FUNCTION "public"."record_learning_event"(
    "p_simulation" "uuid",
    "p_kind" "text",
    "p_ref" "text" DEFAULT NULL,
    "p_correct" boolean DEFAULT NULL
) RETURNS "jsonb"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_topic uuid;
    v_manifest jsonb;
    v_recent int;
    v_checkpoints_total int;
    v_checkpoints_reached int;
    v_attempts int;
    v_correct int;
    v_correct_types int;
    v_level text := 'explored';
    v_previous text;
    v_rank_new int;
    v_rank_old int;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;

    SELECT s.topic_id, s.manifest INTO v_topic, v_manifest
    FROM public.simulations s
    WHERE s.id = p_simulation AND s.status = 'published';
    IF v_topic IS NULL THEN
        RAISE EXCEPTION 'No such simulation.' USING ERRCODE = 'P0002';
    END IF;

    IF p_kind = 'explored' THEN
        IF p_ref IS NOT NULL OR p_correct IS NOT NULL THEN
            RAISE EXCEPTION 'An explored report takes no id.' USING ERRCODE = '22023';
        END IF;
    ELSIF p_kind = 'checkpoint' THEN
        IF v_manifest IS NULL OR NOT (v_manifest -> 'checkpoints') ? COALESCE(p_ref, '') OR p_correct IS NOT NULL THEN
            RAISE EXCEPTION 'Unknown checkpoint for this simulation.' USING ERRCODE = '22023';
        END IF;
    ELSIF p_kind = 'challenge' THEN
        IF v_manifest IS NULL OR NOT (v_manifest -> 'challenges') ? COALESCE(p_ref, '') OR p_correct IS NULL THEN
            RAISE EXCEPTION 'Unknown challenge for this simulation.' USING ERRCODE = '22023';
        END IF;
    ELSE
        RAISE EXCEPTION 'Unknown report type.' USING ERRCODE = '22023';
    END IF;

    -- One lock per student, so the rate check and the insert cannot interleave.
    PERFORM pg_advisory_xact_lock(hashtext('learning_events:' || v_uid::text));
    SELECT count(*) INTO v_recent FROM public.learning_events
    WHERE user_id = v_uid AND created_at > now() - interval '1 minute';
    IF v_recent >= 60 THEN
        RAISE EXCEPTION 'Too many progress reports. Try again in a minute.' USING ERRCODE = '54000';
    END IF;

    INSERT INTO public.learning_events (user_id, simulation_id, topic_id, kind, ref, correct)
    VALUES (v_uid, p_simulation, v_topic, p_kind, p_ref, p_correct)
    ON CONFLICT DO NOTHING;

    -- Work out the level from everything this student did in this simulation.
    IF v_manifest IS NOT NULL THEN
        v_checkpoints_total := jsonb_array_length(v_manifest -> 'checkpoints');
        SELECT count(DISTINCT ref) FILTER (WHERE kind = 'checkpoint'),
               count(*) FILTER (WHERE kind = 'challenge'),
               count(*) FILTER (WHERE kind = 'challenge' AND correct),
               count(DISTINCT ref) FILTER (WHERE kind = 'challenge' AND correct)
          INTO v_checkpoints_reached, v_attempts, v_correct, v_correct_types
        FROM public.learning_events
        WHERE user_id = v_uid AND simulation_id = p_simulation;

        IF (v_checkpoints_total > 0 AND v_checkpoints_reached >= v_checkpoints_total)
           OR (jsonb_array_length(v_manifest -> 'challenges') > 0
               AND v_attempts >= (v_manifest ->> 'practice_attempts')::int) THEN
            v_level := 'practised';
        END IF;
        IF jsonb_array_length(v_manifest -> 'challenges') > 0
           AND v_correct >= (v_manifest ->> 'mastery_correct')::int
           AND v_correct_types >= (v_manifest ->> 'mastery_types')::int THEN
            v_level := 'mastered';
        END IF;
    END IF;

    -- Never goes down.
    SELECT level INTO v_previous FROM public.topic_progress WHERE user_id = v_uid AND topic_id = v_topic;
    v_rank_new := array_position(ARRAY['explored', 'practised', 'mastered'], v_level);
    v_rank_old := COALESCE(array_position(ARRAY['explored', 'practised', 'mastered'], v_previous), 0);

    IF v_rank_new > v_rank_old THEN
        INSERT INTO public.topic_progress (user_id, topic_id, level, explored_at, practised_at, mastered_at, updated_at)
        VALUES (v_uid, v_topic, v_level, now(),
                CASE WHEN v_rank_new >= 2 THEN now() END,
                CASE WHEN v_rank_new >= 3 THEN now() END,
                now())
        ON CONFLICT (user_id, topic_id) DO UPDATE SET
            level = EXCLUDED.level,
            practised_at = COALESCE(public.topic_progress.practised_at, EXCLUDED.practised_at),
            mastered_at = COALESCE(public.topic_progress.mastered_at, EXCLUDED.mastered_at),
            updated_at = now();
        RETURN jsonb_build_object('level', v_level, 'changed', true);
    END IF;

    RETURN jsonb_build_object('level', COALESCE(v_previous, v_level), 'changed', false);
END;
$$;

REVOKE ALL ON FUNCTION "public"."record_learning_event"("uuid", "text", "text", boolean) FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."record_learning_event"("uuid", "text", "text", boolean) TO "authenticated";

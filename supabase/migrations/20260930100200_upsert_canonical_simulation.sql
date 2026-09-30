-- An idempotent insert path for hand-authored canonical simulations.
--
-- Publishing one simulation means touching two tables: a row in topics (the
-- lesson, its description and its study guide) and a row in the subject's
-- simulation table (the HTML payload). Doing that by hand for every simulation
-- is repetitive and easy to get wrong, and a second run would create duplicate
-- topics because topics has no natural unique key.
--
-- This function resolves the curriculum path by human-readable names, then
-- inserts or updates both rows. Running it twice with the same class, subject,
-- chapter and topic updates the existing rows instead of duplicating them, so a
-- corrected simulation is republished by simply running it again.
--
-- SECURITY INVOKER (the default) is deliberate: the function runs with the
-- caller's privileges, so RLS still applies and only an admin or the service
-- role can write. Making it SECURITY DEFINER would let any authenticated user
-- write simulation payloads.

CREATE OR REPLACE FUNCTION "public"."upsert_canonical_simulation"(
    "p_class_name" "text",
    "p_subject_slug" "text",
    "p_chapter_no" integer,
    "p_topic_name" "text",
    "p_description" "text",
    "p_study_guide" "text",
    "p_code_payload" "text"
) RETURNS "uuid"
LANGUAGE "plpgsql"
SET "search_path" = 'public', 'pg_temp'
AS $$
DECLARE
    v_class_id   uuid;
    v_subject_id uuid;
    v_chapter_id uuid;
    v_topic_id   uuid;
    v_table      text;
    v_sim_id     uuid;
BEGIN
    SELECT id INTO v_class_id
    FROM classes
    WHERE name = p_class_name;

    IF v_class_id IS NULL THEN
        RAISE EXCEPTION 'No class named %', p_class_name;
    END IF;

    SELECT id INTO v_subject_id
    FROM subjects
    WHERE class_id = v_class_id AND slug = p_subject_slug;

    IF v_subject_id IS NULL THEN
        RAISE EXCEPTION 'No subject with slug % in %', p_subject_slug, p_class_name;
    END IF;

    SELECT id INTO v_chapter_id
    FROM chapters
    WHERE subject_id = v_subject_id AND chapter_no = p_chapter_no;

    IF v_chapter_id IS NULL THEN
        RAISE EXCEPTION 'No chapter % for % in %', p_chapter_no, p_subject_slug, p_class_name;
    END IF;

    -- topics has no unique constraint, so match on (subject_id, name) by hand.
    SELECT id INTO v_topic_id
    FROM topics
    WHERE subject_id = v_subject_id AND name = p_topic_name;

    IF v_topic_id IS NULL THEN
        INSERT INTO topics (subject_id, chapter_id, name, description, study_guide)
        VALUES (v_subject_id, v_chapter_id, p_topic_name, p_description, p_study_guide)
        RETURNING id INTO v_topic_id;
    ELSE
        UPDATE topics
        SET chapter_id  = v_chapter_id,
            description = p_description,
            study_guide = p_study_guide
        WHERE id = v_topic_id;
    END IF;

    -- The payload table name is derived the same way the admin panel derives it.
    -- p_subject_slug is constrained to ^[a-z][a-z0-9_]*$ by
    -- subjects_slug_identifier_check, and %I quotes it regardless.
    v_table := format('%I', p_subject_slug || '_simulations');

    EXECUTE format('SELECT id FROM %s WHERE topic_id = $1 LIMIT 1', v_table)
    INTO v_sim_id
    USING v_topic_id;

    IF v_sim_id IS NULL THEN
        EXECUTE format(
            'INSERT INTO %s (topic_id, code_payload) VALUES ($1, $2) RETURNING id',
            v_table
        )
        INTO v_sim_id
        USING v_topic_id, p_code_payload;
    ELSE
        EXECUTE format('UPDATE %s SET code_payload = $1 WHERE id = $2', v_table)
        USING p_code_payload, v_sim_id;
    END IF;

    RETURN v_sim_id;
END;
$$;

ALTER FUNCTION "public"."upsert_canonical_simulation"(
    "text", "text", integer, "text", "text", "text", "text"
) OWNER TO "postgres";

-- Only the roles that can already write simulations should be able to call it.
-- RLS on the underlying tables is the real boundary; this just avoids offering
-- the function to anonymous callers through PostgREST.
REVOKE ALL ON FUNCTION "public"."upsert_canonical_simulation"(
    "text", "text", integer, "text", "text", "text", "text"
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."upsert_canonical_simulation"(
    "text", "text", integer, "text", "text", "text", "text"
) TO "authenticated";

GRANT EXECUTE ON FUNCTION "public"."upsert_canonical_simulation"(
    "text", "text", integer, "text", "text", "text", "text"
) TO "service_role";

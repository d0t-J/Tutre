-- Phase 2b: one simulation library with review status and version history.
--
-- Before: five payload tables, one per subject (biology_, chemistry_,
-- mathematics_, physics_, computer_science_simulations), unioned by the
-- all_simulations view, and written by the admin panel under a table name built
-- from the subject slug. Everything published the moment it was saved.
--
-- After:
--   simulations          every simulation, whatever its subject, with
--                        status  draft -> in_review -> published -> archived
--                        kind    canonical (hand-authored, verified) | generated (AI)
--                        version incremented each time the payload changes
--   simulation_versions  every payload a simulation has had, so any change can be undone
--   all_simulations      redefined over simulations; same columns, plus status,
--                        kind and version appended at the end
--
-- Existing rows are copied with their ids unchanged, as published, so students
-- see exactly the same library and every link (/simulation/<sim_id>) keeps
-- working. The 27 Computer Science simulations are canonical, the rest generated.
--
-- The five old tables are left untouched as a frozen backup. Removing them is a
-- separate, later decision. Nothing in the apps reads or writes them after this.
--
-- Who may do what (enforced for API callers; the SQL editor and migrations, which
-- run as the database owner, are trusted):
--   students and other signed-in users   read published simulations only
--   Studio author                        create drafts, edit drafts and items in
--                                        review, submit for review, delete own drafts
--   Studio reviewer, platform admin      everything: publish, unpublish, archive,
--                                        edit published items, restore old versions

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE "public"."simulations" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "topic_id" "uuid" NOT NULL REFERENCES "public"."topics"("id") ON DELETE CASCADE,
    -- Nullable only because the legacy tables allowed it; copied as-is.
    "code_payload" "text",
    "status" "text" NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'in_review', 'published', 'archived')),
    "kind" "text" NOT NULL DEFAULT 'generated' CHECK ("kind" IN ('canonical', 'generated')),
    "version" integer NOT NULL DEFAULT 1 CHECK ("version" >= 1),
    "created_by" "uuid" DEFAULT "auth"."uid"() REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "reviewed_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    CHECK ("status" <> 'published' OR "published_at" IS NOT NULL)
);
CREATE INDEX "simulations_topic_idx" ON "public"."simulations" ("topic_id");
CREATE INDEX "simulations_status_idx" ON "public"."simulations" ("status");

CREATE TABLE "public"."simulation_versions" (
    "simulation_id" "uuid" NOT NULL REFERENCES "public"."simulations"("id") ON DELETE CASCADE,
    "version" integer NOT NULL,
    "code_payload" "text",
    "status" "text" NOT NULL,
    -- who replaced this version, and when
    "replaced_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "replaced_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    PRIMARY KEY ("simulation_id", "version")
);

-- ---------------------------------------------------------------------------
-- Copy the library. Rows with no topic were never visible (the old view joined
-- on topic) and are left in the old tables.
-- ---------------------------------------------------------------------------

INSERT INTO "public"."simulations"
    ("id", "topic_id", "code_payload", "status", "kind", "version", "created_by", "published_at", "created_at", "updated_at")
SELECT "id", "topic_id", "code_payload", 'published', 'generated', 1, NULL::uuid, "created_at", "created_at", "created_at"
FROM "public"."biology_simulations" WHERE "topic_id" IS NOT NULL
UNION ALL
SELECT "id", "topic_id", "code_payload", 'published', 'generated', 1, NULL::uuid, "created_at", "created_at", "created_at"
FROM "public"."chemistry_simulations" WHERE "topic_id" IS NOT NULL
UNION ALL
SELECT "id", "topic_id", "code_payload", 'published', 'generated', 1, NULL::uuid, "created_at", "created_at", "created_at"
FROM "public"."mathematics_simulations" WHERE "topic_id" IS NOT NULL
UNION ALL
SELECT "id", "topic_id", "code_payload", 'published', 'generated', 1, NULL::uuid, "created_at", "created_at", "created_at"
FROM "public"."physics_simulations" WHERE "topic_id" IS NOT NULL
UNION ALL
SELECT "id", "topic_id", "code_payload", 'published', 'canonical', 1, NULL::uuid, "created_at", "created_at", "created_at"
FROM "public"."computer_science_simulations" WHERE "topic_id" IS NOT NULL;

DO $$
DECLARE
    v_old integer;
    v_new integer;
BEGIN
    SELECT (SELECT count(*) FROM public.biology_simulations WHERE topic_id IS NOT NULL)
         + (SELECT count(*) FROM public.chemistry_simulations WHERE topic_id IS NOT NULL)
         + (SELECT count(*) FROM public.mathematics_simulations WHERE topic_id IS NOT NULL)
         + (SELECT count(*) FROM public.physics_simulations WHERE topic_id IS NOT NULL)
         + (SELECT count(*) FROM public.computer_science_simulations WHERE topic_id IS NOT NULL)
      INTO v_old;
    SELECT count(*) INTO v_new FROM public.simulations;
    IF v_old <> v_new THEN
        RAISE EXCEPTION 'Copy mismatch: % rows in the old tables, % copied.', v_old, v_new;
    END IF;
    RAISE NOTICE 'Copied % simulations into public.simulations.', v_new;
END;
$$;

-- ---------------------------------------------------------------------------
-- Helpers and triggers
-- ---------------------------------------------------------------------------

-- The caller's Content Studio role, or NULL if they are not in the Studio.
CREATE FUNCTION "private"."studio_role"() RETURNS "text"
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT studio_role FROM public.admin_users WHERE id = (SELECT auth.uid());
$$;
REVOKE ALL ON FUNCTION "private"."studio_role"() FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "private"."studio_role"() TO "authenticated", "service_role";

-- Review workflow: who may move a simulation between which statuses, and the
-- bookkeeping that goes with publishing. The bookkeeping always runs; the
-- permission checks apply to API callers (role "authenticated") only.
CREATE FUNCTION "private"."simulations_workflow"() RETURNS "trigger"
LANGUAGE "plpgsql"
SET "search_path" = ''
AS $$
DECLARE
    v_role text;
BEGIN
    IF current_user = 'authenticated' THEN
        v_role := private.studio_role();
        IF v_role IS NULL THEN
            RAISE EXCEPTION 'Only Content Studio members can change simulations.' USING ERRCODE = '42501';
        END IF;
        IF v_role = 'author' THEN
            IF TG_OP = 'UPDATE' AND OLD.status NOT IN ('draft', 'in_review') THEN
                RAISE EXCEPTION 'Only a reviewer can change a % simulation.', OLD.status USING ERRCODE = '42501';
            END IF;
            IF NEW.status NOT IN ('draft', 'in_review') THEN
                RAISE EXCEPTION 'Authors can save drafts and submit them for review; a reviewer publishes.' USING ERRCODE = '42501';
            END IF;
            IF NEW.kind = 'canonical' AND (TG_OP = 'INSERT' OR OLD.kind <> 'canonical') THEN
                RAISE EXCEPTION 'Only a reviewer can mark a simulation as canonical.' USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;

    IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status <> 'published') THEN
        NEW.published_at := now();
        NEW.reviewed_by := coalesce((SELECT auth.uid()), NEW.reviewed_by);
    END IF;
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at := now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "simulations_workflow"
    BEFORE INSERT OR UPDATE ON "public"."simulations"
    FOR EACH ROW EXECUTE FUNCTION "private"."simulations_workflow"();

-- Version history: when the payload changes, keep the old one and bump version.
-- SECURITY DEFINER because nobody may write simulation_versions directly.
CREATE FUNCTION "private"."simulations_keep_version"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF NEW.code_payload IS DISTINCT FROM OLD.code_payload THEN
        INSERT INTO public.simulation_versions (simulation_id, version, code_payload, status, replaced_by)
        VALUES (OLD.id, OLD.version, OLD.code_payload, OLD.status, (SELECT auth.uid()));
        NEW.version := OLD.version + 1;
    ELSE
        NEW.version := OLD.version;
    END IF;
    RETURN NEW;
END;
$$;

-- Named to fire after "simulations_workflow" (BEFORE triggers run in name order),
-- so only permitted changes are versioned.
CREATE TRIGGER "simulations_zz_keep_version"
    BEFORE UPDATE ON "public"."simulations"
    FOR EACH ROW EXECUTE FUNCTION "private"."simulations_keep_version"();

-- A simulation's title, description and study guide live on its topic, and the
-- topics table has no workflow of its own (any Studio member may write it). So an
-- author could change the live description of a published simulation, or delete
-- its topic and with it the simulation. This trigger closes that: authors may not
-- update or delete a topic that has a published or archived simulation.
-- Additive: the existing topics policies are unchanged.
CREATE FUNCTION "private"."topics_respect_review"() RETURNS "trigger"
LANGUAGE "plpgsql"
SET "search_path" = ''
AS $$
BEGIN
    IF current_user = 'authenticated'
       AND private.studio_role() = 'author'
       AND EXISTS (
           SELECT 1 FROM public.simulations
           WHERE topic_id = OLD.id AND status IN ('published', 'archived')
       ) THEN
        RAISE EXCEPTION 'Only a reviewer can change a published simulation.' USING ERRCODE = '42501';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER "topics_respect_review"
    BEFORE UPDATE OR DELETE ON "public"."topics"
    FOR EACH ROW EXECUTE FUNCTION "private"."topics_respect_review"();

-- Undo: put an earlier payload back. The current payload becomes a version too,
-- so a restore can itself be undone.
CREATE FUNCTION "public"."restore_simulation_version"("p_simulation" "uuid", "p_version" integer)
RETURNS integer
LANGUAGE "plpgsql"
SET "search_path" = ''
AS $$
DECLARE
    v_payload text;
    v_new_version integer;
BEGIN
    IF coalesce(private.studio_role(), '') NOT IN ('reviewer', 'platform_admin') THEN
        RAISE EXCEPTION 'Only a reviewer can restore an earlier version.' USING ERRCODE = '42501';
    END IF;
    SELECT code_payload INTO v_payload
    FROM public.simulation_versions
    WHERE simulation_id = p_simulation AND version = p_version;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No such version.' USING ERRCODE = 'P0002';
    END IF;
    UPDATE public.simulations SET code_payload = v_payload WHERE id = p_simulation
    RETURNING version INTO v_new_version;
    RETURN v_new_version;
END;
$$;
REVOKE ALL ON FUNCTION "public"."restore_simulation_version"("uuid", integer) FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."restore_simulation_version"("uuid", integer) TO "authenticated";

-- ---------------------------------------------------------------------------
-- Row level security and privileges
-- ---------------------------------------------------------------------------

ALTER TABLE "public"."simulations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."simulation_versions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read published simulations; the Studio reads all" ON "public"."simulations"
    FOR SELECT TO "authenticated"
    USING ("status" = 'published' OR "private"."is_studio_member"());

CREATE POLICY "Studio members can create simulations" ON "public"."simulations"
    FOR INSERT TO "authenticated"
    WITH CHECK ("private"."is_studio_member"());

CREATE POLICY "Studio members can update simulations" ON "public"."simulations"
    FOR UPDATE TO "authenticated"
    USING ("private"."is_studio_member"())
    WITH CHECK ("private"."is_studio_member"());

CREATE POLICY "Reviewers delete simulations; authors delete their own drafts" ON "public"."simulations"
    FOR DELETE TO "authenticated"
    USING ("private"."studio_role"() IN ('reviewer', 'platform_admin')
        OR ("private"."studio_role"() = 'author' AND "status" = 'draft' AND "created_by" = (SELECT "auth"."uid"())));

CREATE POLICY "Studio members can read version history" ON "public"."simulation_versions"
    FOR SELECT TO "authenticated"
    USING ("private"."is_studio_member"());

-- Anonymous visitors keep SELECT (and get no rows: no policy grants them any), so
-- an anonymous read of all_simulations still returns [] rather than an error,
-- exactly as before. They cannot write.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "public"."simulations" FROM "anon";
REVOKE ALL ON TABLE "public"."simulation_versions" FROM "anon";

-- Signed-in users may set only these columns; id, version, created_by,
-- reviewed_by, published_at and the timestamps belong to the database.
REVOKE INSERT, UPDATE, TRUNCATE ON TABLE "public"."simulations" FROM "authenticated";
GRANT INSERT ("topic_id", "code_payload", "status", "kind") ON TABLE "public"."simulations" TO "authenticated";
GRANT UPDATE ("code_payload", "status", "kind") ON TABLE "public"."simulations" TO "authenticated";
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "public"."simulation_versions" FROM "authenticated";

-- ---------------------------------------------------------------------------
-- all_simulations over the new table. Same 14 columns in the same order, then
-- status, kind and version (CREATE OR REPLACE VIEW can only append columns).
-- security_invoker stays on, so the RLS above decides what each caller sees.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW "public"."all_simulations"
WITH ("security_invoker" = 'on') AS
 SELECT "t"."id" AS "topic_id",
    "t"."name" AS "topic",
    "t"."description",
    "t"."chapter_id",
    "s"."id" AS "subject_id",
    "s"."name" AS "subject",
    "s"."icon_name",
    "c"."id" AS "class_id",
    "c"."name" AS "class_name",
    "sim"."id" AS "sim_id",
    "sim"."code_payload",
    "sim"."created_at",
    "t"."study_guide",
    "s"."slug" AS "subject_slug",
    "sim"."status",
    "sim"."kind",
    "sim"."version"
   FROM ((("public"."simulations" "sim"
     JOIN "public"."topics" "t" ON (("sim"."topic_id" = "t"."id")))
     JOIN "public"."subjects" "s" ON (("t"."subject_id" = "s"."id")))
     JOIN "public"."classes" "c" ON (("s"."class_id" = "c"."id")));

-- ---------------------------------------------------------------------------
-- The canonical publish path writes to the new table. Same signature, same
-- behaviour: idempotent on (subject, topic name), returns the simulation id, and
-- publishes. Re-running it on an existing topic updates the payload, which the
-- version trigger records.
-- ---------------------------------------------------------------------------

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

    SELECT id INTO v_sim_id
    FROM simulations
    WHERE topic_id = v_topic_id
    ORDER BY created_at
    LIMIT 1;

    IF v_sim_id IS NULL THEN
        INSERT INTO simulations (topic_id, code_payload, status, kind)
        VALUES (v_topic_id, p_code_payload, 'published', 'canonical')
        RETURNING id INTO v_sim_id;
    ELSE
        UPDATE simulations
        SET code_payload = p_code_payload, status = 'published', kind = 'canonical'
        WHERE id = v_sim_id;
    END IF;

    RETURN v_sim_id;
END;
$$;

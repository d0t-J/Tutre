-- Phase 3c: Urdu versions of the curriculum, and a shared glossary.
--
-- content_translations  The Urdu text of one field of one curriculum item:
--                       a class, subject or chapter name, a chapter description,
--                       or a topic's name, description or study guide. English
--                       stays where it is (in the curriculum tables) and is the
--                       source; a missing or unverified translation falls back to it.
-- glossary_terms        The agreed Urdu word for each technical term, per subject
--                       or for all subjects. Translators and the AI tutor use it so
--                       the same term is translated the same way everywhere, and
--                       the way Urdu-medium textbooks write it.
-- translation_overview  One row per translatable field with its English source,
--                       its translation, status, and whether the English changed
--                       after it was translated. Used by the Studio.
--
-- Review workflow (approved 2026-10-06: the reviewer role verifies):
--   authors          write drafts; cannot verify, and cannot change or delete a
--                    verified row
--   reviewers,       everything, including verifying and editing verified rows
--   platform admins
--   everyone else    reads verified rows only
-- Enforced for API callers. The SQL editor and migrations run as the owner and
-- are trusted, so a reviewed batch can be imported directly as verified.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE "public"."content_translations" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "entity_type" "text" NOT NULL CHECK ("entity_type" IN ('class', 'subject', 'chapter', 'topic')),
    -- No foreign key: the target table depends on entity_type. Existence is
    -- checked by content_translations_source, and rows are removed with their
    -- item by the *_drop_translations triggers below.
    "entity_id" "uuid" NOT NULL,
    "field" "text" NOT NULL CHECK ("field" IN ('name', 'description', 'study_guide')),
    "language" "text" NOT NULL DEFAULT 'ur' CHECK ("language" IN ('ur')),
    "text" "text" NOT NULL,
    "status" "text" NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'verified')),
    -- human: typed or imported by a person; ai: drafted by translate-content.
    "source" "text" NOT NULL DEFAULT 'human' CHECK ("source" IN ('human', 'ai')),
    -- md5 of the English text this translation was made from.
    "source_md5" "text",
    "edited_by" "uuid" DEFAULT "auth"."uid"() REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "verified_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    UNIQUE ("entity_type", "entity_id", "field", "language"),
    -- Which fields exist for which items.
    CHECK (("entity_type" IN ('class', 'subject') AND "field" = 'name')
        OR ("entity_type" = 'chapter' AND "field" IN ('name', 'description'))
        OR "entity_type" = 'topic'),
    CHECK ("char_length"("btrim"("text")) >= 1),
    CHECK ("field" <> 'name' OR "char_length"("text") <= 300),
    CHECK ("char_length"("text") <= 200000),
    CHECK ("status" <> 'verified' OR "verified_at" IS NOT NULL)
);
CREATE INDEX "content_translations_entity_idx" ON "public"."content_translations" ("entity_type", "entity_id");

CREATE TABLE "public"."glossary_terms" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    -- subjects.slug, or NULL for a term used the same way in every subject.
    "subject_slug" "text" CHECK ("subject_slug" IS NULL OR "subject_slug" ~ '^[a-z0-9_]+$'),
    "term_en" "text" NOT NULL CHECK ("char_length"("btrim"("term_en")) BETWEEN 1 AND 120),
    "term_ur" "text" NOT NULL CHECK ("char_length"("btrim"("term_ur")) BETWEEN 1 AND 120),
    "roman_ur" "text" CHECK ("roman_ur" IS NULL OR "char_length"("roman_ur") <= 120),
    "notes" "text" CHECK ("notes" IS NULL OR "char_length"("notes") <= 500),
    "status" "text" NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'verified')),
    "edited_by" "uuid" DEFAULT "auth"."uid"() REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "verified_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    CHECK ("status" <> 'verified' OR "verified_at" IS NOT NULL)
);
CREATE UNIQUE INDEX "glossary_terms_term_subject_key"
    ON "public"."glossary_terms" ("lower"("btrim"("term_en")), COALESCE("subject_slug", ''));

-- ---------------------------------------------------------------------------
-- Review workflow, shared by both tables
-- ---------------------------------------------------------------------------
-- Bookkeeping always runs: who last edited the text, and who verified it when.
-- Permission checks apply to API callers (role "authenticated") only.
CREATE FUNCTION "private"."translation_workflow"() RETURNS "trigger"
LANGUAGE "plpgsql"
SET "search_path" = ''
AS $$
DECLARE
    v_role text;
    v_content_changed boolean;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_content_changed := true;
    ELSE
        v_content_changed :=
            (to_jsonb(NEW) - ARRAY['status', 'edited_by', 'verified_by', 'verified_at', 'updated_at', 'source_md5'])
            IS DISTINCT FROM
            (to_jsonb(OLD) - ARRAY['status', 'edited_by', 'verified_by', 'verified_at', 'updated_at', 'source_md5']);
    END IF;

    IF current_user = 'authenticated' THEN
        v_role := private.studio_role();
        IF v_role IS NULL THEN
            RAISE EXCEPTION 'Only the Content Studio can change translations.' USING ERRCODE = '42501';
        END IF;
        IF v_role = 'author' THEN
            IF TG_OP = 'UPDATE' THEN
                IF OLD.status = 'verified' THEN
                    RAISE EXCEPTION 'Only a reviewer can change a verified translation.' USING ERRCODE = '42501';
                END IF;
            END IF;
            IF NEW.status = 'verified' THEN
                RAISE EXCEPTION 'Only a reviewer can verify a translation.' USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;

    IF v_content_changed THEN
        NEW.edited_by := COALESCE((SELECT auth.uid()), NEW.edited_by);
    END IF;

    IF NEW.status = 'verified' THEN
        -- A new verification, or a reviewer editing verified text, re-signs it.
        IF v_content_changed OR NEW.verified_at IS NULL THEN
            NEW.verified_by := (SELECT auth.uid());
            NEW.verified_at := now();
        ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.status <> 'verified' THEN
                NEW.verified_by := (SELECT auth.uid());
                NEW.verified_at := now();
            END IF;
        END IF;
    ELSE
        NEW.verified_by := NULL;
        NEW.verified_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;

-- Checks the item exists and has English text for this field, and records an
-- md5 of that English text so a later change to it shows up as "outdated".
-- The fingerprint is refreshed when the Urdu text changes and whenever a row is
-- saved as verified (a reviewer confirming it still matches the English), but
-- not when a row is only sent back to draft.
CREATE FUNCTION "private"."content_translations_source"() RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_source text;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.text IS NOT DISTINCT FROM OLD.text AND NEW.status <> 'verified' THEN
            RETURN NEW;
        END IF;
    END IF;

    v_source := CASE NEW.entity_type
        WHEN 'class' THEN (SELECT c.name FROM public.classes c WHERE c.id = NEW.entity_id)
        WHEN 'subject' THEN (SELECT s.name FROM public.subjects s WHERE s.id = NEW.entity_id)
        WHEN 'chapter' THEN (
            SELECT CASE NEW.field WHEN 'name' THEN ch.name ELSE ch.description END
            FROM public.chapters ch WHERE ch.id = NEW.entity_id)
        WHEN 'topic' THEN (
            SELECT CASE NEW.field WHEN 'name' THEN t.name WHEN 'description' THEN t.description ELSE t.study_guide END
            FROM public.topics t WHERE t.id = NEW.entity_id)
    END;

    IF v_source IS NULL OR btrim(v_source) = '' THEN
        RAISE EXCEPTION 'There is no English % to translate for that %.', replace(NEW.field, '_', ' '), NEW.entity_type
            USING ERRCODE = '23503';
    END IF;

    NEW.source_md5 := md5(v_source);
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION "private"."translation_workflow"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "private"."content_translations_source"() FROM PUBLIC, "anon", "authenticated";

-- BEFORE triggers fire in name order: source check, then workflow, then the
-- updated_at stamp.
CREATE TRIGGER "content_translations_a_source"
    BEFORE INSERT OR UPDATE ON "public"."content_translations"
    FOR EACH ROW EXECUTE FUNCTION "private"."content_translations_source"();
CREATE TRIGGER "content_translations_b_workflow"
    BEFORE INSERT OR UPDATE ON "public"."content_translations"
    FOR EACH ROW EXECUTE FUNCTION "private"."translation_workflow"();
CREATE TRIGGER "content_translations_set_updated_at"
    BEFORE UPDATE ON "public"."content_translations"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

CREATE TRIGGER "glossary_terms_b_workflow"
    BEFORE INSERT OR UPDATE ON "public"."glossary_terms"
    FOR EACH ROW EXECUTE FUNCTION "private"."translation_workflow"();
CREATE TRIGGER "glossary_terms_set_updated_at"
    BEFORE UPDATE ON "public"."glossary_terms"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Translations go with their item.
CREATE FUNCTION "private"."drop_content_translations"() RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    DELETE FROM public.content_translations
    WHERE entity_type = TG_ARGV[0] AND entity_id = OLD.id;
    RETURN OLD;
END;
$$;
REVOKE ALL ON FUNCTION "private"."drop_content_translations"() FROM PUBLIC, "anon", "authenticated";

CREATE TRIGGER "classes_drop_translations" AFTER DELETE ON "public"."classes"
    FOR EACH ROW EXECUTE FUNCTION "private"."drop_content_translations"('class');
CREATE TRIGGER "subjects_drop_translations" AFTER DELETE ON "public"."subjects"
    FOR EACH ROW EXECUTE FUNCTION "private"."drop_content_translations"('subject');
CREATE TRIGGER "chapters_drop_translations" AFTER DELETE ON "public"."chapters"
    FOR EACH ROW EXECUTE FUNCTION "private"."drop_content_translations"('chapter');
CREATE TRIGGER "topics_drop_translations" AFTER DELETE ON "public"."topics"
    FOR EACH ROW EXECUTE FUNCTION "private"."drop_content_translations"('topic');

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE "public"."content_translations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."glossary_terms" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read verified translations; the Studio reads all" ON "public"."content_translations"
    FOR SELECT TO "authenticated"
    USING ("status" = 'verified' OR "private"."is_studio_member"());
CREATE POLICY "The Studio adds translations" ON "public"."content_translations"
    FOR INSERT TO "authenticated"
    WITH CHECK ("private"."is_studio_member"());
CREATE POLICY "The Studio edits translations" ON "public"."content_translations"
    FOR UPDATE TO "authenticated"
    USING ("private"."is_studio_member"())
    WITH CHECK ("private"."is_studio_member"());
CREATE POLICY "Reviewers delete translations; authors their own drafts" ON "public"."content_translations"
    FOR DELETE TO "authenticated"
    USING ("private"."studio_role"() IN ('reviewer', 'platform_admin')
        OR ("private"."studio_role"() = 'author' AND "status" = 'draft' AND "edited_by" = (SELECT "auth"."uid"())));

CREATE POLICY "Users read verified terms; the Studio reads all" ON "public"."glossary_terms"
    FOR SELECT TO "authenticated"
    USING ("status" = 'verified' OR "private"."is_studio_member"());
CREATE POLICY "The Studio adds terms" ON "public"."glossary_terms"
    FOR INSERT TO "authenticated"
    WITH CHECK ("private"."is_studio_member"());
CREATE POLICY "The Studio edits terms" ON "public"."glossary_terms"
    FOR UPDATE TO "authenticated"
    USING ("private"."is_studio_member"())
    WITH CHECK ("private"."is_studio_member"());
CREATE POLICY "Reviewers delete terms; authors their own drafts" ON "public"."glossary_terms"
    FOR DELETE TO "authenticated"
    USING ("private"."studio_role"() IN ('reviewer', 'platform_admin')
        OR ("private"."studio_role"() = 'author' AND "status" = 'draft' AND "edited_by" = (SELECT "auth"."uid"())));

-- Nothing for anonymous visitors; only the editable columns are writable.
REVOKE ALL ON TABLE "public"."content_translations", "public"."glossary_terms" FROM "anon";
REVOKE INSERT, UPDATE, TRUNCATE ON TABLE "public"."content_translations", "public"."glossary_terms" FROM "authenticated";
GRANT INSERT ("entity_type", "entity_id", "field", "language", "text", "status", "source")
    ON TABLE "public"."content_translations" TO "authenticated";
GRANT UPDATE ("text", "status", "source") ON TABLE "public"."content_translations" TO "authenticated";
GRANT INSERT ("subject_slug", "term_en", "term_ur", "roman_ur", "notes", "status")
    ON TABLE "public"."glossary_terms" TO "authenticated";
GRANT UPDATE ("subject_slug", "term_en", "term_ur", "roman_ur", "notes", "status")
    ON TABLE "public"."glossary_terms" TO "authenticated";

-- ---------------------------------------------------------------------------
-- translation_overview: every translatable field, with its Urdu status
-- ---------------------------------------------------------------------------
-- Runs with the caller's permissions, so it shows what the caller may read.
CREATE VIEW "public"."translation_overview" WITH ("security_invoker" = 'on') AS
WITH "items" AS (
    SELECT 'class'::text AS entity_type, c.id AS entity_id, 'name'::text AS field, c.name AS english,
           c.id AS class_id, NULL::uuid AS subject_id, NULL::uuid AS chapter_id, 0 AS chapter_no
    FROM public.classes c
    UNION ALL
    SELECT 'subject', s.id, 'name', s.name, s.class_id, s.id, NULL, 0
    FROM public.subjects s
    UNION ALL
    SELECT 'chapter', ch.id, f.field, CASE f.field WHEN 'name' THEN ch.name ELSE ch.description END,
           s.class_id, ch.subject_id, ch.id, COALESCE(ch.chapter_no, 0)
    FROM public.chapters ch
    JOIN public.subjects s ON s.id = ch.subject_id
    CROSS JOIN (VALUES ('name'), ('description')) AS f(field)
    UNION ALL
    SELECT 'topic', t.id, f.field,
           CASE f.field WHEN 'name' THEN t.name WHEN 'description' THEN t.description ELSE t.study_guide END,
           s.class_id, t.subject_id, t.chapter_id, COALESCE(ch.chapter_no, 0)
    FROM public.topics t
    JOIN public.subjects s ON s.id = t.subject_id
    LEFT JOIN public.chapters ch ON ch.id = t.chapter_id
    CROSS JOIN (VALUES ('name'), ('description'), ('study_guide')) AS f(field)
)
SELECT i.entity_type, i.entity_id, i.field, i.english,
       i.class_id, i.subject_id, i.chapter_id, i.chapter_no,
       tr.id AS translation_id, tr.text AS urdu, tr.status, tr.source,
       (tr.id IS NOT NULL AND tr.source_md5 IS DISTINCT FROM md5(i.english)) AS outdated,
       tr.edited_by, tr.verified_by, tr.verified_at, tr.updated_at
FROM items i
LEFT JOIN public.content_translations tr
    ON tr.entity_type = i.entity_type AND tr.entity_id = i.entity_id AND tr.field = i.field AND tr.language = 'ur'
-- Empty English fields (a chapter with no description) have nothing to translate.
WHERE i.english IS NOT NULL AND btrim(i.english) <> '';

REVOKE ALL ON TABLE "public"."translation_overview" FROM "anon";
GRANT SELECT ON TABLE "public"."translation_overview" TO "authenticated";

-- ---------------------------------------------------------------------------
-- AI usage limit for translate-content
-- ---------------------------------------------------------------------------
INSERT INTO "public"."ai_quota_limits" ("scope", "daily_limit", "description") VALUES
    ('translation', 300, 'translate-content calls (AI translation drafts) per Studio user per 24 hours');

-- Phase 5c: teachers' own simulations and notes (approved 2026-10-08).
--
-- A teacher's material lives here, never in simulations or topics, so nothing a
-- teacher makes can change Tutre's library or curriculum. Copying a Tutre
-- simulation or Tutre's notes makes an independent copy owned by the teacher.
--
-- teacher_materials  one simulation or one set of notes, owned by a teacher (or
--                    school admin) of one school, anchored to a chapter and
--                    optionally a topic of that chapter
-- material_shares    which sections a material is shared with
--
-- Who sees what:
--   the author                      their own material, while they are staff of the school
--   school admins, Tutre admins     everything in the school; may archive it and
--                                   unshare it, but never edit another person's work
--   staff of the same school        material its author marked "school" (the school
--                                   library), to copy
--   section members                 active material shared with their section
--   everyone else                   nothing; anonymous visitors nothing at all
--
-- Rules are enforced for API callers (current_user = 'authenticated'); the
-- SECURITY DEFINER copy functions below set the provenance columns themselves.
-- Teacher simulations are untrusted HTML like any AI output: the apps render
-- them only in the sandboxed simulation frame, and notes only after DOMPurify.

CREATE TABLE "public"."teacher_materials" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "org_id" "uuid" NOT NULL REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    -- NULL only if the author's account is deleted; the school keeps the material.
    "owner_id" "uuid" DEFAULT "auth"."uid"() REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "kind" "text" NOT NULL CHECK ("kind" IN ('simulation', 'notes')),
    "chapter_id" "uuid" NOT NULL REFERENCES "public"."chapters"("id") ON DELETE CASCADE,
    "topic_id" "uuid" REFERENCES "public"."topics"("id") ON DELETE SET NULL,
    "title" "text" NOT NULL CHECK ("char_length"("btrim"("title")) BETWEEN 2 AND 120),
    -- For a simulation: what it shows (HTML), also the AI tutor's context.
    "summary" "text" NOT NULL DEFAULT '' CHECK ("char_length"("summary") <= 20000),
    -- Simulation HTML, or the notes (HTML).
    "content" "text" NOT NULL DEFAULT '',
    "language" "text" NOT NULL DEFAULT 'en' CHECK ("language" IN ('en', 'ur')),
    "visibility" "text" NOT NULL DEFAULT 'private' CHECK ("visibility" IN ('private', 'school')),
    "status" "text" NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'archived')),
    "based_on_simulation_id" "uuid" REFERENCES "public"."simulations"("id") ON DELETE SET NULL,
    "based_on_topic_id" "uuid" REFERENCES "public"."topics"("id") ON DELETE SET NULL,
    "based_on_material_id" "uuid" REFERENCES "public"."teacher_materials"("id") ON DELETE SET NULL,
    "version" integer NOT NULL DEFAULT 1,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    CHECK ("octet_length"("content") <= CASE "kind" WHEN 'simulation' THEN 2000000 ELSE 300000 END),
    CHECK ("kind" = 'simulation' OR "based_on_simulation_id" IS NULL),
    CHECK ("kind" = 'notes' OR "based_on_topic_id" IS NULL)
);
CREATE INDEX "teacher_materials_org_idx" ON "public"."teacher_materials" ("org_id");
CREATE INDEX "teacher_materials_owner_idx" ON "public"."teacher_materials" ("owner_id");
CREATE INDEX "teacher_materials_chapter_idx" ON "public"."teacher_materials" ("chapter_id");

CREATE TABLE "public"."material_shares" (
    "material_id" "uuid" NOT NULL REFERENCES "public"."teacher_materials"("id") ON DELETE CASCADE,
    "section_id" "uuid" NOT NULL REFERENCES "public"."sections"("id") ON DELETE CASCADE,
    "shared_by" "uuid" DEFAULT "auth"."uid"() REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "shared_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    PRIMARY KEY ("material_id", "section_id")
);
CREATE INDEX "material_shares_section_idx" ON "public"."material_shares" ("section_id");

-- ---------------------------------------------------------------------------
-- Access-check helpers (not exposed through the API)
-- ---------------------------------------------------------------------------

-- Is the caller a teacher or school admin of this active school?
CREATE FUNCTION "private"."is_school_staff"("p_org" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT private.has_org_role(p_org, ARRAY['teacher', 'org_admin']);
$$;

-- May the caller manage this material: its author (while staff of the
-- school), a school admin of the school, or a platform admin?
CREATE FUNCTION "private"."can_manage_material"("p_material" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.teacher_materials m
        WHERE m.id = p_material
          AND ((m.owner_id = (SELECT auth.uid()) AND private.is_school_staff(m.org_id))
               OR private.has_org_role(m.org_id, ARRAY['org_admin'])
               OR private.is_platform_admin())
    );
$$;

-- Is this material shared with a (not archived) section the caller is in?
CREATE FUNCTION "private"."material_shared_with_me"("p_material" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.material_shares s
        JOIN public.section_members sm ON sm.section_id = s.section_id AND sm.user_id = (SELECT auth.uid())
        JOIN public.sections sec ON sec.id = s.section_id AND NOT sec.archived
        JOIN public.organizations o ON o.id = sec.org_id AND o.status = 'active'
        WHERE s.material_id = p_material
    );
$$;

-- May the caller share this material with this section? Only the author, only
-- active material, only a section of the material's school that the author
-- teaches (a school admin may use any section of their school).
CREATE FUNCTION "private"."can_share_material"("p_material" "uuid", "p_section" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.teacher_materials m
        JOIN public.sections sec ON sec.id = p_section AND sec.org_id = m.org_id AND NOT sec.archived
        WHERE m.id = p_material
          AND m.status = 'active'
          AND m.owner_id = (SELECT auth.uid())
          AND private.is_school_staff(m.org_id)
          AND (private.is_section_member(p_section, ARRAY['teacher'])
               OR private.has_org_role(m.org_id, ARRAY['org_admin']))
    );
$$;

REVOKE ALL ON FUNCTION "private"."is_school_staff"("uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "private"."can_manage_material"("uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "private"."material_shared_with_me"("uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "private"."can_share_material"("uuid", "uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "private"."is_school_staff"("uuid") TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "private"."can_manage_material"("uuid") TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "private"."material_shared_with_me"("uuid") TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "private"."can_share_material"("uuid", "uuid") TO "authenticated", "service_role";

-- ---------------------------------------------------------------------------
-- Integrity and editing rules
-- ---------------------------------------------------------------------------

-- SECURITY INVOKER on purpose: it tells API callers from trusted owner code by
-- current_user, which inside a SECURITY DEFINER function is always the owner.
CREATE FUNCTION "private"."teacher_materials_guard"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY INVOKER
SET "search_path" = ''
AS $$
DECLARE
    v_topic_chapter uuid;
BEGIN
    IF NEW.topic_id IS NOT NULL THEN
        SELECT chapter_id INTO v_topic_chapter FROM public.topics WHERE id = NEW.topic_id;
        IF v_topic_chapter IS DISTINCT FROM NEW.chapter_id THEN
            RAISE EXCEPTION 'The topic must belong to the chosen chapter.' USING ERRCODE = '22023';
        END IF;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF current_user = 'authenticated' THEN
            -- The author is always the caller, and provenance is set only by
            -- the copy functions.
            NEW.owner_id := (SELECT auth.uid());
            NEW.status := 'active';
            NEW.version := 1;
            NEW.based_on_simulation_id := NULL;
            NEW.based_on_topic_id := NULL;
            NEW.based_on_material_id := NULL;
        END IF;
        RETURN NEW;
    END IF;

    IF current_user = 'authenticated' THEN
        IF NEW.org_id <> OLD.org_id OR NEW.kind <> OLD.kind
           OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
           OR NEW.based_on_simulation_id IS DISTINCT FROM OLD.based_on_simulation_id
           OR NEW.based_on_topic_id IS DISTINCT FROM OLD.based_on_topic_id
           OR NEW.based_on_material_id IS DISTINCT FROM OLD.based_on_material_id THEN
            RAISE EXCEPTION 'That cannot be changed.' USING ERRCODE = '42501';
        END IF;
        -- School admins and Tutre may archive or restore another person's
        -- material, but only its author edits it.
        IF OLD.owner_id IS DISTINCT FROM (SELECT auth.uid())
           AND (NEW.title, NEW.summary, NEW.content, NEW.chapter_id, NEW.topic_id, NEW.language, NEW.visibility)
               IS DISTINCT FROM
               (OLD.title, OLD.summary, OLD.content, OLD.chapter_id, OLD.topic_id, OLD.language, OLD.visibility) THEN
            RAISE EXCEPTION 'Only the author can edit this material. School admins can archive it.' USING ERRCODE = '42501';
        END IF;
    END IF;

    IF NEW.content IS DISTINCT FROM OLD.content THEN
        NEW.version := OLD.version + 1;
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "teacher_materials_guard"
    BEFORE INSERT OR UPDATE ON "public"."teacher_materials"
    FOR EACH ROW EXECUTE FUNCTION "private"."teacher_materials_guard"();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE "public"."teacher_materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."material_shares" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors, school admins and Tutre read materials" ON "public"."teacher_materials"
    FOR SELECT TO "authenticated"
    USING (("owner_id" = (SELECT "auth"."uid"()) AND "private"."is_school_staff"("org_id"))
        OR "private"."has_org_role"("org_id", ARRAY['org_admin'])
        OR "private"."is_platform_admin"());

CREATE POLICY "School staff read the school library" ON "public"."teacher_materials"
    FOR SELECT TO "authenticated"
    USING ("status" = 'active' AND "visibility" = 'school' AND "private"."is_school_staff"("org_id"));

CREATE POLICY "Section members read material shared with them" ON "public"."teacher_materials"
    FOR SELECT TO "authenticated"
    USING ("status" = 'active' AND "private"."material_shared_with_me"("id"));

CREATE POLICY "School staff create their own material" ON "public"."teacher_materials"
    FOR INSERT TO "authenticated"
    WITH CHECK ("owner_id" = (SELECT "auth"."uid"()) AND "private"."is_school_staff"("org_id"));

CREATE POLICY "Authors edit, school admins and Tutre archive" ON "public"."teacher_materials"
    FOR UPDATE TO "authenticated"
    USING ("private"."can_manage_material"("id"))
    WITH CHECK (("owner_id" = (SELECT "auth"."uid"()) AND "private"."is_school_staff"("org_id"))
        OR "private"."has_org_role"("org_id", ARRAY['org_admin'])
        OR "private"."is_platform_admin"());

CREATE POLICY "Authors delete their own material" ON "public"."teacher_materials"
    FOR DELETE TO "authenticated"
    USING ("owner_id" = (SELECT "auth"."uid"()) AND "private"."is_school_staff"("org_id"));

CREATE POLICY "Managers and section teachers read shares" ON "public"."material_shares"
    FOR SELECT TO "authenticated"
    USING ("private"."can_manage_material"("material_id")
        OR "private"."is_section_member"("section_id", ARRAY['teacher']));

CREATE POLICY "Authors share with their sections" ON "public"."material_shares"
    FOR INSERT TO "authenticated"
    WITH CHECK ("shared_by" = (SELECT "auth"."uid"())
        AND "private"."can_share_material"("material_id", "section_id"));

CREATE POLICY "Authors, school admins and Tutre unshare" ON "public"."material_shares"
    FOR DELETE TO "authenticated"
    USING ("private"."can_manage_material"("material_id"));

-- Only the columns a user may set are writable; owner, provenance and version
-- are the database's.
REVOKE ALL ON TABLE "public"."teacher_materials", "public"."material_shares" FROM "anon";
REVOKE INSERT, UPDATE, TRUNCATE ON TABLE "public"."teacher_materials" FROM "authenticated";
GRANT INSERT ("org_id", "kind", "chapter_id", "topic_id", "title", "summary", "content", "language", "visibility")
    ON TABLE "public"."teacher_materials" TO "authenticated";
GRANT UPDATE ("chapter_id", "topic_id", "title", "summary", "content", "language", "visibility", "status")
    ON TABLE "public"."teacher_materials" TO "authenticated";
REVOKE INSERT, UPDATE, TRUNCATE ON TABLE "public"."material_shares" FROM "authenticated";
GRANT INSERT ("material_id", "section_id") ON TABLE "public"."material_shares" TO "authenticated";

-- ---------------------------------------------------------------------------
-- Copying: Tutre's library and the school library into "my materials"
-- ---------------------------------------------------------------------------

-- A copy of a published Tutre simulation, owned by the caller in p_org. The
-- original is never touched.
CREATE FUNCTION "public"."copy_library_simulation"("p_simulation" "uuid", "p_org" "uuid") RETURNS "uuid"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_id uuid;
    v_sim record;
BEGIN
    IF NOT private.is_school_staff(p_org) THEN
        RAISE EXCEPTION 'Only teachers and school admins of this school can do that.' USING ERRCODE = '42501';
    END IF;
    SELECT s.id, s.code_payload, t.id AS topic_id, t.name, t.description, t.chapter_id
    INTO v_sim
    FROM public.simulations s JOIN public.topics t ON t.id = s.topic_id
    WHERE s.id = p_simulation AND s.status = 'published';
    IF v_sim.id IS NULL THEN
        RAISE EXCEPTION 'No such simulation.' USING ERRCODE = 'P0002';
    END IF;
    IF v_sim.chapter_id IS NULL THEN
        RAISE EXCEPTION 'This simulation is not in a chapter, so it cannot be copied.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.teacher_materials
        (org_id, owner_id, kind, chapter_id, topic_id, title, summary, content, based_on_simulation_id)
    VALUES
        (p_org, (SELECT auth.uid()), 'simulation', v_sim.chapter_id, v_sim.topic_id,
         left(v_sim.name, 120), left(coalesce(v_sim.description, ''), 20000), v_sim.code_payload, v_sim.id)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- A copy of Tutre's notes (the topic's study guide) to edit.
CREATE FUNCTION "public"."copy_library_notes"("p_topic" "uuid", "p_org" "uuid") RETURNS "uuid"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_id uuid;
    v_topic record;
BEGIN
    IF NOT private.is_school_staff(p_org) THEN
        RAISE EXCEPTION 'Only teachers and school admins of this school can do that.' USING ERRCODE = '42501';
    END IF;
    -- Only notes students can already see: a topic with a published simulation.
    SELECT t.id, t.name, t.study_guide, t.chapter_id INTO v_topic
    FROM public.topics t
    WHERE t.id = p_topic
      AND EXISTS (SELECT 1 FROM public.simulations s WHERE s.topic_id = t.id AND s.status = 'published');
    IF v_topic.id IS NULL OR coalesce(btrim(v_topic.study_guide), '') = '' THEN
        RAISE EXCEPTION 'This topic has no notes to copy.' USING ERRCODE = 'P0002';
    END IF;
    IF v_topic.chapter_id IS NULL THEN
        RAISE EXCEPTION 'This topic is not in a chapter, so its notes cannot be copied.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.teacher_materials
        (org_id, owner_id, kind, chapter_id, topic_id, title, content, based_on_topic_id)
    VALUES
        (p_org, (SELECT auth.uid()), 'notes', v_topic.chapter_id, v_topic.id,
         left(v_topic.name, 120), v_topic.study_guide, v_topic.id)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- A copy of material from the school library (or of the caller's own), owned
-- by the caller, private until they share it.
CREATE FUNCTION "public"."copy_teacher_material"("p_material" "uuid") RETURNS "uuid"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_id uuid;
    v_src public.teacher_materials;
BEGIN
    SELECT * INTO v_src FROM public.teacher_materials WHERE id = p_material;
    IF v_src.id IS NULL OR NOT private.is_school_staff(v_src.org_id)
       OR NOT (v_src.owner_id = (SELECT auth.uid())
               OR (v_src.status = 'active' AND v_src.visibility = 'school')
               OR private.has_org_role(v_src.org_id, ARRAY['org_admin'])) THEN
        RAISE EXCEPTION 'No such material.' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.teacher_materials
        (org_id, owner_id, kind, chapter_id, topic_id, title, summary, content, language,
         based_on_simulation_id, based_on_topic_id, based_on_material_id)
    VALUES
        (v_src.org_id, (SELECT auth.uid()), v_src.kind, v_src.chapter_id, v_src.topic_id, v_src.title,
         v_src.summary, v_src.content, v_src.language,
         v_src.based_on_simulation_id, v_src.based_on_topic_id, v_src.id)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Lists with author names (a student cannot read every author's profile)
-- ---------------------------------------------------------------------------

-- Material shared with the caller's sections, optionally for one chapter or
-- one material. No content: open a material by id (RLS) to read it.
CREATE FUNCTION "public"."shared_materials"("p_chapter" "uuid" DEFAULT NULL, "p_material" "uuid" DEFAULT NULL)
RETURNS TABLE ("id" "uuid", "kind" "text", "title" "text", "chapter_id" "uuid", "topic_id" "uuid",
               "language" "text", "owner_name" "text", "updated_at" timestamp with time zone)
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT m.id, m.kind, m.title, m.chapter_id, m.topic_id, m.language, p.display_name, m.updated_at
    FROM public.teacher_materials m
    LEFT JOIN public.profiles p ON p.id = m.owner_id
    WHERE m.status = 'active'
      AND (p_chapter IS NULL OR m.chapter_id = p_chapter)
      AND (p_material IS NULL OR m.id = p_material)
      AND private.material_shared_with_me(m.id)
    ORDER BY m.updated_at DESC
    LIMIT 200;
$$;

-- The school library: other staff's material marked "school", for staff of
-- that school to copy.
CREATE FUNCTION "public"."school_library"("p_org" "uuid")
RETURNS TABLE ("id" "uuid", "kind" "text", "title" "text", "chapter_id" "uuid", "topic_id" "uuid",
               "language" "text", "owner_name" "text", "updated_at" timestamp with time zone)
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT m.id, m.kind, m.title, m.chapter_id, m.topic_id, m.language, p.display_name, m.updated_at
    FROM public.teacher_materials m
    LEFT JOIN public.profiles p ON p.id = m.owner_id
    WHERE m.org_id = p_org
      AND m.status = 'active'
      AND m.visibility = 'school'
      AND m.owner_id IS DISTINCT FROM (SELECT auth.uid())
      AND private.is_school_staff(p_org)
    ORDER BY m.updated_at DESC
    LIMIT 500;
$$;

REVOKE ALL ON FUNCTION "public"."copy_library_simulation"("uuid", "uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."copy_library_notes"("uuid", "uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."copy_teacher_material"("uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."shared_materials"("uuid", "uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."school_library"("uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."copy_library_simulation"("uuid", "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."copy_library_notes"("uuid", "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."copy_teacher_material"("uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."shared_materials"("uuid", "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."school_library"("uuid") TO "authenticated";

-- ---------------------------------------------------------------------------
-- AI limits for teachers (Phase 5d): separate from the content team's
-- ---------------------------------------------------------------------------

INSERT INTO "public"."ai_quota_limits" ("scope", "daily_limit", "description") VALUES
    ('teacher_simulation_generation', 10, 'generate-simulation and generate-simulation-3d calls by teachers and school admins per user per 24 hours'),
    ('teacher_notes_draft', 30, 'chat-tutor notes drafts by teachers and school admins per user per 24 hours'),
    ('teacher_authoring_assist', 50, 'suggest-requirements and extract-html-details calls by teachers and school admins per user per 24 hours')
ON CONFLICT ("scope") DO NOTHING;

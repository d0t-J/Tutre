-- Fixes from the 2026-10-08 audit of Phases 1-5. Additive only: no table,
-- column, row or policy is dropped or rewritten.
--
-- 1. A code tied to an archived section no longer works (redeem and peek).
--    Archiving a section used to leave its codes working until they expired,
--    and a section's class code lasts a year. Unarchiving makes them work again.
-- 2. Indexes for foreign keys that had none: the curriculum lookups every
--    student page makes, progress and teachers' material, and the "who did
--    this" columns that are scanned when an account is deleted. The frozen
--    per-subject backup tables are left alone.
-- 3. Anonymous visitors could call three public functions through the API.
--    None does anything for them, but they should not be offered at all.
-- 4. private.normalize_manifest was marked IMMUTABLE but calls STABLE
--    functions; it is only used by a trigger, so STABLE is the honest label.

-- ---------------------------------------------------------------------------
-- 1. Codes of archived sections
-- ---------------------------------------------------------------------------

-- Unchanged from 20261004130300_invite_codes.sql except the archived check.
CREATE OR REPLACE FUNCTION "public"."redeem_invite_code"("p_code" "text") RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_norm text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
    v_code public.invite_codes;
    v_org public.organizations;
    v_section_name text;
    v_org_changed integer := 0;
    v_section_changed integer := 0;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_code FROM public.invite_codes WHERE code = v_norm FOR UPDATE;
    SELECT * INTO v_org FROM public.organizations WHERE id = v_code.org_id;
    IF v_code.id IS NULL OR v_code.revoked OR v_code.expires_at <= now()
       OR v_code.uses >= v_code.max_uses OR v_org.status <> 'active'
       OR EXISTS (SELECT 1 FROM public.sections WHERE id = v_code.section_id AND archived) THEN
        RAISE EXCEPTION 'This code is not valid. Ask your school for a new one.' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.org_memberships (org_id, user_id, role)
    VALUES (v_code.org_id, v_uid, v_code.role)
    ON CONFLICT (org_id, user_id, role) DO UPDATE SET status = 'active'
        WHERE public.org_memberships.status <> 'active';
    GET DIAGNOSTICS v_org_changed = ROW_COUNT;

    IF v_code.section_id IS NOT NULL THEN
        INSERT INTO public.section_members (section_id, user_id, role)
        VALUES (v_code.section_id, v_uid, v_code.role)
        ON CONFLICT DO NOTHING;
        GET DIAGNOSTICS v_section_changed = ROW_COUNT;
        SELECT name INTO v_section_name FROM public.sections WHERE id = v_code.section_id;
    END IF;

    IF v_org_changed = 0 AND v_section_changed = 0 THEN
        RETURN jsonb_build_object('already_member', true, 'org_id', v_org.id, 'org_name', v_org.name,
                                  'role', v_code.role, 'section_id', v_code.section_id, 'section_name', v_section_name);
    END IF;

    UPDATE public.invite_codes SET uses = uses + 1 WHERE id = v_code.id;

    RETURN jsonb_build_object('already_member', false, 'org_id', v_org.id, 'org_name', v_org.name,
                              'role', v_code.role, 'section_id', v_code.section_id, 'section_name', v_section_name);
END;
$$;

-- Unchanged from 20261009090000_head_admins_staff_portal.sql except the archived check.
CREATE OR REPLACE FUNCTION "public"."peek_invite_code"("p_code" "text") RETURNS "jsonb"
LANGUAGE "plpgsql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_norm text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
    v_code public.invite_codes;
    v_org public.organizations;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_code FROM public.invite_codes WHERE code = v_norm;
    SELECT * INTO v_org FROM public.organizations WHERE id = v_code.org_id;
    IF v_code.id IS NULL OR v_code.revoked OR v_code.expires_at <= now()
       OR v_code.uses >= v_code.max_uses OR v_org.status <> 'active'
       OR EXISTS (SELECT 1 FROM public.sections WHERE id = v_code.section_id AND archived) THEN
        RETURN jsonb_build_object('valid', false);
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'role', v_code.role,
        'org_name', v_org.name,
        'section_name', (SELECT name FROM public.sections WHERE id = v_code.section_id),
        'already_member', EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE org_id = v_code.org_id AND user_id = v_uid AND role = v_code.role AND status = 'active'
        ) AND (v_code.section_id IS NULL OR EXISTS (
            SELECT 1 FROM public.section_members
            WHERE section_id = v_code.section_id AND user_id = v_uid AND role = v_code.role
        ))
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Foreign-key indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "subjects_class_id_idx" ON "public"."subjects" ("class_id");
CREATE INDEX IF NOT EXISTS "topics_chapter_id_idx" ON "public"."topics" ("chapter_id");
CREATE INDEX IF NOT EXISTS "topics_subject_id_idx" ON "public"."topics" ("subject_id");
CREATE INDEX IF NOT EXISTS "sections_class_id_idx" ON "public"."sections" ("class_id");
CREATE INDEX IF NOT EXISTS "profiles_class_id_idx" ON "public"."profiles" ("class_id");
CREATE INDEX IF NOT EXISTS "learning_events_simulation_id_idx" ON "public"."learning_events" ("simulation_id");
CREATE INDEX IF NOT EXISTS "learning_events_topic_id_idx" ON "public"."learning_events" ("topic_id");
CREATE INDEX IF NOT EXISTS "topic_progress_topic_id_idx" ON "public"."topic_progress" ("topic_id");
CREATE INDEX IF NOT EXISTS "teacher_materials_topic_id_idx" ON "public"."teacher_materials" ("topic_id");
CREATE INDEX IF NOT EXISTS "teacher_materials_based_on_simulation_id_idx" ON "public"."teacher_materials" ("based_on_simulation_id");
CREATE INDEX IF NOT EXISTS "teacher_materials_based_on_topic_id_idx" ON "public"."teacher_materials" ("based_on_topic_id");
CREATE INDEX IF NOT EXISTS "teacher_materials_based_on_material_id_idx" ON "public"."teacher_materials" ("based_on_material_id");
CREATE INDEX IF NOT EXISTS "material_shares_shared_by_idx" ON "public"."material_shares" ("shared_by");
CREATE INDEX IF NOT EXISTS "organizations_created_by_idx" ON "public"."organizations" ("created_by");
CREATE INDEX IF NOT EXISTS "invite_codes_created_by_idx" ON "public"."invite_codes" ("created_by");
CREATE INDEX IF NOT EXISTS "simulations_created_by_idx" ON "public"."simulations" ("created_by");
CREATE INDEX IF NOT EXISTS "simulations_reviewed_by_idx" ON "public"."simulations" ("reviewed_by");
CREATE INDEX IF NOT EXISTS "simulation_versions_replaced_by_idx" ON "public"."simulation_versions" ("replaced_by");
CREATE INDEX IF NOT EXISTS "content_translations_edited_by_idx" ON "public"."content_translations" ("edited_by");
CREATE INDEX IF NOT EXISTS "content_translations_verified_by_idx" ON "public"."content_translations" ("verified_by");
CREATE INDEX IF NOT EXISTS "glossary_terms_edited_by_idx" ON "public"."glossary_terms" ("edited_by");
CREATE INDEX IF NOT EXISTS "glossary_terms_verified_by_idx" ON "public"."glossary_terms" ("verified_by");

-- ---------------------------------------------------------------------------
-- 3. Functions not offered to anonymous visitors
-- ---------------------------------------------------------------------------

-- Trigger functions: nobody calls them directly; triggers keep working.
REVOKE ALL ON FUNCTION "public"."set_updated_at"() FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."subjects_set_slug"() FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "public"."subjects_set_slug"() TO "authenticated", "service_role";

-- Its own migration revoked PUBLIC, but Supabase's default privileges had
-- already granted anon directly.
REVOKE ALL ON FUNCTION "public"."upsert_canonical_simulation"(
    "text", "text", integer, "text", "text", "text", "text"
) FROM "anon";

-- ---------------------------------------------------------------------------
-- 4. Honest volatility
-- ---------------------------------------------------------------------------

ALTER FUNCTION "private"."normalize_manifest"("jsonb") STABLE;

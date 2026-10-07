-- Phase 5f: a standing class code per section (approved 2026-10-08).
--
-- Instead of making a new student code for every class, each section has one
-- standing student code: valid for a year, up to 1000 students. Its teachers
-- and the school's admins see it, share it as a link or QR code, and replace it
-- in one click (the old code stops working at once). Ordinary one-off codes
-- (create_invite_code) still work as before.

ALTER TABLE "public"."invite_codes"
    ADD COLUMN "is_class_code" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_class_code_is_student_section"
    CHECK (NOT "is_class_code" OR ("section_id" IS NOT NULL AND "role" = 'student'));

-- One live class code per section.
CREATE UNIQUE INDEX "invite_codes_one_class_code_per_section"
    ON "public"."invite_codes" ("section_id") WHERE "is_class_code" AND NOT "revoked";

-- Returns the section's class code, creating it if there is none or the old one
-- has expired or is used up; p_replace revokes the current one and makes a new
-- one. For the section's teachers, the school's admins and platform admins.
CREATE FUNCTION "public"."class_code"("p_section" "uuid", "p_replace" boolean DEFAULT false) RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_section public.sections;
    v_code public.invite_codes;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;
    SELECT * INTO v_section FROM public.sections WHERE id = p_section;
    IF v_section.id IS NULL OR NOT (
        private.is_platform_admin()
        OR private.has_org_role(v_section.org_id, ARRAY['org_admin'])
        OR private.is_section_member(p_section, ARRAY['teacher'])
    ) THEN
        RAISE EXCEPTION 'No such section.' USING ERRCODE = 'P0002';
    END IF;
    IF v_section.archived THEN
        RAISE EXCEPTION 'This section is archived. Unarchive it to use its class code.' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = v_section.org_id AND status = 'active') THEN
        RAISE EXCEPTION 'This school is suspended.' USING ERRCODE = '22023';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended('tutre.class_code:' || p_section::text, 0));

    SELECT * INTO v_code FROM public.invite_codes
    WHERE section_id = p_section AND is_class_code AND NOT revoked;

    IF v_code.id IS NOT NULL AND NOT p_replace
       AND v_code.expires_at > now() AND v_code.uses < v_code.max_uses THEN
        RETURN jsonb_build_object('id', v_code.id, 'code', v_code.code, 'uses', v_code.uses,
                                  'max_uses', v_code.max_uses, 'expires_at', v_code.expires_at);
    END IF;

    IF v_code.id IS NOT NULL THEN
        UPDATE public.invite_codes SET revoked = true WHERE id = v_code.id;
    END IF;

    v_code := private.insert_invite_code(v_section.org_id, 'student', p_section, 1000, 365);
    UPDATE public.invite_codes SET is_class_code = true WHERE id = v_code.id RETURNING * INTO v_code;

    RETURN jsonb_build_object('id', v_code.id, 'code', v_code.code, 'uses', v_code.uses,
                              'max_uses', v_code.max_uses, 'expires_at', v_code.expires_at);
END;
$$;

REVOKE ALL ON FUNCTION "public"."class_code"("uuid", boolean) FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."class_code"("uuid", boolean) TO "authenticated";

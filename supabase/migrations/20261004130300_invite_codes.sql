-- Phase 2a: how schools and people get onto Tutre.
--
--   create_organization(name, slug)     platform admins; returns the school's
--                                       first org-admin invite code
--   set_organization_status(org, status) platform admins; 'active' or 'suspended'
--   create_invite_code(org, role, section, max_uses, valid_days)
--       platform admin: any role, any school
--       org admin:      org_admin, teacher or student codes for their school
--       teacher:        student codes for sections they teach
--   revoke_invite_code(id)              whoever could create it, or its creator
--   redeem_invite_code(code)            any signed-in user; joins the school (and
--                                       section) with the code's role
--
-- invite_codes has no INSERT/UPDATE/DELETE policy, so these functions are the
-- only way codes are created or used.

-- 10 characters from a 31-character alphabet with no look-alikes: about 8 x 10^14
-- possible codes, and every code also expires and has a use limit.
CREATE FUNCTION "private"."generate_invite_code"() RETURNS "text"
LANGUAGE "plpgsql" VOLATILE
SET "search_path" = ''
AS $$
DECLARE
    alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    bytes bytea := extensions.gen_random_bytes(10);
    result text := '';
BEGIN
    FOR i IN 0..9 LOOP
        result := result || substr(alphabet, (get_byte(bytes, i) % 31) + 1, 1);
    END LOOP;
    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION "private"."generate_invite_code"() FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "private"."generate_invite_code"() TO "authenticated", "service_role";

-- Inserts a code row with a fresh, unused code. Callers check permissions first.
CREATE FUNCTION "private"."insert_invite_code"(
    "p_org" "uuid", "p_role" "text", "p_section" "uuid", "p_max_uses" integer, "p_valid_days" integer
) RETURNS "public"."invite_codes"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_row public.invite_codes;
BEGIN
    LOOP
        BEGIN
            INSERT INTO public.invite_codes (code, org_id, section_id, role, max_uses, expires_at, created_by)
            VALUES (private.generate_invite_code(), p_org, p_section, p_role, p_max_uses,
                    now() + make_interval(days => p_valid_days), (SELECT auth.uid()))
            RETURNING * INTO v_row;
            RETURN v_row;
        EXCEPTION WHEN unique_violation THEN
            -- vanishingly rare code collision: try another code
        END;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION "private"."insert_invite_code"("uuid", "text", "uuid", integer, integer) FROM PUBLIC, "anon", "authenticated";

CREATE FUNCTION "public"."create_organization"("p_name" "text", "p_slug" "text")
RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_org public.organizations;
    v_code public.invite_codes;
BEGIN
    IF NOT private.is_platform_admin() THEN
        RAISE EXCEPTION 'Only platform admins can create schools.' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.organizations (name, slug, created_by)
    VALUES (btrim(p_name), lower(btrim(p_slug)), (SELECT auth.uid()))
    RETURNING * INTO v_org;

    v_code := private.insert_invite_code(v_org.id, 'org_admin', NULL, 1, 14);

    RETURN jsonb_build_object(
        'org_id', v_org.id,
        'name', v_org.name,
        'slug', v_org.slug,
        'admin_code', v_code.code,
        'admin_code_expires_at', v_code.expires_at
    );
END;
$$;

CREATE FUNCTION "public"."set_organization_status"("p_org" "uuid", "p_status" "text")
RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF NOT private.is_platform_admin() THEN
        RAISE EXCEPTION 'Only platform admins can change a school''s status.' USING ERRCODE = '42501';
    END IF;
    UPDATE public.organizations SET status = p_status WHERE id = p_org;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No such school.' USING ERRCODE = 'P0002';
    END IF;
END;
$$;

CREATE FUNCTION "public"."create_invite_code"(
    "p_org" "uuid",
    "p_role" "text",
    "p_section" "uuid" DEFAULT NULL,
    "p_max_uses" integer DEFAULT 1,
    "p_valid_days" integer DEFAULT 14
) RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_code public.invite_codes;
    v_allowed boolean;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;
    IF p_role NOT IN ('org_admin', 'teacher', 'student') THEN
        RAISE EXCEPTION 'Unknown role %.', p_role USING ERRCODE = '22023';
    END IF;
    IF p_valid_days IS NULL OR p_valid_days NOT BETWEEN 1 AND 90 THEN
        RAISE EXCEPTION 'A code can be valid for 1 to 90 days.' USING ERRCODE = '22023';
    END IF;
    IF p_max_uses IS NULL OR p_max_uses NOT BETWEEN 1 AND 1000 THEN
        RAISE EXCEPTION 'A code can be used 1 to 1000 times.' USING ERRCODE = '22023';
    END IF;
    IF p_section IS NOT NULL THEN
        IF p_role = 'org_admin' THEN
            RAISE EXCEPTION 'Org admin codes cannot be tied to a section.' USING ERRCODE = '22023';
        END IF;
        IF private.section_org(p_section) IS DISTINCT FROM p_org THEN
            RAISE EXCEPTION 'That section does not belong to this school.' USING ERRCODE = '22023';
        END IF;
    END IF;

    v_allowed := private.is_platform_admin()
        OR private.has_org_role(p_org, ARRAY['org_admin'])
        OR (p_role = 'student' AND p_section IS NOT NULL
            AND private.is_section_member(p_section, ARRAY['teacher']));
    IF NOT v_allowed THEN
        RAISE EXCEPTION 'You cannot create this kind of code.' USING ERRCODE = '42501';
    END IF;

    v_code := private.insert_invite_code(p_org, p_role, p_section, p_max_uses, p_valid_days);
    RETURN jsonb_build_object('id', v_code.id, 'code', v_code.code, 'role', v_code.role,
                              'section_id', v_code.section_id, 'max_uses', v_code.max_uses,
                              'expires_at', v_code.expires_at);
END;
$$;

CREATE FUNCTION "public"."revoke_invite_code"("p_id" "uuid") RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_code public.invite_codes;
BEGIN
    SELECT * INTO v_code FROM public.invite_codes WHERE id = p_id;
    IF NOT FOUND OR NOT (
        private.is_platform_admin()
        OR private.has_org_role(v_code.org_id, ARRAY['org_admin'])
        OR v_code.created_by = (SELECT auth.uid())
    ) THEN
        RAISE EXCEPTION 'No such code.' USING ERRCODE = 'P0002';
    END IF;
    UPDATE public.invite_codes SET revoked = true WHERE id = p_id;
END;
$$;

-- Joins the caller to the code's school (and section) with the code's role.
-- Every way a code can be unusable gives the same message, so the function does
-- not reveal which codes exist. Redeeming a code you have already used returns
-- already_member and does not use up the code.
CREATE FUNCTION "public"."redeem_invite_code"("p_code" "text") RETURNS "jsonb"
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
       OR v_code.uses >= v_code.max_uses OR v_org.status <> 'active' THEN
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

REVOKE ALL ON FUNCTION "public"."create_organization"("text", "text") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."set_organization_status"("uuid", "text") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."create_invite_code"("uuid", "text", "uuid", integer, integer) FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."revoke_invite_code"("uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."redeem_invite_code"("text") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."create_organization"("text", "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."set_organization_status"("uuid", "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."create_invite_code"("uuid", "text", "uuid", integer, integer) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."revoke_invite_code"("uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."redeem_invite_code"("text") TO "authenticated";

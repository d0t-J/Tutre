-- Phase 5a/5b: head admins and the staff portal (approved 2026-10-08).
--
-- 1. Every school has one head admin, normally the principal. The head adds and
--    removes other org admins and can hand the head role to another admin.
--    Ordinary org admins can still appoint admins (with a code, or by promoting
--    a teacher) but cannot remove one.
-- 2. Tutre platform admins are admins of every school without a membership row.
--    They pass every org-admin check already (each policy ORs
--    private.is_platform_admin()); what changes here is that the "a school must
--    keep at least one org admin" rule no longer binds them, because Tutre itself
--    is always an admin.
-- 3. get_my_context(): everything the apps need to know about the signed-in
--    user in one call (Studio role, schools, sections), used by both panels to
--    decide which portal and which screens a person gets.
-- 4. peek_invite_code(): what a code is for, before it is used, so each portal
--    can send a staff code to the staff portal and a student code to the
--    student app.
--
-- Rules are enforced for API callers only (current_user = 'authenticated'), as
-- elsewhere: the SQL editor, migrations and SECURITY DEFINER functions run as
-- the owner and are trusted. The two trigger functions that make that check
-- become SECURITY INVOKER here; as SECURITY DEFINER, current_user inside them
-- would always be the owner.

-- ---------------------------------------------------------------------------
-- 1. The head admin flag
-- ---------------------------------------------------------------------------

ALTER TABLE "public"."org_memberships"
    ADD COLUMN "is_head" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."org_memberships"
    ADD CONSTRAINT "org_memberships_head_is_active_admin"
    CHECK (NOT "is_head" OR ("role" = 'org_admin' AND "status" = 'active'));

-- At most one head per school. A school can be without one only when it has no
-- active org admin, and then Tutre's platform admins act for it.
CREATE UNIQUE INDEX "org_memberships_one_head_per_org"
    ON "public"."org_memberships" ("org_id") WHERE "is_head";

-- The longest-serving active org admin of each school becomes its head.
UPDATE "public"."org_memberships" m
SET "is_head" = true
WHERE m."id" IN (
    SELECT DISTINCT ON ("org_id") "id"
    FROM "public"."org_memberships"
    WHERE "role" = 'org_admin' AND "status" = 'active'
    ORDER BY "org_id", "created_at", "id"
);

-- Is the caller this school's head admin (or a Tutre platform admin)?
CREATE FUNCTION "private"."is_org_head"("p_org" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT private.is_platform_admin() OR EXISTS (
        SELECT 1
        FROM public.org_memberships m
        JOIN public.organizations o ON o.id = m.org_id
        WHERE m.org_id = p_org
          AND m.user_id = (SELECT auth.uid())
          AND m.is_head
          AND m.status = 'active'
          AND o.status = 'active'
    );
$$;

REVOKE ALL ON FUNCTION "private"."is_org_head"("uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "private"."is_org_head"("uuid") TO "authenticated", "service_role";

-- Keeps "one head per school with an active admin":
--  * a removed membership stops being head;
--  * an org admin who joins (or is restored to) a school without a head becomes
--    its head, so the principal who redeems the first org-admin code of a new
--    school is its head.
CREATE FUNCTION "private"."maintain_head_admin"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF NEW.status <> 'active' THEN
        NEW.is_head := false;
        RETURN NEW;
    END IF;

    IF NEW.role = 'org_admin' AND NOT NEW.is_head
       AND (TG_OP = 'INSERT' OR OLD.status <> 'active') THEN
        -- Two admins joining a headless school at the same moment must not both
        -- become head.
        PERFORM pg_advisory_xact_lock(hashtextextended('tutre.org_head:' || NEW.org_id::text, 0));
        IF NOT EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE org_id = NEW.org_id AND is_head AND id <> NEW.id
        ) THEN
            NEW.is_head := true;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "org_memberships_head_admin"
    BEFORE INSERT OR UPDATE ON "public"."org_memberships"
    FOR EACH ROW EXECUTE FUNCTION "private"."maintain_head_admin"();

-- When a head is removed (only Tutre can do that), the longest-serving
-- remaining org admin takes over, so the school is not left without a head.
CREATE FUNCTION "private"."promote_next_head_admin"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF OLD.is_head AND NOT NEW.is_head AND NEW.status <> 'active' THEN
        UPDATE public.org_memberships SET is_head = true
        WHERE id = (
            SELECT id FROM public.org_memberships
            WHERE org_id = NEW.org_id AND role = 'org_admin' AND status = 'active'
            ORDER BY created_at, id
            LIMIT 1
        );
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER "org_memberships_promote_next_head"
    AFTER UPDATE OF "status" ON "public"."org_memberships"
    FOR EACH ROW EXECUTE FUNCTION "private"."promote_next_head_admin"();

-- ---------------------------------------------------------------------------
-- 2. Who may remove an org admin
-- ---------------------------------------------------------------------------

-- Replaces "only platform admins can remove an org admin" (Phase 2d):
--  * Tutre platform admins may remove any org admin, the head included;
--  * the head admin may remove other org admins;
--  * nobody else may, and the head cannot remove themselves: they hand the
--    head role to another admin first.
-- Restoring (removed -> active) is still open to every org admin.
CREATE OR REPLACE FUNCTION "private"."restrict_org_admin_removal"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY INVOKER
SET "search_path" = ''
AS $$
BEGIN
    IF current_user <> 'authenticated' OR private.is_platform_admin() THEN
        RETURN NEW;
    END IF;
    IF OLD.role = 'org_admin' AND OLD.status = 'active' AND NEW.status <> 'active' THEN
        IF OLD.is_head THEN
            RAISE EXCEPTION 'The head admin cannot be removed. Make another admin the head first.'
                USING ERRCODE = '42501';
        END IF;
        IF NOT private.is_org_head(OLD.org_id) THEN
            RAISE EXCEPTION 'Only the school''s head admin or Tutre can remove an org admin.'
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- The name says what the trigger now does. It must still sort before
-- "org_memberships_protect_last_admin" (BEFORE triggers fire by name), so the
-- caller is told the real reason first.
ALTER TRIGGER "org_memberships_admin_removal_platform_only" ON "public"."org_memberships"
    RENAME TO "org_memberships_admin_removal_rules";

-- Tutre is an admin of every school, so a school may be left without an org
-- admin of its own when a platform admin removes the last one. For everyone
-- else the rule stands (in practice the head rules above already stop them).
CREATE OR REPLACE FUNCTION "private"."protect_last_org_admin"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY INVOKER
SET "search_path" = ''
AS $$
BEGIN
    IF current_user <> 'authenticated' OR private.is_platform_admin() THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    IF OLD.role = 'org_admin' AND OLD.status = 'active'
       AND (TG_OP = 'DELETE' OR NEW.status <> 'active')
       AND NOT EXISTS (
           SELECT 1 FROM public.org_memberships
           WHERE org_id = OLD.org_id AND role = 'org_admin' AND status = 'active' AND id <> OLD.id
       )
       AND EXISTS (SELECT 1 FROM public.organizations WHERE id = OLD.org_id)
    THEN
        RAISE EXCEPTION 'A school must keep at least one org admin.' USING ERRCODE = '23514';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Appointing admins and handing over the head role
-- ---------------------------------------------------------------------------

-- Makes an active teacher of the school an org admin as well (they keep their
-- teacher role). Any org admin of the school, or a platform admin, may do it.
CREATE FUNCTION "public"."make_org_admin"("p_org" "uuid", "p_user" "uuid") RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_row public.org_memberships;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;
    IF NOT (private.is_platform_admin() OR private.has_org_role(p_org, ARRAY['org_admin'])) THEN
        RAISE EXCEPTION 'You cannot appoint admins in this school.' USING ERRCODE = '42501';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.org_memberships
        WHERE org_id = p_org AND user_id = p_user AND role = 'teacher' AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Only an active teacher of this school can be made an admin.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.org_memberships (org_id, user_id, role)
    VALUES (p_org, p_user, 'org_admin')
    ON CONFLICT (org_id, user_id, role) DO UPDATE SET status = 'active'
    RETURNING * INTO v_row;

    RETURN jsonb_build_object('id', v_row.id, 'is_head', v_row.is_head);
END;
$$;

-- Hands the head role to another active org admin of the school. The current
-- head or a platform admin may do it.
CREATE FUNCTION "public"."transfer_head_admin"("p_org" "uuid", "p_user" "uuid") RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_target uuid;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;
    IF NOT private.is_org_head(p_org) THEN
        RAISE EXCEPTION 'Only the school''s head admin or Tutre can hand over the head role.' USING ERRCODE = '42501';
    END IF;

    SELECT id INTO v_target FROM public.org_memberships
    WHERE org_id = p_org AND user_id = p_user AND role = 'org_admin' AND status = 'active';
    IF v_target IS NULL THEN
        RAISE EXCEPTION 'Only an active admin of this school can become its head.' USING ERRCODE = '22023';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended('tutre.org_head:' || p_org::text, 0));
    UPDATE public.org_memberships SET is_head = false WHERE org_id = p_org AND is_head AND id <> v_target;
    UPDATE public.org_memberships SET is_head = true WHERE id = v_target AND NOT is_head;
END;
$$;

REVOKE ALL ON FUNCTION "public"."make_org_admin"("uuid", "uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."transfer_head_admin"("uuid", "uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."make_org_admin"("uuid", "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."transfer_head_admin"("uuid", "uuid") TO "authenticated";

-- ---------------------------------------------------------------------------
-- 4. The signed-in user's context, in one call
-- ---------------------------------------------------------------------------

-- Returns only the caller's own rows. Memberships of suspended schools are
-- included (with org_status) so the apps can say why access is missing.
CREATE FUNCTION "public"."get_my_context"() RETURNS "jsonb"
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT jsonb_build_object(
        'user_id', u.uid,
        'studio_role', (SELECT a.studio_role FROM public.admin_users a WHERE a.id = u.uid),
        'memberships', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                       'org_id', o.id, 'org_name', o.name, 'org_slug', o.slug, 'org_status', o.status,
                       'role', m.role, 'is_head', m.is_head)
                   ORDER BY o.name, m.role)
            FROM public.org_memberships m
            JOIN public.organizations o ON o.id = m.org_id
            WHERE m.user_id = u.uid AND m.status = 'active'
        ), '[]'::jsonb),
        'sections', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                       'section_id', s.id, 'org_id', s.org_id, 'name', s.name, 'role', sm.role,
                       'class_id', s.class_id, 'academic_year', s.academic_year)
                   ORDER BY s.name)
            FROM public.section_members sm
            JOIN public.sections s ON s.id = sm.section_id
            JOIN public.organizations o ON o.id = s.org_id
            WHERE sm.user_id = u.uid AND NOT s.archived AND o.status = 'active'
        ), '[]'::jsonb)
    )
    FROM (SELECT (SELECT auth.uid()) AS uid) u
    WHERE u.uid IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION "public"."get_my_context"() FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."get_my_context"() TO "authenticated";

-- ---------------------------------------------------------------------------
-- 5. What a code is for, before it is used
-- ---------------------------------------------------------------------------

-- Like redeem_invite_code, every unusable code gives the same answer
-- ({"valid": false}), so this does not reveal which codes exist. A valid code
-- shows its school, role and section; that is what redeeming it would show.
CREATE FUNCTION "public"."peek_invite_code"("p_code" "text") RETURNS "jsonb"
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
       OR v_code.uses >= v_code.max_uses OR v_org.status <> 'active' THEN
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

REVOKE ALL ON FUNCTION "public"."peek_invite_code"("text") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."peek_invite_code"("text") TO "authenticated";

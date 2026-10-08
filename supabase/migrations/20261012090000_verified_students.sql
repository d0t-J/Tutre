-- Phase 5g: verified students without email (approved 2026-10-08).
--
-- There is no email delivery yet, so an email address proves nothing. A
-- student's place in a class is verified by the school instead:
--
-- 1. Verified schools. Tutre marks a school verified (optionally with its
--    government EMIS code). Students can ask to join only a verified school
--    that has a head admin. Schools that existed before this migration count
--    as verified, so nothing that works today stops working.
-- 2. Class lists. A teacher (or school admin) lists the section's students by
--    name and roll number. Each entry can get a personal one-time slip code to
--    print and hand out.
-- 3. Join requests. A student code (class code, slip, or one-off) no longer
--    joins anyone: request_to_join records the student's name and roll number
--    as a request, matched to the class list where possible, and the section's
--    teachers or the school's admins approve or reject it. redeem_invite_code
--    refuses student codes, so the approval cannot be skipped. Staff codes are
--    unchanged (instant).
-- 4. Password reset without email. A teacher (for their students), a school
--    admin (for the school's teachers and students) or Tutre creates a one-time
--    code; only a fingerprint (SHA-256) is stored. The reset-password-with-code
--    Edge Function checks it with the service role and sets the new password.

-- ---------------------------------------------------------------------------
-- 1. Verified schools
-- ---------------------------------------------------------------------------

ALTER TABLE "public"."organizations"
    ADD COLUMN "verified_at" timestamp with time zone,
    ADD COLUMN "verified_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    ADD COLUMN "emis_code" "text" CHECK ("emis_code" IS NULL OR "emis_code" ~ '^[A-Za-z0-9-]{3,20}$');

CREATE UNIQUE INDEX "organizations_emis_code_key" ON "public"."organizations" (upper("emis_code"))
    WHERE "emis_code" IS NOT NULL;
CREATE INDEX "organizations_verified_by_idx" ON "public"."organizations" ("verified_by");

-- Existing schools keep working.
UPDATE "public"."organizations" SET "verified_at" = now() WHERE "verified_at" IS NULL;

-- Open to students: active, verified by Tutre, and with a head admin.
CREATE FUNCTION "private"."school_open_to_students"("p_org" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE o.id = p_org AND o.status = 'active' AND o.verified_at IS NOT NULL
          AND EXISTS (
              SELECT 1 FROM public.org_memberships m
              WHERE m.org_id = o.id AND m.is_head AND m.status = 'active'
          )
    );
$$;

-- May the caller manage this section's students: its teachers, the school's
-- admins, Tutre platform admins?
CREATE FUNCTION "private"."can_manage_section"("p_section" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT private.is_platform_admin()
        OR private.has_org_role(private.section_org(p_section), ARRAY['org_admin'])
        OR private.is_section_member(p_section, ARRAY['teacher']);
$$;

REVOKE ALL ON FUNCTION "private"."school_open_to_students"("uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "private"."can_manage_section"("uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "private"."school_open_to_students"("uuid") TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "private"."can_manage_section"("uuid") TO "authenticated", "service_role";

-- Tutre verifies a school (or takes the mark away), with its EMIS code if known.
CREATE FUNCTION "public"."set_school_verification"("p_org" "uuid", "p_verified" boolean, "p_emis_code" "text" DEFAULT NULL)
RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF NOT private.is_platform_admin() THEN
        RAISE EXCEPTION 'Only Tutre platform admins can verify schools.' USING ERRCODE = '42501';
    END IF;
    UPDATE public.organizations SET
        verified_at = CASE WHEN p_verified THEN coalesce(verified_at, now()) END,
        verified_by = CASE WHEN p_verified THEN coalesce(verified_by, (SELECT auth.uid())) END,
        emis_code = nullif(btrim(coalesce(p_emis_code, '')), '')
    WHERE id = p_org;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No such school.' USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION "public"."set_school_verification"("uuid", boolean, "text") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."set_school_verification"("uuid", boolean, "text") TO "authenticated";

-- ---------------------------------------------------------------------------
-- 2. Class lists and slip codes
-- ---------------------------------------------------------------------------

CREATE TABLE "public"."class_list_entries" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "section_id" "uuid" NOT NULL REFERENCES "public"."sections"("id") ON DELETE CASCADE,
    "full_name" "text" NOT NULL CHECK ("char_length"("btrim"("full_name")) BETWEEN 2 AND 120),
    "roll_number" "text" NOT NULL CHECK ("char_length"("btrim"("roll_number")) BETWEEN 1 AND 30),
    -- The student account that joined for this entry, set on approval.
    "student_id" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"()
);
CREATE UNIQUE INDEX "class_list_entries_roll_key" ON "public"."class_list_entries" ("section_id", lower(btrim("roll_number")));
CREATE INDEX "class_list_entries_student_id_idx" ON "public"."class_list_entries" ("student_id");
CREATE INDEX "class_list_entries_created_by_idx" ON "public"."class_list_entries" ("created_by");

ALTER TABLE "public"."class_list_entries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Section managers read the class list" ON "public"."class_list_entries"
    FOR SELECT TO "authenticated" USING ("private"."can_manage_section"("section_id"));
CREATE POLICY "Section managers add to the class list" ON "public"."class_list_entries"
    FOR INSERT TO "authenticated" WITH CHECK ("private"."can_manage_section"("section_id"));
CREATE POLICY "Section managers edit the class list" ON "public"."class_list_entries"
    FOR UPDATE TO "authenticated" USING ("private"."can_manage_section"("section_id"))
    WITH CHECK ("private"."can_manage_section"("section_id"));
CREATE POLICY "Section managers remove from the class list" ON "public"."class_list_entries"
    FOR DELETE TO "authenticated" USING ("private"."can_manage_section"("section_id"));

REVOKE ALL ON TABLE "public"."class_list_entries" FROM "anon";
REVOKE INSERT, UPDATE, TRUNCATE ON TABLE "public"."class_list_entries" FROM "authenticated";
GRANT INSERT ("section_id", "full_name", "roll_number") ON TABLE "public"."class_list_entries" TO "authenticated";
GRANT UPDATE ("full_name", "roll_number") ON TABLE "public"."class_list_entries" TO "authenticated";

-- A slip code: a one-time student code for one class list entry.
ALTER TABLE "public"."invite_codes"
    ADD COLUMN "class_list_entry_id" "uuid" REFERENCES "public"."class_list_entries"("id") ON DELETE CASCADE;
ALTER TABLE "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_slip_is_one_student" CHECK (
        "class_list_entry_id" IS NULL
        OR ("role" = 'student' AND "section_id" IS NOT NULL AND "max_uses" = 1 AND NOT "is_class_code"));
CREATE UNIQUE INDEX "invite_codes_one_slip_per_entry" ON "public"."invite_codes" ("class_list_entry_id")
    WHERE "class_list_entry_id" IS NOT NULL AND NOT "revoked";

-- Returns the entry's slip, creating it if there is none or the old one has
-- expired or been used; p_replace makes a new one and revokes the old.
CREATE FUNCTION "public"."slip_code"("p_entry" "uuid", "p_replace" boolean DEFAULT false) RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_entry public.class_list_entries;
    v_section public.sections;
    v_code public.invite_codes;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;
    SELECT * INTO v_entry FROM public.class_list_entries WHERE id = p_entry;
    IF v_entry.id IS NULL OR NOT private.can_manage_section(v_entry.section_id) THEN
        RAISE EXCEPTION 'No such class list entry.' USING ERRCODE = 'P0002';
    END IF;
    IF v_entry.student_id IS NOT NULL THEN
        RAISE EXCEPTION 'This student has already joined.' USING ERRCODE = '22023';
    END IF;
    SELECT * INTO v_section FROM public.sections WHERE id = v_entry.section_id;
    IF v_section.archived THEN
        RAISE EXCEPTION 'This section is archived. Unarchive it to hand out codes.' USING ERRCODE = '22023';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended('tutre.slip:' || p_entry::text, 0));
    SELECT * INTO v_code FROM public.invite_codes WHERE class_list_entry_id = p_entry AND NOT revoked;
    IF v_code.id IS NOT NULL AND NOT p_replace AND v_code.expires_at > now() AND v_code.uses < v_code.max_uses THEN
        RETURN jsonb_build_object('code', v_code.code, 'expires_at', v_code.expires_at);
    END IF;
    IF v_code.id IS NOT NULL THEN
        UPDATE public.invite_codes SET revoked = true WHERE id = v_code.id;
    END IF;

    v_code := private.insert_invite_code(v_section.org_id, 'student', v_section.id, 1, 90);
    UPDATE public.invite_codes SET class_list_entry_id = p_entry WHERE id = v_code.id RETURNING * INTO v_code;
    RETURN jsonb_build_object('code', v_code.code, 'expires_at', v_code.expires_at);
END;
$$;

REVOKE ALL ON FUNCTION "public"."slip_code"("uuid", boolean) FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."slip_code"("uuid", boolean) TO "authenticated";

-- ---------------------------------------------------------------------------
-- 3. Join requests
-- ---------------------------------------------------------------------------

CREATE TABLE "public"."join_requests" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "org_id" "uuid" NOT NULL REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    "section_id" "uuid" REFERENCES "public"."sections"("id") ON DELETE CASCADE,
    "code_id" "uuid" REFERENCES "public"."invite_codes"("id") ON DELETE SET NULL,
    -- The class list entry this request matches: the slip's entry, or the one
    -- with the same roll number. A suggestion for the teacher, not a decision.
    "class_list_entry_id" "uuid" REFERENCES "public"."class_list_entries"("id") ON DELETE SET NULL,
    "from_slip" boolean NOT NULL DEFAULT false,
    "full_name" "text" NOT NULL CHECK ("char_length"("btrim"("full_name")) BETWEEN 2 AND 120),
    "roll_number" "text" NOT NULL CHECK ("char_length"("btrim"("roll_number")) BETWEEN 1 AND 30),
    "status" "text" NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected', 'cancelled')),
    "reason" "text" CHECK ("reason" IS NULL OR "char_length"("reason") <= 300),
    "decided_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "decided_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"()
);
-- One open request per student and section (or school, for a school-only code).
CREATE UNIQUE INDEX "join_requests_one_pending" ON "public"."join_requests"
    ("user_id", "org_id", COALESCE("section_id", '00000000-0000-0000-0000-000000000000'::"uuid"))
    WHERE "status" = 'pending';
CREATE INDEX "join_requests_section_status_idx" ON "public"."join_requests" ("section_id", "status");
CREATE INDEX "join_requests_org_status_idx" ON "public"."join_requests" ("org_id", "status");
CREATE INDEX "join_requests_user_created_idx" ON "public"."join_requests" ("user_id", "created_at" DESC);
CREATE INDEX "join_requests_code_id_idx" ON "public"."join_requests" ("code_id");
CREATE INDEX "join_requests_class_list_entry_id_idx" ON "public"."join_requests" ("class_list_entry_id");
CREATE INDEX "join_requests_decided_by_idx" ON "public"."join_requests" ("decided_by");

ALTER TABLE "public"."join_requests" ENABLE ROW LEVEL SECURITY;

-- Who decides a request: the section's teachers, the school's admins, Tutre.
CREATE FUNCTION "private"."can_decide_join_request"("p_org" "uuid", "p_section" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT private.is_platform_admin()
        OR private.has_org_role(p_org, ARRAY['org_admin'])
        OR (p_section IS NOT NULL AND private.is_section_member(p_section, ARRAY['teacher']));
$$;
REVOKE ALL ON FUNCTION "private"."can_decide_join_request"("uuid", "uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "private"."can_decide_join_request"("uuid", "uuid") TO "authenticated", "service_role";

CREATE POLICY "Students read their own requests" ON "public"."join_requests"
    FOR SELECT TO "authenticated" USING ("user_id" = (SELECT "auth"."uid"()));
CREATE POLICY "Teachers and school admins read requests to decide" ON "public"."join_requests"
    FOR SELECT TO "authenticated" USING ("private"."can_decide_join_request"("org_id", "section_id"));

-- Written only by the functions below.
REVOKE ALL ON TABLE "public"."join_requests" FROM "anon";
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "public"."join_requests" FROM "authenticated";

-- A student asks to join with a student code (class code, slip, one-off code).
CREATE FUNCTION "public"."request_to_join"("p_code" "text", "p_full_name" "text", "p_roll_number" "text") RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_uid uuid := (SELECT auth.uid());
    v_norm text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
    v_name text := btrim(coalesce(p_full_name, ''));
    v_roll text := btrim(coalesce(p_roll_number, ''));
    v_code public.invite_codes;
    v_org public.organizations;
    v_section public.sections;
    v_entry uuid;
    v_request public.join_requests;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_code FROM public.invite_codes WHERE code = v_norm FOR UPDATE;
    SELECT * INTO v_org FROM public.organizations WHERE id = v_code.org_id;
    SELECT * INTO v_section FROM public.sections WHERE id = v_code.section_id;
    IF v_code.id IS NULL OR v_code.revoked OR v_code.expires_at <= now()
       OR v_code.uses >= v_code.max_uses OR v_org.status <> 'active' OR coalesce(v_section.archived, false) THEN
        RAISE EXCEPTION 'This code is not valid. Ask your school for a new one.' USING ERRCODE = 'P0001';
    END IF;
    IF v_code.role <> 'student' THEN
        RAISE EXCEPTION 'This is a staff code. Teachers and school admins join in the staff portal.' USING ERRCODE = '22023';
    END IF;
    IF NOT private.school_open_to_students(v_org.id) THEN
        RAISE EXCEPTION 'This school is not open to students on Tutre yet.' USING ERRCODE = '22023';
    END IF;
    IF char_length(v_name) NOT BETWEEN 2 AND 120 THEN
        RAISE EXCEPTION 'Write your full name as your school has it.' USING ERRCODE = '22023';
    END IF;
    IF char_length(v_roll) NOT BETWEEN 1 AND 30 THEN
        RAISE EXCEPTION 'Write your roll number.' USING ERRCODE = '22023';
    END IF;

    -- Already in: nothing to ask, and the code is not used up.
    IF (v_section.id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.section_members
            WHERE section_id = v_section.id AND user_id = v_uid AND role = 'student'))
       OR (v_section.id IS NULL AND EXISTS (
            SELECT 1 FROM public.org_memberships
            WHERE org_id = v_org.id AND user_id = v_uid AND role = 'student' AND status = 'active')) THEN
        RETURN jsonb_build_object('status', 'already_member', 'org_name', v_org.name, 'section_name', v_section.name);
    END IF;

    SELECT * INTO v_request FROM public.join_requests
    WHERE user_id = v_uid AND org_id = v_org.id AND status = 'pending'
      AND section_id IS NOT DISTINCT FROM v_section.id;
    IF v_request.id IS NOT NULL THEN
        RETURN jsonb_build_object('status', 'pending', 'request_id', v_request.id,
                                  'org_name', v_org.name, 'section_name', v_section.name);
    END IF;

    -- A student cannot flood teachers with requests.
    IF (SELECT count(*) FROM public.join_requests
        WHERE user_id = v_uid AND created_at > now() - interval '24 hours') >= 10 THEN
        RAISE EXCEPTION 'Too many join requests today. Try again tomorrow.' USING ERRCODE = '54000';
    END IF;

    -- Match the class list: the slip's own entry, or an unclaimed entry with
    -- the same roll number in the section.
    IF v_code.class_list_entry_id IS NOT NULL THEN
        v_entry := v_code.class_list_entry_id;
    ELSIF v_section.id IS NOT NULL THEN
        SELECT id INTO v_entry FROM public.class_list_entries
        WHERE section_id = v_section.id AND student_id IS NULL AND lower(btrim(roll_number)) = lower(v_roll);
    END IF;

    INSERT INTO public.join_requests (user_id, org_id, section_id, code_id, class_list_entry_id, from_slip, full_name, roll_number)
    VALUES (v_uid, v_org.id, v_section.id, v_code.id, v_entry, v_code.class_list_entry_id IS NOT NULL, v_name, v_roll)
    RETURNING * INTO v_request;
    UPDATE public.invite_codes SET uses = uses + 1 WHERE id = v_code.id;

    RETURN jsonb_build_object('status', 'pending', 'request_id', v_request.id, 'matched', v_entry IS NOT NULL,
                              'org_name', v_org.name, 'section_name', v_section.name);
END;
$$;

-- The caller's own requests, with the school and section names (a student who
-- is not a member yet cannot read those tables).
CREATE FUNCTION "public"."my_join_requests"()
RETURNS TABLE ("id" "uuid", "status" "text", "org_name" "text", "section_name" "text", "full_name" "text",
               "roll_number" "text", "reason" "text", "created_at" timestamp with time zone, "decided_at" timestamp with time zone)
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT r.id, r.status, o.name, s.name, r.full_name, r.roll_number, r.reason, r.created_at, r.decided_at
    FROM public.join_requests r
    JOIN public.organizations o ON o.id = r.org_id
    LEFT JOIN public.sections s ON s.id = r.section_id
    WHERE r.user_id = (SELECT auth.uid())
    ORDER BY r.created_at DESC
    LIMIT 20;
$$;

-- Adds the student to the school and section. Callers check permission.
CREATE FUNCTION "private"."approve_join_request"("p_request" "uuid") RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_request public.join_requests;
BEGIN
    SELECT * INTO v_request FROM public.join_requests WHERE id = p_request FOR UPDATE;
    IF v_request.id IS NULL OR v_request.status <> 'pending' THEN
        RETURN jsonb_build_object('approved', false);
    END IF;

    INSERT INTO public.org_memberships (org_id, user_id, role)
    VALUES (v_request.org_id, v_request.user_id, 'student')
    ON CONFLICT (org_id, user_id, role) DO UPDATE SET status = 'active'
        WHERE public.org_memberships.status <> 'active';
    IF v_request.section_id IS NOT NULL THEN
        INSERT INTO public.section_members (section_id, user_id, role)
        VALUES (v_request.section_id, v_request.user_id, 'student')
        ON CONFLICT DO NOTHING;
    END IF;
    IF v_request.class_list_entry_id IS NOT NULL THEN
        UPDATE public.class_list_entries SET student_id = v_request.user_id
        WHERE id = v_request.class_list_entry_id AND student_id IS NULL;
    END IF;
    UPDATE public.join_requests
    SET status = 'approved', decided_by = (SELECT auth.uid()), decided_at = now()
    WHERE id = v_request.id;

    RETURN jsonb_build_object(
        'approved', true,
        'org_id', v_request.org_id,
        'org_name', (SELECT name FROM public.organizations WHERE id = v_request.org_id),
        'section_id', v_request.section_id,
        'section_name', (SELECT name FROM public.sections WHERE id = v_request.section_id));
END;
$$;
REVOKE ALL ON FUNCTION "private"."approve_join_request"("uuid") FROM PUBLIC, "anon", "authenticated";

-- Approve or reject several requests at once. Returns how many were decided;
-- requests already decided are skipped.
CREATE FUNCTION "public"."decide_join_requests"("p_requests" "uuid"[], "p_approve" boolean, "p_reason" "text" DEFAULT NULL)
RETURNS integer
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_request public.join_requests;
    v_count integer := 0;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;
    IF p_reason IS NOT NULL AND char_length(p_reason) > 300 THEN
        RAISE EXCEPTION 'Keep the reason under 300 characters.' USING ERRCODE = '22023';
    END IF;
    FOR v_request IN
        SELECT * FROM public.join_requests WHERE id = ANY (coalesce(p_requests, '{}')) ORDER BY created_at FOR UPDATE
    LOOP
        IF NOT private.can_decide_join_request(v_request.org_id, v_request.section_id) THEN
            RAISE EXCEPTION 'You cannot decide this request.' USING ERRCODE = '42501';
        END IF;
        CONTINUE WHEN v_request.status <> 'pending';
        IF p_approve THEN
            PERFORM private.approve_join_request(v_request.id);
        ELSE
            UPDATE public.join_requests
            SET status = 'rejected', reason = nullif(btrim(coalesce(p_reason, '')), ''),
                decided_by = (SELECT auth.uid()), decided_at = now()
            WHERE id = v_request.id;
        END IF;
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END;
$$;

CREATE FUNCTION "public"."cancel_join_request"("p_request" "uuid") RETURNS void
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    UPDATE public.join_requests SET status = 'cancelled', decided_at = now()
    WHERE id = p_request AND user_id = (SELECT auth.uid()) AND status = 'pending';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No such open request.' USING ERRCODE = 'P0002';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION "public"."request_to_join"("text", "text", "text") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."my_join_requests"() FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."decide_join_requests"("uuid"[], boolean, "text") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."cancel_join_request"("uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."request_to_join"("text", "text", "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."my_join_requests"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."decide_join_requests"("uuid"[], boolean, "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."cancel_join_request"("uuid") TO "authenticated";

-- redeem_invite_code: unchanged from 20261011090000_audit_fixes.sql except
-- that it refuses student codes.
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

    -- Phase 5g: students do not join directly; they ask (request_to_join) and
    -- the school approves.
    IF v_code.role = 'student' THEN
        RAISE EXCEPTION 'Student codes are used to ask to join (request_to_join).' USING ERRCODE = '22023';
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

-- peek_invite_code: unchanged from 20261011090000_audit_fixes.sql except the
-- extra fields at the end.
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
        )),
        -- Phase 5g: a student code makes a join request, which the school must
        -- be open to (verified, with a head admin); the section's teachers are
        -- named so the student knows who will approve.
        'needs_request', v_code.role = 'student',
        'school_open', private.school_open_to_students(v_code.org_id),
        'teachers', COALESCE((
            SELECT jsonb_agg(p.display_name ORDER BY p.display_name)
            FROM public.section_members sm
            JOIN public.profiles p ON p.id = sm.user_id
            WHERE sm.section_id = v_code.section_id AND sm.role = 'teacher'
        ), '[]'::jsonb),
        'pending_request', EXISTS (
            SELECT 1 FROM public.join_requests r
            WHERE r.user_id = v_uid AND r.org_id = v_code.org_id AND r.status = 'pending'
              AND r.section_id IS NOT DISTINCT FROM v_code.section_id
        ),
        'slip_name', (SELECT e.full_name FROM public.class_list_entries e WHERE e.id = v_code.class_list_entry_id)
    );
END;
$$;

-- get_my_context: unchanged from 20261009090000 except org_verified.
CREATE OR REPLACE FUNCTION "public"."get_my_context"() RETURNS "jsonb"
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT jsonb_build_object(
        'user_id', u.uid,
        'studio_role', (SELECT a.studio_role FROM public.admin_users a WHERE a.id = u.uid),
        'memberships', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                       'org_id', o.id, 'org_name', o.name, 'org_slug', o.slug, 'org_status', o.status,
                       'role', m.role, 'is_head', m.is_head,
                       'org_verified', o.verified_at IS NOT NULL)
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

-- ---------------------------------------------------------------------------
-- 4. Password reset without email
-- ---------------------------------------------------------------------------

CREATE TABLE "public"."password_reset_codes" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    -- SHA-256 of the code; the code itself is shown once and never stored.
    "code_hash" "text" NOT NULL,
    "created_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "attempts" integer NOT NULL DEFAULT 0
);
CREATE INDEX "password_reset_codes_user_idx" ON "public"."password_reset_codes" ("user_id", "created_at" DESC);
CREATE INDEX "password_reset_codes_created_by_idx" ON "public"."password_reset_codes" ("created_by", "created_at" DESC);

-- No policies: nobody reads or writes it through the API; only the functions.
ALTER TABLE "public"."password_reset_codes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."password_reset_codes" FROM "anon", "authenticated";

-- Who may reset whom:
--   Tutre platform admins: anyone except other platform admins;
--   a school's admins: its teachers and students (other admins: the head only);
--   a teacher: the students of their sections.
-- Members of the Tutre content team are reset only by platform admins.
CREATE FUNCTION "private"."can_reset_password"("p_user" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT p_user <> (SELECT auth.uid()) AND (
        (private.is_platform_admin()
         AND NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = p_user AND studio_role = 'platform_admin'))
        OR (NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = p_user) AND (
            EXISTS (
                SELECT 1 FROM public.org_memberships target
                WHERE target.user_id = p_user AND target.status = 'active'
                  AND private.has_org_role(target.org_id, ARRAY['org_admin'])
                  AND (target.role IN ('teacher', 'student') OR private.is_org_head(target.org_id))
                  AND (NOT EXISTS (SELECT 1 FROM public.org_memberships a
                                   WHERE a.org_id = target.org_id AND a.user_id = p_user
                                     AND a.role = 'org_admin' AND a.status = 'active')
                       OR private.is_org_head(target.org_id)))
            OR EXISTS (
                SELECT 1 FROM public.section_members s
                WHERE s.user_id = p_user AND s.role = 'student'
                  AND private.is_section_member(s.section_id, ARRAY['teacher'])
                  AND NOT EXISTS (SELECT 1 FROM public.org_memberships a
                                  WHERE a.user_id = p_user AND a.role IN ('teacher', 'org_admin')
                                    AND a.org_id = private.section_org(s.section_id) AND a.status = 'active'))
        ))
    );
$$;
REVOKE ALL ON FUNCTION "private"."can_reset_password"("uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "private"."can_reset_password"("uuid") TO "authenticated", "service_role";

CREATE FUNCTION "private"."new_password_reset_code"("p_user" "uuid") RETURNS "jsonb"
LANGUAGE "plpgsql" VOLATILE SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    v_bytes bytea := extensions.gen_random_bytes(8);
    v_code text := '';
    v_expires timestamptz := now() + interval '30 minutes';
BEGIN
    IF (SELECT count(*) FROM public.password_reset_codes
        WHERE created_by = (SELECT auth.uid()) AND created_at > now() - interval '24 hours') >= 50 THEN
        RAISE EXCEPTION 'Too many reset codes today.' USING ERRCODE = '54000';
    END IF;
    FOR i IN 0..7 LOOP
        v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 31) + 1, 1);
    END LOOP;
    -- Only the newest code works.
    UPDATE public.password_reset_codes SET expires_at = now()
    WHERE user_id = p_user AND used_at IS NULL AND expires_at > now();
    INSERT INTO public.password_reset_codes (user_id, code_hash, created_by, expires_at)
    VALUES (p_user, encode(extensions.digest(v_code, 'sha256'), 'hex'), (SELECT auth.uid()), v_expires);
    RETURN jsonb_build_object('code', v_code, 'expires_at', v_expires);
END;
$$;
REVOKE ALL ON FUNCTION "private"."new_password_reset_code"("uuid") FROM PUBLIC, "anon", "authenticated";

-- A one-time reset code for someone the caller may reset (see above).
CREATE FUNCTION "public"."create_password_reset_code"("p_user" "uuid") RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
    END IF;
    IF NOT private.can_reset_password(p_user) THEN
        RAISE EXCEPTION 'You cannot reset this person''s password.' USING ERRCODE = '42501';
    END IF;
    RETURN private.new_password_reset_code(p_user);
END;
$$;

-- Tutre support: the same for an account found by its email (private
-- learners have no teacher). Platform admins only.
CREATE FUNCTION "public"."support_password_reset_code"("p_email" "text") RETURNS "jsonb"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_user uuid;
BEGIN
    IF NOT private.is_platform_admin() THEN
        RAISE EXCEPTION 'Only Tutre platform admins can do that.' USING ERRCODE = '42501';
    END IF;
    SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(btrim(coalesce(p_email, '')));
    IF v_user IS NULL OR NOT private.can_reset_password(v_user) THEN
        RAISE EXCEPTION 'No account you can reset has that email.' USING ERRCODE = 'P0002';
    END IF;
    RETURN private.new_password_reset_code(v_user);
END;
$$;

-- Used only by the reset-password-with-code Edge Function (service role):
-- returns the account's id when the code is right, otherwise NULL. Each code
-- allows 5 attempts and lasts 30 minutes; every unusable case looks the same.
CREATE FUNCTION "public"."use_password_reset_code"("p_email" "text", "p_code" "text") RETURNS "uuid"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
DECLARE
    v_norm text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
    v_user uuid;
    v_row public.password_reset_codes;
BEGIN
    SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(btrim(coalesce(p_email, '')));
    IF v_user IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT * INTO v_row FROM public.password_reset_codes
    WHERE user_id = v_user AND used_at IS NULL AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1
    FOR UPDATE;
    IF v_row.id IS NULL OR v_row.attempts >= 5 THEN
        RETURN NULL;
    END IF;
    UPDATE public.password_reset_codes SET attempts = attempts + 1 WHERE id = v_row.id;
    IF v_row.code_hash = encode(extensions.digest(v_norm, 'sha256'), 'hex') THEN
        UPDATE public.password_reset_codes SET used_at = now() WHERE id = v_row.id;
        RETURN v_user;
    END IF;
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION "public"."create_password_reset_code"("uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."support_password_reset_code"("text") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."use_password_reset_code"("text", "text") FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."create_password_reset_code"("uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."support_password_reset_code"("text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."use_password_reset_code"("text", "text") TO "service_role";

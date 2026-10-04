-- Phase 2a: organisations, memberships and sections.
--
--   organizations     a school or school chain
--   org_memberships   user + organisation + role (org_admin, teacher, student, parent);
--                     one person may hold several roles, in several organisations
--   sections          a teaching group such as "Class 9-A"
--   section_members   user + section + role (teacher or student)
--   invite_codes      how people join; created and redeemed only through the
--                     functions in 20261004130300_invite_codes.sql
--
-- Users with no membership are independent learners and keep today's experience.
--
-- Every access rule goes through a SECURITY DEFINER helper in the private schema.
-- Writing the checks inline would make policies on org_memberships query
-- org_memberships, which Postgres rejects as infinite recursion.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE "public"."organizations" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "name" "text" NOT NULL CHECK ("char_length"("btrim"("name")) BETWEEN 2 AND 120),
    "slug" "text" NOT NULL UNIQUE CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND "char_length"("slug") <= 60),
    "status" "text" NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'suspended')),
    "created_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT "now"()
);

CREATE TABLE "public"."org_memberships" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "org_id" "uuid" NOT NULL REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "role" "text" NOT NULL CHECK ("role" IN ('org_admin', 'teacher', 'student', 'parent')),
    "status" "text" NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'removed')),
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    UNIQUE ("org_id", "user_id", "role")
);
CREATE INDEX "org_memberships_user_idx" ON "public"."org_memberships" ("user_id");
CREATE INDEX "org_memberships_org_role_idx" ON "public"."org_memberships" ("org_id", "role");

CREATE TABLE "public"."sections" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "org_id" "uuid" NOT NULL REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    "class_id" "uuid" REFERENCES "public"."classes"("id") ON DELETE SET NULL,
    "name" "text" NOT NULL CHECK ("char_length"("btrim"("name")) BETWEEN 1 AND 60),
    "academic_year" "text" CHECK ("academic_year" IS NULL OR "academic_year" ~ '^[0-9]{4}(-[0-9]{2,4})?$'),
    "archived" boolean NOT NULL DEFAULT false,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT "now"()
);
CREATE INDEX "sections_org_idx" ON "public"."sections" ("org_id");

CREATE TABLE "public"."section_members" (
    "section_id" "uuid" NOT NULL REFERENCES "public"."sections"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "role" "text" NOT NULL CHECK ("role" IN ('teacher', 'student')),
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    PRIMARY KEY ("section_id", "user_id", "role")
);
CREATE INDEX "section_members_user_idx" ON "public"."section_members" ("user_id");

CREATE TABLE "public"."invite_codes" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    -- 10 characters from an alphabet without look-alikes (no 0/O, 1/I/L), stored
    -- without the hyphen the app shows in the middle.
    "code" "text" NOT NULL UNIQUE CHECK ("code" ~ '^[A-HJKMNP-Z2-9]{10}$'),
    "org_id" "uuid" NOT NULL REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    "section_id" "uuid" REFERENCES "public"."sections"("id") ON DELETE CASCADE,
    "role" "text" NOT NULL CHECK ("role" IN ('org_admin', 'teacher', 'student')),
    "max_uses" integer NOT NULL DEFAULT 1 CHECK ("max_uses" BETWEEN 1 AND 1000),
    "uses" integer NOT NULL DEFAULT 0 CHECK ("uses" >= 0),
    "expires_at" timestamp with time zone NOT NULL,
    "revoked" boolean NOT NULL DEFAULT false,
    "created_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    CHECK ("uses" <= "max_uses"),
    CHECK ("section_id" IS NULL OR "role" IN ('teacher', 'student'))
);
CREATE INDEX "invite_codes_org_idx" ON "public"."invite_codes" ("org_id");
CREATE INDEX "invite_codes_section_idx" ON "public"."invite_codes" ("section_id");

CREATE TRIGGER "organizations_set_updated_at" BEFORE UPDATE ON "public"."organizations"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
CREATE TRIGGER "sections_set_updated_at" BEFORE UPDATE ON "public"."sections"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- ---------------------------------------------------------------------------
-- Access-check helpers (not exposed through the API)
-- ---------------------------------------------------------------------------

-- Does the caller hold one of p_roles (any role if NULL) in an active organisation?
CREATE FUNCTION "private"."has_org_role"("p_org" "uuid", "p_roles" "text"[]) RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships m
        JOIN public.organizations o ON o.id = m.org_id
        WHERE m.org_id = p_org
          AND m.user_id = (SELECT auth.uid())
          AND m.status = 'active'
          AND o.status = 'active'
          AND (p_roles IS NULL OR m.role = ANY (p_roles))
    );
$$;

CREATE FUNCTION "private"."section_org"("p_section" "uuid") RETURNS "uuid"
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT org_id FROM public.sections WHERE id = p_section;
$$;

-- Is the caller in this section with one of p_roles (any if NULL)?
CREATE FUNCTION "private"."is_section_member"("p_section" "uuid", "p_roles" "text"[]) RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.section_members sm
        JOIN public.sections s ON s.id = sm.section_id
        JOIN public.organizations o ON o.id = s.org_id
        WHERE sm.section_id = p_section
          AND sm.user_id = (SELECT auth.uid())
          AND o.status = 'active'
          AND (p_roles IS NULL OR sm.role = ANY (p_roles))
    );
$$;

-- Who may read whose profile: yourself; platform admins; an org admin, for
-- active members of their organisation; a teacher, for students in sections
-- they teach.
CREATE FUNCTION "private"."can_view_profile"("p_user" "uuid") RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT p_user = (SELECT auth.uid())
        OR private.is_platform_admin()
        OR EXISTS (
            SELECT 1
            FROM public.org_memberships viewer
            JOIN public.org_memberships target ON target.org_id = viewer.org_id
            JOIN public.organizations o ON o.id = viewer.org_id
            WHERE viewer.user_id = (SELECT auth.uid())
              AND viewer.role = 'org_admin'
              AND viewer.status = 'active'
              AND target.user_id = p_user
              AND target.status = 'active'
              AND o.status = 'active'
        )
        OR EXISTS (
            SELECT 1
            FROM public.section_members teacher
            JOIN public.section_members student ON student.section_id = teacher.section_id
            JOIN public.sections s ON s.id = teacher.section_id
            JOIN public.organizations o ON o.id = s.org_id
            WHERE teacher.user_id = (SELECT auth.uid())
              AND teacher.role = 'teacher'
              AND student.user_id = p_user
              AND student.role = 'student'
              AND o.status = 'active'
        );
$$;

REVOKE ALL ON FUNCTION "private"."has_org_role"("uuid", "text"[]) FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "private"."section_org"("uuid") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "private"."is_section_member"("uuid", "text"[]) FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "private"."can_view_profile"("uuid") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "private"."has_org_role"("uuid", "text"[]) TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "private"."section_org"("uuid") TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "private"."is_section_member"("uuid", "text"[]) TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "private"."can_view_profile"("uuid") TO "authenticated", "service_role";

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

-- A section member must be an active member of the section's organisation with
-- the same role (a section teacher is an org teacher; a section student is an
-- org student).
CREATE FUNCTION "private"."check_section_member_org"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.org_memberships m
        JOIN public.sections s ON s.org_id = m.org_id
        WHERE s.id = NEW.section_id
          AND m.user_id = NEW.user_id
          AND m.role = NEW.role
          AND m.status = 'active'
    ) THEN
        RAISE EXCEPTION 'This person is not an active % of the section''s school.', NEW.role
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "section_members_check_org"
    BEFORE INSERT ON "public"."section_members"
    FOR EACH ROW EXECUTE FUNCTION "private"."check_section_member_org"();

-- An organisation must always keep at least one active org admin.
CREATE FUNCTION "private"."protect_last_org_admin"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF OLD.role = 'org_admin' AND OLD.status = 'active'
       AND (TG_OP = 'DELETE' OR NEW.status <> 'active')
       AND NOT EXISTS (
           SELECT 1 FROM public.org_memberships
           WHERE org_id = OLD.org_id AND role = 'org_admin' AND status = 'active' AND id <> OLD.id
       )
       -- Deleting the whole organisation cascades here; allow that.
       AND EXISTS (SELECT 1 FROM public.organizations WHERE id = OLD.org_id)
    THEN
        RAISE EXCEPTION 'A school must keep at least one org admin.' USING ERRCODE = '23514';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER "org_memberships_protect_last_admin"
    BEFORE UPDATE OR DELETE ON "public"."org_memberships"
    FOR EACH ROW EXECUTE FUNCTION "private"."protect_last_org_admin"();

-- Removing someone's teacher or student role in a school also removes them from
-- that school's sections in that role.
CREATE FUNCTION "private"."cleanup_removed_membership"() RETURNS "trigger"
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    IF OLD.status = 'active' AND NEW.status = 'removed' AND NEW.role IN ('teacher', 'student') THEN
        DELETE FROM public.section_members sm
        USING public.sections s
        WHERE sm.section_id = s.id
          AND s.org_id = NEW.org_id
          AND sm.user_id = NEW.user_id
          AND sm.role = NEW.role;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "org_memberships_cleanup_sections"
    AFTER UPDATE OF "status" ON "public"."org_memberships"
    FOR EACH ROW EXECUTE FUNCTION "private"."cleanup_removed_membership"();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."org_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."section_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invite_codes" ENABLE ROW LEVEL SECURITY;

-- organizations: members read their own school; org admins rename it; status
-- changes and creation go through functions for platform admins.
CREATE POLICY "Members can read their organisation" ON "public"."organizations"
    FOR SELECT TO "authenticated"
    USING ("private"."has_org_role"("id", NULL) OR "private"."is_platform_admin"());

CREATE POLICY "Org admins can rename their organisation" ON "public"."organizations"
    FOR UPDATE TO "authenticated"
    USING ("private"."has_org_role"("id", ARRAY['org_admin']) OR "private"."is_platform_admin"())
    WITH CHECK ("private"."has_org_role"("id", ARRAY['org_admin']) OR "private"."is_platform_admin"());

-- org_memberships: you see your own; org admins see and remove or restore
-- members of their school. Joining happens only through redeem_invite_code.
CREATE POLICY "Users can read their own memberships" ON "public"."org_memberships"
    FOR SELECT TO "authenticated"
    USING (("user_id" = (SELECT "auth"."uid"())));

CREATE POLICY "Org admins can read their organisation's memberships" ON "public"."org_memberships"
    FOR SELECT TO "authenticated"
    USING ("private"."has_org_role"("org_id", ARRAY['org_admin']) OR "private"."is_platform_admin"());

CREATE POLICY "Org admins can change membership status" ON "public"."org_memberships"
    FOR UPDATE TO "authenticated"
    USING ("private"."has_org_role"("org_id", ARRAY['org_admin']) OR "private"."is_platform_admin"())
    WITH CHECK ("private"."has_org_role"("org_id", ARRAY['org_admin']) OR "private"."is_platform_admin"());

-- sections: org admins manage their school's sections; members see the
-- sections they belong to.
CREATE POLICY "Members can read their sections" ON "public"."sections"
    FOR SELECT TO "authenticated"
    USING ("private"."has_org_role"("org_id", ARRAY['org_admin'])
        OR "private"."is_section_member"("id", NULL)
        OR "private"."is_platform_admin"());

CREATE POLICY "Org admins can create sections" ON "public"."sections"
    FOR INSERT TO "authenticated"
    WITH CHECK ("private"."has_org_role"("org_id", ARRAY['org_admin']) OR "private"."is_platform_admin"());

CREATE POLICY "Org admins can update sections" ON "public"."sections"
    FOR UPDATE TO "authenticated"
    USING ("private"."has_org_role"("org_id", ARRAY['org_admin']) OR "private"."is_platform_admin"())
    WITH CHECK ("private"."has_org_role"("org_id", ARRAY['org_admin']) OR "private"."is_platform_admin"());

CREATE POLICY "Org admins can delete sections" ON "public"."sections"
    FOR DELETE TO "authenticated"
    USING ("private"."has_org_role"("org_id", ARRAY['org_admin']) OR "private"."is_platform_admin"());

-- section_members: you see your own rows; a section's teachers see its members;
-- org admins assign and remove; teachers may remove students from their sections.
CREATE POLICY "Users can read their own section memberships" ON "public"."section_members"
    FOR SELECT TO "authenticated"
    USING (("user_id" = (SELECT "auth"."uid"())));

CREATE POLICY "Teachers and org admins can read section members" ON "public"."section_members"
    FOR SELECT TO "authenticated"
    USING ("private"."is_section_member"("section_id", ARRAY['teacher'])
        OR "private"."has_org_role"("private"."section_org"("section_id"), ARRAY['org_admin'])
        OR "private"."is_platform_admin"());

CREATE POLICY "Org admins can add section members" ON "public"."section_members"
    FOR INSERT TO "authenticated"
    WITH CHECK ("private"."has_org_role"("private"."section_org"("section_id"), ARRAY['org_admin'])
        OR "private"."is_platform_admin"());

CREATE POLICY "Org admins and section teachers can remove section members" ON "public"."section_members"
    FOR DELETE TO "authenticated"
    USING ("private"."has_org_role"("private"."section_org"("section_id"), ARRAY['org_admin'])
        OR "private"."is_platform_admin"()
        OR ("role" = 'student' AND "private"."is_section_member"("section_id", ARRAY['teacher'])));

-- invite_codes: readable by whoever can hand them out; written only by functions.
CREATE POLICY "Code managers can read invite codes" ON "public"."invite_codes"
    FOR SELECT TO "authenticated"
    USING ("private"."has_org_role"("org_id", ARRAY['org_admin'])
        OR ("section_id" IS NOT NULL AND "private"."is_section_member"("section_id", ARRAY['teacher']))
        OR "created_by" = (SELECT "auth"."uid"())
        OR "private"."is_platform_admin"());

-- profiles: in addition to "Users can read their own profile".
CREATE POLICY "Org admins and teachers can read members' profiles" ON "public"."profiles"
    FOR SELECT TO "authenticated"
    USING ("private"."can_view_profile"("id"));

-- ---------------------------------------------------------------------------
-- Table privileges: nothing for anonymous visitors; only the columns that may
-- change are updatable.
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE "public"."organizations", "public"."org_memberships", "public"."sections",
    "public"."section_members", "public"."invite_codes" FROM "anon";

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "public"."organizations" FROM "authenticated";
GRANT UPDATE ("name") ON TABLE "public"."organizations" TO "authenticated";

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "public"."org_memberships" FROM "authenticated";
GRANT UPDATE ("status") ON TABLE "public"."org_memberships" TO "authenticated";

REVOKE UPDATE, TRUNCATE ON TABLE "public"."sections" FROM "authenticated";
GRANT UPDATE ("name", "class_id", "academic_year", "archived") ON TABLE "public"."sections" TO "authenticated";

REVOKE UPDATE, TRUNCATE ON TABLE "public"."section_members" FROM "authenticated";

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "public"."invite_codes" FROM "authenticated";

-- Phase 2a: one profile per user.
--
-- A row is created automatically when an auth user is created, using the
-- full_name the student panel already sends at sign-up, and existing users are
-- backfilled. Users read and edit only their own profile here; who else may
-- read a profile (teachers, org admins) is added with the organisation tables in
-- 20261004130200_organizations.sql.
--
-- preferred_language is stored now and used by the bilingual interface (Phase 3).

CREATE TABLE "public"."profiles" (
    "id" "uuid" PRIMARY KEY REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "display_name" "text" NOT NULL DEFAULT '' CHECK ("char_length"("display_name") <= 80),
    "preferred_language" "text" NOT NULL DEFAULT 'en' CHECK ("preferred_language" IN ('en', 'ur')),
    "class_id" "uuid" REFERENCES "public"."classes"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT "now"()
);

-- Shared by every table in Phase 2 that has an updated_at column.
CREATE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
LANGUAGE "plpgsql"
SET "search_path" = ''
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "profiles_set_updated_at"
    BEFORE UPDATE ON "public"."profiles"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- Runs as the function owner because the signing-up user has no session yet.
CREATE FUNCTION "public"."handle_new_user_profile"() RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        left(coalesce(nullif(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
                      split_part(coalesce(NEW.email, ''), '@', 1)), 80)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION "public"."handle_new_user_profile"() FROM PUBLIC, "anon", "authenticated";

CREATE TRIGGER "on_auth_user_created_profile"
    AFTER INSERT ON "auth"."users"
    FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user_profile"();

-- Backfill everyone who signed up before this migration.
INSERT INTO "public"."profiles" ("id", "display_name")
SELECT "u"."id",
       left(coalesce(nullif(btrim("u"."raw_user_meta_data" ->> 'full_name'), ''),
                     split_part(coalesce("u"."email", ''), '@', 1)), 80)
FROM "auth"."users" "u"
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile" ON "public"."profiles"
    FOR SELECT TO "authenticated"
    USING (("id" = (SELECT "auth"."uid"())));

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
    FOR UPDATE TO "authenticated"
    USING (("id" = (SELECT "auth"."uid"())))
    WITH CHECK (("id" = (SELECT "auth"."uid"())));

-- No INSERT or DELETE policy: rows come from the trigger and go with the user.
-- Only these three columns can be changed by their owner.
REVOKE ALL ON TABLE "public"."profiles" FROM "anon";
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "public"."profiles" FROM "authenticated";
GRANT UPDATE ("display_name", "preferred_language", "class_id") ON TABLE "public"."profiles" TO "authenticated";

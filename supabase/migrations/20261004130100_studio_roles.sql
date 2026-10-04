-- Phase 2a: Content Studio roles.
--
-- admin_users stays the gate to the admin panel ("Content Studio membership"), so
-- every existing check keeps working: both panels' auth code, the "Enable all
-- access for admins" policies on content tables, and the Edge Function guard.
-- studio_role refines it:
--   author          writes and edits simulations, submits them for review
--   reviewer        also publishes and unpublishes (used from Phase 2b)
--   platform_admin  also creates organisations and manages Studio members
-- The members who existed before this migration are the project owners, so they
-- become platform_admin.
--
-- Access-check helpers live in the "private" schema, which the API does not
-- expose, so they can be used by policies but not called by clients.

ALTER TABLE "public"."admin_users"
    ADD COLUMN "studio_role" "text" NOT NULL DEFAULT 'author'
    CHECK ("studio_role" IN ('author', 'reviewer', 'platform_admin'));

UPDATE "public"."admin_users" SET "studio_role" = 'platform_admin';

CREATE SCHEMA IF NOT EXISTS "private";
REVOKE ALL ON SCHEMA "private" FROM PUBLIC, "anon";
GRANT USAGE ON SCHEMA "private" TO "authenticated", "service_role";

CREATE FUNCTION "private"."is_studio_member"() RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid()));
$$;

CREATE FUNCTION "private"."is_platform_admin"() RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
SET "search_path" = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE id = (SELECT auth.uid()) AND studio_role = 'platform_admin'
    );
$$;

REVOKE ALL ON FUNCTION "private"."is_studio_member"() FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "private"."is_platform_admin"() FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "private"."is_studio_member"() TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "private"."is_platform_admin"() TO "authenticated", "service_role";

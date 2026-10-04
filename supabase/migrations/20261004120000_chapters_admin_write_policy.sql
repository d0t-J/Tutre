-- Close RLS gap 1 (supabase/README.md, "Two known gaps"):
-- "Enable all access for authenticated users" on chapters has no FOR clause and
-- USING (auth.role() = 'authenticated'), so any signed-in user (any student) can
-- insert, update and delete chapters.
--
-- chapters is also the only content table without an "Enable all access for
-- admins" policy: admins have been writing chapters through the over-broad
-- policy. Add the admin policy first, in the same form as the other content
-- tables, then drop the broad one. "Enable read access for all users" (SELECT,
-- USING true) stays, so students and the landing page still read chapters.

CREATE POLICY "Enable all access for admins" ON "public"."chapters"
    USING (("auth"."uid"() IN ( SELECT "admin_users"."id"
   FROM "public"."admin_users")));

DROP POLICY "Enable all access for authenticated users" ON "public"."chapters";

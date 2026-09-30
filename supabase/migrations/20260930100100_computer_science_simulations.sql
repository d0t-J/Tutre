-- Simulation payload table for the Computer Science and Entrepreneurship
-- subject, plus the matching fifth branch in the all_simulations view.
--
-- The table mirrors the four existing per-subject tables exactly: same columns,
-- same defaults, same cascade on topic deletion, same two policies, same grants.
-- Its name matches subjects.slug = 'computer_science' set in the previous
-- migration, which is what the admin panel concatenates with '_simulations'.

CREATE TABLE IF NOT EXISTS "public"."computer_science_simulations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "topic_id" "uuid",
    "code_payload" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE "public"."computer_science_simulations" OWNER TO "postgres";

ALTER TABLE ONLY "public"."computer_science_simulations"
    ADD CONSTRAINT "computer_science_simulations_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."computer_science_simulations"
    ADD CONSTRAINT "computer_science_simulations_topic_id_fkey"
    FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;

ALTER TABLE "public"."computer_science_simulations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for admins" ON "public"."computer_science_simulations" USING (("auth"."uid"() IN ( SELECT "admin_users"."id"
   FROM "public"."admin_users")));

CREATE POLICY "Enable read access for authenticated users" ON "public"."computer_science_simulations" FOR SELECT TO "authenticated" USING (true);

GRANT ALL ON TABLE "public"."computer_science_simulations" TO "anon";
GRANT ALL ON TABLE "public"."computer_science_simulations" TO "authenticated";
GRANT ALL ON TABLE "public"."computer_science_simulations" TO "service_role";

-- Rebuild the view with a fifth branch.
--
-- subject_slug is appended as the LAST column of every branch. CREATE OR REPLACE
-- VIEW may only add columns at the end of the list; a column inserted in the
-- middle is interpreted as renaming whatever already sits in that position, and
-- Postgres rejects it with 42P16.
--
-- security_invoker is restated explicitly. It was turned on in
-- 20260930090000_all_simulations_security_invoker.sql, and omitting it from a
-- CREATE OR REPLACE risks silently reverting the view to owner privileges, which
-- would reopen anonymous read access to every simulation payload.
CREATE OR REPLACE VIEW "public"."all_simulations"
WITH ("security_invoker" = 'on') AS
 SELECT "t"."id" AS "topic_id",
    "t"."name" AS "topic",
    "t"."description",
    "t"."chapter_id",
    "s"."id" AS "subject_id",
    "s"."name" AS "subject",
    "s"."icon_name",
    "c"."id" AS "class_id",
    "c"."name" AS "class_name",
    "ps"."id" AS "sim_id",
    "ps"."code_payload",
    "ps"."created_at",
    "t"."study_guide",
    "s"."slug" AS "subject_slug"
   FROM ((("public"."topics" "t"
     JOIN "public"."subjects" "s" ON (("t"."subject_id" = "s"."id")))
     JOIN "public"."classes" "c" ON (("s"."class_id" = "c"."id")))
     JOIN "public"."physics_simulations" "ps" ON (("ps"."topic_id" = "t"."id")))
UNION ALL
 SELECT "t"."id" AS "topic_id",
    "t"."name" AS "topic",
    "t"."description",
    "t"."chapter_id",
    "s"."id" AS "subject_id",
    "s"."name" AS "subject",
    "s"."icon_name",
    "c"."id" AS "class_id",
    "c"."name" AS "class_name",
    "cs"."id" AS "sim_id",
    "cs"."code_payload",
    "cs"."created_at",
    "t"."study_guide",
    "s"."slug" AS "subject_slug"
   FROM ((("public"."topics" "t"
     JOIN "public"."subjects" "s" ON (("t"."subject_id" = "s"."id")))
     JOIN "public"."classes" "c" ON (("s"."class_id" = "c"."id")))
     JOIN "public"."chemistry_simulations" "cs" ON (("cs"."topic_id" = "t"."id")))
UNION ALL
 SELECT "t"."id" AS "topic_id",
    "t"."name" AS "topic",
    "t"."description",
    "t"."chapter_id",
    "s"."id" AS "subject_id",
    "s"."name" AS "subject",
    "s"."icon_name",
    "c"."id" AS "class_id",
    "c"."name" AS "class_name",
    "bs"."id" AS "sim_id",
    "bs"."code_payload",
    "bs"."created_at",
    "t"."study_guide",
    "s"."slug" AS "subject_slug"
   FROM ((("public"."topics" "t"
     JOIN "public"."subjects" "s" ON (("t"."subject_id" = "s"."id")))
     JOIN "public"."classes" "c" ON (("s"."class_id" = "c"."id")))
     JOIN "public"."biology_simulations" "bs" ON (("bs"."topic_id" = "t"."id")))
UNION ALL
 SELECT "t"."id" AS "topic_id",
    "t"."name" AS "topic",
    "t"."description",
    "t"."chapter_id",
    "s"."id" AS "subject_id",
    "s"."name" AS "subject",
    "s"."icon_name",
    "c"."id" AS "class_id",
    "c"."name" AS "class_name",
    "ms"."id" AS "sim_id",
    "ms"."code_payload",
    "ms"."created_at",
    "t"."study_guide",
    "s"."slug" AS "subject_slug"
   FROM ((("public"."topics" "t"
     JOIN "public"."subjects" "s" ON (("t"."subject_id" = "s"."id")))
     JOIN "public"."classes" "c" ON (("s"."class_id" = "c"."id")))
     JOIN "public"."mathematics_simulations" "ms" ON (("ms"."topic_id" = "t"."id")))
UNION ALL
 SELECT "t"."id" AS "topic_id",
    "t"."name" AS "topic",
    "t"."description",
    "t"."chapter_id",
    "s"."id" AS "subject_id",
    "s"."name" AS "subject",
    "s"."icon_name",
    "c"."id" AS "class_id",
    "c"."name" AS "class_name",
    "css"."id" AS "sim_id",
    "css"."code_payload",
    "css"."created_at",
    "t"."study_guide",
    "s"."slug" AS "subject_slug"
   FROM ((("public"."topics" "t"
     JOIN "public"."subjects" "s" ON (("t"."subject_id" = "s"."id")))
     JOIN "public"."classes" "c" ON (("s"."class_id" = "c"."id")))
     JOIN "public"."computer_science_simulations" "css" ON (("css"."topic_id" = "t"."id")));

ALTER TABLE "public"."all_simulations" OWNER TO "postgres";

GRANT ALL ON TABLE "public"."all_simulations" TO "anon";
GRANT ALL ON TABLE "public"."all_simulations" TO "authenticated";
GRANT ALL ON TABLE "public"."all_simulations" TO "service_role";

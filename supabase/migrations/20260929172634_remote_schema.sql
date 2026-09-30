


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."biology_simulations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "topic_id" "uuid",
    "code_payload" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."biology_simulations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chemistry_simulations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "topic_id" "uuid",
    "code_payload" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."chemistry_simulations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mathematics_simulations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "topic_id" "uuid",
    "code_payload" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."mathematics_simulations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."physics_simulations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "topic_id" "uuid",
    "code_payload" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."physics_simulations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "class_id" "uuid",
    "name" "text" NOT NULL,
    "icon_name" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."topics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "subject_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "chapter_id" "uuid",
    "study_guide" "text"
);


ALTER TABLE "public"."topics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."all_simulations" AS
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
    "t"."study_guide"
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
    "t"."study_guide"
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
    "t"."study_guide"
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
    "t"."study_guide"
   FROM ((("public"."topics" "t"
     JOIN "public"."subjects" "s" ON (("t"."subject_id" = "s"."id")))
     JOIN "public"."classes" "c" ON (("s"."class_id" = "c"."id")))
     JOIN "public"."mathematics_simulations" "ms" ON (("ms"."topic_id" = "t"."id")));


ALTER VIEW "public"."all_simulations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chapters" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "chapter_no" integer DEFAULT 0,
    "description" "text"
);


ALTER TABLE "public"."chapters" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."biology_simulations"
    ADD CONSTRAINT "biology_simulations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_subject_id_chapter_no_key" UNIQUE ("subject_id", "chapter_no");



ALTER TABLE ONLY "public"."chemistry_simulations"
    ADD CONSTRAINT "chemistry_simulations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mathematics_simulations"
    ADD CONSTRAINT "mathematics_simulations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."physics_simulations"
    ADD CONSTRAINT "physics_simulations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "unique_chapter_name_per_subject" UNIQUE ("name", "subject_id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "unique_class_name" UNIQUE ("name");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "unique_subject_name_per_class" UNIQUE ("name", "class_id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."biology_simulations"
    ADD CONSTRAINT "biology_simulations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chemistry_simulations"
    ADD CONSTRAINT "chemistry_simulations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mathematics_simulations"
    ADD CONSTRAINT "mathematics_simulations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."physics_simulations"
    ADD CONSTRAINT "physics_simulations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



CREATE POLICY "Enable all access for admins" ON "public"."biology_simulations" USING (("auth"."uid"() IN ( SELECT "admin_users"."id"
   FROM "public"."admin_users")));



CREATE POLICY "Enable all access for admins" ON "public"."chemistry_simulations" USING (("auth"."uid"() IN ( SELECT "admin_users"."id"
   FROM "public"."admin_users")));



CREATE POLICY "Enable all access for admins" ON "public"."classes" USING (("auth"."uid"() IN ( SELECT "admin_users"."id"
   FROM "public"."admin_users")));



CREATE POLICY "Enable all access for admins" ON "public"."mathematics_simulations" USING (("auth"."uid"() IN ( SELECT "admin_users"."id"
   FROM "public"."admin_users")));



CREATE POLICY "Enable all access for admins" ON "public"."physics_simulations" USING (("auth"."uid"() IN ( SELECT "admin_users"."id"
   FROM "public"."admin_users")));



CREATE POLICY "Enable all access for admins" ON "public"."subjects" USING (("auth"."uid"() IN ( SELECT "admin_users"."id"
   FROM "public"."admin_users")));



CREATE POLICY "Enable all access for admins" ON "public"."topics" USING (("auth"."uid"() IN ( SELECT "admin_users"."id"
   FROM "public"."admin_users")));



CREATE POLICY "Enable all access for authenticated users" ON "public"."chapters" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."chapters" FOR SELECT USING (true);



CREATE POLICY "Enable read access for authenticated admins" ON "public"."admin_users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Enable read access for authenticated users" ON "public"."biology_simulations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."chemistry_simulations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."classes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."mathematics_simulations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."physics_simulations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."subjects" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."topics" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."biology_simulations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chemistry_simulations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mathematics_simulations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."physics_simulations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."topics" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."biology_simulations" TO "anon";
GRANT ALL ON TABLE "public"."biology_simulations" TO "authenticated";
GRANT ALL ON TABLE "public"."biology_simulations" TO "service_role";



GRANT ALL ON TABLE "public"."chemistry_simulations" TO "anon";
GRANT ALL ON TABLE "public"."chemistry_simulations" TO "authenticated";
GRANT ALL ON TABLE "public"."chemistry_simulations" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."mathematics_simulations" TO "anon";
GRANT ALL ON TABLE "public"."mathematics_simulations" TO "authenticated";
GRANT ALL ON TABLE "public"."mathematics_simulations" TO "service_role";



GRANT ALL ON TABLE "public"."physics_simulations" TO "anon";
GRANT ALL ON TABLE "public"."physics_simulations" TO "authenticated";
GRANT ALL ON TABLE "public"."physics_simulations" TO "service_role";



GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";



GRANT ALL ON TABLE "public"."topics" TO "anon";
GRANT ALL ON TABLE "public"."topics" TO "authenticated";
GRANT ALL ON TABLE "public"."topics" TO "service_role";



GRANT ALL ON TABLE "public"."all_simulations" TO "anon";
GRANT ALL ON TABLE "public"."all_simulations" TO "authenticated";
GRANT ALL ON TABLE "public"."all_simulations" TO "service_role";



GRANT ALL ON TABLE "public"."chapters" TO "anon";
GRANT ALL ON TABLE "public"."chapters" TO "authenticated";
GRANT ALL ON TABLE "public"."chapters" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































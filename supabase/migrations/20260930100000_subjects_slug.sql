-- Add a stable, identifier-safe slug to subjects.
--
-- The admin panel derives a simulation table name from the subject name:
--   const tableName = `${subjectName.toLowerCase()}_simulations`;
-- That works only while every subject is a single lowercase word. The existing
-- "Computer Science and Entrepreneurship" subject produces
-- "computer science and entrepreneurship_simulations", which is not a valid
-- identifier, so saving a simulation for it fails.
--
-- This migration is additive and changes no existing behaviour: for the four
-- original subjects the slug is identical to lower(name), so the derived table
-- names stay physics_simulations, chemistry_simulations, biology_simulations and
-- mathematics_simulations. The frontend is switched to read slug separately.

alter table "public"."subjects"
  add column if not exists "slug" "text";

-- Generic backfill: lowercase, every run of non-alphanumeric characters becomes
-- a single underscore, no leading or trailing underscore.
update "public"."subjects"
set "slug" = trim(both '_' from regexp_replace(lower("name"), '[^a-z0-9]+', '_', 'g'))
where "slug" is null;

-- One deliberate override. The generic rule would give
-- "computer_science_and_entrepreneurship", making a 49-character table name that
-- also breaks if the subject is ever renamed to just "Computer Science". A short
-- explicit slug keeps the table name stable and independent of the display name.
update "public"."subjects"
set "slug" = 'computer_science'
where "name" = 'Computer Science and Entrepreneurship';

alter table "public"."subjects"
  alter column "slug" set not null;

-- A slug must be a legal unquoted SQL identifier, because it is concatenated
-- into a table name. This constraint is the guard that stops another
-- "computer science and entrepreneurship_simulations" ever being attempted.
alter table "public"."subjects"
  add constraint "subjects_slug_identifier_check"
  check ("slug" ~ '^[a-z][a-z0-9_]*$');

-- Mirrors the existing unique (name, class_id). The same subject repeats across
-- classes with the same slug, and all four classes share one simulation table,
-- so uniqueness is per class, not global.
alter table "public"."subjects"
  add constraint "subjects_slug_class_key" unique ("slug", "class_id");

-- Fill the slug automatically when a writer does not supply one.
--
-- The admin panel's Curriculum manager inserts subjects as { class_id, name,
-- icon_name } with no slug. Without this trigger that insert would fail the
-- NOT NULL constraint, so the trigger is what keeps subject creation working
-- unchanged. It also guarantees the slug stays a legal identifier no matter who
-- writes the row — the frontend, a migration, or the SQL editor.
CREATE OR REPLACE FUNCTION "public"."subjects_set_slug"() RETURNS "trigger"
LANGUAGE "plpgsql"
SET "search_path" = 'public', 'pg_temp'
AS $$
DECLARE
    v_slug text;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        v_slug := trim(both '_' from regexp_replace(lower(coalesce(NEW.name, '')), '[^a-z0-9]+', '_', 'g'));

        -- An identifier cannot start with a digit, and must not be empty.
        IF v_slug !~ '^[a-z]' THEN
            v_slug := 'subject_' || v_slug;
            v_slug := trim(both '_' from v_slug);
        END IF;

        NEW.slug := v_slug;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."subjects_set_slug"() OWNER TO "postgres";

CREATE TRIGGER "subjects_set_slug_trg"
    BEFORE INSERT OR UPDATE ON "public"."subjects"
    FOR EACH ROW EXECUTE FUNCTION "public"."subjects_set_slug"();

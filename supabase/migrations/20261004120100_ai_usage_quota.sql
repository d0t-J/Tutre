-- Per-user AI usage limits, enforced by the Edge Functions before every model call
-- (supabase/functions/_shared/guard.ts).
--
-- ai_quota_limits  one row per scope; daily_limit NULL means "log, but no limit".
-- ai_usage         one row per counted call: who, which scope and function, when,
--                  and token counts where the model reports them.
--
-- The window is a rolling 24 hours, so a limit never resets at an awkward time
-- for users in a different time zone.
--
-- Neither table is writable by clients. Rows are written only by the two
-- SECURITY DEFINER functions below, which act on auth.uid() and nothing else.
-- To change a limit, update ai_quota_limits in the SQL editor.

CREATE TABLE "public"."ai_quota_limits" (
    "scope" "text" PRIMARY KEY,
    "daily_limit" integer CHECK ("daily_limit" IS NULL OR "daily_limit" >= 0),
    "description" "text" NOT NULL,
    "updated_at" timestamp with time zone NOT NULL DEFAULT "now"()
);

INSERT INTO "public"."ai_quota_limits" ("scope", "daily_limit", "description") VALUES
    ('simulation_generation', 30, 'generate-simulation and generate-simulation-3d calls (new or update) per user per 24 hours'),
    ('tutor_message', 200, 'chat-tutor calls (student tutor chat and admin study-guide drafts) per user per 24 hours'),
    ('authoring_assist', NULL, 'suggest-requirements and extract-html-details calls; logged, not limited');

CREATE TABLE "public"."ai_usage" (
    "id" "uuid" PRIMARY KEY DEFAULT "gen_random_uuid"(),
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "scope" "text" NOT NULL REFERENCES "public"."ai_quota_limits"("scope"),
    "function_name" "text" NOT NULL CHECK ("char_length"("function_name") <= 64),
    "prompt_tokens" integer CHECK ("prompt_tokens" IS NULL OR "prompt_tokens" >= 0),
    "completion_tokens" integer CHECK ("completion_tokens" IS NULL OR "completion_tokens" >= 0),
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"()
);

CREATE INDEX "ai_usage_user_scope_created_idx"
    ON "public"."ai_usage" USING "btree" ("user_id", "scope", "created_at" DESC);

ALTER TABLE "public"."ai_quota_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ai_usage" ENABLE ROW LEVEL SECURITY;

-- Reads only. No INSERT, UPDATE or DELETE policy exists for either table.
CREATE POLICY "Admins can read AI limits" ON "public"."ai_quota_limits"
    FOR SELECT TO "authenticated"
    USING (("auth"."uid"() IN ( SELECT "admin_users"."id" FROM "public"."admin_users")));

CREATE POLICY "Users can read their own AI usage" ON "public"."ai_usage"
    FOR SELECT TO "authenticated"
    USING (("user_id" = "auth"."uid"()));

CREATE POLICY "Admins can read all AI usage" ON "public"."ai_usage"
    FOR SELECT TO "authenticated"
    USING (("auth"."uid"() IN ( SELECT "admin_users"."id" FROM "public"."admin_users")));

-- Counts one use for the calling user, or refuses if the limit is reached.
-- Returns {allowed, used, limit, usage_id} or {allowed: false, used, limit,
-- retry_after_seconds}. An advisory lock per user and scope makes the
-- check-then-insert safe against parallel requests.
CREATE FUNCTION "public"."consume_ai_quota"("p_scope" "text", "p_function" "text")
RETURNS "jsonb"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" = 'public', 'pg_temp'
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_limit  integer;
    v_used   integer;
    v_oldest timestamptz;
    v_id     uuid;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
    END IF;

    SELECT daily_limit INTO v_limit FROM ai_quota_limits WHERE scope = p_scope;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unknown AI quota scope %', p_scope USING ERRCODE = '22023';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_scope, 0));

    SELECT count(*), min(created_at) INTO v_used, v_oldest
    FROM ai_usage
    WHERE user_id = v_uid
      AND scope = p_scope
      AND created_at > now() - interval '24 hours';

    IF v_limit IS NOT NULL AND v_used >= v_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'used', v_used,
            'limit', v_limit,
            'retry_after_seconds',
            GREATEST(1, ceil(extract(epoch FROM (v_oldest + interval '24 hours' - now())))::integer)
        );
    END IF;

    INSERT INTO ai_usage (user_id, scope, function_name)
    VALUES (v_uid, p_scope, left(p_function, 64))
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('allowed', true, 'used', v_used + 1, 'limit', v_limit, 'usage_id', v_id);
END;
$$;

-- Adds token counts to the caller's own usage row, once.
CREATE FUNCTION "public"."record_ai_usage_tokens"("p_usage_id" "uuid", "p_prompt_tokens" integer, "p_completion_tokens" integer)
RETURNS void
LANGUAGE "sql"
SECURITY DEFINER
SET "search_path" = 'public', 'pg_temp'
AS $$
    UPDATE ai_usage
    SET prompt_tokens = p_prompt_tokens,
        completion_tokens = p_completion_tokens
    WHERE id = p_usage_id
      AND user_id = auth.uid()
      AND prompt_tokens IS NULL
      AND completion_tokens IS NULL;
$$;

ALTER FUNCTION "public"."consume_ai_quota"("text", "text") OWNER TO "postgres";
ALTER FUNCTION "public"."record_ai_usage_tokens"("uuid", integer, integer) OWNER TO "postgres";

-- Supabase's default privileges grant EXECUTE to PUBLIC and anon; signed-in
-- users only.
REVOKE ALL ON FUNCTION "public"."consume_ai_quota"("text", "text") FROM PUBLIC, "anon";
REVOKE ALL ON FUNCTION "public"."record_ai_usage_tokens"("uuid", integer, integer) FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."consume_ai_quota"("text", "text") TO "authenticated", "service_role";
GRANT EXECUTE ON FUNCTION "public"."record_ai_usage_tokens"("uuid", integer, integer) TO "authenticated", "service_role";

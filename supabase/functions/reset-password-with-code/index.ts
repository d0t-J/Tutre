import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { json, preflight } from "../_shared/cors.ts";
import { errorResponse, HttpError } from "../_shared/guard.ts";

// Password reset without email (Phase 5g). A teacher, school admin or Tutre
// gives the person a one-time code (create_password_reset_code); the person
// sends their email, the code and a new password here.
//
// The only function that does not call requireUser(): the caller has forgotten
// their password, so there is no session. That is why it is deployed with
// verify_jwt = false (supabase/config.toml). What protects it instead:
//   * codes are 8 characters from 31 (about 8.5 x 10^11), last 30 minutes, work
//     once, allow 5 attempts, and only the newest code for an account works;
//   * the database stores only a SHA-256 fingerprint of each code;
//   * use_password_reset_code() can only be called with the service role, which
//     never leaves the server;
//   * every failure gives the same answer, so it reveals nothing about which
//     emails have accounts or codes.

const INVALID = 'This reset code is not valid. Ask your teacher (or Tutre) for a new one.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight(req);
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Use POST.');

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const code = typeof body?.code === 'string' ? body.code : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!email || email.length > 254 || !code || code.length > 20) throw new HttpError(400, INVALID);
    if (password.length < 8 || password.length > 72) {
      throw new HttpError(400, 'Choose a password of 8 to 72 characters.');
    }

    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) throw new HttpError(500, 'The function is not configured.');
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userId, error } = await admin.rpc('use_password_reset_code', { p_email: email, p_code: code });
    if (error) {
      console.error('use_password_reset_code failed', error);
      throw new HttpError(500, 'Could not check the code. Please try again.');
    }
    if (!userId) throw new HttpError(400, INVALID);

    const { error: updateError } = await admin.auth.admin.updateUserById(userId as string, { password });
    if (updateError) {
      // The code is used up; the person asks for a new one.
      console.error('updateUserById failed', updateError.message);
      throw new HttpError(400, 'That password was not accepted. Choose a longer, less common one and ask for a new code.');
    }

    return json(req, { ok: true });
  } catch (err) {
    return errorResponse(req, err);
  }
});

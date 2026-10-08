// Password reset without email (Phase 5g): the person's teacher (or school
// admin, or Tutre) gives them a one-time code; this sends it with a new
// password to the reset-password-with-code Edge Function. No session is
// needed, so only the public project key is sent.
const projectKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function resetPasswordWithCode({ email, code, password }) {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password-with-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: projectKey },
    body: JSON.stringify({ email, code, password }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Could not reset the password.');
  }
}

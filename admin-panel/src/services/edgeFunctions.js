import { supabase } from './supabase';

const projectKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Edge Functions check who is calling (supabase/functions/_shared/guard.ts), so
// every request must carry the signed-in admin's access token. The publishable
// key identifies the project only; it is not a login.
export async function functionHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  return {
    'Content-Type': 'application/json',
    apikey: projectKey,
    Authorization: `Bearer ${token}`,
  };
}

// Turns a failed response into an Error carrying the function's own message
// (e.g. "Daily limit reached: …"), falling back to `fallback`.
export async function functionError(response, fallback) {
  try {
    const body = await response.json();
    if (body?.error) return new Error(body.error);
  } catch {
    // not JSON
  }
  return new Error(fallback);
}

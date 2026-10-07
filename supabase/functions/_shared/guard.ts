// Access control and AI usage limits for Tutre's Edge Functions.
//
// Every function calls requireUser() before doing any work. The browser's
// publishable key is public, so it cannot prove who is calling: only a signed-in
// user's access token can. Admin-only functions also require a row in
// admin_users (the Tutre content team, "Studio"). Staff functions (Phase 5d)
// also accept teachers and school admins of an active school, who are counted
// against their own, lower limits (see scopeFor). Functions that call a model then call consumeQuota(), which
// enforces the per-user limits in public.ai_quota_limits (see
// supabase/migrations/20261004120100_ai_usage_quota.sql).

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { json } from './cors.ts';

export class HttpError extends Error {
  constructor(public status: number, message: string, public headers: Record<string, string> = {}) {
    super(message);
  }
}

export interface Caller {
  userId: string;
  // A client that acts as the caller, so every query is subject to RLS.
  db: SupabaseClient;
  // A member of the Tutre content team (admin_users), as opposed to a teacher
  // or school admin.
  isStudio: boolean;
}

export type QuotaScope =
  | 'simulation_generation' | 'tutor_message' | 'authoring_assist' | 'translation'
  | 'teacher_simulation_generation' | 'teacher_notes_draft' | 'teacher_authoring_assist';

const SCOPE_LABEL: Record<QuotaScope, string> = {
  simulation_generation: 'simulation generations',
  tutor_message: 'AI tutor messages',
  authoring_assist: 'authoring requests',
  translation: 'AI translation drafts',
  teacher_simulation_generation: 'simulation generations',
  teacher_notes_draft: 'AI notes drafts',
  teacher_authoring_assist: 'authoring requests',
};

// The content team and teachers have separate limits for the same work.
export function scopeFor(caller: Caller, studioScope: QuotaScope, teacherScope: QuotaScope): QuotaScope {
  return caller.isStudio ? studioScope : teacherScope;
}

// The key PostgREST and GoTrue expect in the apikey header. It is public; it
// only identifies the project.
function projectKey(req: Request): string {
  const legacy = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacy) return legacy;
  const published = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (published) {
    try {
      const first = Object.values(JSON.parse(published))[0];
      if (typeof first === 'string') return first;
    } catch {
      // fall through to the request header
    }
  }
  const header = req.headers.get('apikey');
  if (header) return header;
  throw new HttpError(500, 'The function cannot find the project key.');
}

export async function requireUser(req: Request, options: { admin?: boolean; staff?: boolean } = {}): Promise<Caller> {
  const authorization = req.headers.get('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

  // A user's access token is a JWT (three dot-separated parts). The publishable
  // key, which anonymous visitors also send as a bearer token, is not.
  if (token.split('.').length !== 3) {
    throw new HttpError(401, 'Sign in required.');
  }

  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new HttpError(500, 'SUPABASE_URL is not available to the function.');

  const db = createClient(url, projectKey(req), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Asks the Auth server, so expired, revoked or forged tokens are rejected.
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) {
    throw new HttpError(401, 'Your session has expired. Sign in again.');
  }

  let isStudio = false;
  if (options.admin || options.staff) {
    // admin_users lets a user read only their own row, so this returns a row
    // exactly when the caller is an admin.
    const { data: row, error: adminError } = await db
      .from('admin_users')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();
    if (adminError) throw new HttpError(500, 'Could not check admin access.');
    isStudio = !!row;
    if (options.admin && !isStudio) throw new HttpError(403, 'Admin access required.');
  }

  if (options.staff && !isStudio) {
    // get_my_context() returns only the caller's own memberships.
    const { data: context, error: contextError } = await db.rpc('get_my_context');
    if (contextError || !context) throw new HttpError(500, 'Could not check staff access.');
    const memberships: { role: string; org_status: string }[] = context.memberships ?? [];
    const isSchoolStaff = memberships.some(
      (m) => m.org_status === 'active' && (m.role === 'teacher' || m.role === 'org_admin'),
    );
    if (!isSchoolStaff) throw new HttpError(403, 'Only teachers, school admins and the Tutre team can do that.');
  }

  return { userId: data.user.id, db, isStudio };
}

// Counts one use against the caller's limit for this scope, or throws 429.
// Returns the id of the usage row so token counts can be added afterwards.
// Attempts are counted, including ones where the model call later fails, so
// that retries cannot be used to get round the limit.
export async function consumeQuota(caller: Caller, scope: QuotaScope, functionName: string): Promise<string> {
  const { data, error } = await caller.db.rpc('consume_ai_quota', {
    p_scope: scope,
    p_function: functionName,
  });
  if (error || !data) {
    console.error('consume_ai_quota failed', error);
    throw new HttpError(500, 'Could not check the AI usage limit.');
  }
  if (!data.allowed) {
    const seconds = Math.max(60, Number(data.retry_after_seconds) || 0);
    const hours = Math.ceil(seconds / 3600);
    throw new HttpError(
      429,
      `Daily limit reached: ${data.limit} ${SCOPE_LABEL[scope]} per 24 hours. ` +
        `Try again in about ${hours} hour${hours === 1 ? '' : 's'}.`,
      { 'Retry-After': String(seconds) },
    );
  }
  return data.usage_id as string;
}

interface ModelUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

// Adds up usage blocks from one or more model responses.
export function addUsage(total: ModelUsage, next: ModelUsage | undefined): ModelUsage {
  if (!next) return total;
  return {
    prompt_tokens: (total.prompt_tokens ?? 0) + (next.prompt_tokens ?? 0),
    completion_tokens: (total.completion_tokens ?? 0) + (next.completion_tokens ?? 0),
  };
}

// Best effort: a failure to record tokens must never fail the user's request.
export async function recordTokens(caller: Caller, usageId: string, usage: ModelUsage | undefined): Promise<void> {
  if (!usageId || !usage || (usage.prompt_tokens == null && usage.completion_tokens == null)) return;
  const { error } = await caller.db.rpc('record_ai_usage_tokens', {
    p_usage_id: usageId,
    p_prompt_tokens: usage.prompt_tokens ?? null,
    p_completion_tokens: usage.completion_tokens ?? null,
  });
  if (error) console.error('record_ai_usage_tokens failed', error);
}

export function errorResponse(req: Request, err: unknown): Response {
  if (err instanceof HttpError) {
    return json(req, { error: err.message }, err.status, err.headers);
  }
  console.error(err);
  const message = err instanceof Error ? err.message : String(err);
  return json(req, { error: message }, 500);
}

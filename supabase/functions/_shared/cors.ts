// CORS for Tutre's Edge Functions.
//
// Set the ALLOWED_ORIGINS secret to a comma-separated list of the panels'
// origins, e.g. "https://admin.example.com,https://app.example.com,http://localhost:5173".
// While it is unset, any origin is allowed (the behaviour before 2026-10-04), so
// deploying these functions never breaks a site whose secret is not set yet.
//
// CORS only stops other websites from calling the functions from a visitor's
// browser. It is not access control: that is guard.ts.

const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type';

export function corsHeaders(req: Request): Record<string, string> {
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': ALLOW_HEADERS };
  }

  const origin = req.headers.get('Origin') ?? '';
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Headers': ALLOW_HEADERS,
    'Vary': 'Origin',
  };
}

export function preflight(req: Request): Response {
  return new Response('ok', { headers: corsHeaders(req) });
}

export function json(req: Request, body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json', ...extra },
  });
}

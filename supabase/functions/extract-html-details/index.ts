import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json, preflight } from "../_shared/cors.ts";
import { requireUser, consumeQuota, scopeFor, recordTokens, errorResponse } from "../_shared/guard.ts";

// Caller: admin-panel/src/features/simulations/hooks/useHtmlDetailsExtraction.js
// Request:  { htmlContent: string }
// Response: { topic: string, details: string } | { error: string }
// The Tutre team (authoring_assist, logged, no limit), teachers and school
// admins (teacher_authoring_assist, 50 per day).

// Simulation payloads can be hundreds of kilobytes. Send the model the head and
// the tail: the head carries the title, headings and control markup, the tail
// carries the physics constants and update loop. The middle is usually styling.
const MAX_CHARS = 48000;

function trimPayload(html: string) {
  if (html.length <= MAX_CHARS) return html;
  const half = Math.floor(MAX_CHARS / 2);
  return `${html.slice(0, half)}\n\n<!-- ...middle of document omitted... -->\n\n${html.slice(-half)}`;
}

// The model is asked for bare JSON, but reasoning models still wrap output in
// <think> blocks or markdown fences. Strip both, then take the outermost object.
function parseModelJson(raw: string) {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Model did not return JSON.');
  }

  return JSON.parse(text.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }

  try {
    const caller = await requireUser(req, { staff: true });
    const { htmlContent } = await req.json();

    const apiKey = Deno.env.get('AIMLAPI_API_KEY');
    if (!apiKey) {
      throw new Error("AIMLAPI_API_KEY is not set in Edge Function secrets.");
    }
    const baseUrl = Deno.env.get('AIMLAPI_BASE_URL') || 'https://api.aimlapi.com/v1';
    const model = Deno.env.get('AIMLAPI_MODEL_EXTRACT_HTML_DETAILS') || 'anthropic/claude-sonnet-5-5';
    if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
      throw new Error("htmlContent is required.");
    }

    const systemPrompt = `You are an expert STEM curriculum analyst. You read a self-contained interactive HTML simulation and describe what it teaches and how a student interacts with it.

Respond with a single JSON object and nothing else. No prose before or after, no markdown fences, no internal reasoning, no "Thinking Process" header.

The object has exactly two string keys:
"topic"   - the specific concept the simulation teaches, as a short title of at most 8 words. Use the scientific name of the concept, not the file name and not a generic label like "Physics Simulation".
"details" - a compact description of what the simulation contains: the variables the student can change, the controls used to change them, the quantities displayed, any graph or readout, and the formula or law being demonstrated. Two to four sentences. Plain text, no markdown.

Describe only what the HTML actually implements. Do not invent controls or outputs that are not in the code.`;

    const userPrompt = `Analyse this interactive simulation and return the JSON object described above.

\`\`\`html
${trimPayload(htmlContent)}
\`\`\``;

    const usageId = await consumeQuota(caller, scopeFor(caller, 'authoring_assist', 'teacher_authoring_assist'), 'extract-html-details');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: Number(Deno.env.get('AIMLAPI_MAX_TOKENS_EXTRACT_HTML_DETAILS') || '2048'),
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    await recordTokens(caller, usageId, data.usage);
    const parsed = parseModelJson(data.choices[0].message.content);

    const topic = typeof parsed.topic === 'string' ? parsed.topic.trim() : '';
    const details = typeof parsed.details === 'string' ? parsed.details.trim() : '';

    if (!topic && !details) {
      throw new Error('Could not extract a topic or details from this HTML.');
    }

    return json(req, { topic, details });
  } catch (err) {
    return errorResponse(req, err);
  }
});

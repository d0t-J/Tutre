import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json, preflight } from "../_shared/cors.ts";
import { requireUser, consumeQuota, recordTokens, errorResponse, HttpError } from "../_shared/guard.ts";

// Caller: admin-panel/src/features/translations/hooks/useTranslations.js
// Request:  { entity_type: 'class'|'subject'|'chapter'|'topic', entity_id: uuid,
//             field: 'name'|'description'|'study_guide' }
// Response: { translation_id: uuid, text: string } | { error: string }
// Studio members only. Counts against the translation limit (300 per 24 h).
//
// Drafts an Urdu translation of one curriculum field with the model and saves
// it as a draft (source 'ai') through the caller's own database client, so RLS
// and the review workflow apply. It never verifies anything, and it refuses to
// replace a translation a reviewer has already verified.

const ENTITY_TYPES = ['class', 'subject', 'chapter', 'topic'];
const FIELDS = ['name', 'description', 'study_guide'];
const MAX_GLOSSARY_TERMS = 300;

// Reasoning models may wrap output in <think> blocks or code fences.
function cleanModelText(raw: string) {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()
    .replace(/^```(?:html|text)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function buildSystemPrompt(field: string, glossary: { term_en: string; term_ur: string }[]) {
  const glossaryText = glossary.length > 0
    ? glossary.map(g => `- ${g.term_en} = ${g.term_ur}`).join('\n')
    : '(no glossary terms yet)';

  const formatRules = field === 'name'
    ? `- The input is a short title. Return a short Urdu title, with no quotation marks and no full stop at the end.`
    : `- The input is HTML. Keep every tag and attribute exactly as it is, in the same order. Translate only the visible text between tags. Do not add, remove or reorder tags.
- Keep everything between $...$ or $$...$$ exactly as it is: it is LaTeX maths.`;

  return `You translate school curriculum content from English into Urdu for students in Pakistan (classes 9 to 12, Punjab board).

Rules:
- Write standard Urdu in Urdu script, as used in Pakistani Urdu-medium textbooks. Never write Roman Urdu.
- When an English term from the glossary below appears, use exactly the Urdu given for it.
- For a technical term that is not in the glossary, use the word Urdu-medium textbooks use. If you are not sure, write the Urdu followed by the English term in brackets, for example: رفتار (velocity).
- Keep all numbers in Western digits (0-9). Keep units, symbols, chemical formulas, code and programming keywords unchanged.
${formatRules}
- Return only the translation. No explanations, no notes, no code fences.

Glossary:
${glossaryText}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }

  try {
    const caller = await requireUser(req, { admin: true });
    const { entity_type, entity_id, field } = await req.json();

    if (!ENTITY_TYPES.includes(entity_type) || !FIELDS.includes(field) || typeof entity_id !== 'string') {
      throw new HttpError(400, 'entity_type, entity_id and field are required.');
    }

    // The English source, read as the caller.
    const { data: item, error: itemError } = await caller.db
      .from('translation_overview')
      .select('english, subject_id, status')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .eq('field', field)
      .maybeSingle();
    if (itemError) throw new HttpError(500, 'Could not read the English text.');
    if (!item) throw new HttpError(404, 'There is no English text to translate for that item.');
    if (item.status === 'verified') {
      throw new HttpError(409, 'This item already has a verified translation. Edit it in the Studio instead.');
    }

    // Glossary: verified terms for this subject and for all subjects.
    let subjectSlug: string | null = null;
    if (item.subject_id) {
      const { data: subject } = await caller.db.from('subjects').select('slug').eq('id', item.subject_id).maybeSingle();
      subjectSlug = subject?.slug ?? null;
    }
    let glossaryQuery = caller.db
      .from('glossary_terms')
      .select('term_en, term_ur')
      .eq('status', 'verified')
      .limit(MAX_GLOSSARY_TERMS);
    glossaryQuery = subjectSlug
      ? glossaryQuery.or(`subject_slug.is.null,subject_slug.eq.${subjectSlug}`)
      : glossaryQuery.is('subject_slug', null);
    const { data: glossary } = await glossaryQuery;

    const apiKey = Deno.env.get('AIMLAPI_API_KEY');
    if (!apiKey) {
      throw new Error("AIMLAPI_API_KEY is not set in Edge Function secrets.");
    }
    const baseUrl = Deno.env.get('AIMLAPI_BASE_URL') || 'https://api.aimlapi.com/v1';
    const model = Deno.env.get('AIMLAPI_MODEL_TRANSLATE_CONTENT') || 'anthropic/claude-sonnet-5-5';
    const maxTokens = Number(Deno.env.get('AIMLAPI_MAX_TOKENS_TRANSLATE_CONTENT') || '16384');

    const usageId = await consumeQuota(caller, 'translation', 'translate-content');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.2,
        messages: [
          { role: 'system', content: buildSystemPrompt(field, glossary ?? []) },
          { role: 'user', content: item.english }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      console.error('AIML API error', data.error ?? response.status);
      throw new Error('The translation model did not respond. Please try again.');
    }
    await recordTokens(caller, usageId, data.usage);

    const text = cleanModelText(data.choices?.[0]?.message?.content ?? '');
    if (!text) throw new Error('The model returned an empty translation.');

    // Save as a draft, as the caller. Update the existing draft if there is one.
    const { data: existing } = await caller.db
      .from('content_translations')
      .select('id')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .eq('field', field)
      .eq('language', 'ur')
      .maybeSingle();

    const saved = existing
      ? await caller.db.from('content_translations')
          .update({ text, status: 'draft', source: 'ai' })
          .eq('id', existing.id)
          .select('id')
          .single()
      : await caller.db.from('content_translations')
          .insert({ entity_type, entity_id, field, language: 'ur', text, status: 'draft', source: 'ai' })
          .select('id')
          .single();
    if (saved.error) {
      console.error('saving translation failed', saved.error);
      throw new HttpError(403, saved.error.message);
    }

    return json(req, { translation_id: saved.data.id, text });
  } catch (err) {
    return errorResponse(req, err);
  }
});

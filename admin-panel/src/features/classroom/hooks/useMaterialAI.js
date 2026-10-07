import { functionHeaders, functionError } from '../../../services/edgeFunctions';
import { extractDescription } from '../../simulations/utils/extractDescription';
import { markdownToHtml } from '../../simulations/utils/markdownToHtml';
import { preprocessLegacyMath } from '../../simulations/utils/mathPreprocessor';
import { STUDY_GUIDE_PROMPT } from '../../simulations/utils/studyGuidePrompt';

// AI help for teachers' material. The same Edge Functions as the Studio, but a
// teacher's requests count against the teachers' own daily limits (10
// simulations, 30 notes drafts; see supabase/functions/_shared/guard.ts).

const functionUrl = (name) => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

// Writes a new simulation, or changes an existing one when existingCode is
// given. Returns { html, description } with the description taken out of the
// HTML, as in the Studio.
export async function generateSimulation({ dimension, subject, className, topic, details, request, existingCode }) {
  const name = dimension === '3D' ? 'generate-simulation-3d' : 'generate-simulation';
  const response = await fetch(functionUrl(name), {
    method: 'POST',
    headers: await functionHeaders(),
    body: JSON.stringify({
      subject,
      className,
      topic,
      details,
      customPrompt: request,
      ...(existingCode ? { existingCode, updateTarget: 'both' } : {}),
    }),
  });
  if (!response.ok) throw await functionError(response, 'Could not create the simulation.');
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  const { cleanedHtml, description } = extractDescription(data.code_payload);
  return { html: cleanedHtml, description };
}

// Drafts notes for a topic and streams them as HTML through onUpdate.
export async function draftNotes({ topic, details, onUpdate }) {
  const response = await fetch(functionUrl('chat-tutor'), {
    method: 'POST',
    headers: await functionHeaders(),
    body: JSON.stringify({
      topic,
      details,
      stream: true,
      purpose: 'notes',
      messages: [{ role: 'user', content: STUDY_GUIDE_PROMPT }],
    }),
  });
  if (!response.ok) throw await functionError(response, 'Could not draft the notes.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let markdown = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let end;
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, end).trim();
      buffer = buffer.slice(end + 1);
      if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
      try {
        markdown += JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || '';
      } catch {
        // an incomplete event; the rest arrives with the next chunk
      }
    }
    onUpdate(preprocessLegacyMath(markdownToHtml(markdown)));
  }
  return preprocessLegacyMath(markdownToHtml(markdown));
}

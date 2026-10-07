import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { requireUser, consumeQuota, recordTokens, errorResponse } from "../_shared/guard.ts";
// Any signed-in user: students (tutor chat) and admins (study-guide drafts).
// Counts against the tutor_message limit.

// The reply language follows the student's interface language. Only these two
// values are accepted; anything else is treated as English.
const LANGUAGE_RULES: Record<string, string> = {
  en: `LANGUAGE:
- Reply in English.
- Students may write in Roman Urdu (Urdu typed in Latin letters, for example "velocity kya hoti hai?") or in Urdu script. Understand it and reply in English.`,
  ur: `LANGUAGE:
- Reply in Urdu, written in Urdu script. Never reply in Roman Urdu, even when the student writes in Roman Urdu or English.
- Students may write in Roman Urdu (Urdu typed in Latin letters, for example "velocity kya hoti hai?"), Urdu script or English. Understand all three.
- Use simple, standard Urdu of the kind used in Pakistani Urdu-medium textbooks.
- The first time you use a technical term, put the English term in brackets after it, for example: رفتار (velocity).
- Keep every mathematical expression, symbol, unit and number exactly as the math rules below require, with Western digits (0-9). Do not translate symbols or units. Keep code and code keywords in English.`,
};

serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }
  try {
    const caller = await requireUser(req);
    const { topic, details, messages, stream, language } = await req.json();
    const languageRules = language === 'ur' ? LANGUAGE_RULES.ur : LANGUAGE_RULES.en;
    const apiKey = Deno.env.get('AIMLAPI_API_KEY');
    if (!apiKey) {
      throw new Error("AIMLAPI_API_KEY is missing in environment variables");
    }
    const baseUrl = Deno.env.get('AIMLAPI_BASE_URL') || 'https://api.aimlapi.com/v1';
    const model = Deno.env.get('AIMLAPI_MODEL_CHAT_TUTOR') || 'anthropic/claude-sonnet-5-5';
    const maxTokens = Number(Deno.env.get('AIMLAPI_MAX_TOKENS_CHAT_TUTOR') || '8192');
    let systemPrompt = `You are a helpful and educational AI tutor for students.
You are currently helping a student who is viewing a science simulation about "${topic}".
Here are the details of the simulation:
${details}

Your goal is to answer their questions accurately and concisely, specifically focusing on the simulation topic. Help them understand the core concepts. Keep responses encouraging and easy to read.

CRITICAL FORMATTING RULES FOR MATH:
- For ALL inline mathematical expressions, wrap them in single dollar signs: $expression$
- For ALL display/block mathematical equations, wrap them in double dollar signs: $$expression$$
- NEVER use plain parentheses ( ) or brackets [ ] to wrap math expressions or variables.

${languageRules}`;
    if (!stream) {
      systemPrompt += `\n\nCRITICAL INSTRUCTION: You MUST output your response in pure JSON format exactly like this:\n{ "reply": "Your markdown formatted response goes here" }\nDo not output any other text outside of the JSON object. Do not include markdown code block backticks around the JSON.`;
    }
    const formattedMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map((m: { role: string; content: string })=>({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
    ];
    const usageId = await consumeQuota(caller, 'tutor_message', 'chat-tutor');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: formattedMessages,
        stream: !!stream
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("AIML API Error:", errText);
      throw new Error(`AIML API error: ${response.status}`);
    }
    if (stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders(req),
          'Content-Type': 'text/event-stream'
        }
      });
    } else {
      const data = await response.json();
      await recordTokens(caller, usageId, data.usage);
      let reply = "";
      const rawContent = data.choices?.[0]?.message?.content || "";
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
      else if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      try {
        const parsed = JSON.parse(jsonStr.trim());
        reply = parsed.reply || rawContent;
      } catch (e) {
        reply = rawContent;
      }
      return new Response(JSON.stringify({
        reply
      }), {
        headers: {
          ...corsHeaders(req),
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    return errorResponse(req, error);
  }
});

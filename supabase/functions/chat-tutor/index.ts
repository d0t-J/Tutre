import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { topic, details, messages, stream } = await req.json();
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
- NEVER use plain parentheses ( ) or brackets [ ] to wrap math expressions or variables.`;
    if (!stream) {
      systemPrompt += `\n\nCRITICAL INSTRUCTION: You MUST output your response in pure JSON format exactly like this:\n{ "reply": "Your markdown formatted response goes here" }\nDo not output any other text outside of the JSON object. Do not include markdown code block backticks around the JSON.`;
    }
    const formattedMessages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...messages.map((m)=>({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
    ];
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
          ...corsHeaders,
          'Content-Type': 'text/event-stream'
        }
      });
    } else {
      const data = await response.json();
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
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

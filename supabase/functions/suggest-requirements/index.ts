import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json, preflight } from "../_shared/cors.ts";
import { requireUser, consumeQuota, recordTokens, addUsage, errorResponse } from "../_shared/guard.ts";
// Admins only. Logged under authoring_assist (no limit).
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }
  try {
    const caller = await requireUser(req, { admin: true });
    const { subject, className, topic, existingDetails, imageBase64 } = await req.json();
    const apiKey = Deno.env.get('AIMLAPI_API_KEY');
    if (!apiKey) {
      throw new Error("AIMLAPI_API_KEY is not set in Edge Function secrets.");
    }
    const baseUrl = Deno.env.get('AIMLAPI_BASE_URL') || 'https://api.aimlapi.com/v1';
    // Sonnet 5 accepts image input, so the same model serves both paths.
    const model = Deno.env.get('AIMLAPI_MODEL_SUGGEST_REQUIREMENTS') || 'anthropic/claude-sonnet-5-5';
    if (!topic) {
      throw new Error("Topic is required.");
    }
    const systemPrompt = `You are an expert ${subject || 'educational'} curriculum developer and instructional designer specializing in creating highly interactive digital simulations for ${className || 'students'}. DO NOT output any internal thinking process, reasoning, or "Thinking Process" headers. Provide ONLY the final requested output.`;
    let promptText = `I am building an interactive HTML5 physics/science simulation for the following topic:
Subject: ${subject}
Class/Grade: ${className}
Topic Name: ${topic}

`;
    if (imageBase64) {
      promptText += `I have provided an image/diagram representing the concept or the desired simulation layout. Please carefully analyze the uploaded image and extract all relevant physical variables, UI controls (like sliders or buttons), graphs, and visual components shown or implied. `;
    }
    if (existingDetails && existingDetails.trim().length > 0) {
      promptText += `\nThe user has also provided the following initial ideas/requirements:\n"${existingDetails}"\n\nPlease use the image (if any) and these existing ideas to generate a highly refined, comprehensive list of specific interactive elements, physical variables, controls, and visual outputs that MUST be included to make it an excellent learning tool. `;
    } else {
      promptText += `\nPlease generate a concise, comma-separated list or short bulleted paragraph of specific interactive elements, physical variables, controls, and visual outputs that MUST be included in this simulation to make it an excellent learning tool. `;
    }
    promptText += `\n\nKeep your response focused purely on the technical simulation requirements. DO NOT include greetings, filler text, or your internal thinking process. Start directly with the requirements.`;
    let userContent;
    if (imageBase64) {
      userContent = [
        {
          type: "text",
          text: promptText
        },
        {
          type: "image_url",
          image_url: {
            url: imageBase64
          }
        }
      ];
    } else {
      userContent = promptText;
    }
    const usageId = await consumeQuota(caller, 'authoring_assist', 'suggest-requirements');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: Number(Deno.env.get('AIMLAPI_MAX_TOKENS_SUGGEST_REQUIREMENTS') || '8192'),
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userContent
          }
        ],
        temperature: 0.3
      })
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }
    await recordTokens(caller, usageId, data.usage);
    let textPayload = data.choices[0].message.content.trim();
    // Sometimes reasoning models still output `<think>...</think>`, let's strip it just in case
    textPayload = textPayload.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    // Also strip "Thinking Process:" if it appears
    textPayload = textPayload.replace(/Thinking Process:[\s\S]*?(?=Interactive elements|Controls|Sliders|Requirements|- 1)/gi, '').trim();
    return json(req, {
      suggestions: textPayload
    });
  } catch (err) {
    return errorResponse(req, err);
  }
});

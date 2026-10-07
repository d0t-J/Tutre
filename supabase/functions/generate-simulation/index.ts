import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { json, preflight } from "../_shared/cors.ts";
import { requireUser, consumeQuota, scopeFor, recordTokens, addUsage, errorResponse } from "../_shared/guard.ts";
// The Tutre team, teachers and school admins (Phase 5d). One request (three model
// calls) counts as one generation, against the team's or the teachers' limit.
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }
  try {
    const caller = await requireUser(req, { staff: true });
    const { subject, className, topic, details, customPrompt, imageBase64, existingCode, updateTarget } = await req.json();
    const apiKey = Deno.env.get('AIMLAPI_API_KEY');
    if (!apiKey) {
      throw new Error("AIMLAPI_API_KEY is not set in Edge Function secrets.");
    }
    const baseUrl = Deno.env.get('AIMLAPI_BASE_URL') || 'https://api.aimlapi.com/v1';
    const model = Deno.env.get('AIMLAPI_MODEL_GENERATE_SIMULATION') || 'deepseek/deepseek-v4-pro';
    const maxTokens = Number(Deno.env.get('AIMLAPI_MAX_TOKENS_GENERATE_SIMULATION') || '32768');
    const systemPrompt = `You are an expert ${subject || 'educational'} developer and subject specialist, creating interactive animations specifically tailored for ${className || 'students'}.
Generate a single-file HTML (containing internal CSS and JS) that simulates the requested topic for the given subject. Ensure the complexity, language, and conceptual depth are perfectly suited for ${className || 'the target grade level'}.
Guidelines:
- Return ONLY valid HTML. Do not include markdown formatting like \`\`\`html.
- Include a <canvas> if needed.
- You may use CDNs for libraries: p5.js (2D Physics/Bio), Three.js (3D), or Matter.js (2D collision).
- CRITICAL DESIGN RULE: The simulation MUST use a bright, clean Light Theme by default (e.g., white or very light gray backgrounds, dark highly legible text, and bright/visible colors for physics objects and UI controls). Do NOT generate dark mode themes unless explicitly requested.
- CRITICAL: Keep your CSS extremely minimal and concise. Do not add excessive styling, complex gradients, or unnecessary UI elements.
- CRITICAL: Keep your Javascript concise. 
- CRITICAL: Do NOT truncate the code. Your output MUST end with </html>. It is crucial the code fits within the output token limit.
- CRITICAL MATH RULE: For all mathematical formulas, variables, and equations, you MUST use standard LaTeX syntax. Wrap inline math in \\( ... \\) and block math in $$ ... $$. Do not use plain text for math. You are generating a vanilla HTML/JS file, NOT a React component. Include the MathJax CDN in the <head> (<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>) and call window.MathJax.typesetPromise() inside your vanilla JavaScript rendering loop or event listeners whenever the DOM updates.

CRITICAL REQUIREMENT 1: You MUST include a detailed step-by-step text description of the animation. You MUST wrap this entire text description in a div with id 'visiolab-description' (i.e. <div id='visiolab-description'>...</div>). Do NOT put the description anywhere else, we will extract it programmatically. Inside this description, use highly engaging HTML formatting: bold headings (<h2>, <h3>), well-structured paragraphs (<p>), bullet points (<ul>, <li>), and apply inline styles or CSS classes to make it visually eye-catching and interactive (e.g., colored highlights, borders, soft backgrounds). 
CRITICAL REQUIREMENT 2: DO NOT use any emojis or icons (like 🧪, 💡, 📝, etc.) in your text. 
CRITICAL REQUIREMENT 3: The <div id='visiolab-description'> MUST be placed at the very bottom of the <body>, OUTSIDE of any main application layout wrappers or flex containers. It will be removed by the frontend, so it must not be structurally required for your CSS layout.
CRITICAL REQUIREMENT 4: The simulation MUST be fully responsive and adapt to ANY screen size. You MUST include <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"> in the <head>. You MUST dynamically resize any <canvas> elements using window.addEventListener('resize', ...). Use CSS flexbox/grid and relative units (%, vh, vw).
CRITICAL UI RULE FOR MOBILE: On small screens (using CSS @media max-width: 768px), UI controls (buttons, sliders, labels) MUST be extremely compact, use small fonts (10px-12px), minimal padding, and be strictly anchored to the bottom 25% of the screen. The top 75% MUST be reserved entirely for the animation canvas. Apply CSS 'touch-action: none;' to canvases and interactive elements to prevent the browser window from scrolling while dragging. Hide all body scrollbars and prevent overflowing (overflow: hidden).`;
    let promptText = "";
    if (existingCode) {
      promptText = `Here is the existing code for a simulation about ${topic} (${subject}):\n\n\`\`\`html\n${existingCode}\n\`\`\`\n\nCRITICAL INSTRUCTIONS FOR UPDATING:\n1. Apply ONLY the changes requested in the following prompt.\n2. DO NOT make any unasked changes. DO NOT hallucinate new features, alter the existing design, change colors, or modify the layout unless explicitly instructed to do so.\n3. Preserve all previous functionalities, code structure, and logic exactly as they are.\n4. Return ONLY the complete, valid HTML code without markdown formatting.\n`;
      if (updateTarget === 'description') {
        promptText += `\n5. CRITICAL TARGET CONSTRAINT: You MUST ONLY update the <div id='visiolab-description'> text content. DO NOT change ANY of the CSS, JS, or HTML canvas logic related to the simulation itself.`;
      } else if (updateTarget === 'simulation') {
        promptText += `\n5. CRITICAL TARGET CONSTRAINT: You MUST ONLY update the simulation logic, graphics, CSS, or layout. DO NOT change the existing <div id='visiolab-description'> text at all. Keep the description exactly as provided in the original code.`;
      } else {
        promptText += `\n5. CRITICAL TARGET CONSTRAINT: You may update both the simulation code and the description text based on the instructions.`;
      }
      promptText += `\n\nUpdate Prompt:\n${customPrompt}`;
    } else {
      promptText = `Subject: ${subject}\nTopic: ${topic}\n\nPlease generate a simple and concise interactive simulation HTML.`;
      if (details && details.trim()) {
        promptText += `\n\nSpecific Details/Requirements:\n${details.trim()}`;
      }
      if (customPrompt && customPrompt.trim()) {
        promptText += `\n\nCustomization/Styling Prompt:\n${customPrompt.trim()}`;
      }
      if (imageBase64) {
        promptText += `\n\nHere is a sample reference image for the simulation.`;
      }
    }
    let userContent;
    if (imageBase64 && !existingCode) {
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
    const usageId = await consumeQuota(caller, scopeFor(caller, 'simulation_generation', 'teacher_simulation_generation'), 'generate-simulation');
    let usage = {};
    let currentHtml = "";
    let messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userContent
      }
    ];
    for(let i = 0; i < 3; i++){
      if (i > 0) {
        messages.push({
          role: "assistant",
          content: currentHtml
        });
        messages.push({
          role: "user",
          content: "Please validate your previous HTML code. Check for any missing CSS, layout issues, JavaScript syntax errors, correct placement of the 'visiolab-description' div, and adherence to the Light Theme rule. Provide the complete, corrected HTML code."
        });
      }
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
          messages: messages,
          temperature: 0.1
        })
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }
      usage = addUsage(usage, data.usage);
      let htmlPayload = data.choices[0].message.content.trim();
      // Robust regex to extract code block regardless of conversational text
      const codeMatch = htmlPayload.match(/\`\`\`(?:html)?\s*([\s\S]*?)\`\`\`/i);
      if (codeMatch && codeMatch[1]) {
        htmlPayload = codeMatch[1].trim();
      } else {
        // Fallback manual cleanup in case regex fails but backticks exist
        if (htmlPayload.startsWith('\`\`\`html')) {
          htmlPayload = htmlPayload.substring(7);
        } else if (htmlPayload.startsWith('\`\`\`')) {
          htmlPayload = htmlPayload.substring(3);
        }
        if (htmlPayload.endsWith('\`\`\`')) {
          htmlPayload = htmlPayload.substring(0, htmlPayload.length - 3);
        }
      }
      currentHtml = htmlPayload.trim();
    }
    await recordTokens(caller, usageId, usage);
    return json(req, {
      code_payload: currentHtml
    });
  } catch (err) {
    return errorResponse(req, err);
  }
});

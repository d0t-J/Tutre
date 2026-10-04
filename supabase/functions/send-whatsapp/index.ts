import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, json, preflight } from '../_shared/cors.ts';
import { requireUser, HttpError } from '../_shared/guard.ts';
// WhatsApp delivery is switched off (2026-10-04) until its future is decided:
// it sends any file URL to any phone number from the project's Green API account.
// It only runs when the WHATSAPP_ENABLED secret is exactly "true", and then only
// for signed-in users. The student panel hides the button unless
// VITE_ENABLE_WHATSAPP=true.
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return preflight(req);
  }
  if (Deno.env.get('WHATSAPP_ENABLED') !== 'true') {
    return json(req, {
      success: false,
      error: 'WhatsApp delivery is turned off.'
    }, 503);
  }
  try {
    await requireUser(req);
    const { phoneNumber, fileUrl, fileName } = await req.json();
    if (!phoneNumber || !fileUrl || !fileName) {
      throw new Error('Missing required parameters: phoneNumber, fileUrl, or fileName.');
    }
    const greenApiId = Deno.env.get('GREEN_API_ID_INSTANCE');
    const greenApiToken = Deno.env.get('GREEN_API_TOKEN_INSTANCE');
    if (!greenApiId || !greenApiToken) {
      throw new Error('Green API credentials are not configured in Edge Function secrets.');
    }
    // Format phone number to WhatsApp format (e.g. 1234567890@c.us)
    // Strip everything except digits
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    const chatId = `${cleanedNumber}@c.us`;
    // Call Green API
    const greenApiUrl = `https://api.green-api.com/waInstance${greenApiId}/sendFileByUrl/${greenApiToken}`;
    const response = await fetch(greenApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: chatId,
        urlFile: fileUrl,
        fileName: fileName,
        caption: `Here are your Study Guide notes for ${fileName.replace('.docx', '')}! 📚`
      })
    });
    const responseData = await response.json();
    if (!response.ok) {
      console.error('Green API Error:', responseData);
      throw new Error(responseData.message || 'Failed to send WhatsApp message via Green API');
    }
    return new Response(JSON.stringify({
      success: true,
      messageId: responseData.idMessage
    }), {
      headers: {
        ...corsHeaders(req),
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return json(req, {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, error instanceof HttpError ? error.status : 400);
  }
});

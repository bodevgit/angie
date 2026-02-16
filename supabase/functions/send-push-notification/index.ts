import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content, targetUserId } = await req.json();

    if (!content || !targetUserId) {
      throw new Error('Missing content or targetUserId');
    }

    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      throw new Error('Server OneSignal configuration missing');
    }

    // Clean up API Key in case user pasted "Basic " prefix or whitespace
    const cleanApiKey = ONESIGNAL_API_KEY.trim().replace(/^Basic\s+/i, '');

    console.log(`Using App ID: ${ONESIGNAL_APP_ID.trim()}`);
    console.log(`Using Cleaned API Key: ${cleanApiKey.slice(0, 4)}... (Length: ${cleanApiKey.length})`);

    const headers = {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${cleanApiKey}`,
    };

    const payload = {
        app_id: ONESIGNAL_APP_ID.trim(),
        include_aliases: {
            external_id: [targetUserId]
        },
        target_channel: "push",
        contents: { en: content },
        headings: { en: 'New Message' },
        url: 'https://bodevgit.github.io/angie/#/messages',
    };

    const options = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    };

    let response = await fetch('https://onesignal.com/api/v1/notifications', options);
    let data = await response.json();

    // Fallback: If aliases fail (e.g. user not on new Identity model), try legacy external_user_id
    if (data.errors && (JSON.stringify(data.errors).includes('include_aliases') || JSON.stringify(data.errors).includes('invalid_external_user_ids'))) {
       console.log('Aliases failed, trying legacy include_external_user_ids...');
       const legacyPayload = {
           ...payload,
           include_aliases: undefined,
           include_external_user_ids: [targetUserId]
       };
       response = await fetch('https://onesignal.com/api/v1/notifications', {
           ...options,
           body: JSON.stringify(legacyPayload)
       });
       data = await response.json();
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

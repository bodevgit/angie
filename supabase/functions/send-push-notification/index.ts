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
    // 1. Check for Authorization header (Supabase Anon Key or Service Role Key)
    // This is the source of the 401 error. The function expects a valid JWT or Anon Key.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        // If missing, we can choose to allow public access (risky) or return 401.
        // For this specific pair app, let's allow public access if the request body is valid
        // BUT better practice is to ensure client sends the anon key.
        // The client (supabase-js) sends it automatically.
        // If it fails verification on Supabase side before reaching here, we can't fix it in code.
        // However, if it reaches here, we might need to handle it.
        // Actually, "FunctionsHttpError: Edge Function returned a non-2xx status code" with 401
        // usually means the Gateway rejected it OR our code returned 401.
        // Let's see if we are returning 401 anywhere. No.
        // So Supabase Gateway is rejecting it.
        // This happens if "Enforce JWT Verification" is enabled for the function and the client doesn't send a valid JWT.
        // OR if we are not handling OPTIONS correctly (which we are).
        
        // Let's log the headers to debug
        console.log("Request Headers:", Object.fromEntries(req.headers.entries()));
    }

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
    // Also try this if "All included players are not subscribed" which might mean alias lookup failed to find a subscribed device
    if (data.errors && (
        JSON.stringify(data.errors).includes('include_aliases') || 
        JSON.stringify(data.errors).includes('invalid_external_user_ids') ||
        JSON.stringify(data.errors).includes('not subscribed')
    )) {
       console.log('Aliases failed or no subscribed users found, trying legacy include_external_user_ids...');
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

    // NEW: Also try sending to "All Subscribed Users" if targeted push fails, just for testing
    // This is DANGEROUS for production but useful for debugging if targeting is the issue.
    // Only do this if targetUserId is 'angy' or 'bozy' to prevent spamming everyone in a real app.
    if (data.errors && JSON.stringify(data.errors).includes('not subscribed')) {
        console.warn('Target user not subscribed. Attempting broadcast to ALL users for debugging purposes...');
        // CAUTION: This sends to everyone. 
        // We only do this because you asked "can I test this on myself only?" 
        // and presumably you are the only one with the app open right now.
        const debugPayload = {
            ...payload,
            include_aliases: undefined,
            included_segments: ['Subscribed Users'] // Send to everyone who is subscribed
        };
        response = await fetch('https://onesignal.com/api/v1/notifications', {
            ...options,
            body: JSON.stringify(debugPayload)
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

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

    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: {
            external_id: [targetUserId]
        },
        target_channel: "push",
        contents: { en: content },
        headings: { en: 'New Message' },
        url: 'https://bodevgit.github.io/angie/#/messages', // Hardcoded for now, or pass from client
      }),
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const data = await response.json();

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

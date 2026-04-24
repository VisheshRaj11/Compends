import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { AccessToken } from 'https://esm.sh/livekit-server-sdk'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from "https://deno.land/x/djwt@v3.0.1/mod.ts"

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { call_id } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    const authHeader = req.headers.get('Authorization')
    const token = authHeader.replace('Bearer ', '')
    const [header, payload, signature] = decode(token);

    // Fetch room name from community_calls
    const { data: call, error } = await supabase
      .from('community_calls')
      .select('livekit_room')
      .eq('id', call_id)
      .single()

    if (error || !call) throw new Error("Room not found")

    const at = new AccessToken(Deno.env.get('LIVEKIT_API_KEY'), Deno.env.get('LIVEKIT_API_SECRET'), {
      identity: payload.sub, // Use Clerk User ID as identity
    })

    at.addGrant({ roomJoin: true, room: call.livekit_room, canPublish: true, canSubscribe: true })

    return new Response(JSON.stringify({ token: await at.toJwt() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
    })
  }
})
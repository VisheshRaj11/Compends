import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from "https://deno.land/x/djwt@v3.0.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    const { community_id, invitees } = await req.json()

    // 1. Decode Clerk JWT for host_id
    const authHeader = req.headers.get('Authorization')
    const token = authHeader.replace('Bearer ', '')
    const [header, payload, signature] = decode(token);
    const userId = payload.sub;

    // 2. Insert into community_calls (matching your image)
    const { data: call, error: callError } = await supabase
      .from('community_calls')
      .insert({ 
        community_id, 
        host_id: userId,
        status: 'active',
        livekit_room: `room_${Math.random().toString(36).substring(7)}` 
      })
      .select().single()

    if (callError) throw new Error(`Call Error: ${callError.message}`)

    // 3. Insert into call_invites (matching your image)
    const inviteRecords = invitees.map((invitedId) => ({
      call_id: call.id,
      user_id: invitedId,
      status: 'pending'
    }))

    const { error: inviteError } = await supabase
      .from('call_invites')
      .insert(inviteRecords)

    if (inviteError) throw new Error(`Invite Error: ${inviteError.message}`)

    return new Response(JSON.stringify({ call_id: call.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
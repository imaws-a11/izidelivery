import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
serve(async (req) => {
  try {
    const payload = await req.json()
    console.log('OpenNode webhook:', JSON.stringify(payload))
    if (payload.status !== 'paid') return new Response('Not paid', { status: 200 })
    const chargeId = payload.id
    if (!chargeId) return new Response('Missing charge id', { status: 400 })
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { autoRefreshToken: false, persistSession: false } })
    await db.from('orders_delivery').update({ payment_status: 'paid', status: 'novo' }).eq('payment_intent_id', chargeId)
    console.log('Payment confirmed:', chargeId)
    return new Response('OK', { status: 200 })
  } catch (err: any) {
    return new Response(err.message, { status: 500 })
  }
})

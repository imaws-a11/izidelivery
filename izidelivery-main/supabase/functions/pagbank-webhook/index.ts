import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const payload = await req.json()
    console.log('PagBank webhook:', JSON.stringify(payload))
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { autoRefreshToken: false, persistSession: false } })
    const eventType = payload.charges?.[0]?.status || payload.status
    if (eventType === 'PAID' || eventType === 'AUTHORIZED') {
      const pagbankOrderId = payload.id
      const { data: order } = await supabaseAdmin.from('orders_delivery').select('id, user_id, total_price').eq('payment_intent_id', pagbankOrderId).maybeSingle()
      if (order) {
        await supabaseAdmin.from('orders_delivery').update({ status: 'novo', paid_at: new Date().toISOString() }).eq('id', order.id)
        await supabaseAdmin.from('audit_logs_delivery').insert({ action: 'Pagamento PIX Confirmado', module: 'PagBank', metadata: { orderId: order.id, pagbankOrderId } })
      }
    }
    if (eventType === 'CANCELED' || eventType === 'DECLINED') {
      await supabaseAdmin.from('orders_delivery').update({ status: 'cancelado' }).eq('payment_intent_id', payload.id).eq('status', 'pendente_pagamento')
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

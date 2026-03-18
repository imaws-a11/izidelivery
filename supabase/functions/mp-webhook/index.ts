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
    console.log('MP webhook:', JSON.stringify(payload))

    if (payload.type !== 'payment') {
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const paymentId = payload.data?.id
    if (!paymentId) {
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    const payment = await mpResponse.json()
    console.log('MP payment status:', payment.status, 'orderId:', payment.external_reference)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    if (payment.status === 'approved') {
      await supabaseAdmin
        .from('orders_delivery')
        .update({ status: 'novo', paid_at: new Date().toISOString() })
        .eq('id', payment.external_reference)

      await supabaseAdmin.from('audit_logs_delivery').insert({
        action: 'Pagamento PIX Confirmado',
        module: 'MercadoPago',
        metadata: { orderId: payment.external_reference, paymentId, amount: payment.transaction_amount },
      })
    }

    if (payment.status === 'cancelled' || payment.status === 'rejected') {
      await supabaseAdmin
        .from('orders_delivery')
        .update({ status: 'cancelado' })
        .eq('id', payment.external_reference)
        .eq('status', 'pendente_pagamento')
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

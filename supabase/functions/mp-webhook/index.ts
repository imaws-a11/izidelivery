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

    const orderId = payment.external_reference
    if (!orderId) {
      console.error('Webhook: external_reference (orderId) missing in payment', paymentId)
      return new Response(JSON.stringify({ error: 'orderId missing' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Busca o status atual do pedido para evitar retroceder status
    const { data: order } = await supabaseAdmin
      .from('orders_delivery')
      .select('status')
      .eq('id', orderId)
      .single()

    if (order?.status === 'concluido' || order?.status === 'cancelado') {
      console.log(`Webhook: Order ${orderId} already in final state: ${order.status}. Ignoring update.`)
      return new Response(JSON.stringify({ received: true, ignored: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (payment.status === 'approved') {
      await supabaseAdmin
        .from('orders_delivery')
        .update({ 
          status: 'novo', 
          paid_at: new Date().toISOString(),
          payment_status: 'approved'
        })
        .eq('id', orderId)

      await supabaseAdmin.from('audit_logs_delivery').insert({
        action: 'Pagamento Confirmado',
        module: 'MercadoPago',
        metadata: { orderId, paymentId, amount: payment.transaction_amount, status: payment.status },
      })
    } else if (payment.status === 'in_process') {
       await supabaseAdmin
        .from('orders_delivery')
        .update({ payment_status: 'in_process' })
        .eq('id', orderId)
    } else if (payment.status === 'cancelled' || payment.status === 'rejected') {
      await supabaseAdmin
        .from('orders_delivery')
        .update({ status: 'cancelado', payment_status: payment.status })
        .eq('id', orderId)
    } else if (payment.status === 'refunded') {
      await supabaseAdmin
        .from('orders_delivery')
        .update({ status: 'cancelado', payment_status: 'refunded' })
        .eq('id', orderId)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2023-10-16' })
const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { autoRefreshToken: false, persistSession: false } })

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!signature || !webhookSecret) return new Response('Webhook secret nao configurado', { status: 400 })

  let event
  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object
      const orderId = pi.metadata?.orderId
      if (!orderId) break
      await supabaseAdmin.from('orders_delivery').update({ status: 'novo', paid_at: new Date().toISOString(), payment_intent_id: pi.id }).eq('id', orderId).eq('status', 'pendente_pagamento')
      await supabaseAdmin.from('audit_logs_delivery').insert({ action: 'Pagamento Confirmado', module: 'Stripe', metadata: { orderId, paymentIntentId: pi.id, amount: pi.amount / 100 } })
      break
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object
      const orderId = pi.metadata?.orderId
      if (!orderId) break
      await supabaseAdmin.from('orders_delivery').update({ status: 'cancelado' }).eq('id', orderId).eq('status', 'pendente_pagamento')
      await supabaseAdmin.from('audit_logs_delivery').insert({ action: 'Pagamento Falhou', module: 'Stripe', metadata: { orderId, paymentIntentId: pi.id } })
      break
    }
    case 'charge.refunded': {
      const charge = event.data.object
      const { data: order } = await supabaseAdmin.from('orders_delivery').select('id, user_id').eq('payment_intent_id', charge.payment_intent).maybeSingle()
      if (!order) break
      const refundAmount = charge.amount_refunded / 100
      const { data: user } = await supabaseAdmin.from('users_delivery').select('wallet_balance').eq('id', order.user_id).maybeSingle()
      if (user) {
        await supabaseAdmin.from('users_delivery').update({ wallet_balance: (user.wallet_balance || 0) + refundAmount }).eq('id', order.user_id)
        await supabaseAdmin.from('wallet_transactions').insert({ user_id: order.user_id, type: 'reembolso', amount: refundAmount, description: `Reembolso pedido #${order.id.slice(0,8).toUpperCase()}` })
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})

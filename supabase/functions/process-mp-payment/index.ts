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
    const { amount, orderId, email, token, payment_method_id, installments, issuer_id, customer } = await req.json()

    if (!amount || !orderId || !payment_method_id) {
      return new Response(JSON.stringify({ error: 'amount, orderId e payment_method_id são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
    
    // Payload base para Mercado Pago v1/payments
    const payload: any = {
      transaction_amount: Number(amount),
      payment_method_id: payment_method_id,
      description: `Pedido IziDelivery #${orderId.slice(0, 8).toUpperCase()}`,
      external_reference: orderId,
      binary_mode: true, // Garante Aprovação ou Rejeição imediata (sem pendência manual)
      metadata: {
        order_id: orderId,
        customer_email: email
      },
      payer: {
        email: email || 'cliente@izidelivery.com',
        identification: {
          type: 'CPF',
          number: customer?.cpf?.replace(/\D/g, '') || '00000000000',
        },
      },
      notification_url: `https://cmkylgblkiceiclbewxr.supabase.co/functions/v1/mp-webhook`,
    }

    // Se for cartão, adiciona token e detalhes extras
    if (payment_method_id !== 'pix') {
      payload.token = token
      payload.installments = Number(installments) || 1
      payload.issuer_id = issuer_id
    } else {
      // Expira em 30 minutos
      payload.date_of_expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }

    console.log(`Processing ${payment_method_id} payment for order ${orderId}...`)

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': orderId,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('MP error response:', JSON.stringify(data))
      return new Response(JSON.stringify({ 
        error: 'Erro no processamento do pagamento', 
        details: data.message || 'Erro desconhecido',
        code: data.error || 'mp_error' 
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Atualiza o pedido com o ID do pagamento do MP
    await supabaseAdmin
      .from('orders_delivery')
      .update({ 
        payment_intent_id: String(data.id),
        status: data.status === 'approved' ? 'novo' : 'pendente_pagamento'
      })
      .eq('id', orderId)

    // Retorno customizado por tipo de pagamento
    if (payment_method_id === 'pix') {
      return new Response(JSON.stringify({
        mpPaymentId: data.id,
        status: data.status,
        qrCode: data.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        copyPaste: data.point_of_interaction?.transaction_data?.qr_code,
        expirationDate: data.date_of_expiration,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({
      mpPaymentId: data.id,
      status: data.status,
      status_detail: data.status_detail
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error('Erro function process-mp-payment:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

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
    const { amount, orderId, email, customer, meta } = await req.json()
    if (!amount || !orderId) {
      return new Response(JSON.stringify({ error: 'amount e orderId obrigatorios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
    const payload = {
      transaction_amount: Number(amount),
      payment_method_id: 'pix',
      description: meta?.type === 'loan_payment' ? `Parcela Empréstimo IziPay #${orderId.slice(0,8)}` : `Pedido IziDelivery #${orderId.slice(0,8).toUpperCase()}`,
      external_reference: orderId,
      metadata: meta || { order_id: orderId },
      payer: {
        email: email || 'cliente@izidelivery.com',
        first_name: customer?.name?.split(' ')[0] || 'Cliente',
        last_name: customer?.name?.split(' ').slice(1).join(' ') || 'IziDelivery',
        identification: {
          type: 'CPF',
          number: customer?.cpf?.replace(/\D/g, '') || '00000000000',
        },
      },
      date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      notification_url: 'https://cmkylgblkiceiclbewxr.supabase.co/functions/v1/mp-webhook',
    }
    console.log(`[DEBUG] Enviando pedido para MP: OrderID=${orderId}, Amount=${amount}, NotifyURL=${payload.notification_url}`);
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': orderId + (meta?.type === 'loan_payment' ? '_' + Date.now() : ''),
      },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    console.log(`[DEBUG] Resposta MP: ID=${data.id}, Status=${data.status}`);
    if (!response.ok) {
      console.error('MP error:', JSON.stringify(data))
      return new Response(JSON.stringify({ error: 'Erro ao criar PIX', details: data }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const qrCode = data.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { autoRefreshToken: false, persistSession: false } })
    
    if (meta?.type !== 'loan_payment') {
      await supabaseAdmin.from('orders_delivery').update({ payment_intent_id: String(data.id) }).eq('id', orderId)
    }
    return new Response(JSON.stringify({
      mpPaymentId: data.id,
      qrCode,
      qrCodeBase64,
      copyPaste: qrCode,
      expirationDate: data.date_of_expiration,
      amount,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('Erro MP PIX:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

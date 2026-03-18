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
    const { amount, orderId, email, customer } = await req.json()
    if (!amount || !orderId) {
      return new Response(JSON.stringify({ error: 'amount e orderId obrigatorios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const pagbankToken = Deno.env.get('PAGBANK_TOKEN') ?? ''
    const isSandbox = Deno.env.get('PAGBANK_SANDBOX') === 'true'
    const baseUrl = isSandbox ? 'https://sandbox.api.pagseguro.com' : 'https://api.pagseguro.com'
    const pixPayload = {
      reference_id: orderId,
      customer: {
        name: customer?.name || 'Cliente IziDelivery',
        email: email || 'cliente@izidelivery.com',
        tax_id: customer?.cpf?.replace(/\D/g, '') || '00000000000',
      },
      items: [{ reference_id: orderId, name: `Pedido #${orderId.slice(0,8).toUpperCase()}`, quantity: 1, unit_amount: Math.round(amount * 100) }],
      qr_codes: [{ amount: { value: Math.round(amount * 100) }, expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString() }],
      notification_urls: [`${Deno.env.get('SUPABASE_URL')}/functions/v1/pagbank-webhook`],
    }
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pagbankToken}` },
      body: JSON.stringify(pixPayload),
    })
    const data = await response.json()
    if (!response.ok) {
      console.error('PagBank error:', JSON.stringify(data))
      return new Response(JSON.stringify({ error: 'Erro ao criar cobrança PIX', details: data }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const qrCode = data.qr_codes?.[0]
    if (!qrCode) {
      return new Response(JSON.stringify({ error: 'QR Code não gerado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { autoRefreshToken: false, persistSession: false } })
    await supabaseAdmin.from('orders_delivery').update({ payment_intent_id: data.id }).eq('id', orderId)
    return new Response(JSON.stringify({ pagbankOrderId: data.id, qrCode: qrCode.text, qrCodeBase64: null, expirationDate: qrCode.expiration_date, copyPaste: qrCode.text, amount }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('Erro interno:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

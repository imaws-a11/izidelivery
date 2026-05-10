import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // webhook externo — chamado pelo servidor do PagBank
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Valida a assinatura HMAC-SHA256 enviada pelo PagBank
// Configure o secret em: PagBank Dashboard > Webhooks > Segredo
// Salve como PAGBANK_WEBHOOK_SECRET nos Edge Function Secrets
async function assertPagBankSignature(req: Request, rawBody: string): Promise<void> {
  const webhookSecret = Deno.env.get('PAGBANK_WEBHOOK_SECRET') ?? ''
  if (!webhookSecret) {
    throw new Error('PAGBANK_WEBHOOK_SECRET não configurado. Requisição bloqueada.')
  }

  // PagBank envia o hash no header x-pagbank-signature (base64 HMAC-SHA256)
  const receivedSignature = req.headers.get('x-pagbank-signature') ?? ''
  if (!receivedSignature) {
    throw new Error('Header x-pagbank-signature ausente.')
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  if (computedSignature !== receivedSignature) {
    throw new Error('Assinatura PagBank inválida. Requisição rejeitada.')
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()

    // ── GUARD: valida assinatura HMAC do PagBank ──
    await assertPagBankSignature(req, rawBody)

    const payload = JSON.parse(rawBody)
    console.log('[pagbank-webhook] Payload verificado:', JSON.stringify(payload))

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const eventType = payload.charges?.[0]?.status || payload.status

    if (eventType === 'PAID' || eventType === 'AUTHORIZED') {
      const pagbankOrderId = payload.id
      const { data: order } = await supabaseAdmin
        .from('orders_delivery')
        .select('id, user_id, total_price')
        .eq('payment_intent_id', pagbankOrderId)
        .maybeSingle()

      if (order) {
        await supabaseAdmin.from('orders_delivery').update({
          status: 'novo',
          paid_at: new Date().toISOString()
        }).eq('id', order.id)

        await supabaseAdmin.from('audit_logs_delivery').insert({
          action: 'Pagamento PIX Confirmado',
          module: 'PagBank',
          metadata: { orderId: order.id, pagbankOrderId }
        })
      }
    }

    if (eventType === 'CANCELED' || eventType === 'DECLINED') {
      await supabaseAdmin.from('orders_delivery')
        .update({ status: 'cancelado' })
        .eq('payment_intent_id', payload.id)
        .eq('status', 'pendente_pagamento')
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    const status = err.message.includes('inválida') || err.message.includes('ausente') || err.message.includes('bloqueada') ? 403 : 500
    console.error('[pagbank-webhook] Erro:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

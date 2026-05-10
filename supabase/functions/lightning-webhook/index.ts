import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // webhook externo — chamado pelo servidor do OpenNode
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Valida a assinatura HMAC-SHA256 enviada pelo OpenNode
// O OpenNode envia o campo "hashed_order" no body, que é o HMAC-SHA256
// do charge_id usando a API key como secret
// Docs: https://developers.opennode.com/docs/signing-webhooks
async function assertOpenNodeSignature(payload: Record<string, any>): Promise<void> {
  const apiKey = Deno.env.get('OPENNODE_API_KEY') ?? ''
  if (!apiKey) {
    throw new Error('OPENNODE_API_KEY não configurada. Requisição bloqueada.')
  }

  const receivedHash = payload.hashed_order ?? ''
  if (!receivedHash) {
    throw new Error('Campo hashed_order ausente no payload do OpenNode.')
  }

  const chargeId = String(payload.id ?? '')
  if (!chargeId) {
    throw new Error('Campo id ausente no payload do OpenNode.')
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(chargeId))
  const computedHash = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  if (computedHash !== receivedHash) {
    throw new Error('Assinatura OpenNode inválida. Requisição rejeitada.')
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const contentType = req.headers.get('content-type') || ''
    let payload: any = {}

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      payload = Object.fromEntries(formData.entries())
    } else {
      payload = await req.json()
    }

    console.log('[lightning-webhook] Payload recebido. Status:', payload.status)

    // ── GUARD: valida assinatura HMAC do OpenNode ──
    await assertOpenNodeSignature(payload)

    if (payload.status !== 'paid') {
      console.log('[lightning-webhook] Status ignorado:', payload.status)
      return new Response(JSON.stringify({ message: `Status '${payload.status}' ignorado` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const openNodeChargeId = payload.id
    const internalOrderId = payload.order_id

    if (!openNodeChargeId && !internalOrderId) {
      console.error('[lightning-webhook] Dados de identificação ausentes (id/order_id)')
      return new Response(JSON.stringify({ error: 'Missing charge/order identification' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuração do Supabase ausente (URL/KEY)')
    }

    const db = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log(`[lightning-webhook] Confirmando pagamento. ChargeID: ${openNodeChargeId}, InternalID: ${internalOrderId}`)

    // Tentativa 1: localizar pelo payment_intent_id (charge ID do OpenNode)
    let query = db.from('orders_delivery').update({
      payment_status: 'paid',
      status: 'waiting_merchant',
      updated_at: new Date().toISOString()
    })

    query = openNodeChargeId
      ? query.eq('payment_intent_id', openNodeChargeId)
      : query.eq('id', internalOrderId)

    const { data: updateData, error: updateError } = await query.select('*')

    if (updateError) {
      console.error('[lightning-webhook] Erro ao atualizar pedido:', updateError)
      throw updateError
    }

    // Tentativa 2: fallback pelo ID interno se o intent não bateu
    if ((!updateData || updateData.length === 0) && internalOrderId && openNodeChargeId) {
      console.log(`[lightning-webhook] Tentando por ID interno: ${internalOrderId}`)
      const { data: retryData, error: retryError } = await db
        .from('orders_delivery')
        .update({
          payment_status: 'paid',
          status: 'waiting_merchant',
          payment_intent_id: openNodeChargeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', internalOrderId)
        .select('*')

      if (retryError) throw retryError

      if (retryData && retryData.length > 0) {
        console.log('[lightning-webhook] Confirmado via ID interno:', internalOrderId)
        return new Response(JSON.stringify({ message: 'OK', method: 'retry_internal_id', updated: 1 }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (!updateData || updateData.length === 0) {
      console.warn(`[lightning-webhook] Nenhum pedido encontrado. IDs: ${openNodeChargeId} / ${internalOrderId}`)
      return new Response(JSON.stringify({ message: 'No order found', updated: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('[lightning-webhook] Confirmado via IntentID:', openNodeChargeId)
    return new Response(JSON.stringify({ message: 'OK', method: 'intent_id', updated: updateData.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    const status = err.message.includes('inválida') || err.message.includes('ausente') || err.message.includes('bloqueada') ? 403 : 500
    console.error('[lightning-webhook] Erro:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

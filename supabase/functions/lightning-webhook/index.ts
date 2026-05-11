import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function assertOpenNodeSignature(payload: Record<string, any>): Promise<void> {
  const apiKey = Deno.env.get('OPENNODE_API_KEY') ?? ''
  if (!apiKey) throw new Error('OPENNODE_API_KEY não configurada.')

  const receivedHash = payload.hashed_order ?? ''
  const chargeId = String(payload.id ?? '')
  if (!receivedHash || !chargeId) throw new Error('Assinatura malformada.')

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

  if (computedHash !== receivedHash) throw new Error('Assinatura inválida.')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const contentType = req.headers.get('content-type') || ''
    const payload = contentType.includes('application/x-www-form-urlencoded') 
      ? Object.fromEntries((await req.formData()).entries())
      : await req.json()

    console.log('[LN-Webhook] Payload:', payload.status, 'ID:', payload.id)
    await assertOpenNodeSignature(payload)

    if (payload.status !== 'paid') {
      return new Response(JSON.stringify({ message: 'Status ignorado' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Atualizar o pedido para Pago
    const { data: updatedOrders, error: updateError } = await db
      .from('orders_delivery')
      .update({ 
        payment_status: 'paid', 
        status: 'waiting_merchant', 
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .or(`payment_intent_id.eq.${payload.id},id.eq.${payload.order_id}`)
      .select('*')

    if (updateError) throw updateError
    if (!updatedOrders || updatedOrders.length === 0) {
      console.error('[LN-Webhook] Pedido não encontrado:', payload.id, payload.order_id)
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: corsHeaders })
    }

    const order = updatedOrders[0]
    console.log(`[LN-Webhook] Pedido ${order.id} marcado como pago.`)

    // 2. Se for recarga de moedas (coin_purchase), creditar o usuário
    if (order.service_type === 'coin_purchase') {
      console.log(`[LN-Webhook] Processando recarga para usuário ${order.user_id}`)
      
      // Obter taxa de conversão atual
      const { data: settings } = await db.from('app_settings_delivery').select('izi_coin_rate').maybeSingle()
      const coinRate = settings?.izi_coin_rate || 1.0
      const coinsToAdd = Number(order.total_price) / coinRate

      // Obter saldo atual para o balance_after
      const { data: user } = await db.from('users_delivery').select('izi_coins, wallet_balance').eq('id', order.user_id).single()
      const newIziCoins = Number(user?.izi_coins || 0) + coinsToAdd

      // Atualizar perfil do usuário
      const { error: userUpdateErr } = await db.from('users_delivery')
        .update({ izi_coins: newIziCoins })
        .eq('id', order.user_id)

      if (userUpdateErr) console.error('[LN-Webhook] Erro ao creditar moedas:', userUpdateErr)

      // Registrar transação na carteira
      await db.from('wallet_transactions_delivery').insert({
        user_id: order.user_id,
        amount: coinsToAdd,
        type: 'deposito',
        description: `Recarga via Lightning #${order.id.slice(0,6).toUpperCase()}`,
        status: 'concluido',
        balance_after: newIziCoins,
        metadata: { order_id: order.id, payment_id: payload.id, type: 'coin_purchase' }
      })

      // Marcar pedido como concluído imediatamente (pois é digital)
      await db.from('orders_delivery').update({ status: 'concluido' }).eq('id', order.id)
    }

    return new Response(JSON.stringify({ message: 'OK', orderId: order.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error('[LN-Webhook] Erro:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

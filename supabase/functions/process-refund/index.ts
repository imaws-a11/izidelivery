import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Webhooks internos do Supabase (Database Webhooks) enviam um secret fixo
// Configure o secret em: Supabase Dashboard > Database > Webhooks > Secret
// Salve o valor como SUPABASE_WEBHOOK_SECRET nos Edge Function Secrets
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // webhook interno — não é chamado pelo browser
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // ── GUARD: valida o secret do Supabase Database Webhook ──
  if (WEBHOOK_SECRET) {
    const incomingSecret = req.headers.get('x-webhook-secret') ?? ''
    if (incomingSecret !== WEBHOOK_SECRET) {
      console.error('[process-refund] Secret inválido. Requisição rejeitada.')
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  try {
    const { record } = await req.json()
    const order = record

    if (!order || order.status !== 'cancelado') {
      return new Response(JSON.stringify({ message: 'Not a cancellation' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[process-refund] Iniciando estorno. Pedido: ${order.id}, Método: ${order.payment_method}, Valor: ${order.total_price}`)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Idempotência: verifica se já houve estorno para este pedido
    const { data: existingRefund } = await supabaseAdmin
      .from('wallet_transactions_delivery')
      .select('id')
      .eq('order_id', order.id)
      .eq('type', 'reembolso')
      .maybeSingle()

    if (existingRefund) {
      console.log(`[process-refund] Pedido ${order.id} já possui reembolso. Abortando.`)
      return new Response(JSON.stringify({ message: 'Already refunded' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let refundSuccess = false
    let refundMessage = ''
    let metadata = {}

    const paymentMethod = order.payment_method?.toLowerCase()

    if (paymentMethod === 'wallet' || paymentMethod === 'saldo' || paymentMethod === 'izi pay') {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users_delivery')
        .select('wallet_balance')
        .eq('id', order.user_id)
        .single()

      if (userError) throw userError

      const newBalance = Number(userData.wallet_balance || 0) + Number(order.total_price)

      const { error: updateBalanceError } = await supabaseAdmin
        .from('users_delivery')
        .update({ wallet_balance: newBalance })
        .eq('id', order.user_id)

      if (updateBalanceError) throw updateBalanceError

      const { error: transError } = await supabaseAdmin
        .from('wallet_transactions_delivery')
        .insert({
          user_id: order.user_id,
          order_id: order.id,
          type: 'reembolso',
          amount: order.total_price,
          description: `Estorno de Pedido Cancelado #${order.id.slice(0, 8)}`,
          balance_after: newBalance,
          status: 'concluido'
        })

      if (transError) throw transError

      refundSuccess = true
      refundMessage = 'Estorno realizado com sucesso na carteira Izi Pay.'
    }
    else if (paymentMethod === 'pix' || paymentMethod === 'card' || paymentMethod === 'credit_card') {
      const paymentId = order.payment_intent_id
      if (!paymentId) {
        refundMessage = 'Erro: payment_intent_id não encontrado para estorno no gateway.'
      } else {
        const accessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
        const mpRefundRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}/refunds`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': `refund_${order.id}`
          }
        })

        const refundData = await mpRefundRes.json()
        if (mpRefundRes.ok) {
          refundSuccess = true
          refundMessage = `Estorno ${paymentMethod.toUpperCase()} processado via Mercado Pago.`
          metadata = { refund_id: refundData.id }
          await supabaseAdmin.from('orders_delivery').update({ payment_status: 'refunded' }).eq('id', order.id)
        } else {
          refundMessage = `Erro no Mercado Pago: ${refundData.message || 'Desconhecido'}`
          console.error('[process-refund] Erro MP Refund:', refundData)
        }
      }
    }
    else if (paymentMethod === 'lightning' || paymentMethod === 'bitcoin') {
      refundMessage = 'Estorno Lightning: Requer processamento manual ou fatura de devolução do cliente.'
      metadata = { note: 'Aguardando implementação de LNURL-withdraw ou devolução manual' }
    }
    else {
      refundMessage = `Método de pagamento ${paymentMethod} não suporta estorno automatizado ou é 'Dinheiro'.`
    }

    await supabaseAdmin.from('audit_logs_delivery').insert({
      user_id: order.user_id,
      action: refundSuccess ? 'Estorno Automático Sucesso' : 'Estorno Automático Falha/Manual',
      module: 'Financeiro',
      metadata: {
        orderId: order.id,
        method: paymentMethod,
        amount: order.total_price,
        message: refundMessage,
        success: refundSuccess,
        ...metadata
      }
    })

    return new Response(JSON.stringify({ success: refundSuccess, message: refundMessage }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('[process-refund] Erro:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

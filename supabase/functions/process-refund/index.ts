import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { record } = await req.json()
    const order = record
    
    if (!order || order.status !== 'cancelado') {
      return new Response(JSON.stringify({ message: 'Not a cancellation' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log(`Iniciando estorno para o pedido: ${order.id}, Método: ${order.payment_method}, Valor: ${order.total_price}`)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Idempotência: Verificar se já houve estorno para este pedido
    const { data: existingRefund } = await supabaseAdmin
      .from('wallet_transactions_delivery')
      .select('id')
      .eq('order_id', order.id)
      .eq('type', 'reembolso')
      .maybeSingle()

    if (existingRefund) {
      console.log(`Pedido ${order.id} já possui registro de reembolso. Abortando.`)
      return new Response(JSON.stringify({ message: 'Already refunded' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let refundSuccess = false
    let refundMessage = ''
    let metadata = {}

    const paymentMethod = order.payment_method?.toLowerCase()

    if (paymentMethod === 'wallet' || paymentMethod === 'saldo' || paymentMethod === 'izi pay') {
      // ESTORNO CARTEIRA INTERNA
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users_delivery')
        .select('wallet_balance')
        .eq('id', order.user_id)
        .single()

      if (userError) throw userError

      const newBalance = Number(userData.wallet_balance || 0) + Number(order.total_price)

      // Atualiza saldo do usuário
      const { error: updateBalanceError } = await supabaseAdmin
        .from('users_delivery')
        .update({ wallet_balance: newBalance })
        .eq('id', order.user_id)

      if (updateBalanceError) throw updateBalanceError

      // Registra transação
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
      // ESTORNO MERCADO PAGO (PIX ou CARTÃO)
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
          
          // Atualiza status do pagamento no banco
          await supabaseAdmin.from('orders_delivery').update({ payment_status: 'refunded' }).eq('id', order.id)
        } else {
          refundMessage = `Erro no Mercado Pago: ${refundData.message || 'Desconhecido'}`
          console.error('Erro MP Refund:', refundData)
        }
      }
    }
    else if (paymentMethod === 'lightning' || paymentMethod === 'bitcoin') {
      // ESTORNO BITCOIN LIGHTNING (Via OpenNode ou Manual)
      // OpenNode refunds dependem de saldo e geralmente requerem interação ou LNURL.
      // Por padrão, marcamos para revisão manual ou creditamos na carteira se o usuário preferir.
      // Neste MVP, vamos logar a necessidade de ação manual para segurança.
      refundMessage = 'Estorno Lightning: Requer processamento manual ou fatura de devolução do cliente.'
      metadata = { note: 'Aguardando implementação de LNURL-withdraw ou devolução manual' }
    }
    else {
      refundMessage = `Método de pagamento ${paymentMethod} não suporta estorno automatizado ou é 'Dinheiro'.`
    }

    // REGISTRO DE AUDITORIA
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

    return new Response(JSON.stringify({ 
      success: refundSuccess, 
      message: refundMessage 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (err: any) {
    console.error('Erro no process-refund:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

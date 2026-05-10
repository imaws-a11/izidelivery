import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // webhook externo — chamado pelo servidor do MP
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago
// Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
async function assertMpSignature(req: Request, rawBody: string): Promise<void> {
  const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET') ?? ''
  if (!webhookSecret) {
    // Se o secret não estiver configurado, bloqueia por precaução
    throw new Error('MP_WEBHOOK_SECRET não configurado. Requisição bloqueada.')
  }

  // O MP envia o header x-signature com ts e hash separados por vírgula
  // Formato: "ts=<timestamp>,v1=<hash>"
  const xSignature = req.headers.get('x-signature') ?? ''
  const xRequestId = req.headers.get('x-request-id') ?? ''

  const parts = Object.fromEntries(
    xSignature.split(',').map(part => {
      const [k, v] = part.split('=')
      return [k.trim(), v?.trim()]
    })
  )

  const ts = parts['ts']
  const receivedHash = parts['v1']

  if (!ts || !receivedHash) {
    throw new Error('Assinatura MP ausente ou malformada.')
  }

  // A string a assinar é: "id:<queryId>;request-id:<xRequestId>;ts:<ts>;"
  // Para webhooks de notificação o MP usa o data.id do payload
  // A string exata é: ts + "." + rawBody  — porém o MP especifica:
  // manifest = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
  let dataId = ''
  try {
    const parsed = JSON.parse(rawBody)
    dataId = String(parsed?.data?.id ?? parsed?.id ?? '')
  } catch { /* ignora */ }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const computedHash = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  if (computedHash !== receivedHash) {
    throw new Error('Assinatura MP inválida. Requisição rejeitada.')
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Lê o body uma única vez (streams só podem ser lidos uma vez)
    const rawBody = await req.text()

    // ── GUARD: valida assinatura HMAC do Mercado Pago ──
    await assertMpSignature(req, rawBody)

    const payload = JSON.parse(rawBody)
    console.log('[mp-webhook] Payload verificado. Tipo:', payload.type)

    if (payload.type !== 'payment') {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paymentId = payload.data?.id || payload.id
    if (!paymentId) {
      console.log('[mp-webhook] Ignorado: sem paymentId.')
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? ''
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    const payment = await mpResponse.json()
    console.log('[mp-webhook] status:', payment.status, 'orderId:', payment.external_reference)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const orderId = payment.external_reference

    // Pagamento de Empréstimo
    if (payment.metadata?.type === 'loan_payment') {
      if (payment.status === 'approved') {
        const { error: rpcErr } = await supabaseAdmin.rpc('record_loan_payment_v1', {
          p_loan_id: payment.metadata.loan_id,
          p_user_id: payment.metadata.user_id,
          p_installments_count: payment.metadata.installments_count,
          p_total_amount: payment.transaction_amount,
          p_payment_method: 'pix'
        })
        if (rpcErr) console.error('[mp-webhook] Erro ao registrar pagamento de empréstimo:', rpcErr)

        await supabaseAdmin.from('audit_logs_delivery').insert({
          action: 'Parcela Empréstimo Paga',
          module: 'MercadoPago',
          metadata: { loanId: payment.metadata.loan_id, amount: payment.transaction_amount, status: payment.status },
        })
      }
      return new Response(JSON.stringify({ received: true, type: 'loan_payment' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Recarga de Saldo Lojista
    if (payment.metadata?.type === 'wallet_recharge') {
      console.log(`[mp-webhook] Recarga MerchantID: ${payment.metadata.user_id}, Status: ${payment.status}`)

      if (payment.status === 'approved') {
        const merchantId = payment.metadata.user_id
        const amount = payment.transaction_amount

        const { data: txs } = await supabaseAdmin
          .from('wallet_transactions_delivery')
          .select('amount, type, status')
          .eq('user_id', merchantId)

        const currentBalance = txs?.reduce((acc: number, t: any) => {
          if (t.status === 'cancelado' || t.status === 'estornado') return acc
          const amt = Math.abs(Number(t.amount) || 0)
          return acc + (t.type === 'saque' || t.type === 'debit' ? -amt : amt)
        }, 0) || 0

        const newBalance = currentBalance + amount

        const { error: insErr } = await supabaseAdmin.from('wallet_transactions_delivery').insert({
          user_id: merchantId,
          amount,
          type: 'deposito',
          description: `Recarga via PIX #${String(payment.id).slice(-6)}`,
          status: 'concluido',
          balance_after: newBalance,
          metadata: { mp_payment_id: payment.id }
        })

        if (insErr) throw insErr

        await supabaseAdmin.from('audit_logs_delivery').insert({
          action: 'Recarga Saldo Lojista',
          module: 'Wallet',
          metadata: { merchantId, amount, paymentId: payment.id, balanceAfter: newBalance },
        })

        try {
          await supabaseAdmin.channel(`recharge_confirm_${merchantId}`).send({
            type: 'broadcast',
            event: 'confirmed',
            payload: { merchantId, amount, paymentId: payment.id, balanceAfter: newBalance, timestamp: new Date().toISOString() }
          })
        } catch (broadcastErr: any) {
          console.error('[mp-webhook] Falha no broadcast:', broadcastErr.message)
        }
      }
      return new Response(JSON.stringify({ received: true, type: 'wallet_recharge' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!orderId) {
      console.error('[mp-webhook] external_reference ausente. PaymentID:', paymentId)
      return new Response(JSON.stringify({ error: 'orderId missing' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: order } = await supabaseAdmin
      .from('orders_delivery')
      .select('status, service_type')
      .eq('id', orderId)
      .single()

    if (order?.status === 'concluido' || order?.status === 'cancelado') {
      console.log(`[mp-webhook] Pedido ${orderId} já em estado final. Ignorando.`)
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (payment.status === 'approved') {
      if (order?.service_type === 'coin_purchase' || order?.service_type === 'subscription') {
        await supabaseAdmin.from('orders_delivery').update({
          status: 'concluido',
          paid_at: new Date().toISOString(),
          payment_status: 'approved'
        }).eq('id', orderId)

        if (order.service_type === 'subscription') {
          const { data: orderData } = await supabaseAdmin.from('orders_delivery').select('user_id').eq('id', orderId).single()
          if (orderData?.user_id) {
            await supabaseAdmin.from('users_delivery').update({ is_izi_black: true }).eq('id', orderData.user_id)
          }
        }
      } else {
        await supabaseAdmin.from('orders_delivery').update({
          status: 'waiting_merchant',
          paid_at: new Date().toISOString(),
          payment_status: 'approved'
        }).eq('id', orderId)
      }

      await supabaseAdmin.from('audit_logs_delivery').insert({
        action: 'Pagamento Confirmado',
        module: 'MercadoPago',
        metadata: { orderId, paymentId, amount: payment.transaction_amount, status: payment.status },
      })
    } else if (payment.status === 'in_process') {
      await supabaseAdmin.from('orders_delivery').update({ payment_status: 'in_process' }).eq('id', orderId)
    } else if (payment.status === 'cancelled' || payment.status === 'rejected') {
      await supabaseAdmin.from('orders_delivery').update({ status: 'cancelado', payment_status: payment.status }).eq('id', orderId)
    } else if (payment.status === 'refunded') {
      await supabaseAdmin.from('orders_delivery').update({ status: 'cancelado', payment_status: 'refunded' }).eq('id', orderId)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    const status = err.message.includes('inválida') || err.message.includes('ausente') || err.message.includes('bloqueada') ? 403 : 500
    console.error('[mp-webhook] Erro:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const rawBody = await req.json()
    console.log('[LN] Recebido body:', JSON.stringify(rawBody))
    
    const { amount, orderId, memo } = rawBody
    const amountNum = Number(amount)

    if (!amountNum || !orderId) {
      console.error('[LN] Erro: amount ou orderId ausentes ou inválidos:', { amount, orderId })
      return new Response(JSON.stringify({ error: 'amount e orderId obrigatorios e devem ser validos' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const apiKey = (Deno.env.get('OPENNODE_API_KEY') ?? '').trim()
    if (!apiKey) {
      console.error('[LN] ERRO CRITICO: OPENNODE_API_KEY não configurada no Supabase Secrets.')
      throw new Error('Configuração de pagamento Bitcoin ausente (API Key).')
    }

    // Valores iniciais e fallbacks
    let btcPriceBRL = 350000 
    let usdPriceBRL = 5.20    
    let btcPriceUSD = 65000   
    
    const coinbaseHeaders = { 'User-Agent': 'IziDelivery-EdgeFunction/1.0' }

    // Tentar obter preços atualizados da Coinbase
    try {
      console.log('[LN] Buscando cotações na Coinbase...')
      const [btcRes, usdRes, btcUsdRes] = await Promise.all([
        fetch('https://api.coinbase.com/v2/prices/BTC-BRL/spot', { headers: coinbaseHeaders }),
        fetch('https://api.coinbase.com/v2/prices/USD-BRL/spot', { headers: coinbaseHeaders }),
        fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { headers: coinbaseHeaders })
      ])

      if (btcRes.ok) {
        const p = await btcRes.json()
        btcPriceBRL = parseFloat(p.data.amount) || btcPriceBRL
      }
      
      if (usdRes.ok) {
        const u = await usdRes.json()
        usdPriceBRL = parseFloat(u.data.amount) || usdPriceBRL
      }

      if (btcUsdRes.ok) {
        const b = await btcUsdRes.json()
        btcPriceUSD = parseFloat(b.data.amount) || btcPriceUSD
      }
      console.log(`[LN] Cotações: BTC/BRL=${btcPriceBRL}, USD/BRL=${usdPriceBRL}, BTC/USD=${btcPriceUSD}`)
    } catch (e) {
      console.error('[LN] Erro ao buscar taxas Coinbase (usando fallbacks):', e.message)
    }

    const btcAmount = amountNum / btcPriceBRL;
    const satoshis = Math.round(btcAmount * 100_000_000);
    const finalSatoshis = satoshis > 0 ? satoshis : 1;

    // OpenNode geralmente prefere USD para calcular sats internamente com precisão
    let amountUSD = Number(((amountNum / btcPriceBRL) * btcPriceUSD).toFixed(2))
    
    // Garantir valor mínimo para OpenNode ($0.01)
    if (amountUSD < 0.01) amountUSD = 0.01

    console.log(`[LN] Calculado: R$ ${amountNum} -> $ ${amountUSD} USD -> ${finalSatoshis} sats`)

    const openNodePayload = { 
      amount: amountUSD, 
      currency: 'USD', 
      order_id: orderId, 
      description: memo || `IziDelivery #${orderId.slice(0,8).toUpperCase()}`, 
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/lightning-webhook`, 
      auto_settle: false 
    }
    
    console.log('[LN] Chamando OpenNode...')

    const chargeRes = await fetch('https://api.opennode.com/v1/charges', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': apiKey 
      },
      body: JSON.stringify(openNodePayload),
    })

    if (!chargeRes.ok) {
      const errorText = await chargeRes.text()
      console.error(`[LN] Erro OpenNode API (${chargeRes.status}):`, errorText)
      throw new Error(`OpenNode Error (${chargeRes.status}): ${errorText}`)
    }

    const responseJson = await chargeRes.json()
    const charge = responseJson.data
    
    if (!charge || !charge.id) {
      console.error('[LN] Resposta OpenNode malformada:', JSON.stringify(responseJson))
      throw new Error('Resposta do provedor de pagamento inválida.')
    }

    console.log(`[LN] Charge criada: ${charge.id}`)

    // Conectar ao Supabase para salvar o ID da cobrança
    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', 
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: updateError } = await db.from('orders_delivery')
      .update({ 
        payment_intent_id: charge.id, 
        payment_status: 'pending' 
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('[LN] Erro ao atualizar pedido no banco:', updateError)
    }

    const responseData = { 
      chargeId: charge.id, 
      payment_request: charge.lightning_invoice?.payreq, 
      hosted_checkout: charge.hosted_checkout_url, 
      satoshis: finalSatoshis, 
      amount_brl: amountNum, 
      btc_price_brl: btcPriceBRL 
    }

    return new Response(JSON.stringify(responseData), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (err: any) {
    console.error('[LN] Erro Crítico:', err.message)
    return new Response(JSON.stringify({ 
      error: err.message,
      stack: err.stack, // Apenas para debug interno, Supabase logs capturam isso
      details: 'Consulte os logs da função para mais informações.'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})


import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const rawBody = await req.json()
    console.log('Recebido create-lightning-invoice body:', JSON.stringify(rawBody))
    
    const { amount, orderId, memo } = rawBody
    if (!amount || !orderId) {
      console.error('Erro: amount ou orderId ausentes')
      return new Response(JSON.stringify({ error: 'amount e orderId obrigatorios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const apiKey = Deno.env.get('OPENNODE_API_KEY') ?? ''
    if (!apiKey) console.warn('Aviso: OPENNODE_API_KEY no configurado')

    // Valores iniciais e fallbacks
    let btcPriceBRL = 350000 // Fallback conservador
    let usdPriceBRL = 5.20    // Fallback conservador
    
    // Tentar obter preos atualizados da Coinbase
    try {
      const btcRes = await fetch('https://api.coinbase.com/v2/prices/BTC-BRL/spot')
      if (btcRes.ok) {
        const p = await btcRes.json()
        btcPriceBRL = parseFloat(p.data.amount) || btcPriceBRL
        console.log(`Preo BTC obtido: R$ ${btcPriceBRL}`)
      }
      
      const usdRes = await fetch('https://api.coinbase.com/v2/prices/USD-BRL/spot')
      if (usdRes.ok) {
        const u = await usdRes.json()
        usdPriceBRL = parseFloat(u.data.amount) || usdPriceBRL
        console.log(`Preo USD obtido: R$ ${usdPriceBRL}`)
      }
      const btcUsdRes = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot')
      if (btcUsdRes.ok) {
        const b = await btcUsdRes.json()
        btcPriceUSD = parseFloat(b.data.amount) || btcPriceUSD
      }
    } catch (e) {
      console.error('Erro ao buscar taxas de cmbio Coinbase:', e.message)
    }

    console.log(`[LN] Calculando Invoice: BRL=${amount}, BTC/BRL=${btcPriceBRL}, BTC/USD=${btcPriceUSD}, OrderId=${orderId}`);

    const amountNum = Number(amount)
    const btcAmount = amountNum / btcPriceBRL;
    const satoshis = Math.round(btcAmount * 100_000_000);

    // Valor mínimo de 1 satoshi para evitar exibir 0
    const finalSatoshis = satoshis > 0 ? satoshis : 1;

    console.log(`[LN] Resultado: BTC=${btcAmount.toFixed(10)}, Satoshis=${finalSatoshis}`);

    let amountUSD = (amountNum / btcPriceBRL) * btcPriceUSD
    
    // Garantir que amountUSD no seja 0 se o amount for > 0
    if (amountNum > 0 && amountUSD < 0.01) {
      amountUSD = 0.01
    }

    console.log(`Processando fatura: R$ ${amountNum} -> $ ${amountUSD} USD -> ${finalSatoshis} sats`)

    // Criar cobrana no OpenNode
    // Nota: Usamos USD como moeda base para a cobrana para que o OpenNode calcule os sats na cotao dele
    const openNodePayload = { 
      amount: amountUSD, 
      currency: 'USD', 
      order_id: orderId, 
      description: memo || `IziDelivery #${orderId.slice(0,8).toUpperCase()}`, 
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/lightning-webhook`, 
      auto_settle: false 
    }
    
    console.log('Enviando para OpenNode:', JSON.stringify(openNodePayload))

    const chargeRes = await fetch('https://api.opennode.com/v1/charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': apiKey },
      body: JSON.stringify(openNodePayload),
    })

    if (!chargeRes.ok) {
      const errorText = await chargeRes.text()
      console.error(`Erro OpenNode API (${chargeRes.status}):`, errorText)
      throw new Error(`OpenNode: ${errorText}`)
    }

    const { data: charge } = await chargeRes.json()
    console.log(`Charge criada com sucesso: ${charge.id}, Invoice: ${charge.lightning_invoice?.payreq ? 'Gerada' : 'NO gerada'}`);

    // Conectar ao Supabase para salvar o ID da cobrana
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
      console.error('Erro ao atualizar pedido no banco de dados:', updateError)
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
    console.error('Erro crtico na Edge Function:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

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
    const { amount, orderId, memo } = await req.json()

    if (!amount || !orderId) {
      return new Response(JSON.stringify({ error: 'amount and orderId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Obter cotação BTC/BRL (ex: Coinbase ou Blockchain.info)
    const priceRes = await fetch('https://api.coinbase.com/v2/prices/BTC-BRL/spot')
    const priceData = await priceRes.json()
    const btcPriceBRL = parseFloat(priceData.data.amount)

    // 2. Converter BRL para Satoshis
    // (Valor em BRL / Preço de 1 BTC em BRL) * 100,000,000 (Sats em 1 BTC)
    const satoshis = Math.round((Number(amount) / btcPriceBRL) * 100000000)

    // 3. Criar Invoice no LNbits
    const lnbitsUrl = Deno.env.get('LNBITS_URL') || 'https://legend.lnbits.com'
    const lnbitsKey = Deno.env.get('LNBITS_API_KEY') // Deve ser a "Invoice/read key" ou "Admin key"

    const lnResponse = await fetch(`${lnbitsUrl}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': lnbitsKey ?? '',
      },
      body: JSON.stringify({
        out: false,
        amount: satoshis,
        memo: memo || `Pedido IziDelivery #${orderId.slice(0, 8).toUpperCase()}`,
        webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/lightning-webhook`,
      }),
    })

    const lnData = await lnResponse.json()

    if (!lnResponse.ok) {
      throw new Error(`LNbits Error: ${JSON.stringify(lnData)}`)
    }

    // 4. Atualizar pedido no Supabase com o payment_hash (para conferência no webhook)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await supabaseAdmin
      .from('orders_delivery')
      .update({ 
        payment_intent_id: lnData.payment_hash,
        payment_status: 'pending' 
      })
      .eq('id', orderId)

    return new Response(
      JSON.stringify({
        payment_hash: lnData.payment_hash,
        payment_request: lnData.payment_request, // BOLT11
        satoshis,
        amount_brl: amount,
        btc_price_brl: btcPriceBRL
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('Lightning Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

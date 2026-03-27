import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { amount, orderId, memo } = await req.json()
    if (!amount || !orderId) return new Response(JSON.stringify({ error: 'amount e orderId obrigatorios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const apiKey = Deno.env.get('OPENNODE_API_KEY') ?? ''
    let btcPriceBRL = 0, satoshis = 0, amountUSD = Number((Number(amount) / 5.0).toFixed(2))
    try {
      const p = await (await fetch('https://api.coinbase.com/v2/prices/BTC-BRL/spot')).json()
      btcPriceBRL = parseFloat(p.data.amount)
      satoshis = Math.round((Number(amount) / btcPriceBRL) * 100_000_000)
      const u = await (await fetch('https://api.coinbase.com/v2/prices/USD-BRL/spot')).json()
      amountUSD = Number((Number(amount) / parseFloat(u.data.amount)).toFixed(2))
    } catch (_) {}
    const chargeRes = await fetch('https://api.opennode.com/v1/charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': apiKey },
      body: JSON.stringify({ amount: amountUSD, currency: 'USD', order_id: orderId, description: memo || `IziDelivery #${orderId.slice(0,8).toUpperCase()}`, callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/lightning-webhook`, auto_settle: false }),
    })
    if (!chargeRes.ok) throw new Error(`OpenNode: ${JSON.stringify(await chargeRes.json())}`)
    const { data: charge } = await chargeRes.json()
    console.log(`Charge criada: ${charge.id}, Invoice: ${charge.lightning_invoice?.payreq ? 'Sim' : 'Não'}`);
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { autoRefreshToken: false, persistSession: false } })
    await db.from('orders_delivery').update({ payment_intent_id: charge.id, payment_status: 'pending' }).eq('id', orderId)
    return new Response(JSON.stringify({ chargeId: charge.id, payment_request: charge.lightning_invoice?.payreq, hosted_checkout: charge.hosted_checkout_url, satoshis, amount_brl: amount, btc_price_brl: btcPriceBRL }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

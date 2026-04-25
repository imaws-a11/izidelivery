import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
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

    console.log('OpenNode webhook recebido. Content-Type:', contentType)
    console.log('Payload:', JSON.stringify(payload))

    // OpenNode envia status: 'paid' quando confirmado
    if (payload.status !== 'paid') {
      console.log('Status não é "paid", ignorando:', payload.status)
      return new Response(JSON.stringify({ message: `Status '${payload.status}' ignorado` }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const openNodeChargeId = payload.id
    const internalOrderId = payload.order_id // ID que enviamos na criação (order.id)

    if (!openNodeChargeId && !internalOrderId) {
      console.error('Dados de identificação ausentes no payload (id/order_id)')
      return new Response(JSON.stringify({ error: 'Missing charge/order identification' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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

    console.log(`[LN-WEBHOOK] Tentando confirmar pagamento. ChargeID: ${openNodeChargeId}, InternalID: ${internalOrderId}`);

    // Tentativa 1: Localizar pelo payment_intent_id (ID da cobrança OpenNode)
    let query = db.from('orders_delivery').update({ 
      payment_status: 'paid', 
      status: 'waiting_merchant',
      updated_at: new Date().toISOString()
    })

    if (openNodeChargeId) {
      query = query.eq('payment_intent_id', openNodeChargeId)
    } else {
      query = query.eq('id', internalOrderId)
    }

    const { data: updateData, error: updateError } = await query.select('*')

    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError)
      throw updateError
    }

    // Tentativa 2: Se falhou na primeira e temos o internalOrderId, tentamos por ele diretamente caso o intent_id não tenha batido
    if ((!updateData || updateData.length === 0) && internalOrderId && openNodeChargeId) {
       console.log(`[LN-WEBHOOK] IntentID não encontrado, tentando por ID interno: ${internalOrderId}`);
       const { data: retryData, error: retryError } = await db
         .from('orders_delivery')
         .update({ 
           payment_status: 'paid', 
           status: 'waiting_merchant',
           payment_intent_id: openNodeChargeId, // Força o vínculo se não estava vinculado
           updated_at: new Date().toISOString()
         })
         .eq('id', internalOrderId)
         .select('*')
       
       if (retryError) {
         console.error('Erro no retry do webhook:', retryError)
         throw retryError
       }

       if (retryData && retryData.length > 0) {
         console.log('Pedido confirmado via ID interno com sucesso!', internalOrderId)
         return new Response(JSON.stringify({ message: 'OK', method: 'retry_internal_id', updated: 1 }), { 
           status: 200, 
           headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
         })
       }
    }

    if (!updateData || updateData.length === 0) {
      console.warn(`[LN-WEBHOOK] Nenhum pedido encontrado para atualizar. IDs: ${openNodeChargeId} / ${internalOrderId}`);
      return new Response(JSON.stringify({ message: 'No order found', updated: 0 }), { 
        status: 200, // Retornamos 200 para o OpenNode não ficar tentando reenviar se o pedido sumiu
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    console.log('Pedido confirmado via IntentID com sucesso!', openNodeChargeId, updateData)

    return new Response(JSON.stringify({ message: 'OK', method: 'intent_id', updated: updateData.length }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (err: any) {
    console.error('Erro crítico no lightning-webhook:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})


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
      return new Response(JSON.stringify({ message: 'Status ignorado' }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const chargeId = payload.id
    const orderIdPayload = payload.order_id // Opcional: ID que enviamos na criação

    if (!chargeId) {
      console.error('Charge ID ausente no payload')
      return new Response(JSON.stringify({ error: 'Missing charge id' }), { 
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

    // Tentar atualizar pelo payment_intent_id (Charge ID do OpenNode)
    const { data: updateData, error: updateError } = await db
      .from('orders_delivery')
      .update({ 
        payment_status: 'paid', 
        status: 'novo',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', chargeId)
      .select('id, service_type, user_id')

    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError)
      throw updateError
    }

    console.log('Pedido confirmado com sucesso!', chargeId, updateData)

    return new Response(JSON.stringify({ message: 'OK', updated: updateData?.length || 0 }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (err: any) {
    console.error('Erro no lightning-webhook:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})


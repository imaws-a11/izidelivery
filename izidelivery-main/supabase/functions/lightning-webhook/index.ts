import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const payload = await req.json()
    console.log('Lightning Webhook Payload:', JSON.stringify(payload))

    // O LNbits envia o webhook quando o pagamento é liquidado
    const { payment_hash } = payload

    if (!payment_hash) {
      return new Response('Missing payment_hash', { status: 400 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Atualizar o status do pedido associado a este hash
    // (Ajuste 'status' e 'pago' conforme o seu sistema de status interno)
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders_delivery')
      .update({ 
        payment_status: 'paid',
        status: 'novo' // Ou o status que dispara o envio para a cozinha
      })
      .eq('payment_intent_id', payment_hash)
      .select('id, store_id')
      .single()

    if (updateError || !updatedOrder) {
      console.error('Error updating order for lightning:', updateError)
      return new Response('Order update failed', { status: 404 })
    }

    console.log('Payment confirmed for order:', updatedOrder.id)

    // Opcional: Notificar estabelecimento se necessário, embora o Realtime já faça isso
    return new Response('OK', { status: 200 })

  } catch (err: any) {
    console.error('Lightning Webhook Error:', err.message)
    return new Response(err.message, { status: 500 })
  }
})

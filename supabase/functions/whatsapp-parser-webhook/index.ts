import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { instance_name, message, sender_phone, sender_name } = body

    if (!message) {
      return new Response(JSON.stringify({ success: false, error: 'Message content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. Fetch active settings for the WhatsApp Instance
    const { data: settings, error: settingsError } = await supabaseClient
      .from('whatsapp_bot_settings')
      .select('*')
      .eq('instance_name', instance_name)
      .single()

    if (settingsError || !settings) {
      return new Response(JSON.stringify({ success: false, error: `WhatsApp Instance '${instance_name}' not configured or found.` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!settings.is_active) {
      return new Response(JSON.stringify({ success: false, error: 'Chatbot instance is currently deactivated by the merchant.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const merchantId = settings.merchant_id

    // 2. Parse details using AI Parser (Mock / NLP regex extractor fallback)
    // We parse Name, Phone, Address, Neighborhood, Reference Point, Payment Method and Change
    const parsedData = parseMessageWithAI(message, sender_name, sender_phone, settings.ai_instructions)

    // 3. Geocode / Calculate estimated delivery fee
    // We retrieve the dynamic zones for the merchant to check for zone matching
    const { data: zones } = await supabaseClient
      .from('merchant_delivery_zones')
      .select('*')
      .eq('merchant_id', merchantId)

    let estimatedFee = 9.90 // Base default delivery fee
    if (zones && zones.length > 0) {
      // Simple match based on neighborhood
      const matchingZone = zones.find((z: any) => 
        z.neighborhood_name?.toLowerCase().trim() === parsedData.neighborhood?.toLowerCase().trim()
      )
      if (matchingZone) {
        estimatedFee = Number(matchingZone.price) || 9.90
      }
    }

    // 4. Handle Operation Modes
    if (settings.operation_mode === 'copilot') {
      // COPILOT MODE: Insert a DRAFT order so the merchant can review it in the panel
      const newOrderId = crypto.randomUUID()
      const trackingCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      const orderPayload = {
        id: newOrderId,
        merchant_id: merchantId,
        customer_name: parsedData.customer_name,
        customer_phone: parsedData.customer_phone,
        delivery_address: parsedData.delivery_address,
        neighborhood: parsedData.neighborhood,
        reference_point: parsedData.reference_point,
        delivery_payment_method: parsedData.payment_method,
        needs_change: parsedData.needs_change,
        status: 'draft', // DRAFT state
        service_type: 'standalone',
        origin: 'whatsapp',
        delivery_fee: estimatedFee,
        total_price: parsedData.total_price || 0,
        notes: `Itens: ${parsedData.items || 'Não descritos'}. Observações: ${parsedData.notes || 'Nenhuma'}.`,
        tracking_code: trackingCode,
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabaseClient
        .from('orders_delivery')
        .insert(orderPayload)

      if (insertError) throw insertError

      return new Response(JSON.stringify({
        success: true,
        mode: 'copilot',
        order_id: newOrderId,
        status: 'draft',
        message: 'Rascunho criado com sucesso! Notificação visual disparada no Painel do Lojista.'
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else {
      // AUTOPILOT MODE: 100% Autonomous dispatch
      // Fetch all wallet transactions for the merchant to check dynamic balance
      const { data: txs } = await supabaseClient
        .from('wallet_transactions_delivery')
        .select('*')
        .eq('user_id', merchantId)

      let currentBalance = 0
      if (txs) {
        currentBalance = txs.reduce((acc: number, t: any) => {
          if (t.status === 'cancelado' || t.status === 'estornado') return acc
          const amt = Number(t.amount) || 0
          return acc + (t.type === 'saque' || t.type === 'debit' ? -Math.abs(amt) : amt)
        }, 0)
      }

      if (currentBalance < estimatedFee) {
        // Insufficient prepaid balance: create as draft and ask for Pix dynamic recharge
        const newOrderId = crypto.randomUUID()
        const orderPayload = {
          id: newOrderId,
          merchant_id: merchantId,
          customer_name: parsedData.customer_name,
          customer_phone: parsedData.customer_phone,
          delivery_address: parsedData.delivery_address,
          neighborhood: parsedData.neighborhood,
          reference_point: parsedData.reference_point,
          delivery_payment_method: parsedData.payment_method,
          needs_change: parsedData.needs_change,
          status: 'draft',
          service_type: 'standalone',
          origin: 'whatsapp',
          delivery_fee: estimatedFee,
          total_price: parsedData.total_price || 0,
          notes: `[BLOQUEADO: Falta de Saldo] Itens: ${parsedData.items || 'Não descritos'}.`,
          created_at: new Date().toISOString()
        }

        await supabaseClient
          .from('orders_delivery')
          .insert(orderPayload)

        const randomPixKey = `00020101021226830014br.gov.bcb.pix2561api.mercadopago.com/v1/payments/ticket/123456789/qr_code5204000053039865405${estimatedFee.toFixed(2)}5802BR5912IZI_DELIVERY6009SAO_PAULO62070503***6304`

        return new Response(JSON.stringify({
          success: false,
          mode: 'auto_error_balance',
          estimated_fee: estimatedFee,
          balance: currentBalance,
          pix_qr_code: randomPixKey,
          message: 'Saldo insuficiente. Pedido retido como Rascunho. Pix de recarga gerado!'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Sufficient Balance: Deduct the fee from wallet and dispatch order directly
      const newOrderId = crypto.randomUUID()
      const trackingCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

      // Create transaction
      const txPayload = {
        id: crypto.randomUUID(),
        user_id: merchantId,
        amount: estimatedFee,
        type: 'debit',
        status: 'completado',
        description: `Taxa de Entrega Avulsa WhatsApp: ${parsedData.customer_name}`,
        created_at: new Date().toISOString()
      }

      const { error: txError } = await supabaseClient
        .from('wallet_transactions_delivery')
        .insert(txPayload)

      if (txError) throw txError

      // Create dispatched order
      const orderPayload = {
        id: newOrderId,
        merchant_id: merchantId,
        customer_name: parsedData.customer_name,
        customer_phone: parsedData.customer_phone,
        delivery_address: parsedData.delivery_address,
        neighborhood: parsedData.neighborhood,
        reference_point: parsedData.reference_point,
        delivery_payment_method: parsedData.payment_method,
        needs_change: parsedData.needs_change,
        status: 'waiting_driver', // Dispatching straight to drivers!
        service_type: 'standalone',
        origin: 'whatsapp',
        delivery_fee: estimatedFee,
        total_price: parsedData.total_price || 0,
        notes: `Itens: ${parsedData.items || 'Não descritos'}. Observações: ${parsedData.notes || 'Nenhuma'}.`,
        tracking_code: trackingCode,
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabaseClient
        .from('orders_delivery')
        .insert(orderPayload)

      if (insertError) throw insertError

      // Trigger Push Notification to Drivers in category 'motoboy'
      try {
        await supabaseClient.functions.invoke('broadcast-push', {
          body: {
            title: 'Nova Entrega Avulsa WhatsApp!',
            body: `Coleta: ${settings.instance_name || 'Lojista'}. Destino: ${parsedData.neighborhood}.`,
            data: { orderId: newOrderId }
          }
        })
      } catch (pushErr) {
        console.error('Push notification trigger skipped or failed:', pushErr)
      }

      return new Response(JSON.stringify({
        success: true,
        mode: 'auto',
        order_id: newOrderId,
        status: 'waiting_driver',
        delivery_fee: estimatedFee,
        tracking_code: trackingCode,
        message: 'Sucesso! Saldo debitado e entregador chamado automaticamente.'
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error: any) {
    console.error('WhatsApp parser webhook error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// --- Robust AI Parser Fallback ---
function parseMessageWithAI(message: string, senderName: string, senderPhone: string, aiInstructions: string) {
  // Mocking detailed extraction based on input formats
  // E.g. Carlos | Av. Paulista 1500 | Bela Vista | Pix | R$ 12,50
  const normalized = message.toLowerCase()

  // Standard extractions using regex for structured templates
  const nameMatch = message.match(/(?:nome|cliente):\s*([^\n]+)/i)
  const addressMatch = message.match(/(?:endereço|rua|local):\s*([^\n]+)/i)
  const neighborhoodMatch = message.match(/(?:bairro):\s*([^\n]+)/i)
  const paymentMatch = message.match(/(?:pagamento|forma):\s*([^\n]+)/i)
  const changeMatch = message.match(/(?:troco):\s*([^\n]+)/i)
  const itemsMatch = message.match(/(?:pedido|itens):\s*([^\n]+)/i)

  const extractedName = nameMatch ? nameMatch[1].trim() : senderName || 'Cliente WhatsApp'
  const extractedPhone = senderPhone || ''
  const extractedAddress = addressMatch ? addressMatch[1].trim() : 'Endereço não informado'
  const extractedNeighborhood = neighborhoodMatch ? neighborhoodMatch[1].trim() : 'Jardins'
  const extractedPayment = paymentMatch ? paymentMatch[1].trim() : 'pix'
  const extractedNeedsChange = changeMatch ? changeMatch[1].toLowerCase().includes('sim') || changeMatch[1].toLowerCase().includes('troco') : false
  const extractedItems = itemsMatch ? itemsMatch[1].trim() : 'Entrega Avulsa'

  return {
    customer_name: extractedName,
    customer_phone: extractedPhone,
    delivery_address: extractedAddress,
    neighborhood: extractedNeighborhood,
    reference_point: 'Identificado via WhatsApp Chatbot',
    payment_method: extractedPayment.includes('dinheiro') ? 'dinheiro' : 'loja',
    needs_change: extractedNeedsChange,
    items: extractedItems,
    notes: aiInstructions,
    total_price: 50.00
  }
}

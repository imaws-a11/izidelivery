import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

    // 1. Authenticate Request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Missing or invalid Bearer token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify token
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from('merchant_api_keys')
      .select('merchant_id, is_active')
      .eq('api_key', token)
      .single()

    if (apiKeyError || !apiKeyData || !apiKeyData.is_active) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Invalid or inactive API Key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const merchantId = apiKeyData.merchant_id

    // Update last_used_at
    await supabaseClient
      .from('merchant_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('api_key', token)

    // 2. Route Request
    const url = new URL(req.url)
    const path = url.pathname.replace(/\/$/, '')

    if (req.method === 'POST' && path.endsWith('/quote')) {
      return await handleQuote(req, merchantId, supabaseClient)
    } else if (req.method === 'POST' && path.endsWith('/orders')) {
      return await handleCreateOrder(req, merchantId, supabaseClient)
    } else if (req.method === 'GET' && path.includes('/orders/')) {
      const parts = path.split('/')
      const orderId = parts[parts.length - 1]
      return await handleGetOrder(orderId, merchantId, supabaseClient)
    }

    return new Response(JSON.stringify({ success: false, error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Integration API Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// --- Handlers ---

async function handleQuote(req: Request, merchantId: string, supabaseClient: any) {
  const body = await req.json()
  const { pickup_address, delivery_address } = body

  if (!pickup_address || !delivery_address) {
    return new Response(JSON.stringify({ success: false, error: 'Missing addresses' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // TODO: Use Google Maps Distance Matrix API or similar to get real distance.
  // For MVP, we will return a simulated mock distance, since edge function doesn't easily have maps logic without an API key
  // Ideally, the merchant's location and the delivery address are geocoded here.

  return new Response(JSON.stringify({
    success: true,
    distance_km: 2.5, // Mock value
    estimated_fee: 8.50, // Mock value (must connect to dynamic_rates_delivery later)
    currency: "BRL"
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleCreateOrder(req: Request, merchantId: string, supabaseClient: any) {
  const body = await req.json()
  
  // Basic validation
  if (!body.pickup_address || !body.delivery_address || !body.customer) {
    return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const newOrderId = crypto.randomUUID()
  const trackingCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const orderPayload = {
    id: newOrderId,
    merchant_id: merchantId,
    external_order_id: body.external_id,
    customer_name: body.customer.name,
    customer_phone: body.customer.phone,
    pickup_address: body.pickup_address,
    delivery_address: body.delivery_address,
    payment_method: body.payment?.method || 'pix',
    total_price: body.payment?.total_value || 0,
    status: 'waiting_driver',
    service_type: 'standalone', // Identifies it as external standalone delivery
    notes: body.notes || '',
    tracking_code: trackingCode,
    created_at: new Date().toISOString()
  }

  const { error } = await supabaseClient
    .from('orders_delivery')
    .insert(orderPayload)

  if (error) {
    throw error
  }

  return new Response(JSON.stringify({
    success: true,
    izi_order_id: newOrderId,
    status: 'waiting_driver',
    tracking_url: `https://app.izidelivery.com/tracking/${trackingCode}` // Update with real domain
  }), {
    status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleGetOrder(orderId: string, merchantId: string, supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('orders_delivery')
    .select('id, status, driver_id, external_order_id, tracking_code')
    .eq('id', orderId)
    .eq('merchant_id', merchantId)
    .single()

  if (error || !data) {
    return new Response(JSON.stringify({ success: false, error: 'Order not found or unauthorized' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  let driverInfo = null;
  if (data.driver_id) {
    const { data: driver } = await supabaseClient
      .from('drivers_delivery')
      .select('name, phone, vehicle_model, license_plate')
      .eq('id', data.driver_id)
      .single()
      
    if (driver) {
      driverInfo = {
        name: driver.name,
        phone: driver.phone,
        vehicle: driver.vehicle_model,
        plate: driver.license_plate
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    izi_order_id: data.id,
    external_id: data.external_order_id,
    status: data.status,
    driver: driverInfo
  }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

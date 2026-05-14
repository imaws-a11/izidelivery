import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // This function will be called by a Database Webhook or pg_net trigger
    const payload = await req.json();

    // Verify it's an UPDATE on orders_delivery
    if (payload.type !== 'UPDATE' || payload.table !== 'orders_delivery') {
      return new Response(JSON.stringify({ error: 'Invalid payload type or table' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const newRecord = payload.record;
    const oldRecord = payload.old_record;

    // Only dispatch if status changed
    if (newRecord.status === oldRecord.status) {
      return new Response(JSON.stringify({ message: 'Status did not change, ignoring' }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Only for deliveries with a merchant attached
    if (!newRecord.merchant_id) {
       return new Response(JSON.stringify({ message: 'No merchant_id, ignoring' }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch the webhook config for this merchant
    const { data: config, error: configError } = await supabaseClient
      .from('store_webhook_configs')
      .select('webhook_url, secret_key, is_active')
      .eq('store_id', newRecord.merchant_id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      // No active config found for this merchant, which is fine
      return new Response(JSON.stringify({ message: 'No active webhook config found for merchant' }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Optional: Fetch driver details if there is a driver assigned
    let driverData = null;
    if (newRecord.driver_id) {
      const { data: driver } = await supabaseClient
        .from('drivers_delivery')
        .select('users_delivery(name, phone), vehicle_plate, vehicle_model')
        .eq('id', newRecord.driver_id)
        .single();
      
      if (driver) {
        driverData = {
          name: driver.users_delivery?.name,
          phone: driver.users_delivery?.phone,
          vehicle: driver.vehicle_model,
          plate: driver.vehicle_plate
        };
      }
    }

    // Construct the payload to send to the merchant
    const webhookPayload = {
      event: "order.status_updated",
      created_at: new Date().toISOString(),
      data: {
        izi_order_id: newRecord.id,
        merchant_order_id: newRecord.id, // Replace with merchant's own order ID if stored in a different column
        status: newRecord.status,
        driver: driverData,
        tracking_code: newRecord.tracking_code,
        notes: newRecord.cancel_reason || null,
        timestamp: new Date().toISOString()
      }
    };

    const payloadString = JSON.stringify(webhookPayload);

    // Create HMAC signature using the merchant's secret key
    const signature = hmac("sha256", config.secret_key, payloadString, "utf8", "hex");

    // Make the POST request to the merchant's webhook URL
    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-izi-signature': signature as string
      },
      body: payloadString
    });

    if (!response.ok) {
        console.error(`Failed to send webhook to ${config.webhook_url}. Status: ${response.status}`);
        // Here you could implement retry logic or log the failure to a database table
        return new Response(JSON.stringify({ error: `Webhook delivery failed with status ${response.status}` }), { 
            status: 502, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    return new Response(JSON.stringify({ success: true, message: 'Webhook dispatched successfully' }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

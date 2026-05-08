import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import admin from 'npm:firebase-admin@11.11.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Inicia o Firebase Admin assim que o servidor subir (recuperando do Segredo de Ambiente)
try {
  const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (serviceAccountRaw && !admin.apps.length) {
    const serviceAccount = JSON.parse(serviceAccountRaw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (err) {
  console.error("Aviso: Falha ao carregar credenciais do FIREBASE_SERVICE_ACCOUNT", err);
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // Usar SERVICE_ROLE para ignorar RLS
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { driver_id, user_id, merchant_id, title, body, data } = await req.json()

    if (!driver_id && !user_id && !merchant_id) {
      throw new Error("Um identificador (driver_id, user_id ou merchant_id) é obrigatório");
    }

    if (!admin.apps.length) {
        throw new Error("O Firebase Admin SDK não foi inicializado. Crie o secret FIREBASE_SERVICE_ACCOUNT na Dashboard.");
    }

    let targetToken = null;

    if (driver_id) {
      if (driver_id === 'all') {
        let query = supabase.from('drivers_delivery').select('push_token').not('push_token', 'is', null);

        // Lógica de Despacho Exclusivo
        if (merchant_id) {
          const { data: mData } = await supabase
            .from('admin_users')
            .select('dispatch_priority')
            .eq('id', merchant_id)
            .single();

          if (mData?.dispatch_priority === 'exclusive') {
            console.log(`[EXCLUSIVE_DISPATCH] Filtrando apenas motoboys do lojista: ${merchant_id}`);
            query = query.eq('merchant_id', merchant_id);
          }
        }

        const { data: driversData, error: driversError } = await query;

        if (driversError || !driversData || driversData.length === 0) {
          throw new Error("Nenhum entregador com push_token encontrado para este despacho.");
        }

        const tokens = driversData.map((d: any) => d.push_token).filter(Boolean);
        const message = {
          notification: { 
            title: title || '🛵 Nova Entrega IZI!', 
            body: body || 'Um novo pedido aguarda um entregador na região. Seja rápido!' 
          },
          android: {
            notification: {
              channelId: 'izi_notifications',
              priority: 'high',
              sound: 'default'
            }
          },
          data: data || { context: "geral" },
          tokens: tokens,
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`[PUSH] Enviado para ${response.successCount} motoboys.`);
        return new Response(JSON.stringify({ success: true, sent: response.successCount }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: dData } = await supabase.from('drivers_delivery').select('push_token').eq('id', driver_id).single();
      targetToken = dData?.push_token;
    } else if (user_id) {
      const { data: uData } = await supabase.from('users_delivery').select('push_token').eq('id', user_id).single();
      targetToken = uData?.push_token;
    } else if (merchant_id) {
      const { data: mData } = await supabase.from('admin_users').select('push_token').eq('id', merchant_id).single();
      targetToken = mData?.push_token;
    }

    if (!targetToken) {
      throw new Error(`Token não encontrado para o destinatário especificado.`);
    }

    const message = {
      notification: {
        title: title || 'Izi Delivery',
        body: body || 'Você tem uma nova atualização.'
      },
      data: data || { context: "geral" },
      token: targetToken,
    };

    const response = await admin.messaging().send(message);

    return new Response(
      JSON.stringify({ success: true, messageId: response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Erro ao enviar Push:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!; // ou SERVICE_ROLE_KEY dependendo das politicas RLS
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { driver_id, title, body, data } = await req.json()

    if (!driver_id) throw new Error("driver_id é obrigatório");

    if (!admin.apps.length) {
        throw new Error("O Firebase Admin SDK não foi inicializado. Crie o secret FIREBASE_SERVICE_ACCOUNT na Dashboard.");
    }

    if (driver_id === 'all') {
      const { data: driversData, error: driversError } = await supabase
        .from('drivers_delivery')
        .select('push_token')
        .not('push_token', 'is', null);

      if (driversError || !driversData || driversData.length === 0) {
        throw new Error("Nenhum entregador com push_token encontrado.");
      }

      const tokens = driversData.map((d: any) => d.push_token).filter(Boolean);
      
      const message = {
        notification: {
          title: title || 'Nova Missão Izi!',
          body: body || 'Temos uma nova entrega disponível na região.'
        },
        data: data || { context: "geral" },
        tokens: tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      return new Response(
        JSON.stringify({ success: true, messageId: response, message: 'Push disparado para todos com sucesso!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Procura o Token FCM do entregador no banco de dados (1 específico)
    const { data: driverData, error: driverError } = await supabase
      .from('drivers_delivery')
      .select('push_token')
      .eq('id', driver_id)
      .single()

    if (driverError || !driverData?.push_token) {
      throw new Error(`Entregador id=${driver_id} não possui um push_token cadastrado no banco.`);
    }

    // Estrutura a mensagem para a nuvem da Google
    const message = {
      notification: {
        title: title || 'Nova Missão Izi!',
        body: body || 'Você tem um novo pedido aguardando.'
      },
      data: data || { context: "geral" }, // permite mandar dados ocultos
      token: driverData.push_token,
    };

    // Dispara via Firebase Cloud Messaging
    const response = await admin.messaging().send(message);

    return new Response(
      JSON.stringify({ success: true, messageId: response, message: 'Push disparado com sucesso!' }),
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

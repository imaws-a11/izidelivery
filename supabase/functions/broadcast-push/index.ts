import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import admin from 'npm:firebase-admin@11.11.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!; 
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { target_type, title, message, image_url, data } = await req.json()

    if (!target_type) {
      throw new Error("O parâmetro target_type é obrigatório ('all', 'users', 'drivers')");
    }

    if (!admin.apps.length) {
        throw new Error("O Firebase Admin SDK não foi inicializado. Crie o secret FIREBASE_SERVICE_ACCOUNT na Dashboard.");
    }

    let tokens: string[] = [];

    if (target_type === 'drivers' || target_type === 'all') {
        const { data: driversData, error: driversError } = await supabase
          .from('drivers_delivery')
          .select('push_token')
          .not('push_token', 'is', null);

        if (!driversError && driversData) {
            tokens = tokens.concat(driversData.map((d: any) => d.push_token).filter(Boolean));
        }
    }

    if (target_type === 'users' || target_type === 'all') {
        const { data: usersData, error: usersError } = await supabase
          .from('users_delivery')
          .select('push_token')
          .not('push_token', 'is', null);

        if (!usersError && usersData) {
            tokens = tokens.concat(usersData.map((d: any) => d.push_token).filter(Boolean));
        }
    }

    // Remove duplicates
    tokens = [...new Set(tokens)];

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "Nenhum push_token nativo encontrado. Transmissão ocorreu apenas via Web/Realtime." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = {
      notification: { 
          title: title || 'Notificação Izi', 
          body: message || '',
          ...(image_url && { image: image_url })
      },
      data: data || { context: "broadcast" },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(payload);

    return new Response(JSON.stringify({ success: true, response }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Erro ao enviar Broadcast Push:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import admin from 'npm:firebase-admin@11.11.1'

const ALLOWED_ORIGINS = [
  'https://izi-admin.vercel.app',
  'http://localhost:5173',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Inicializa Firebase uma única vez
try {
  const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
  if (serviceAccountRaw && !admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountRaw)) })
  }
} catch (err) {
  console.error('[broadcast-push] Falha ao inicializar Firebase:', err)
}

// Valida o JWT do chamador e garante que ele é admin
async function assertCallerIsAdmin(req: Request): Promise<void> {
  const authHeader = req.headers.get('authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '').trim()
  if (!jwt) throw new Error('Não autorizado: token ausente.')

  const supabaseCaller = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  )

  const { data: { user }, error } = await supabaseCaller.auth.getUser()
  if (error || !user) throw new Error('Não autorizado: sessão inválida.')

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: adminRow } = await supabaseAdmin
    .from('admin_users')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!adminRow || !adminRow.is_active || adminRow.role !== 'admin') {
    throw new Error('Não autorizado: permissão insuficiente.')
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── GUARD: apenas admins autenticados podem disparar broadcast ──
    await assertCallerIsAdmin(req)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { target_type, title, message, image_url, data } = await req.json()

    if (!target_type) {
      throw new Error("O parâmetro target_type é obrigatório ('all', 'users', 'drivers')")
    }

    let tokens: string[] = []

    if (target_type === 'drivers' || target_type === 'all') {
      const { data: driversData } = await supabase
        .from('drivers_delivery')
        .select('push_token')
        .not('push_token', 'is', null)

      if (driversData) {
        tokens = tokens.concat(driversData.map((d: any) => d.push_token).filter(Boolean))
      }
    }

    if (target_type === 'users' || target_type === 'all') {
      const { data: usersData } = await supabase
        .from('users_delivery')
        .select('push_token')
        .not('push_token', 'is', null)

      if (usersData) {
        tokens = tokens.concat(usersData.map((d: any) => d.push_token).filter(Boolean))
      }
    }

    tokens = [...new Set(tokens)]

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum push_token nativo encontrado. Transmissão via Web/Realtime concluída.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!admin.apps.length) {
      return new Response(
        JSON.stringify({ success: true, warning: 'Firebase Admin SDK não inicializado. Configure o secret FIREBASE_SERVICE_ACCOUNT.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = {
      notification: {
        title: title || 'Notificação Izi',
        body: message || '',
        ...(image_url && { image: image_url })
      },
      android: {
        notification: {
          channelId: 'izi_notifications',
          priority: 'high',
          sound: 'default'
        }
      },
      data: data || { context: 'broadcast' },
      tokens,
    }

    console.log(`[broadcast-push] Enviando para ${tokens.length} tokens...`)
    const response = await admin.messaging().sendEachForMulticast(payload)
    console.log(`[broadcast-push] Resultado: ${response.successCount} sucessos, ${response.failureCount} falhas.`)

    // PERSISTÊNCIA NO HISTÓRICO EM LOTE (IN-APP SYNC)
    try {
      const historyRows: any[] = [];
      
      if (target_type === 'drivers' || target_type === 'all') {
        const { data: dData } = await supabase.from('drivers_delivery').select('id').not('push_token', 'is', null);
        if (dData) {
          dData.forEach((d: any) => historyRows.push({
            user_id: d.id,
            app_type: 'driver',
            title: title || 'Notificação Izi',
            body: message || '',
            data: data || { context: 'broadcast' },
            status: 'pending'
          }));
        }
      }

      if (target_type === 'users' || target_type === 'all') {
        const { data: uData } = await supabase.from('users_delivery').select('id').not('push_token', 'is', null);
        if (uData) {
          uData.forEach((u: any) => historyRows.push({
            user_id: u.id,
            app_type: 'customer',
            title: title || 'Notificação Izi',
            body: message || '',
            data: data || { context: 'broadcast' },
            status: 'pending'
          }));
        }
      }

      if (historyRows.length > 0) {
        // Inserir em chunks de 500 para evitar limites do Supabase/Postgres
        for (let i = 0; i < historyRows.length; i += 500) {
          const chunk = historyRows.slice(i, i + 500);
          await supabase.from('notifications_delivery').insert(chunk);
        }
        console.log(`[broadcast-push] Histórico persistido para ${historyRows.length} usuários.`);
      }
    } catch (dbErr) {
      console.error('[broadcast-push] Erro ao persistir histórico:', dbErr.message);
    }

    return new Response(
      JSON.stringify({ success: true, sent: response.successCount, failed: response.failureCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    const status = error.message.startsWith('Não autorizado') ? 403 : 400
    console.error('[broadcast-push] Erro:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})

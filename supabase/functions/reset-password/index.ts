import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Responder preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, userEmail } = await req.json()

    if (!userId && !userEmail) {
      return new Response(
        JSON.stringify({ error: 'userId ou userEmail é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Usar service_role para ter permissão de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar que o caller é um admin autenticado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )
    const { data: { user: callerUser }, error: authError } = await supabaseUser.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar que o caller é admin
    const { data: adminRecord } = await supabaseAdmin
      .from('admin_users')
      .select('role')
      .eq('email', callerUser.email)
      .maybeSingle()

    const isMasterAdmin = callerUser.email === Deno.env.get('MASTER_ADMIN_EMAIL')
    if (!isMasterAdmin && adminRecord?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Permissão negada. Apenas admins podem resetar senhas.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar e-mail do usuário pelo ID se necessário
    let targetEmail = userEmail
    if (!targetEmail && userId) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
      targetEmail = userData?.user?.email
    }

    if (!targetEmail) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Gerar link de redefinição de senha
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: targetEmail,
    })

    if (error) throw error

    // Registrar no log de auditoria
    await supabaseAdmin.from('audit_logs_delivery').insert({
      user_id: callerUser.id,
      action: 'Password Reset Sent',
      module: 'Auth',
      metadata: { targetEmail, triggeredBy: callerUser.email }
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Link de redefinição enviado para ${targetEmail}`,
        // Não expor o link em produção — o Supabase envia por e-mail automaticamente
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

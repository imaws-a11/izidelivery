import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGINS = [
  'https://izi-admin.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

// Valida o JWT do chamador e garante que ele é admin na tabela admin_users
async function assertCallerIsAdmin(req: Request): Promise<void> {
  const authHeader = req.headers.get('authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '').trim()

  if (!jwt) throw new Error('Não autorizado: token ausente.')

  // Cria cliente com a anon key para validar o JWT do usuário chamador
  const supabaseCaller = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  )

  const { data: { user }, error } = await supabaseCaller.auth.getUser()
  if (error || !user) throw new Error('Não autorizado: sessão inválida.')

  // Confere na tabela admin_users se o chamador tem role = 'admin'
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: adminRow, error: adminErr } = await supabaseAdmin
    .from('admin_users')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (adminErr || !adminRow) throw new Error('Não autorizado: usuário não encontrado em admin_users.')
  if (!adminRow.is_active) throw new Error('Não autorizado: conta desativada.')
  if (adminRow.role !== 'admin') throw new Error('Não autorizado: permissão insuficiente.')
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── GUARD: apenas admins autenticados podem prosseguir ──
    await assertCallerIsAdmin(req)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, password, role, metadata, userId, action } = await req.json()

    // Caso de deleção
    if (action === 'delete' && userId) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) throw deleteError
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios')
    }

    // Verifica se o usuário já existe no Auth por email
    const { data: { users: existingUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const existingAuthUser = existingUsers.find(u => u.email === email)

    let authUser

    if (existingAuthUser && !userId) {
      throw new Error('Este e-mail já está em uso por outra conta no sistema.')
    }

    if (existingAuthUser && userId && existingAuthUser.id !== userId) {
      throw new Error('Este e-mail já está vinculado a outro usuário.')
    }

    if (existingAuthUser || userId) {
      const targetId = userId || existingAuthUser?.id
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetId,
        {
          password: password,
          user_metadata: { role, ...metadata }
        }
      )
      if (updateError) throw updateError
      authUser = updatedUser.user
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, ...metadata }
      })
      if (createError) throw createError
      authUser = newUser.user
    }

    return new Response(
      JSON.stringify({ user: authUser }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    const status = error.message.startsWith('Não autorizado') ? 403 : 400
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})

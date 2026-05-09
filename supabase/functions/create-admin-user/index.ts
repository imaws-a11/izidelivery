import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
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

    // 1. Verificar se o usuário já existe no Auth por email
    const { data: { users: existingUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    const existingAuthUser = existingUsers.find(u => u.email === email)

    let authUser;

    // Se o usuário já existe e não informamos um userId (intenção de novo cadastro)
    if (existingAuthUser && !userId) {
      throw new Error('Este e-mail já está em uso por outra conta no sistema.')
    }

    // Se o usuário existe e informamos um userId diferente do dono do e-mail
    if (existingAuthUser && userId && existingAuthUser.id !== userId) {
      throw new Error('Este e-mail já está vinculado a outro usuário.')
    }

    if (existingAuthUser || userId) {
      // Se existe (ou informamos o userId para editar), atualizamos
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
      // Se não existe, criamos novo
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

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

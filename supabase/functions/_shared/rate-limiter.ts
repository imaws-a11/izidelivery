import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Valida o rate limit usando a tabela audit_logs_delivery como backend persistente.
 * Retorna true se a requisição estiver dentro do limite, ou lança um erro 429 se ultrapassar.
 */
export async function checkRateLimit(
  req: Request,
  supabaseAdmin: SupabaseClient,
  actionName: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  
  if (clientIp === 'unknown') {
    // Caso não seja possível identificar o IP, falha aberta (não bloqueia)
    return true
  }

  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  // 1. Verifica quantos requests este IP fez na janela de tempo definida
  const { count, error } = await supabaseAdmin
    .from('audit_logs_delivery')
    .select('id', { count: 'exact', head: true })
    .eq('action', `RateLimit:${actionName}`)
    .eq('metadata->>ip', clientIp)
    .gte('created_at', windowStart)

  if (error) {
    console.error(`[RateLimit] Erro ao consultar limites para ${actionName}:`, error.message)
    return true // Falha aberta em caso de erro no BD para não bloquear o sistema inteiro
  }

  // 2. Se estourou o limite, bloqueia a requisição
  if (count !== null && count >= maxRequests) {
    throw new Error(`Too Many Requests - Retry-After: ${windowSeconds}`)
  }

  // 3. Registra a requisição atual
  // Utilizamos fire-and-forget (sem await) para não penalizar a latência da requisição
  supabaseAdmin
    .from('audit_logs_delivery')
    .insert({
      action: `RateLimit:${actionName}`,
      module: 'Security',
      user_id: null, // Sistema
      metadata: { ip: clientIp, path: new URL(req.url).pathname }
    })
    .then(({ error }) => {
      if (error) console.error('[RateLimit] Erro ao registrar log:', error.message)
    })

  return true
}

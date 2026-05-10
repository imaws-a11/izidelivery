import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
export const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas.\n' +
    'Copie .env.example para .env e preencha os valores.'
  );
}

// FIX BUG 4: Supabase client sem configuração de Realtime robusta
// No APK (Android WebView), conexões WebSocket podem cair silenciosamente.
// evictIncompleteSubscriptions: garante que subscriptions zumbis sejam limpas
// heartbeatIntervalMs: mantém a conexão viva com ping frequente
// reconnectAfterMs: reconecta rapidamente após queda (crucial no APK)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 15000,      // Ping a cada 15s (padrão é 30s — muito lento para APK)
    reconnectAfterMs: (tries: number) => {
      // Backoff exponencial: 500ms, 1s, 2s, 4s, 8s... máx 10s
      return Math.min(500 * Math.pow(2, tries), 10000);
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,       // Evita conflito com Capacitor deep links
  },
});

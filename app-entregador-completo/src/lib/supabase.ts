import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
export const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();

if (!supabaseUrl || !supabaseKey) {
 throw new Error(
 'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas.\n' +
 'Copie .env.example para .env e preencha os valores.'
 );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
 realtime: {
 params: {
  eventsPerSecond: 10,
 },
 heartbeatIntervalMs: 15000,
 reconnectAfterMs: (tries: number) => {
  return Math.min(500 * Math.pow(2, tries), 10000);
 },
 },
 auth: {
 persistSession: true,
 autoRefreshToken: true,
 storageKey: 'izi-entregador-auth',
 storage: globalThis.localStorage,
 detectSessionInUrl: false,
 },
});

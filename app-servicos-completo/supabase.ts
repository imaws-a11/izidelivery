import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || '').trim();
const supabaseServiceKey = (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string || '').trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas.\n' +
    'Copie .env.example para .env e preencha os valores.'
  );
}

// Cliente padrão (anon key) — para operações normais
export const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente admin (service role) — bypassa RLS, use apenas para operações do admin
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase; // fallback para anon se não configurado

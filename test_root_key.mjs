
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbqmyozgwpxwxrdwwkwn.supabase.co';
const supabaseKey = 'sb_publishable_ilfY2OcDtJ_-FMBrH4fJ_w_oRmyYcRm';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testando conexão com a chave da RAIZ...');
  const { data, error } = await supabase.from('users_delivery').select('id').limit(1);
  if (error) {
    console.error('Erro na conexão:', error.message);
  } else {
    console.log('Conexão bem-sucedida com a chave da RAIZ! Dados:', data);
  }
}

test();

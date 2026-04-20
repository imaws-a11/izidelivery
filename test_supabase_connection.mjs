
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbqmyozgwpxwxrdwwkwn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icW15b3pnd3B4d3hyZHd3a3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMjM1NjksImV4cCI6MjA4OTg5OTU2OX0.ZPxVz6qGAYb__Pw4Q0KEmRbhuWUE4MJrx6WwGYYtk1w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testando conexão com Supabase...');
  const { data, error } = await supabase.from('users_delivery').select('id').limit(1);
  if (error) {
    console.error('Erro na conexão:', error.message);
    if (error.message.includes('404')) {
      console.log('DICA: O projeto pode estar PAUSADO ou a URL está incorreta.');
    }
  } else {
    console.log('Conexão bem-sucedida! Dados:', data);
  }
}

test();

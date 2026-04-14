const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
let VITE_SUPABASE_URL = '';
let VITE_SUPABASE_ANON_KEY = '';

envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) VITE_SUPABASE_URL = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) VITE_SUPABASE_ANON_KEY = line.split('=')[1].trim();
});

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function testFetch() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  
  console.log('Buscando agendamentos a partir de:', startOfToday);
  const { data, error } = await supabase
      .from('orders_delivery')
      .select('*')
      .not('scheduled_at', 'is', null)
      .gte('scheduled_at', startOfToday)
      .order('scheduled_at', { ascending: true });

  if (error) {
      console.error('Erro:', error);
      return;
  }

  console.log('Dados puros:', data ? data.length : 0);

  const filtered = data.filter(o => {
      // isAvailable test mode
      const isMine = o.driver_id && String(o.driver_id).trim() === 'driver1';
      const isAvailable = !o.driver_id || String(o.driver_id).trim() === '';
      const openStatuses = ['pendente', 'agendado', 'novo', 'waiting_driver', 'waiting_merchant', 'preparando', 'pronto', 'a_caminho_coleta', 'a_caminho', 'confirmado', 'confirmed'];
      const statusOk = openStatuses.includes(o.status);
      return isMine || (isAvailable && statusOk);
  });

  console.log('Filtrados (Disponiveis):', filtered.length);
  process.exit(0);
}

testFetch();

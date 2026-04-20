
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbqmyozgwpxwxrdwwkwn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icW15b3pnd3B4d3hyZHd3a3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMjM1NjksImV4cCI6MjA4OTg5OTU2OX0.ZPxVz6qGAYb__Pw4Q0KEmRbhuWUE4MJrx6WwGYYtk1w';

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

async function testRealtime() {
  console.log('Testando Realtime (WebSocket)...');
  const channel = supabase.channel('test-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_delivery' }, payload => {
      console.log('Mudança recebida:', payload);
    })
    .subscribe((status) => {
      console.log('Status do canal:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Conexão Realtime estabelecida com sucesso!');
        process.exit(0);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Falha ao conectar no Realtime (404 ou erro de rede).');
        process.exit(1);
      }
    });

  // Timeout d 10s
  setTimeout(() => {
    console.error('Timeout aguardando conexão Realtime.');
    process.exit(1);
  }, 10000);
}

testRealtime();

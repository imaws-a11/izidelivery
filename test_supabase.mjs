import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbqmyozgwpxwxrdwwkwn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1icW15b3pnd3B4d3hyZHd3a3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMjM1NjksImV4cCI6MjA4OTg5OTU2OX0.ZPxVz6qGAYb__Pw4Q0KEmRbhuWUE4MJrx6WwGYYtk1w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHealth() {
    console.log('Iniciando teste de conexão...');
    const timeout = setTimeout(() => {
        console.error('TIMEOUUUUUT: O Supabase não respondeu em 10 segundos.');
        process.exit(1);
    }, 10000);

    const { data, error } = await supabase.from('admin_users').select('id').limit(1);
    clearTimeout(timeout);
    
    if (error) {
        console.error('ERRO:', error.message);
    } else {
        console.log('SUCESSO:', data);
    }
    process.exit(0);
}

testHealth();


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = 'https://mbqmyozgwpxwxrdwwkwn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Need to get this

async function testSync() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase.functions.invoke('manage-merchant-auth', {
    body: {
      targetEmail: 'ramosacai@izi.com',
      targetPassword: 'Jnior19!',
      name: 'Ramos Açai',
      callerEmail: 'system@izi.com'
    }
  });

  console.log('Result:', data);
  console.log('Error:', error);
}

// testSync();

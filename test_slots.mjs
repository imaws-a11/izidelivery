import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mbqmyozgwpxwxrdwwkwn.supabase.co";
import fs from 'fs';
const envFile = fs.readFileSync('app-entregador-completo/.env', 'utf-8');
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (keyMatch) {
  const supabase = createClient(SUPABASE_URL, keyMatch[1].trim());
  supabase.from('dedicated_slots_delivery').select('*').limit(2).then(res => console.log(JSON.stringify(res.data, null, 2)));
} else {
  console.log("No key found");
}

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function resetAllData() {
  console.log('--- CALLING admin_clear_all_test_data RPC ---');
  const { data, error } = await supabase.rpc('admin_clear_all_test_data');
  if (error) {
    console.error('Error resetting test data:', error);
  } else {
    console.log('Result:', data);
  }
}

resetAllData().catch(console.error);

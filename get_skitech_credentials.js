import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.production
config({ path: '.env.production' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function getSkyTechCredentials() {
  try {
    console.log('🔍 Fetching SkyTech API credentials from database...');

    const { data, error } = await supabase
      .from('external_api_providers')
      .select('api_key, api_secret, is_default')
      .eq('provider', 'skytech');

    if (error) {
      console.error('❌ Error fetching credentials:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ SkyTech API credentials retrieved:');
      data.forEach((row, index) => {
        console.log(`Entry ${index + 1}:`);
        console.log('🔑 API Key:', row.api_key);
        console.log('🔐 API Secret: [HIDDEN]');
        console.log('📍 Is Default:', row.is_default);
        console.log('---');
      });
    } else {
      console.log('⚠️  No SkyTech provider found in database.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getSkyTechCredentials();
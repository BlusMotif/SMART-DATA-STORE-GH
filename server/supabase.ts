import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseServerInstance: SupabaseClient | null = null;

export function initializeSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Supabase initialization:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseServiceRoleKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseServiceRoleKey?.length
  });

  if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseServerInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('✅ Supabase server client initialized successfully');
  } else {
    console.error('❌ Supabase server client failed to initialize - missing environment variables');
  }
  
  return supabaseServerInstance;
}

export function getSupabaseServer(): SupabaseClient | null {
  return supabaseServerInstance;
}

// For backward compatibility
export let supabaseServer: SupabaseClient | null = null;
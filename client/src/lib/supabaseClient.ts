import { createClient, AuthChangeEvent, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Singleton pattern to prevent multiple client instances
let supabaseInstance: any = null;

if (!supabaseInstance) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Persist sessions across browser restarts so API requests keep the token
      // Use localStorage for better persistence
      storage: window.localStorage,
    },
  });

  // Clear potentially invalid sessions on initialization
  const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
  const storedSession = localStorage.getItem(storageKey);
  if (storedSession) {
    try {
      const sessionData = JSON.parse(storedSession);
      // Check if access token exists and hasn't expired
      if (!sessionData.access_token || (sessionData.expires_at && sessionData.expires_at * 1000 < Date.now())) {
        console.warn('Clearing expired session data');
        localStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.warn('Clearing invalid session data');
      localStorage.removeItem(storageKey);
    }
  }

  // Add global auth state change handler for logging only
  supabaseInstance.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
    // Only clear storage if explicitly signed out, don't interfere with token refresh
    if (event === 'SIGNED_OUT' && !session) {
      console.log('User signed out, clearing local storage');
      localStorage.removeItem(storageKey);
    }
  });
}

export const supabase = supabaseInstance;
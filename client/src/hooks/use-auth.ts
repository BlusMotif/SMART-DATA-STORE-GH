import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "../../../src/shared/schema";
import { supabase } from "@/lib/supabaseClient";

export function useAuth() {
  const queryClient = useQueryClient();

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  // Stable session setter that only updates if session actually changed
  const stableSetSession = useCallback((newSession: any) => {
    setSession((prevSession: any) => {
      if (!prevSession && !newSession) return prevSession;
      if (prevSession?.access_token === newSession?.access_token) return prevSession;
      return newSession;
    });
  }, []);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * ------------------------------------------------------
   * AUTH BOOTSTRAP (single source of truth)
   * ------------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    // Load initial session once
    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted) {
        if (error) {
          console.error('Session error:', error);
          // Clear invalid session data
          supabase.auth.signOut();
          setSession(null);
        } else {
          stableSetSession(data.session);
        }
        setAuthLoading(false);
      }
    }).catch((err) => {
      console.error('Failed to get session:', err);
      if (mounted) {
        setSession(null);
        setAuthLoading(false);
      }
    });

    // Listen for real auth transitions only
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (event, session) => {
        // Only log important auth events, not INITIAL_SESSION
        if (event !== 'INITIAL_SESSION') {
          console.log('Auth state change:', event, session ? 'session exists' : 'no session');
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          stableSetSession(session);
        }

        if (event === "SIGNED_OUT") {
          stableSetSession(null);
          queryClient.setQueryData(["/api/auth/me"], { user: null });
          queryClient.clear();
        }

        // Handle token refresh errors
        if (event === "TOKEN_REFRESHED" && !session) {
          console.warn('Token refresh failed, signing out');
          await supabase.auth.signOut();
          stableSetSession(null);
          queryClient.clear();
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  /**
   * ------------------------------------------------------
   * CURRENT USER
   * ------------------------------------------------------
   */
  const { data, isLoading, error } = useQuery<{
    user: User | null;
    agent?: any;
  }>({
    queryKey: ["/api/auth/me"],
    enabled: !!session?.access_token,
    retry: (failureCount, error: any) => {
      // Don't retry on network errors or connection refused
      if (error?.message?.includes('ERR_CONNECTION_REFUSED') || 
          error?.message?.includes('Failed to fetch') ||
          error?.message?.includes('NetworkError')) {
        console.log('🚫 Not retrying auth query due to network error');
        return false;
      }
      // Only retry once for other errors
      return failureCount < 1;
    },
    retryDelay: 2000, // Wait 2 seconds before retry
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: 10 * 60 * 1000, // Increased to 10 minutes
    cacheTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    queryFn: async () => {
      console.log('🔄 Running /api/auth/me query');
      try {
        // In development, use the full backend URL
        const baseUrl = import.meta.env.DEV ? 'http://localhost:10000' : '';
        const res = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!res.ok) {
          console.log('❌ /api/auth/me query failed:', res.status);
          throw new Error(`HTTP ${res.status}`);
        }

        const result = await res.json();
        console.log('✅ /api/auth/me query success:', { user: result.user?.email, agent: !!result.agent });
        return result;
      } catch (error: any) {
        console.error('🚨 /api/auth/me query error:', error.message);
        // Re-throw to let React Query handle it
        throw error;
      }
    },
  });

  const user = data?.user ?? null;
  const agent = data?.agent;
  
  // If server is unavailable but we have a Supabase session, create a basic user object
  const fallbackUser = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
    role: session.user.user_metadata?.role || 'user',
    phone: session.user.phone || null,
  } : null;

  const effectiveUser = user || fallbackUser;
  const isAuthenticated = !!effectiveUser;

  // Handle network errors gracefully
  const isNetworkError = error?.message?.includes('ERR_CONNECTION_REFUSED') ||
                        error?.message?.includes('Failed to fetch') ||
                        error?.message?.includes('NetworkError') ||
                        error?.message?.includes('AbortError');

  // If there's a network error and no cached data, show loading
  const effectiveLoading = isLoading && !effectiveUser;

  /**
   * ------------------------------------------------------
   * ACTIONS
   * ------------------------------------------------------
   */
  const login = async ({ email, password }: { email: string; password: string }) => {
    setIsLoginLoading(true);
    setLoginError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoginError(error.message);
      setIsLoginLoading(false);
      return { error: error.message };
    }

    setIsLoginLoading(false);
    return { success: true };
  };

  const register = async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) => {
    setIsRegisterLoading(true);
    setRegisterError(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (error) {
      setRegisterError(error.message);
      setIsRegisterLoading(false);
      return { error: error.message };
    }

    // Check if user is immediately signed in (email confirmation disabled)
    if (data.session) {
      // User is signed in, session will be handled by onAuthStateChange
    } else if (data.user && !data.session) {
      // Email confirmation required
      setRegisterError("Please check your email and click the confirmation link to complete registration.");
      setIsRegisterLoading(false);
      return { error: "Email confirmation required" };
    }

    setIsRegisterLoading(false);
    return { success: true };
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Even if signOut fails, clear local state and redirect
        setSession(null);
        queryClient.setQueryData(["/api/auth/me"], { user: null });
        queryClient.clear();
      }
    } catch (err) {
      console.error('Logout failed:', err);
      // Force clear state on error
      setSession(null);
      queryClient.setQueryData(["/api/auth/me"], { user: null });
      queryClient.clear();
    } finally {
      // Force clear localStorage to ensure logout works in production
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
        localStorage.removeItem(storageKey);
      }
      // Also clear any other supabase storage keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
      setIsLoggingOut(false);
      window.location.href = "/";
    }
  };

  /**
   * ------------------------------------------------------
   * PUBLIC API
   * ------------------------------------------------------
   */
  return {
    user: effectiveUser,
    agent,
    isAuthenticated,
    isLoading: authLoading || effectiveLoading,
    login,
    register,
    logout,
    loginError,
    registerError,
    isLoginLoading,
    isRegisterLoading,
    isLoggingOut,
  };
}

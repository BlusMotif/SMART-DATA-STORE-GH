import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";
import { clearAuthCache } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Ref to prevent duplicate logout calls
  const logoutInProgressRef = useRef(false);

  /**
   * ------------------------------------------------------
   * AUTH BOOTSTRAP (single source of truth)
   * ------------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    // Load initial session once
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setAuthLoading(false);
      }
    });

    // Listen for real auth transitions only
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setSession(session);
        }

        if (event === "SIGNED_OUT") {
          setSession(null);
          queryClient.setQueryData(["/api/auth/me"], { user: null });
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
   * EXPIRED SESSION DETECTION
   * Detect and handle expired sessions to prevent stuck state
   * ------------------------------------------------------
   */
  useEffect(() => {
    // If we have no session but authLoading is complete, ensure query is reset
    if (!authLoading && !session) {
      queryClient.setQueryData(["/api/auth/me"], { user: null });
    }
  }, [session, authLoading, queryClient]);

  /**
   * ------------------------------------------------------
   * CURRENT USER
   * ------------------------------------------------------
   */
  const { data, isLoading: queryLoading } = useQuery<{
    user: User | null;
    agent?: any;
  }>({
    queryKey: ["/api/auth/me"],
    enabled: !!session?.access_token,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        return { user: null };
      }

      return res.json();
    },
  });

  const user = data?.user ?? null;
  const agent = data?.agent;
  const isAuthenticated = !!user;
  
  // Fix: When session is null, we're not loading
  // This prevents getting stuck in loading state when session expires
  const isLoading = authLoading || (!!session?.access_token && queryLoading);

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

    // Invalidate user query to immediately fetch user data and trigger navigation
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

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

    const { error } = await supabase.auth.signUp({
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

    // Invalidate user query to immediately fetch user data and trigger navigation
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

    setIsRegisterLoading(false);
    return { success: true };
  };

  const logout = async () => {
    // Prevent duplicate logout calls
    if (logoutInProgressRef.current) {
      console.log('Logout already in progress, skipping duplicate call');
      return;
    }
    
    try {
      logoutInProgressRef.current = true;
      setIsLoggingOut(true);
      
      // Watchdog timer: Force redirect after 3 seconds if logout hangs
      const watchdogTimer = setTimeout(() => {
        console.warn('Logout taking too long, forcing redirect...');
        window.location.href = "/";
      }, 3000);
      
      // Clear all queries first
      queryClient.clear();
      
      // Clear cached auth tokens
      clearAuthCache();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear session state
      setSession(null);
      
      // Cancel watchdog since logout succeeded
      clearTimeout(watchdogTimer);
      
      // Force redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state and redirect
      queryClient.clear();
      setSession(null);
      window.location.href = "/";
    } finally {
      setIsLoggingOut(false);
      logoutInProgressRef.current = false;
    }
  };

  /**
   * ------------------------------------------------------
   * PUBLIC API
   * ------------------------------------------------------
   */
  return {
    user,
    agent,
    isAuthenticated,
    isLoading,
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

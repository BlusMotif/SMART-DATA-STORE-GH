import { useEffect, useState } from "react";
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
          setSession(data.session);
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
          setSession(session);
        }

        if (event === "SIGNED_OUT") {
          setSession(null);
          queryClient.setQueryData(["/api/auth/me"], { user: null });
          queryClient.clear();
        }

        // Handle token refresh errors
        if (event === "TOKEN_REFRESHED" && !session) {
          console.warn('Token refresh failed, signing out');
          await supabase.auth.signOut();
          setSession(null);
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
  const { data, isLoading } = useQuery<{
    user: User | null;
    agent?: any;
  }>({
    queryKey: ["/api/auth/me"],
    enabled: !!session?.access_token,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // In development, use the full backend URL
      const baseUrl = import.meta.env.DEV ? 'http://localhost:10000' : '';
      const res = await fetch(`${baseUrl}/api/auth/me`, {
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
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    window.location.href = "/";
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
    isLoading: authLoading || isLoading,
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

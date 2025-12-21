import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";

export function useAuth() {
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);

        if (session) {
          console.log("Session restored:", session.user.id);
          // Invalidate and refetch auth data when session changes
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        } else {
          console.log("Session cleared");
          // Clear auth data when session is cleared
          queryClient.setQueryData(["/api/auth/me"], { user: null });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Get access token from Supabase session
  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const { data: authData, isLoading } = useQuery<{
    user: User | null;
    agent?: any;
  }>({
    queryKey: ["/api/auth/me"],
    retry: false,
    queryFn: async () => {
      const token = await getAccessToken();
      console.log("Auth check - token exists:", !!token);
      if (!token) {
        console.log("No token found, returning null user");
        return { user: null };
      }

      try {
        console.log("Fetching /api/auth/me with token");
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log("Auth response status:", response.status);
        if (!response.ok) {
          console.log("Auth response not ok, returning null user");
          return { user: null };
        }

        const data = await response.json();
        console.log("Auth response data:", data);
        return data;
      } catch (error) {
        console.error("Auth check error:", error);
        return { user: null };
      }
    },
  });

  const user = authData?.user ?? null;
  const agent = authData?.agent;

  const login = async ({ email, password }: { email: string; password: string }) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginError(error.message);
        return { error: error.message };
      }

      // Supabase will automatically handle session storage
      // The auth state change listener will trigger and update the query cache
      console.log("Login successful, session created");
      return { user: data.user };
    } catch (error: any) {
      const errorMessage = error.message || "Login failed";
      setLoginError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoginLoading(false);
    }
  };

  const register = async ({ email, password, name }: { email: string; password: string; name: string }) => {
    setIsRegisterLoading(true);
    setRegisterError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        setRegisterError(error.message);
        return { error: error.message };
      }

      // For registration, we might not get a session immediately if email confirmation is required
      // The auth state change listener will handle session updates
      console.log("Registration successful");
      return { user: data.user };
    } catch (error: any) {
      const errorMessage = error.message || "Registration failed";
      setRegisterError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout failed:", error);
      }

      // Supabase will automatically clear the session
      // The auth state change listener will handle clearing the query cache
      console.log("Logout successful");
    } catch (error: any) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAuthenticated = !!user;

  return {
    user,
    agent,
    login,
    register,
    logout,
    isLoading,
    isLoginLoading,
    isRegisterLoading,
    isLoggingOut,
    loginError,
    registerError,
    isAuthenticated,
  };
}

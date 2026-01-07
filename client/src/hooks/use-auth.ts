import { useState, useEffect, useRef } from "react";
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
  const isFetchingUser = useRef(false);

  // Get current session for enabling the query
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Initialize session on mount
  useEffect(() => {
    // Get the current session when the component mounts
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log("Initial session found:", session.user.id);
        setCurrentSession(session);
      }
    });
  }, []);

  // Update current session when auth state changes - simplified to avoid auto login/logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);
        
        // Only handle explicit sign out
        if (event === "SIGNED_OUT") {
          console.log("User signed out");
          setCurrentSession(null);
          queryClient.setQueryData(["/api/auth/me"], { user: null });
        }
        // Handle token refresh silently - update session only
        else if (event === "TOKEN_REFRESHED" && session) {
          console.log("Token refreshed");
          setCurrentSession(session);
        }
        // Ignore all other events (SIGNED_IN, INITIAL_SESSION, USER_UPDATED) to prevent unwanted behavior
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: authData, isLoading } = useQuery<{
    user: User | null;
    agent?: any;
  }>({
    queryKey: ["/api/auth/me"],
    enabled: !!currentSession?.access_token, // Only run when we have a session
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      // Prevent duplicate calls
      if (isFetchingUser.current) {
        console.log("Already fetching user, skipping duplicate call");
        return { user: null };
      }
      isFetchingUser.current = true;

      try {
        const token = currentSession?.access_token;
        console.log("Auth check - token exists:", !!token);
        if (!token) {
          console.log("No token found, returning null user");
          return { user: null };
        }

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
      } finally {
        isFetchingUser.current = false;
      }
    },
  });

  const user = authData?.user ?? null;
  const agent = authData?.agent;

  const login = async ({ email, password }: { email: string; password: string }) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      // Validate inputs
      if (!email || !password) {
        const errorMsg = "Email and password are required";
        setLoginError(errorMsg);
        return { error: errorMsg };
      }
      
      if (typeof email !== 'string' || typeof password !== 'string') {
        const errorMsg = "Invalid input types";
        setLoginError(errorMsg);
        return { error: errorMsg };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setLoginError(error.message);
        return { error: error.message };
      }

      // Manually update session and trigger refetch after successful login
      if (data.session) {
        console.log("Login successful, updating session");
        setCurrentSession(data.session);
        // Invalidate and refetch auth data to get user details
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
      
      console.log("Login complete");
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
      // Validate inputs
      if (!email || !password || !name) {
        const errorMsg = "All fields are required";
        setRegisterError(errorMsg);
        return { error: errorMsg };
      }
      
      if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
        const errorMsg = "Invalid input types";
        setRegisterError(errorMsg);
        return { error: errorMsg };
      }
      
      if (name.trim().length < 2) {
        const errorMsg = "Name must be at least 2 characters";
        setRegisterError(errorMsg);
        return { error: errorMsg };
      }
      
      if (password.length < 6) {
        const errorMsg = "Password must be at least 6 characters";
        setRegisterError(errorMsg);
        return { error: errorMsg };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        setRegisterError(error.message);
        return { error: error.message };
      }

      // Manually update session after successful registration
      if (data.session) {
        console.log("Registration successful with session");
        setCurrentSession(data.session);
        // Invalidate and refetch auth data to get user details
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      } else {
        console.log("Registration successful but no session (email confirmation may be required)");
      }
      
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

      // Clear the session state
      setCurrentSession(null);
      
      // Clear auth data from cache
      queryClient.setQueryData(["/api/auth/me"], { user: null });
      
      // Clear all queries to reset the app state
      queryClient.clear();

      // Supabase will automatically clear the session
      // The auth state change listener will handle clearing the query cache
      console.log("Logout successful");
      
      // Redirect to home page
      window.location.href = '/';
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

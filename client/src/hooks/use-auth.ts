import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { supabase } from "@/lib/supabaseClient";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useAuth() {
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const isFetchingUser = useRef(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Get current session for enabling the query
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Only set timer if user is logged in
    if (currentSession) {
      inactivityTimerRef.current = setTimeout(async () => {
        console.log("User inactive for 5 minutes, logging out");
        await supabase.auth.signOut();
      }, INACTIVITY_TIMEOUT);
    }
  };

  // Track user activity
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners for all activity events
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timer on mount
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [currentSession]);

  // Update current session when auth state changes
  useEffect(() => {
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentSession(data.session);
      if (data.session) {
        resetInactivityTimer();
      }
    };
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);
        setCurrentSession(session);

        if (event === "SIGNED_IN" && session) {
          console.log("Session restored:", session.user.id);
          resetInactivityTimer();
          // Invalidate and refetch auth data when session changes
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        } else if (event === "SIGNED_OUT") {
          console.log("User signed out");
          // Clear timer on logout
          if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
          }
          // Clear auth data when user signs out
          queryClient.setQueryData(["/api/auth/me"], { user: null });
        }
        // Don't clear user state on INITIAL_SESSION - this causes confusing logs
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

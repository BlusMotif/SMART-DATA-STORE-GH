import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const { data: authData, isLoading, refetch } = useQuery<{
    user: User | null;
    agent?: any;
  }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const user = authData?.user ?? null;
  const agent = authData?.agent;

  const login = async ({ email, password }: { email: string; password: string }) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.error || 'Login failed');
        return { error: data.error || 'Login failed' };
      }
      await refetch(); // Refresh user data
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRegisterError(data.error || 'Registration failed');
        return { error: data.error || 'Registration failed' };
      }
      await refetch(); // Refresh user data
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
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        console.error("Logout failed");
      }
      await refetch(); // Refresh user data
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

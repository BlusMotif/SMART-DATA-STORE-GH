import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Fetch user on mount
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch(api.auth.me(), {
        credentials: 'include',
      });
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async ({ email, password }: { email: string; password: string }) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      const response = await fetch(api.auth.login(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.error) {
        setLoginError(data.error);
        return { error: data.error };
      }
      setUser(data.user);
      return { user: data.user };
    } catch (error) {
      const errorMessage = "Login failed";
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
      const response = await fetch(api.auth.register(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.error) {
        setRegisterError(data.error);
        return { error: data.error };
      }
      setUser(data.user);
      return { user: data.user };
    } catch (error) {
      const errorMessage = "Registration failed";
      setRegisterError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(api.auth.logout(), { 
        method: "POST",
        credentials: 'include',
      });
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAuthenticated = !!user;

  return {
    user,
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

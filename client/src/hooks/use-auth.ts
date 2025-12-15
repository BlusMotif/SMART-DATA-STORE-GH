import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
}

interface AuthResponse {
  user: AuthUser | null;
  agent?: {
    id: string;
    businessName: string;
    storefrontSlug: string;
    balance: string;
    totalSales: string;
    totalProfit: string;
    isApproved: boolean;
  } | null;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const user = data?.user ?? null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(["/api/auth/me"], { user: responseData.user, agent: null });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (formData: { email: string; password: string; name: string; phone?: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", formData);
      return response.json();
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(["/api/auth/me"], { user: responseData.user, agent: null });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], { user: null, agent: null });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const login = useCallback(
    (credentials: { email: string; password: string }) => {
      return loginMutation.mutateAsync(credentials);
    },
    [loginMutation]
  );

  const register = useCallback(
    (data: { email: string; password: string; name: string; phone?: string }) => {
      return registerMutation.mutateAsync(data);
    },
    [registerMutation]
  );

  const logout = useCallback(() => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    user,
    agent: data?.agent ?? null,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}

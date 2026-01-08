import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface BreakSettings {
  isEnabled: boolean;
  message: string;
}

export function BreakModeGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: authData, isLoading: authLoading } = useAuth();
  const { data: breakSettings, isLoading: breakLoading } = useQuery<BreakSettings>({
    queryKey: ["/api/break-settings"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Show loading state while checking auth and break settings
  if (authLoading || breakLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow admin routes to bypass break mode
  if (location.startsWith("/admin")) {
    return <>{children}</>;
  }

  // Allow access to authentication routes even during break mode
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.includes(location);

  // Allow admins to bypass break mode
  const isAdmin = authData?.user?.role === "admin";
  if (isAdmin || isAuthRoute) {
    return <>{children}</>;
  }

  // If break mode is enabled and user is not admin, show the break message
  if (breakSettings?.isEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <X className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
              Site Closed
            </h1>
            <div className="text-muted-foreground whitespace-pre-wrap text-left bg-muted p-4 rounded-lg">
              {breakSettings.message || "The site is currently closed. Please check back later."}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            We apologize for any inconvenience.
          </div>
        </div>
      </div>
    );
  }

  // If break mode is not enabled, render the normal app
  return <>{children}</>;
}
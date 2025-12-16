import { useAuth } from "@/hooks/use-auth";
import { Route, useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requiredRole?: string;
  fallbackPath?: string;
}

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole,
  fallbackPath = "/login"
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return; // Still loading

    if (!user) {
      setLocation(fallbackPath);
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      // If user doesn't have required role, redirect to home
      setLocation("/");
      return;
    }
  }, [user, isLoading, requiredRole, setLocation, fallbackPath]);

  // Don't render if still loading or not authorized
  if (isLoading || !user || (requiredRole && user.role !== requiredRole)) {
    return null;
  }

  return <Route path={path} component={Component} />;
}
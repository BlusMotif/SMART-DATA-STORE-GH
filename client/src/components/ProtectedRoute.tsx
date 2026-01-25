import { useAuth } from "@/hooks/use-auth";
import { Route, Redirect } from "wouter";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requiredRole?: string;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole,
  requiredRoles,
  fallbackPath = "/login"
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        // Not authenticated - redirect immediately (even if loading)
        // This prevents getting stuck when session expires
        if (!isLoading && !user) {
          return <Redirect to={fallbackPath} />;
        }
        
        // Still loading initial auth check
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" />
            </div>
          );
        }

        // Check role if required
        if (requiredRole && user.role !== requiredRole) {
          return <Redirect to="/" />;
        }

        // Check roles if required
        if (requiredRoles && !requiredRoles.includes(user.role)) {
          return <Redirect to="/" />;
        }

        // Render component
        return <Component {...params} />;
      }}
    </Route>
  );
}
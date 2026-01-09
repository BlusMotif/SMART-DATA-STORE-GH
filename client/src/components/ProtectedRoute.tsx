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
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {(params) => {
        // Still loading
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" />
            </div>
          );
        }

        // Not authenticated
        if (!user) {
          return <Redirect to={fallbackPath} />;
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
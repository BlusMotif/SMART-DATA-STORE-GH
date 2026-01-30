import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { getAgentId, clearAgentStore } from "@/lib/store-context";
import { useTheme } from "@/components/theme-provider";
import logoLight from "@assets/logo_1765774201026.png";
import logoDark from "@assets/darkmode-icon.png";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoginLoading, loginError, user, isLoading } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [hasRedirected, setHasRedirected] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Navigate based on user role when user is loaded and auth is ready
  useEffect(() => {
    // Don't redirect while auth is still loading or if already redirected
    if (isLoading || hasRedirected) {
      return;
    }

    if (user) {
      setHasRedirected(true);

      if (user.role === "admin") {
        console.log("Redirecting admin to /admin");
        setLocation("/admin");
      } else if (user.role === "agent") {
        console.log("Redirecting agent to /agent/dashboard");
        setLocation("/agent/dashboard");
      } else if (user.role === "dealer") {
        console.log("Redirecting dealer to /dealer/dashboard");
        setLocation("/dealer/dashboard");
      } else if (user.role === "super_dealer") {
        console.log("Redirecting super dealer to /super-dealer/dashboard");
        setLocation("/super-dealer/dashboard");
      } else if (user.role === "master") {
        console.log("Redirecting master to /master/dashboard");
        setLocation("/master/dashboard");
      } else if (user.role === "user" || user.role === "guest") {
        console.log("Redirecting user to /user/dashboard");
        setLocation("/user/dashboard");
      } else {
        console.log("Redirecting user to /");
        setLocation("/");
      }
    } else {
      console.log("No user found, staying on login page");
    }
  }, [user, isLoading, setLocation]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login({ email: data.email, password: data.password });
      if (!result.error) {
        // Clear agent store context after successful login
        clearAgentStore();
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        // Note: Redirection is handled by the useEffect below based on user role from database
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const agentStore = typeof window !== "undefined" ? getAgentId() : null;

  return (
    <div className="min-h-screen flex flex-col bg-background px-4 py-6">
      <nav className="mb-6 px-2">
        <Link href={agentStore ? `/store/${agentStore}` : "/"} data-testid="link-back-home">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </nav>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md shadow-xl border-2 border-yellow-400 bg-card text-card-foreground rounded-xl p-8 dark:border-yellow-500\">
            {isLoginLoading && (
              <div className="absolute inset-0 bg-background flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-foreground">Signing you in...</p>
                </div>
              </div>
            )}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img
                src={theme === "dark" ? logoDark : logoLight}
                alt={APP_NAME}
                className="h-8 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-foreground">
              Sign in to your {APP_NAME} account
            </p>
          </div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          className="pl-10"
                          data-testid="input-email"
                          name={field.name}
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Password</FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="Enter your password"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                          data-testid="input-password"
                          name={field.name}
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoginLoading}
                data-testid="button-submit-login"
              >
                {isLoginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
              {loginError && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-2">
                  {loginError}
                </div>
              )}
            </form>
          </Form>



          <div className="mt-6 text-center text-sm">
            <span className="text-foreground">Don't have an account? </span>
            <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-register">
              Sign up
            </Link>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-foreground">Want to become an agent? </span>
            <Link href="/agent/register" className="text-primary hover:underline font-medium" data-testid="link-agent-register">
              Register as Agent
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

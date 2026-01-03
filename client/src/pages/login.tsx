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
import siteLogo from "@assets/logo_1765774201026.png";

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

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Navigate based on user role when user is loaded and auth is ready
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (isLoading) {
      console.log("Auth still loading, waiting...");
      return;
    }

    if (user) {
      console.log("User authenticated in login page:", user);
      console.log("User role:", user.role);
      const role = user.role;
      console.log("Redirecting based on role:", role);

      if (role === "admin") {
        console.log("Redirecting admin to /admin");
        setLocation("/admin");
      } else if (role === "agent") {
        console.log("Redirecting agent to /agent/dashboard");
        setLocation("/agent/dashboard");
      } else if (role === "user") {
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
      if (result.user) {
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

  return (
    <div className="min-h-screen flex flex-col bg-background px-4 py-6">
      <nav className="mb-6 px-2">
        <Link href="/" data-testid="link-back-home">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </nav>
      
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-2 border-yellow-400">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={siteLogo} alt="Logo" className="h-16 w-auto object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your {APP_NAME} account
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          className="pl-10"
                          data-testid="input-email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your password"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                          data-testid="input-password"
                          {...field}
                        />
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
                    </FormControl>
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
                <div className="text-red-500 text-sm mt-2">
                  {loginError}
                </div>
              )}
            </form>
          </Form>



          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/register" className="text-primary hover:underline font-medium" data-testid="link-register">
              Sign up
            </Link>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Want to become an agent? </span>
            <Link href="/agent/register" className="text-primary hover:underline font-medium" data-testid="link-agent-register">
              Register as Agent
            </Link>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
import { getAgentId } from "@/lib/store-context";
import { Loader2, Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import logoLight from "@assets/logo_1765774201026.png";
import logoDark from "@assets/darkmode-icon.jpg";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { register, isRegisterLoading, registerError, user, isLoading } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Navigate based on user role when user is loaded and auth is ready
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (isLoading) {
      return;
    }

    if (user) {
      const role = user.role;

      // Only redirect normal users to user dashboard, not admins
      if (role === "admin") {
        // Admins shouldn't be registering, but if they somehow land here, redirect to admin
        setLocation("/admin");
      } else if (role === "agent") {
        setLocation("/agent");
      } else if (role === "user") {
        // Regular users should go to user dashboard
        setLocation("/user/dashboard");
      } else {
        // Fallback to home
        setLocation("/");
      }
    }
  }, [user, isLoading, setLocation]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await register({ email: data.email, password: data.password, name: data.name });
      
      if (result?.error === "Email confirmation required") {
        toast({
          title: "Check your email",
          description: "Please click the confirmation link in your email to complete registration.",
        });
        return;
      }
      
      toast({
        title: "Account created!",
        description: "Welcome to " + APP_NAME,
      });
      // Note: Redirection is handled by the useEffect based on user role
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const agentStore = typeof window !== "undefined" ? getAgentId() : null;

  return (
    <div className="min-h-screen flex flex-col bg-background px-4 py-6">
      <nav className="mb-6 px-2">
        <Link href={agentStore ? `/store/${agentStore}` : "/"} data-testid="link-back-home">
          <Button variant="outline" size="sm" className="gap-2 text-black dark:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </nav>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md shadow-xl border-2 border-yellow-400 bg-white dark:bg-black text-black dark:text-white rounded-xl p-8" style={{ backgroundColor: theme === 'dark' ? '#000000' : undefined }}>
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img
                src={theme === "dark" ? logoDark : logoLight}
                alt={APP_NAME}
                className="h-8 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold">Create an account</h2>
            <p className="text-muted-foreground">
              Join {APP_NAME} to purchase data bundles and result checkers
            </p>
          </div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="John Doe"
                          className="pl-10"
                          autoComplete="name"
                          data-testid="input-name"
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
                          autoComplete="email"
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="0241234567"
                          autoComplete="tel"
                          className="pl-10"
                          data-testid="input-phone"
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
                          placeholder="Create a password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Confirm your password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className="pl-10"
                          data-testid="input-confirm-password"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isRegisterLoading}
                data-testid="button-submit-register"
              >
                {isRegisterLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {registerError && (
                              <div className="text-red-500 text-sm mt-2">
                                {registerError}
                              </div>
                            )}
                Create account
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

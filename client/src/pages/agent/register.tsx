import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { APP_NAME } from "@/lib/constants";
import { Loader2, Mail, Lock, User, Phone, Store, Link2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import siteLogo from "@assets/logo_1765774201026.png";

const agentRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  businessName: z.string().min(2, "Business name is required"),
  storefrontSlug: z.string()
    .min(3, "URL must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  businessDescription: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AgentRegisterFormData = z.infer<typeof agentRegisterSchema>;

export default function AgentRegisterPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const form = useForm<AgentRegisterFormData>({
    resolver: zodResolver(agentRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      businessName: "",
      storefrontSlug: "",
      businessDescription: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: AgentRegisterFormData) => {
      const response = await apiRequest("POST", "/api/auth/register/agent", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration submitted!",
        description: "Your agent application is pending approval. We'll notify you once approved.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AgentRegisterFormData) => {
    registerMutation.mutate(data);
  };

  const storefrontSlug = form.watch("storefrontSlug");

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
        <Card className="w-full max-w-lg shadow-xl border-2 border-yellow-400">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={siteLogo} alt="Logo" className="h-16 w-auto object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold">Become an Agent</CardTitle>
            <CardDescription>
              Create your {APP_NAME} agent account and start earning
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="John Doe" className="pl-10" data-testid="input-name" {...field} />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="0241234567" className="pl-10" data-testid="input-phone" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="you@example.com" type="email" className="pl-10" data-testid="input-email" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="My Data Store" className="pl-10" data-testid="input-business" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storefrontSlug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storefront URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="my-store" className="pl-10" data-testid="input-slug" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {storefrontSlug && (
                        <span className="text-xs">
                          Your store: {window.location.origin}/store/<strong>{storefrontSlug}</strong>
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell customers about your business..." className="resize-none" data-testid="input-description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type={showPassword ? "text" : "password"} className="pl-10 pr-10" data-testid="input-password" {...field} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                          <Input type={showPassword ? "text" : "password"} className="pl-10" data-testid="input-confirm" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={registerMutation.isPending} data-testid="button-submit">
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Application
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}

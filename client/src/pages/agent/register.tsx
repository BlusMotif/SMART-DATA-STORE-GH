import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { APP_NAME } from "@/lib/constants";
import { Loader2, Mail, Lock, User, Phone, Store, Link2, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Info, Copy } from "lucide-react";
import { getAgentId } from "@/lib/store-context";
import { useTheme } from "@/components/theme-provider";
import logoLight from "@assets/logo_1765774201026.png";
import logoDark from "@assets/darkmode-icon.jpg";

const agentRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  businessName: z.string().min(2, "Business name is required"),
  storefrontSlug: z.string()
    .min(3, "URL must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  businessDescription: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AgentRegisterFormData = z.infer<typeof agentRegisterSchema>;

export default function AgentRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(() => {
    // Only show dialog if user hasn't dismissed it before
    if (typeof window !== 'undefined') {
      const hasSeenDialog = localStorage.getItem('agent-info-dialog-seen');
      return !hasSeenDialog;
    }
    return true;
  });
  const { toast } = useToast();
  const { theme } = useTheme();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  const form = useForm<AgentRegisterFormData>({
    resolver: zodResolver(agentRegisterSchema),
    mode: 'onSubmit', // Only validate on submit to reduce re-renders
    defaultValues: {
      name: "",
      email: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('email') || '' : '',
      phone: "",
      password: "",
      confirmPassword: "",
      businessName: "",
      storefrontSlug: "",
      businessDescription: "",
      agreedToTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: AgentRegisterFormData) => {
      const result = await apiRequest("POST", "/api/agent/register", data);
      return result as {
        message: string;
        paymentUrl: string;
        paymentReference: string;
        amount: number;
      };
    },
    onSuccess: (data) => {
      // Redirect to Paystack payment
      if (data.paymentUrl) {
        toast({
          title: "Registration successful!",
          description: "Redirecting to payment...",
        });
        // Redirect to Paystack payment page
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Registration failed",
          description: "Payment initialization failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      // Check if it's a rate limit error
      if (error.message && error.message.includes('rate limit')) {
        toast({
          title: "Too Many Attempts",
          description: error.message || "You've exceeded the registration attempt limit. Please wait a few minutes before trying again.",
          variant: "destructive",
          duration: 8000,
        });
      } else {
        toast({
          title: "Registration failed",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: AgentRegisterFormData) => {
    registerMutation.mutate(data);
  };

  const handleInfoDialogChange = (open: boolean) => {
    setShowInfoDialog(open);
    if (!open && typeof window !== 'undefined') {
      // Remember that user has seen the dialog
      localStorage.setItem('agent-info-dialog-seen', 'true');
    }
  };
  
  // Memoize the origin to prevent re-computation on every render
  const siteOrigin = useMemo(() => typeof window !== 'undefined' ? window.location.origin : '', []);

  return (
    <div className="min-h-screen flex flex-col bg-background px-4 py-6">
      <nav className="mb-6 px-2">
        <Link href={typeof window !== "undefined" && getAgentId() ? `/store/${getAgentId()}` : "/"} data-testid="link-back-home">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </nav>
      
      <Dialog open={showInfoDialog} onOpenChange={handleInfoDialogChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-white">
              <Info className="h-6 w-6 text-blue-600" />
              Important Information for Agents
            </DialogTitle>
            <DialogDescription className="sr-only">
              Read important information about agent registration and activation requirements
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900">Activation Fee</p>
                  <p className="text-sm text-blue-800">A one-time payment of <strong>GH₵60.00</strong> is required to activate your agent account.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Instant Activation</p>
                  <p className="text-sm text-green-800">Your account will be automatically activated once payment is confirmed.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-purple-900">Commission Structure</p>
                  <p className="text-sm text-purple-800">Earn competitive commissions on every transaction you process.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <CheckCircle2 className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-indigo-900">Your Storefront</p>
                  <p className="text-sm text-indigo-800">Get a personalized storefront URL to share with your customers.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <CheckCircle2 className="h-5 w-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-cyan-900">Payment Methods</p>
                  <p className="text-sm text-cyan-800">Accept payments via Mobile Money, Cards, and Bank transfers.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-orange-900">Requirements</p>
                  <p className="text-sm text-orange-800">Valid phone number, email address, and business information.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setShowInfoDialog(false)}
              className="w-full sm:w-auto"
            >
              I Understand, Proceed to Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <Card className="w-full shadow-xl border-2 border-yellow-400">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <img src={theme === 'dark' ? logoDark : logoLight} alt="ResellersHub Pro" className="h-12 w-auto" />
              </div>
              <CardTitle className="text-2xl font-bold">Become an Agent</CardTitle>
              <CardDescription>
                Create your {APP_NAME} agent account and start earning
              </CardDescription>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm font-semibold text-yellow-900">Activation Fee: GH₵60.00</p>
                <p className="text-xs text-yellow-700 mt-1">Payment required after registration</p>
              </div>
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
                          <Input placeholder="John Doe" autoComplete="name" className="pl-10" data-testid="input-name" {...field} />
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
                          <Input placeholder="0241234567" autoComplete="tel" className="pl-10" data-testid="input-phone" {...field} />
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
                        <Input placeholder="you@example.com" type="email" autoComplete="email" className="pl-10" data-testid="input-email" {...field} />
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
                      {field.value && (
                        <div className="flex items-center gap-2 text-xs">
                          <span>
                            Your store: {siteOrigin}/store/agent/<strong>{field.value}</strong>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(`${siteOrigin}/store/agent/${field.value}`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
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
                          <Input type={showPassword ? "text" : "password"} autoComplete="new-password" className="pl-10 pr-10" data-testid="input-password" {...field} />
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
                          <Input type={showPassword ? "text" : "password"} autoComplete="new-password" className="pl-10" data-testid="input-confirm" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="agreedToTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        I agree to pay the GH₵60.00 activation fee and accept the terms and conditions
                      </FormLabel>
                      <FormDescription className="text-xs">
                        By checking this box, you confirm that you understand the activation fee is required and agree to our terms of service.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={registerMutation.isPending} data-testid="button-submit">
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Proceed to Payment (GH₵60.00)
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
    </div>
  );
}

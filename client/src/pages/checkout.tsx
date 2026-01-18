import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormLabelWithoutFor, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/ui/loading-spinner";
import { NetworkBadge } from "@/components/products/network-badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, APP_NAME } from "@/lib/constants";
import { validatePhoneNetwork, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { Phone, Mail, Loader2, ShieldCheck, Lock, CheckCircle, Wifi, Clock, FileCheck, Wallet, CreditCard, AlertCircle } from "lucide-react";
import type { DataBundle } from "@shared/schema";

const checkoutSchema = z.object({
  customerPhone: z.string()
    .min(10, "Phone number must be exactly 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .regex(/^0[0-9]{9}$/, "Phone number must start with 0 and be 10 digits (e.g., 0241234567)"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  paymentMethod: z.enum(["paystack", "wallet"]).default("paystack"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutResult {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

interface UserStats {
  totalOrders: number;
  totalSpent: string;
  walletBalance: string;
}

export default function CheckoutPage() {
  const { productType, productId, year } = useParams<{ productType: string; productId: string; year?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get agent slug from URL query parameters
  const agentSlug = new URLSearchParams(window.location.search).get("agent");

  const isDataBundle = productType === "data-bundle";
  const isResultChecker = productType === "result-checker";

  const { data: bundle, isLoading: bundleLoading } = useQuery<DataBundle>({
    queryKey: [`/api/products/data-bundles/${productId}`],
    enabled: isDataBundle && !!productId,
  });

  const { data: checkerInfo, isLoading: checkerLoading } = useQuery<{ type: string; year: number; price: number; stock: number }>({
    queryKey: [`/api/products/result-checkers/info/${productId}/${year}`],
    enabled: isResultChecker && !!productId && !!year,
  });

  // Fetch user stats to get wallet balance
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const walletBalance = userStats?.walletBalance ? parseFloat(userStats.walletBalance) : 0;
  const price = isDataBundle 
    ? (bundle?.effective_price ? parseFloat(bundle.effective_price) : 0)
    : (checkerInfo?.price ? parseFloat(String(checkerInfo.price)) : 0);
  
  // Only check insufficient balance if we have valid data loaded
  const hasInsufficientBalance: boolean = Boolean(
    !statsLoading && 
    userStats && 
    price > 0 && 
    walletBalance < price
  );

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerPhone: user?.phone || "",
      customerEmail: "",
      paymentMethod: "paystack",
    },
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      if (data.paymentMethod === "wallet") {
        // Pay with wallet
        const payload = {
          productType: isDataBundle ? "data_bundle" : "result_checker",
          productId: isResultChecker ? `${productId}-${year}` : productId,
          productName: isDataBundle ? bundle?.name : `${checkerInfo?.type.toUpperCase()} Result Checker ${checkerInfo?.year}`,
          network: isDataBundle ? bundle?.network : undefined,
          amount: price.toFixed(2),
          customerPhone: data.customerPhone,
          agentSlug: agentSlug || undefined,
        };

        const response = await apiRequest("POST", "/api/wallet/pay", payload);
        return response.json();
      } else {
        // Pay with Paystack
        const payload = {
          productType: isDataBundle ? "data_bundle" : "result_checker",
          productId: isResultChecker ? `${productId}-${year}` : productId,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || undefined,
          agentSlug: agentSlug || undefined,
        };

        const response = await apiRequest("POST", "/api/checkout/initialize", payload);
        return response.json();
      }
    },
    onSuccess: (data, variables) => {
      if (variables.paymentMethod === "wallet") {
        // Wallet payment successful - show success message
        toast({
          title: "✅ Payment Successful!",
          description: `Your purchase has been confirmed. New wallet balance: GH₵${data.newBalance}. ${data.deliveredPin ? `PIN: ${data.deliveredPin}` : 'Processing your order...'}`,
          duration: 5000,
        });
        setTimeout(() => {
          setLocation("/user/dashboard");
        }, 2000);
      } else {
        // Redirect to Paystack payment page
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Unable to process payment";
      const isInsufficientBalance = errorMessage.toLowerCase().includes("insufficient");
      
      toast({
        title: isInsufficientBalance ? "⚠️ Insufficient Wallet Balance" : "❌ Payment Failed",
        description: isInsufficientBalance 
          ? "Your wallet balance is too low for this purchase. Please top up your wallet or use Paystack."
          : `${errorMessage}. Please try again or contact support if the problem persists.`,
        variant: "destructive",
        duration: 6000,
      });
      setIsProcessing(false);
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(data.customerPhone);
    
    // Validate phone against network for data bundles
    if (isDataBundle && bundle) {
      const validation = validatePhoneNetwork(normalizedPhone, bundle.network);
      if (!validation.isValid) {
        const prefixes = getNetworkPrefixes(bundle.network);
        toast({
          title: "❌ Phone Number Mismatch",
          description: validation.error || `This bundle is for ${bundle.network.toUpperCase()} network. Valid prefixes: ${prefixes.join(", ")}`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }
    }
    
    if (data.paymentMethod === "wallet" && hasInsufficientBalance) {
      const shortfall = price - walletBalance;
      toast({
        title: "⚠️ Insufficient Wallet Balance",
        description: `You need GH₵${shortfall.toFixed(2)} more to complete this purchase. Current balance: GH₵${walletBalance.toFixed(2)}, Required: GH₵${price.toFixed(2)}. Please top up or use Paystack.`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    setIsProcessing(true);
    // Use normalized phone for the mutation
    initializePaymentMutation.mutate({
      ...data,
      customerPhone: normalizedPhone,
    });
  };

  const isLoading = bundleLoading || checkerLoading;
  const product = isDataBundle ? bundle : checkerInfo;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <PageLoader text="Loading product..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
              <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or is no longer available.</p>
              <Button onClick={() => setLocation("/")}>Back to Products</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 px-4 pt-16">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isDataBundle && bundle && (
                    <>
                      <div className="flex items-center justify-between">
                        <NetworkBadge network={bundle.network} size="md" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg" data-testid="text-product-name">{bundle.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Wifi className="h-4 w-4" />
                            <span>{bundle.dataAmount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{bundle.validity}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {isResultChecker && checkerInfo && (
                    <>
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-primary" />
                        <span className="font-medium uppercase">{checkerInfo.type}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg" data-testid="text-product-name">
                          {checkerInfo.type.toUpperCase()} Result Checker
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Year: {checkerInfo.year} &bull; {checkerInfo.stock} in stock
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(price!)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary" data-testid="text-total-price">{formatCurrency(price!)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
                    <Lock className="h-3 w-3" />
                    <span>Secured by Paystack</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Checkout Form */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <Card>
                <CardHeader>
                  <CardTitle>Checkout</CardTitle>
                  <CardDescription>
                    Enter your details to complete the purchase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Payment Method Selection */}
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabelWithoutFor>Payment Method</FormLabelWithoutFor>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="grid gap-3"
                              >
                                {user && (
                                  <div className="relative">
                                    <RadioGroupItem
                                      value="wallet"
                                      id="wallet"
                                      className="peer sr-only"
                                      disabled={hasInsufficientBalance}
                                    />
                                    <Label
                                      className={`flex items-center justify-between rounded-lg border-2 border-muted bg-white p-4 hover:border-green-500 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer transition-all ${
                                        hasInsufficientBalance ? "opacity-50 cursor-not-allowed" : ""
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <Wallet className="h-5 w-5 text-green-600" />
                                        <div>
                                          <div className="font-medium text-green-700">Wallet Balance</div>
                                          <div className="text-sm text-green-600">
                                            Available: GH₵{walletBalance.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                      {field.value === "wallet" && (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      )}
                                    </Label>
                                    {hasInsufficientBalance && (
                                      <div className="absolute top-2 right-2">
                                        <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                                          Insufficient
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div>
                                  <RadioGroupItem
                                    value="paystack"
                                    id="paystack"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    className="flex items-center justify-between rounded-lg border-2 border-muted !bg-white p-4 hover:border-green-500 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer transition-all"
                                  >
                                    <div className="flex items-center gap-3">
                                      <CreditCard className="h-5 w-5 text-green-600" />
                                      <div>
                                        <div className="font-medium text-green-700">Paystack</div>
                                        <div className="text-sm text-green-600">
                                          Pay with card, bank transfer
                                        </div>
                                      </div>
                                    </div>
                                    {field.value === "paystack" && (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    )}
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {hasInsufficientBalance && form.watch("paymentMethod") === "wallet" && (
                        <Alert variant="destructive" className="border-destructive/50 bg-destructive/20">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Insufficient Balance:</strong> You need GH₵{(price - walletBalance).toFixed(2)} more. 
                            <a href="/user/wallet" className="underline ml-1 font-medium hover:text-destructive-foreground">Top up wallet</a> or select Paystack below.
                          </AlertDescription>
                        </Alert>
                      )}

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
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
                            <FormDescription>
                              {isDataBundle && bundle ? (
                                <span className="text-xs">
                                  For <strong>{bundle.network.toUpperCase()}</strong> network only. 
                                  Valid prefixes: <strong>{getNetworkPrefixes(bundle.network).join(", ")}</strong>
                                </span>
                              ) : (
                                "We'll send the result checker PIN to this number"
                              )}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (optional)</FormLabel>
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
                            <FormDescription>
                              We'll send a receipt to this email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-green-800 dark:text-green-300">
                            {form.watch("paymentMethod") === "wallet" ? "Instant Purchase" : "Secure Payment"}
                          </p>
                          <p className="text-green-700 dark:text-green-400">
                            {form.watch("paymentMethod") === "wallet"
                              ? "Your order will be processed instantly from your wallet balance."
                              : "Your payment is processed securely through Paystack. We never store your card details."}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2"
                        disabled={isProcessing || (form.watch("paymentMethod") === "wallet" && hasInsufficientBalance)}
                        data-testid="button-pay"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {form.watch("paymentMethod") === "wallet" ? (
                              <>
                                <Wallet className="h-4 w-4" />
                                Pay from Wallet - {formatCurrency(price!)}
                              </>
                            ) : (
                              <>
                                Pay {formatCurrency(price!)}
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

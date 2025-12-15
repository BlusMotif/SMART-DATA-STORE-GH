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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/ui/loading-spinner";
import { NetworkBadge } from "@/components/products/network-badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, APP_NAME } from "@/lib/constants";
import { Phone, Mail, Loader2, ShieldCheck, Lock, CheckCircle, Wifi, Clock, FileCheck } from "lucide-react";
import type { DataBundle } from "@shared/schema";

const checkoutSchema = z.object({
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutResult {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

export default function CheckoutPage() {
  const { productType, productId, year } = useParams<{ productType: string; productId: string; year?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const isDataBundle = productType === "data-bundle";
  const isResultChecker = productType === "result-checker";

  const { data: bundle, isLoading: bundleLoading } = useQuery<DataBundle>({
    queryKey: ["/api/products/data-bundles", productId],
    enabled: isDataBundle && !!productId,
  });

  const { data: checkerInfo, isLoading: checkerLoading } = useQuery<{ type: string; year: number; price: number; stock: number }>({
    queryKey: ["/api/products/result-checkers/info", productId, year],
    enabled: isResultChecker && !!productId && !!year,
  });

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerPhone: "",
      customerEmail: "",
    },
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const payload = {
        productType: isDataBundle ? "data_bundle" : "result_checker",
        productId: isDataBundle ? productId : productId,
        year: isResultChecker ? parseInt(year!) : undefined,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail || undefined,
      };

      const response = await apiRequest("POST", "/api/checkout/initialize", payload);
      return response.json() as Promise<CheckoutResult>;
    },
    onSuccess: (data) => {
      window.location.href = data.authorizationUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Payment initialization failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    setIsProcessing(true);
    initializePaymentMutation.mutate(data);
  };

  const isLoading = bundleLoading || checkerLoading;
  const product = isDataBundle ? bundle : checkerInfo;
  const price = isDataBundle ? bundle?.basePrice : checkerInfo?.price;

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
      
      <main className="flex-1 py-12 px-4">
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
                                  className="pl-10"
                                  data-testid="input-phone"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              {isDataBundle
                                ? "The data bundle will be sent to this number"
                                : "We'll send the result checker PIN to this number"}
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
                          <p className="font-medium text-green-800 dark:text-green-300">Secure Payment</p>
                          <p className="text-green-700 dark:text-green-400">
                            Your payment is processed securely through Paystack. We never store your card details.
                          </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2"
                        disabled={isProcessing}
                        data-testid="button-pay"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Pay {formatCurrency(price!)}
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

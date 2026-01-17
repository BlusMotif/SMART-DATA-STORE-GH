import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormLabelWithoutFor, FormMessage, FormDescription } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/constants";
import { normalizePhoneNumber } from "@/lib/network-validator";
import { Phone, Mail, Loader2, ShieldCheck, FileCheck, Wallet, CreditCard, CheckCircle, AlertCircle, ShoppingCart } from "lucide-react";

const checkoutSchema = z.object({
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  paymentMethod: z.enum(["paystack", "wallet"]).default("paystack"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface ResultCheckerStock {
  type: string;
  year: number;
  price: number;
  stock: number;
}

interface UserStats {
  totalOrders: number;
  totalSpent: string;
  walletBalance: string;
}

interface UnifiedResultCheckerFlowProps {
  agentSlug?: string | null;
}

export function UnifiedResultCheckerFlow({ agentSlug }: UnifiedResultCheckerFlowProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedChecker, setSelectedChecker] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch result checkers stock
  const { data: resultCheckerStock, isLoading: stockLoading } = useQuery<ResultCheckerStock[]>({
    queryKey: ["/api/products/result-checkers/stock"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Fetch user stats to get wallet balance
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  const selectedCheckerData = resultCheckerStock?.find(
    item => `${item.type}-${item.year}` === selectedChecker
  );

  const walletBalance = userStats?.walletBalance ? parseFloat(userStats.walletBalance) : 0;
  const price = selectedCheckerData ? selectedCheckerData.price : 0;
  const hasInsufficientBalance = Boolean(
    !statsLoading && userStats && price > 0 && walletBalance < price
  );

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerEmail: "",
      paymentMethod: "paystack",
    },
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      if (!selectedCheckerData) throw new Error("No checker selected");

      const [type, year] = selectedChecker.split("-");

      if (data.paymentMethod === "wallet") {
        const payload = {
          productType: "result_checker",
          productId: `${type}-${year}`,
          productName: `${type.toUpperCase()} Result Checker ${year}`,
          amount: price.toFixed(2),
          agentSlug: agentSlug || undefined,
        };

        const response = await apiRequest("POST", "/api/wallet/pay", payload);
        return response.json();
      } else {
        const payload = {
          productType: "result_checker",
          productId: `${type}-${year}`,
          customerEmail: data.customerEmail || undefined,
          agentSlug: agentSlug || undefined,
        };

        const response = await apiRequest("POST", "/api/checkout/initialize", payload);
        return response.json();
      }
    },
    onSuccess: (data, variables) => {
      if (variables.paymentMethod === "wallet") {
        toast({
          title: "✅ Payment Successful!",
          description: `Your purchase has been confirmed. ${data.deliveredPin ? `PIN: ${data.deliveredPin}` : 'Check your phone for the PIN.'}`,
          duration: 5000,
        });
        setTimeout(() => {
          setLocation("/user/dashboard");
        }, 2000);
      } else {
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
    if (!selectedCheckerData) {
      toast({
        title: "No Checker Selected",
        description: "Please select a result checker to continue",
        variant: "destructive",
      });
      return;
    }

    if (selectedCheckerData.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This result checker is currently out of stock. Please try another.",
        variant: "destructive",
      });
      return;
    }

    const normalizedPhone = "0000000000"; // Dummy phone for result checkers
    
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
    initializePaymentMutation.mutate({
      ...data,
      customerPhone: normalizedPhone,
    });
  };

  if (stockLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!resultCheckerStock || resultCheckerStock.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No result checkers available at the moment.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Select Result Checker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
            Select Result Checker
          </CardTitle>
          <CardDescription>Choose the exam type and year</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedChecker} onValueChange={setSelectedChecker}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a result checker..." />
            </SelectTrigger>
            <SelectContent>
              {resultCheckerStock.map((item) => (
                <SelectItem 
                  key={`${item.type}-${item.year}`} 
                  value={`${item.type}-${item.year}`}
                  disabled={item.stock <= 0}
                >
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="font-medium uppercase">
                      {item.type} {item.year}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                    </span>
                    <span className="font-bold text-primary">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCheckerData && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg uppercase">
                    {selectedCheckerData.type} Result Checker {selectedCheckerData.year}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {selectedCheckerData.stock} PINs available
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedCheckerData.price)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Payment Details */}
      {selectedCheckerData && selectedCheckerData.stock > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
              Complete Your Purchase
            </CardTitle>
            <CardDescription>Enter your details and choose payment method</CardDescription>
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
                                className={`flex items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all ${
                                  hasInsufficientBalance ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Wallet className="h-5 w-5" />
                                  <div>
                                    <div className="font-medium">Wallet Balance</div>
                                    <div className="text-sm text-muted-foreground">
                                      Available: GH₵{walletBalance.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                {field.value === "wallet" && (
                                  <CheckCircle className="h-5 w-5 text-primary" />
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
                              className="flex items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5" />
                                <div>
                                  <div className="font-medium">Paystack</div>
                                  <div className="text-sm text-muted-foreground">
                                    Pay with card, bank transfer
                                  </div>
                                </div>
                              </div>
                              {field.value === "paystack" && (
                                <CheckCircle className="h-5 w-5 text-primary" />
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
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Insufficient Balance:</strong> You need GH₵{(price - walletBalance).toFixed(2)} more. 
                      <a href="/user/wallet" className="underline ml-1 font-medium hover:text-destructive-foreground">Top up wallet</a> or select Paystack.
                    </AlertDescription>
                  </Alert>
                )}

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
                        ? "Your result checker PIN and serial number will be generated instantly and available for download."
                        : "Your payment is processed securely through Paystack. Your result checker will be available for download after payment."}
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  disabled={isProcessing || (form.watch("paymentMethod") === "wallet" && hasInsufficientBalance)}
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
                          Pay from Wallet - {formatCurrency(price)}
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Complete Purchase - {formatCurrency(price)}
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

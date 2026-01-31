import { useEffect, useState } from "react";
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
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/constants";
import { Phone, Loader2, ShieldCheck, FileCheck, Wallet, CreditCard, CheckCircle, AlertCircle, ShoppingCart, Plus, Minus, Download } from "lucide-react";
import jsPDF from "jspdf";

const checkoutSchema = z.object({
  customerPhone: z.string().min(10, "Invalid phone number").regex(/^[0-9+\-\s()]*$/, "Phone number must contain only numbers and valid characters"),
  paymentMethod: z.enum(["paystack", "wallet"], {
    required_error: "Please select a payment method",
  }),
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
  const [quantity, setQuantity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<any>(null);

  const scrollToTopQuick = () => {
    const opts: ScrollToOptions = { top: 0, behavior: "smooth" };
    // Try scrolling both the window and document roots to ensure full jump to top
    window.requestAnimationFrame(() => {
      window.scrollTo(opts);
      document.documentElement?.scrollTo?.(opts);
      document.body?.scrollTo?.(opts);
    });
  };

  // Fetch result checkers stock
  const { data: resultCheckerStock, isLoading: stockLoading } = useQuery<ResultCheckerStock[]>({
    queryKey: ["/api/products/result-checkers/stock"],
    queryFn: () => apiRequest("/api/products/result-checkers/stock"),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Ensure the view starts at the top when the flow loads
  useEffect(() => {
    scrollToTopQuick();
  }, []);

  // Fetch user stats to get wallet balance
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    queryFn: () => apiRequest("/api/user/stats"),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const selectedCheckerData = resultCheckerStock?.find(
    item => `${item.type}-${item.year}` === selectedChecker
  );

  const walletBalance = userStats?.walletBalance ? parseFloat(userStats.walletBalance) : 0;
  const unitPrice = selectedCheckerData ? selectedCheckerData.price : 0;
  const totalPrice = unitPrice * quantity;
  const hasInsufficientBalance = Boolean(
    !statsLoading && userStats && totalPrice > 0 && walletBalance < totalPrice
  );

  // Reset quantity and success state when checker changes
  const handleCheckerChange = (value: string) => {
    setSelectedChecker(value);
    setQuantity(1);
    setPaymentSuccess(false);
    setSuccessData(null);
    // Bring the user back to the top when a product is chosen to start the flow at the beginning
    scrollToTopQuick();
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (selectedCheckerData) {
      const maxQuantity = selectedCheckerData.stock;
      if (newQuantity >= 1 && newQuantity <= maxQuantity) {
        setQuantity(newQuantity);
      } else if (newQuantity > maxQuantity) {
        toast({
          title: "Quantity Exceeded",
          description: `Only ${maxQuantity} PINs available for ${selectedCheckerData.type.toUpperCase()} ${selectedCheckerData.year}`,
          variant: "destructive",
        });
      }
    }
  };

  const generatePDF = () => {
    if (!selectedCheckerData || !successData) return;

    const [type, year] = selectedChecker.split("-");
    const doc = new jsPDF();
    
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const lineHeight = 7;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RESULT CHECKER PURCHASE RECEIPT", margin, yPosition);
    yPosition += 12;

    // Receipt Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt Date: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Transaction ID: ${successData.transactionId || "RCP" + Date.now()}`, margin, yPosition);
    yPosition += 12;

    // Purchase Details Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("PURCHASE DETAILS", margin, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Product: ${type.toUpperCase()} Result Checker ${year}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Quantity: ${quantity}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Unit Price: GH₵${selectedCheckerData.price.toFixed(2)}`, margin, yPosition);
    yPosition += lineHeight;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Amount: GH₵${totalPrice.toFixed(2)}`, margin, yPosition);
    yPosition += 12;

    // Result Checker Details Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("RESULT CHECKER DETAILS", margin, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Generate sample PIN and serial numbers for display
    const pinsArray = successData.pinsData || [];
    if (pinsArray.length > 0) {
      pinsArray.forEach((item: any, index: number) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(`PIN ${index + 1}:`, margin, yPosition);
        yPosition += lineHeight;
        doc.text(`Serial number: ${item.serialNumber || item.serial || "XXXXX-XXXXX-XXXXX"}`, margin + 5, yPosition);
        yPosition += lineHeight;
        doc.text(`Pin: ${item.pin || "XXXX-XXXX-XXXX-XXXX"}`, margin + 5, yPosition);
        yPosition += 10;
      });
    } else if (successData.deliveredPin) {
      doc.text(`Serial number: ${successData.serialNumber || successData.deliveredPin.split("-")[0] || "XXXXX-XXXXX-XXXXX"}`, margin + 5, yPosition);
      yPosition += lineHeight;
      doc.text(`Pin: ${successData.deliveredPin}`, margin + 5, yPosition);
      yPosition += 12;
    }

    // Customer Information
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("CUSTOMER INFORMATION", margin, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Phone: ${user?.phone || "N/A"}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Email: ${user?.email || "N/A"}`, margin, yPosition);
    yPosition += 12;

    // Delivery Status
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DELIVERY STATUS", margin, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Status: Completed", margin, yPosition);
    yPosition += lineHeight;
    doc.text(`PINs Delivered: ${quantity}`, margin, yPosition);
    yPosition += 12;

    // Footer
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Keep this receipt safe for your records. Use the provided PINs to check WAEC results.", margin, pageHeight - 20);
    doc.text(`Generated: ${new Date().toISOString()}`, margin, pageHeight - 10);

    // Save PDF
    doc.save(`result-checker-receipt-${Date.now()}.pdf`);

    toast({
      title: "✅ Downloaded",
      description: "Your receipt has been downloaded successfully",
    });
  };

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerPhone: "",
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
          productName: `${quantity} x ${type.toUpperCase()} Result Checker ${year}`,
          amount: totalPrice.toFixed(2),
          agentSlug: agentSlug || undefined,
          quantity: quantity,
        };

        return await apiRequest("/api/wallet/pay", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        const payload = {
          productType: "result_checker",
          productId: `${type}-${year}`,
          productName: `${quantity} x ${type.toUpperCase()} Result Checker ${year}`,
          amount: totalPrice.toFixed(2),
          customerPhone: data.customerPhone,
          customerEmail: user?.email || undefined,
          agentSlug: agentSlug || undefined,
          quantity: quantity,
        };

        console.log("[Result Checker] Paystack payment payload:", {
          amount: payload.amount,
          quantity: payload.quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice
        });

        return await apiRequest("/api/checkout/initialize", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: (data, variables) => {
      setIsProcessing(false);
      
      if (variables.paymentMethod === "wallet") {
        toast({
          title: "✅ Payment Successful!",
          description: "Redirecting to live status...",
          duration: 3000,
        });
        if (data?.reference) {
          setLocation(`/checkout/success?reference=${data.reference}`);
          return;
        }
        setSuccessData(data);
        setPaymentSuccess(true);
      } else {
        // Paystack payment - redirect to authorization URL
        const authUrl = data.paymentUrl || data.authorizationUrl || data.authorization_url || data.data?.authorization_url;
        
        if (authUrl) {
          window.location.href = authUrl;
        } else {
          console.error("Payment response:", data);
          toast({
            title: "❌ Payment Initialization Failed",
            description: data.message || "Unable to redirect to payment page. Please try again.",
            variant: "destructive",
          });
        }
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

    if (selectedCheckerData.stock < quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${selectedCheckerData.stock} PINs available. Please reduce quantity or select another checker.`,
        variant: "destructive",
      });
      return;
    }

    if (data.paymentMethod === "wallet" && hasInsufficientBalance) {
      const shortfall = totalPrice - walletBalance;
      toast({
        title: "⚠️ Insufficient Wallet Balance",
        description: `You need GH₵${shortfall.toFixed(2)} more to complete this purchase. Current balance: GH₵${walletBalance.toFixed(2)}, Required: GH₵${totalPrice.toFixed(2)}. Please top up or use Paystack.`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    setIsProcessing(true);
    initializePaymentMutation.mutate(data);
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

  // Success state
  if (paymentSuccess && selectedCheckerData) {
    const [type, year] = selectedChecker.split("-");
    return (
      <Card className="border-green-500 bg-white dark:bg-black">
        <CardHeader className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-green-700 dark:text-green-300 text-2xl">Payment Successful! 🎉</CardTitle>
              <CardDescription className="text-green-600 dark:text-green-400 mt-1">
                Your result checkers have been delivered
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Purchase Summary */}
          <div className="bg-muted dark:bg-black/20 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg">Purchase Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">{type.toUpperCase()} Result Checker {year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{quantity} PIN(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-medium">{formatCurrency(selectedCheckerData.price)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total Amount Paid:</span>
                <span className="font-bold text-primary text-lg">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📧 Delivery Details</h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Your result checker PINs have been sent to your email. Check your inbox (and spam folder) for the delivery details.
            </p>
            {successData?.deliveredPin && (
              <p className="text-sm font-mono bg-white dark:bg-black rounded p-2 mt-2 text-muted-foreground">
                Reference: {successData.deliveredPin}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={generatePDF}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </Button>
            <Button
              onClick={() => setLocation("/user/dashboard")}
              variant="outline"
              className="flex-1 gap-2"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </div>

          {/* Next Steps */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">📝 Next Steps</h3>
            <ol className="text-sm text-amber-800 dark:text-amber-400 list-decimal list-inside space-y-1">
              <li>Use the PINs to check WAEC result on the official website</li>
              <li>Keep your receipt safe for your records</li>
              <li>Contact support if you encounter any issues</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Result Checker Purchase</CardTitle>
        <CardDescription>Select, review, and pay in one card.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Result Checker</Label>
          <Select value={selectedChecker} onValueChange={handleCheckerChange}>
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
        </div>

        {/* Summary & quantity */}
        {selectedCheckerData && (
          <div className="bg-muted rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
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
                <p className="text-sm text-muted-foreground mb-1">Unit Price</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(unitPrice)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-3 bg-background rounded-lg p-2">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    title="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedCheckerData.stock}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-12 text-center font-semibold border rounded px-2 py-1 text-black"
                    placeholder="1"
                    aria-label="Quantity of result checkers"
                    title="Enter quantity"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                    disabled={quantity >= selectedCheckerData.stock}
                    aria-label="Increase quantity"
                    title="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="pt-3 bg-white dark:bg-black/20 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">Subtotal ({quantity}x @ {formatCurrency(unitPrice)})</span>
                  <span className="font-medium">{formatCurrency(unitPrice * quantity)}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary text-2xl">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabelWithoutFor className="text-green-700">Payment Method</FormLabelWithoutFor>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-3"
                    >
                      {user && (
                        <div className="relative">
                          <div className={`flex items-center space-x-2 p-4 rounded-lg border-2 border-muted !bg-white hover:border-green-500 cursor-pointer transition-all ${
                            hasInsufficientBalance ? "opacity-50 cursor-not-allowed" : ""
                          }`}>
                            <RadioGroupItem value="wallet" id="wallet" disabled={hasInsufficientBalance} />
                            <Label htmlFor="wallet" className="flex items-center justify-between flex-1 cursor-pointer">
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
                          </div>
                          {hasInsufficientBalance && (
                            <div className="absolute top-2 right-2">
                              <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                                Insufficient
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-2 p-4 rounded-lg border-2 border-muted !bg-white hover:border-green-500 cursor-pointer transition-all">
                        <RadioGroupItem
                          value="paystack"
                          id="paystack"
                        />
                        <Label htmlFor="paystack" className="flex items-center justify-between flex-1 cursor-pointer">
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
              <Alert variant="default" className="border-destructive/50 bg-white text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Insufficient Balance:</strong> You need GH₵{(totalPrice - walletBalance).toFixed(2)} more. 
                  <a href="/user/wallet" className="underline ml-1 font-medium hover:text-destructive-foreground">Top up wallet</a> or select Paystack.
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
                        placeholder="+233 XX XXX XXXX"
                        type="tel"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    We'll use this number to deliver your result checker PINs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-green-600 dark:bg-green-700 rounded-lg p-4 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-white dark:text-white mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-white dark:text-white">
                  {form.watch("paymentMethod") === "wallet" ? "Instant Purchase" : "Secure Payment"}
                </p>
                <p className="text-white dark:text-white">
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
              disabled={isProcessing || !form.watch("paymentMethod") || (form.watch("paymentMethod") === "wallet" && hasInsufficientBalance) || !selectedCheckerData}
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
                      Pay from Wallet - {formatCurrency(totalPrice)}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Complete Purchase - {formatCurrency(totalPrice)}
                    </>
                  )}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

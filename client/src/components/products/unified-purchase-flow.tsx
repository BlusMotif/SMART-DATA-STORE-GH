import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
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
import { validatePhoneNetwork, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { NetworkBadge } from "@/components/products/network-badge";
import { Phone, Mail, Loader2, ShieldCheck, Wifi, Clock, Wallet, CreditCard, CheckCircle, AlertCircle, ShoppingCart, ChevronDown, ChevronUp, Package, Layers, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
import type { DataBundle } from "@shared/schema";

const singleOrderSchema = z.object({
  customerPhone: z.string()
    .min(10, "Phone number must be exactly 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .regex(/^0[0-9]{9}$/, "Phone number must start with 0 and be 10 digits (e.g., 0241234567)"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  paymentMethod: z.enum(["paystack", "wallet"]).default("paystack"),
});

const bulkOrderSchema = z.object({
  phoneNumbers: z.string()
    .min(10, "Enter at least one phone number with data amount")
    .refine((val) => {
      const lines = val.split('\n').map(l => l.trim()).filter(l => l);
      return lines.every(line => {
        const parts = line.split(/\s+/);
        return parts.length >= 2 && /^0[0-9]{9}$/.test(parts[0]);
      });
    }, "Each line must start with a valid phone number (10 digits starting with 0) followed by data amount")
    .refine((val) => {
      const lines = val.split('\n').map(l => l.trim()).filter(l => l);
      const phoneNumbers = lines.map(line => line.split(/\s+/)[0]);
      const uniquePhones = new Set(phoneNumbers);
      return phoneNumbers.length === uniquePhones.size;
    }, "Duplicate phone numbers found. Please remove duplicates before proceeding."),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  paymentMethod: z.enum(["paystack", "wallet"]).default("paystack"),
});

type SingleOrderFormData = z.infer<typeof singleOrderSchema>;
type BulkOrderFormData = z.infer<typeof bulkOrderSchema>;

interface UserStats {
  totalOrders: number;
  totalSpent: string;
  walletBalance: string;
}

interface UnifiedPurchaseFlowProps {
  network: string;
  agentSlug?: string | null;
}

export function UnifiedPurchaseFlow({ network, agentSlug }: UnifiedPurchaseFlowProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState<"single" | "bulk" | "excel">("single");
  const [isStep1Open, setIsStep1Open] = useState(true);
  const [isStep2Open, setIsStep2Open] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Calculate total for bulk orders
  useEffect(() => {
    if (orderType === "bulk" && bulkForm.watch("phoneNumbers")) {
      const lines = bulkForm.watch("phoneNumbers").split('\n').map(l => l.trim()).filter(l => l);
      let total = 0;
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;
        let dataAmount = parts.slice(1).join(' ').toLowerCase();
        if (!dataAmount.includes('mb') && !dataAmount.includes('gb')) {
          dataAmount += 'gb';
        }
        const bundle = filteredBundles?.find(b => b.dataAmount.toLowerCase() === dataAmount);
        if (bundle) {
          total += parseFloat(bundle.customPrice || '0');
        }
      }
      setTotalAmount(total);
    } else {
      setTotalAmount(price);
    }
  }, [orderType, bulkForm.watch("phoneNumbers"), filteredBundles, price]);

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const lines: string[] = [];
      json.forEach((row: any) => {
        if (row[0] && row[1]) {
          lines.push(`${row[0]} ${row[1]}`);
        }
      });

      // Check for duplicate phone numbers
      const phoneNumbers = lines.map(line => line.split(/\s+/)[0]);
      const duplicates = phoneNumbers.filter((phone, index) => phoneNumbers.indexOf(phone) !== index);
      const uniqueDuplicates = [...new Set(duplicates)];

      if (uniqueDuplicates.length > 0) {
        toast({
          title: "Duplicate Phone Numbers Found",
          description: `Please remove duplicate numbers: ${uniqueDuplicates.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      bulkForm.setValue('phoneNumbers', lines.join('\n'));
      setOrderType('bulk'); // Switch to bulk after upload
    };
    reader.readAsArrayBuffer(file);
  };

  // Fetch data bundles for the network
  const { data: dataBundles, isLoading: bundlesLoading } = useQuery<DataBundle[]>({
    queryKey: ["/api/products/data-bundles"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Fetch user stats to get wallet balance
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  const filteredBundles = dataBundles?.filter(
    (bundle) => bundle.network === network && bundle.isActive
  );

  const sortedBundles = filteredBundles?.sort(
    (a, b) => getBundlePrice(a) - getBundlePrice(b)
  );

  const selectedBundle = sortedBundles?.find(bundle => bundle.id === selectedBundleId);
  const walletBalance = userStats?.walletBalance ? parseFloat(userStats.walletBalance) : 0;

  // Get price based on user role
  const getBundlePrice = (bundle: typeof selectedBundle) => {
    if (!bundle) return 0;
    
    const userRole = user?.role || 'guest';
    
    switch (userRole) {
      case 'super_dealer':
        return bundle.superDealerPrice ? parseFloat(bundle.superDealerPrice) : parseFloat(bundle.basePrice);
      case 'dealer':
        return bundle.dealerPrice ? parseFloat(bundle.dealerPrice) : parseFloat(bundle.basePrice);
      case 'agent':
        return bundle.agentPrice ? parseFloat(bundle.agentPrice) : parseFloat(bundle.basePrice);
      case 'admin':
      case 'user':
      default:
        return parseFloat(bundle.basePrice);
    }
  };

  const price = selectedBundle ? getBundlePrice(selectedBundle) : 0;
  const hasInsufficientBalance = Boolean(
    !statsLoading && userStats && price > 0 && walletBalance < price
  );

  const singleForm = useForm<SingleOrderFormData>({
    resolver: zodResolver(singleOrderSchema),
    defaultValues: {
      customerPhone: user?.phone || "",
      customerEmail: "",
      paymentMethod: "paystack",
    },
  });

  const bulkForm = useForm<BulkOrderFormData>({
    resolver: zodResolver(bulkOrderSchema),
    defaultValues: {
      phoneNumbers: "",
      customerEmail: "",
      paymentMethod: "paystack",
    },
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async (data: SingleOrderFormData | BulkOrderFormData) => {
      if (!selectedBundle) throw new Error("No bundle selected");

      const isBulk = 'phoneNumbers' in data;
      const phoneNumbers = isBulk 
        ? (data as BulkOrderFormData).phoneNumbers.split(/[\n,]/).map(n => n.trim()).filter(n => n)
        : [(data as SingleOrderFormData).customerPhone];

      // Check for duplicate phone numbers in bulk orders
      if (isBulk) {
        const phoneNumbersOnly = phoneNumbers.map(line => line.split(/\s+/)[0]);
        const uniquePhones = new Set(phoneNumbersOnly);
        if (phoneNumbersOnly.length !== uniquePhones.size) {
          throw new Error("Duplicate phone numbers found. Please remove duplicates before proceeding.");
        }
      }

      console.log("[Frontend] ========== PAYMENT INITIALIZATION ==========");
      console.log("[Frontend] Order type:", orderType);
      console.log("[Frontend] Form data has phoneNumbers field:", 'phoneNumbers' in data);
      console.log("[Frontend] isBulk:", isBulk);
      console.log("[Frontend] phoneNumbers array:", phoneNumbers);
      console.log("[Frontend] numberOfRecipients:", phoneNumbers.length);
      console.log("[Frontend] ================================================");

      const totalAmount = price * phoneNumbers.length;

      if (data.paymentMethod === "wallet") {
        const payload = {
          productType: "data_bundle",
          productId: selectedBundle.id,
          productName: selectedBundle.name,
          network: selectedBundle.network,
          amount: totalAmount.toFixed(2),
          customerPhone: phoneNumbers[0],
          phoneNumbers: isBulk ? phoneNumbers : undefined,
          isBulkOrder: isBulk,
          agentSlug: agentSlug || undefined,
        };

        console.log("[Frontend] Wallet payload:", JSON.stringify(payload, null, 2));

        const response = await apiRequest("POST", "/api/wallet/pay", payload);
        return response.json();
      } else {
        const payload = {
          productType: "data_bundle",
          productId: selectedBundle.id,
          customerPhone: phoneNumbers[0],
          phoneNumbers: isBulk ? phoneNumbers : undefined,
          isBulkOrder: isBulk,
          customerEmail: data.customerEmail || undefined,
          agentSlug: agentSlug || undefined,
        };

        console.log("[Frontend] Sending Paystack payload:", JSON.stringify(payload, null, 2));
        console.log("[Frontend] Phone numbers:", phoneNumbers);
        console.log("[Frontend] Is bulk:", isBulk);
        console.log("[Frontend] Number of recipients:", phoneNumbers.length);

        const response = await apiRequest("POST", "/api/checkout/initialize", payload);
        const result = await response.json();
        
        console.log("[Frontend] ===== SERVER RESPONSE DEBUG =====");
        console.log("[Frontend] Debug info from server:", result.debug);
        console.log("[Frontend] ========================================");
        
        return result;
      }
    },
    onSuccess: (data, variables) => {
      if (variables.paymentMethod === "wallet") {
        toast({
          title: "✅ Payment Successful!",
          description: `Your purchase has been confirmed. New wallet balance: GH₵${data.newBalance}. Redirecting...`,
          duration: 3000,
        });
        setTimeout(() => {
          setLocation("/user/dashboard");
        }, 1000);
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

  const onSubmit = (data: SingleOrderFormData | BulkOrderFormData) => {
    const isBulk = 'phoneNumbers' in data;
    
    let totalAmount = 0;
    let phoneNumbers: string[] = [];
    let orderItems: any[] = [];

    if (isBulk) {
      const lines = (data as BulkOrderFormData).phoneNumbers.split('\n').map(l => l.trim()).filter(l => l);
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;
        const phone = normalizePhoneNumber(parts[0]);
        const dataAmount = parts.slice(1).join(' ').toLowerCase();
        phoneNumbers.push(phone);
        
        // Find bundle by dataAmount
        const bundle = filteredBundles.find(b => b.dataAmount.toLowerCase() === dataAmount);
        if (!bundle) {
          toast({
            title: "Bundle Not Found",
            description: `No bundle found for ${dataAmount} in ${network}`,
            variant: "destructive",
          });
          return;
        }
        
        const price = parseFloat(bundle.customPrice || '0');
        totalAmount += price;
        orderItems.push({
          phone,
          bundleName: `${bundle.dataAmount} ${bundle.validity}`,
          dataAmount: bundle.dataAmount,
          price: price.toFixed(2),
        });
        
        // Validate network but don't deny
        const validation = validatePhoneNetwork(phone, bundle.network);
        if (!validation.isValid) {
          toast({
            title: "⚠️ Network Mismatch",
            description: `${phone}: This number belongs to a different network. Purchase allowed but delivery may fail.`,
            variant: "default",
            duration: 5000,
          });
        }
      }
    } else {
      const phone = normalizePhoneNumber((data as SingleOrderFormData).customerPhone);
      phoneNumbers = [phone];
      totalAmount = price;
      
      // Validate network but don't deny
      const validation = validatePhoneNetwork(phone, selectedBundle.network);
      if (!validation.isValid) {
        toast({
          title: "⚠️ Network Mismatch",
          description: `${phone}: This number belongs to a different network. Purchase allowed but delivery may fail.`,
          variant: "default",
          duration: 5000,
        });
      }
    }

    if (phoneNumbers.length === 0) {
      toast({
        title: "No Valid Orders",
        description: "Please enter valid phone numbers",
        variant: "destructive",
      });
      return;
    }
    
    if (data.paymentMethod === "wallet" && walletBalance < totalAmount) {
      const shortfall = totalAmount - walletBalance;
      toast({
        title: "⚠️ Insufficient Wallet Balance",
        description: `You need GH₵${shortfall.toFixed(2)} more. Current balance: GH₵${walletBalance.toFixed(2)}, Required: GH₵${totalAmount.toFixed(2)}. Please top up or use Paystack.`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    setIsProcessing(true);
    initializePaymentMutation.mutate({ ...data, orderItems, totalAmount });
  };

  if (bundlesLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sortedBundles || sortedBundles.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No data bundles available for this network.</p>
        </div>
      </Card>
    );
  }

  const handleBundleSelect = (bundleId: string) => {
    setSelectedBundleId(bundleId);
    setIsStep1Open(false);
    setIsStep2Open(true);
  };

  const totalAmount = orderType === "bulk" && bulkForm.watch("phoneNumbers")
    ? price * bulkForm.watch("phoneNumbers").split(/[\n,]/).map(n => n.trim()).filter(n => n).length
    : price;

  return (
    <div className="space-y-6">
      {/* Step 1: Select Bundle */}
      <Collapsible open={isStep1Open} onOpenChange={setIsStep1Open}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                  Select Your Data Bundle
                  {selectedBundle && !isStep1Open && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      - {selectedBundle.dataAmount} ({formatCurrency(getBundlePrice(selectedBundle))})
                    </span>
                  )}
                </CardTitle>
                {isStep1Open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
              <CardDescription>Choose the data package that suits your needs</CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <Select value={selectedBundleId} onValueChange={handleBundleSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a data bundle..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedBundles.map((bundle) => (
                    <SelectItem key={bundle.id} value={bundle.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">
                          {bundle.dataAmount}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {bundle.validity}
                        </span>
                        <span className="font-bold text-primary">
                          {formatCurrency(getBundlePrice(bundle))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedBundle && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedBundle.network.toUpperCase()} {selectedBundle.dataAmount} - {selectedBundle.validity} - {formatCurrency(getBundlePrice(selectedBundle))}</h3>
                      <NetworkBadge network={selectedBundle.network} className="mt-1" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(getBundlePrice(selectedBundle))}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Data:</strong> {selectedBundle.dataAmount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Validity:</strong> {selectedBundle.validity}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Step 2: Order Type & Payment Details */}
      {selectedBundle && (
        <Collapsible open={isStep2Open} onOpenChange={setIsStep2Open}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                    Complete Your Purchase
                  </CardTitle>
                  {isStep2Open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
                <CardDescription>Choose order type and enter payment details</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6">
                {/* Order Type Selection */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Order Type</Label>
                  <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "single" | "bulk" | "excel")} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/50 border-2 border-black rounded-lg">
                      <TabsTrigger 
                        value="single" 
                        className="gap-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all"
                      >
                        <Package className="h-4 w-4" />
                        Single Order
                      </TabsTrigger>
                      <TabsTrigger 
                        value="bulk" 
                        disabled={network === "at_ishare"}
                        className="gap-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Layers className="h-4 w-4" />
                        Bulk Order
                        {network === "at_ishare" && (
                          <span className="text-xs text-muted-foreground ml-1">(Disabled)</span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="excel" 
                        disabled={!user || user.role === 'guest' || network === "at_ishare"}
                        className="gap-2 border-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel Upload
                        {(!user || user.role === 'guest') && (
                          <span className="text-xs text-muted-foreground ml-1">(Login Required)</span>
                        )}
                        {network === "at_ishare" && user && user.role !== 'guest' && (
                          <span className="text-xs text-muted-foreground ml-1">(Disabled)</span>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {network === "at_ishare" && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Bulk orders and Excel uploads are not available for AT Ishare network.
                    </p>
                  )}
                </div>

                {/* Single Order Form */}
                {orderType === "single" && (
                  <Form {...singleForm}>
                    <form onSubmit={singleForm.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Payment Method */}
                      <FormField
                        control={singleForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Payment Method</FormLabel>
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
                                      htmlFor="wallet"
                                      className={`flex items-center justify-between rounded-lg border-2 border-black bg-card p-4 hover:border-primary hover:shadow-md peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:shadow-md cursor-pointer transition-all ${
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
                                    htmlFor="paystack"
                                    className="flex items-center justify-between rounded-lg border-2 border-black bg-card p-4 hover:border-primary hover:shadow-md peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:shadow-md cursor-pointer transition-all"
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

                      {hasInsufficientBalance && singleForm.watch("paymentMethod") === "wallet" && (
                        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Insufficient Balance:</strong> You need GH₵{(price - walletBalance).toFixed(2)} more. 
                            <a href="/user/wallet" className="underline ml-1 font-medium hover:text-destructive-foreground">Top up wallet</a> or select Paystack.
                          </AlertDescription>
                        </Alert>
                      )}

                      <FormField
                        control={singleForm.control}
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
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              <span className="text-xs">
                                For <strong>{selectedBundle.network.toUpperCase()}</strong> network only. 
                                Valid prefixes: <strong>{getNetworkPrefixes(selectedBundle.network).join(", ")}</strong>
                              </span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={singleForm.control}
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
                            {singleForm.watch("paymentMethod") === "wallet" ? "Instant Purchase" : "Secure Payment"}
                          </p>
                          <p className="text-green-700 dark:text-green-400">
                            {singleForm.watch("paymentMethod") === "wallet"
                              ? "Your order will be processed instantly from your wallet balance."
                              : "Your payment is processed securely through Paystack. We never store your card details."}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2"
                        disabled={isProcessing || (singleForm.watch("paymentMethod") === "wallet" && hasInsufficientBalance)}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {singleForm.watch("paymentMethod") === "wallet" ? (
                              <>
                                <Wallet className="h-4 w-4" />
                                Pay from Wallet - {formatCurrency(totalAmount)}
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4" />
                                Pay with Card - {formatCurrency(totalAmount)}
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}

                {/* Bulk Order Form */}
                {orderType === "bulk" && (
                  <Form {...bulkForm}>
                    <form onSubmit={bulkForm.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Payment Method */}
                      <FormField
                        control={bulkForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Payment Method</FormLabel>
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
                                      id="wallet-bulk"
                                      className="peer sr-only"
                                      disabled={walletBalance < totalAmount}
                                    />
                                    <Label
                                      htmlFor="wallet-bulk"
                                      className={`flex items-center justify-between rounded-lg border-2 border-black bg-card p-4 hover:border-primary hover:shadow-md peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:shadow-md cursor-pointer transition-all ${
                                        walletBalance < totalAmount ? "opacity-50 cursor-not-allowed" : ""
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
                                    {walletBalance < totalAmount && (
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
                                    id="paystack-bulk"
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor="paystack-bulk"
                                    className="flex items-center justify-between rounded-lg border-2 border-black bg-card p-4 hover:border-primary hover:shadow-md peer-data-[state=checked]:border-black peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:shadow-md cursor-pointer transition-all"
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

                      {walletBalance < totalAmount && bulkForm.watch("paymentMethod") === "wallet" && (
                        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Insufficient Balance:</strong> You need GH₵{(totalAmount - walletBalance).toFixed(2)} more. 
                            <a href="/user/wallet" className="underline ml-1 font-medium hover:text-destructive-foreground">Top up wallet</a> or select Paystack.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Excel Upload Section */}
                      {orderType === "excel" && (
                        <div className="space-y-4">
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <div className="text-sm font-medium mb-1">Upload Excel File</div>
                            <div className="text-xs text-muted-foreground mb-4">
                              Upload an Excel file (.xlsx, .xls) with phone numbers and data amounts
                            </div>
                            <Input
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleExcelUpload}
                              className="max-w-xs mx-auto"
                              disabled={!user}
                            />
                            {!user && (
                              <div className="text-xs text-destructive mt-2">
                                You must be logged in to use Excel upload
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong>Excel Format:</strong> Column A: Phone Numbers, Column B: Data Amount (e.g., "1GB", "500MB")
                          </div>
                        </div>
                      )}

                      <FormField
                        control={bulkForm.control}
                        name="phoneNumbers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Numbers *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="0241234567&#10;0501234567&#10;0261234567"
                                className="min-h-[120px] font-mono"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              <span className="text-xs">
                                Enter one phone number per line or separate with commas. All numbers must be for <strong>{selectedBundle.network.toUpperCase()}</strong> network. 
                                Valid prefixes: <strong>{getNetworkPrefixes(selectedBundle.network).join(", ")}</strong>
                              </span>
                            </FormDescription>
                            <FormMessage />
                            {(() => {
                              const lines = field.value.split('\n').map(l => l.trim()).filter(l => l);
                              const phoneNumbers = lines.map(line => line.split(/\s+/)[0]).filter(phone => phone);
                              const duplicates = phoneNumbers.filter((phone, index) => phoneNumbers.indexOf(phone) !== index);
                              const uniqueDuplicates = [...new Set(duplicates)];

                              if (uniqueDuplicates.length > 0) {
                                return (
                                  <div className="text-sm text-destructive mt-2 flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <strong>Duplicate phone numbers detected:</strong> {uniqueDuplicates.join(", ")}
                                      <br />
                                      <span className="text-xs">Please remove duplicates before proceeding.</span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="ml-2 h-6 text-xs"
                                        onClick={() => {
                                          const lines = field.value.split('\n').map(l => l.trim()).filter(l => l);
                                          const seen = new Set<string>();
                                          const uniqueLines = lines.filter(line => {
                                            const phone = line.split(/\s+/)[0];
                                            if (seen.has(phone)) {
                                              return false;
                                            }
                                            seen.add(phone);
                                            return true;
                                          });
                                          bulkForm.setValue('phoneNumbers', uniqueLines.join('\n'));
                                          toast({
                                            title: "Duplicates Removed",
                                            description: `Removed ${lines.length - uniqueLines.length} duplicate entries.`,
                                          });
                                        }}
                                      >
                                        Remove Duplicates
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {field.value && (
                              <div className="text-sm text-muted-foreground mt-2">
                                <strong>{field.value.split(/[\n,]/).map(n => n.trim()).filter(n => n).length}</strong> phone number(s) entered
                                <span className="ml-2">• Total: <strong>{formatCurrency(totalAmount)}</strong></span>
                              </div>
                            )}
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={bulkForm.control}
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
                            {bulkForm.watch("paymentMethod") === "wallet" ? "Bulk Instant Purchase" : "Bulk Secure Payment"}
                          </p>
                          <p className="text-green-700 dark:text-green-400">
                            {bulkForm.watch("paymentMethod") === "wallet"
                              ? "All orders will be processed instantly from your wallet balance."
                              : "Your payment is processed securely through Paystack for all orders."}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2"
                        disabled={isProcessing || (bulkForm.watch("paymentMethod") === "wallet" && walletBalance < totalAmount)}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {bulkForm.watch("paymentMethod") === "wallet" ? (
                              <>
                                <Wallet className="h-4 w-4" />
                                Pay from Wallet - {formatCurrency(totalAmount)}
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4" />
                                Complete Purchase - {formatCurrency(totalAmount)}
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/constants";
import { validatePhoneNetwork, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { 
  Phone, Mail, Loader2, Clock, CreditCard, AlertTriangle, 
  ArrowLeft, Package, ShoppingCart, Smartphone
} from "lucide-react";
import type { DataBundle } from "@shared/schema";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";

type AgentDataBundle = DataBundle & { price: string };

const networkInfo: Record<string, { name: string; logo: string }> = {
  mtn: { name: "MTN", logo: mtnLogo },
  telecel: { name: "Telecel", logo: telecelLogo },
  airteltigo: { name: "AirtelTigo", logo: airteltigoLogo },
  at_bigtime: { name: "AT BIG TIME", logo: airteltigoLogo },
  at_ishare: { name: "AT iShare", logo: airteltigoLogo },
};

const singleOrderSchema = z.object({
  customerPhone: z.string()
    .min(10, "Phone number must be exactly 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .regex(/^0[0-9]{9}$/, "Phone number must start with 0 and be 10 digits (e.g., 0241234567)"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

const bulkOrderSchema = z.object({
  phoneNumbers: z.string()
    .min(10, "Enter at least one phone number with GB amount")
    .refine((val) => {
      const lines = val.split(/\n/).map(n => n.trim()).filter(n => n);
      return lines.every(line => {
        const parts = line.split(/\s+/);
        if (parts.length !== 2) return false;
        
        // Check if phone number is valid (10 digits or 233 format)
        let phoneStr = parts[0].replace(/^\+/, '');
        if (phoneStr.startsWith('233')) {
          phoneStr = '0' + phoneStr.substring(3);
        }
        const phoneValid = /^0[0-9]{9}$/.test(phoneStr);
        
        // Check if GB amount is a valid number
        const gbAmount = parseFloat(parts[1]);
        const gbValid = !isNaN(gbAmount) && gbAmount > 0;
        
        return phoneValid && gbValid;
      });
    }, "Each line must have format: phone_number GB_amount (e.g., '0241234567 2' or '233241234567 2')"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type SingleOrderFormData = z.infer<typeof singleOrderSchema>;
type BulkOrderFormData = z.infer<typeof bulkOrderSchema>;

export default function AgentNetworkPurchasePage() {
  const { role, slug, network } = useParams<{ role: string; slug: string; network: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState<"single" | "bulk">("single");
  // Force Paystack for single purchases on agent storefronts
  const [paymentMethod, setPaymentMethod] = useState<"paystack">("paystack");

  // Disable bulk orders for AT Ishare network
  useEffect(() => {
    if (network === "at_ishare" && orderType === "bulk") {
      setOrderType("single");
    }
  }, [network, orderType]);

  // Handle back button to redirect to storefront homepage
  useEffect(() => {
    const handlePopState = () => {
      // When back button is pressed on product page, redirect to homepage
      setLocation(`/store/${role}/${slug}`);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [role, slug, setLocation]);

  const info = networkInfo[network || ""] || { name: "Unknown", logo: "" };

  // Fetch agent data
  const { data: storeData, isLoading: agentLoading } = useQuery<{ store: { businessName: string; businessDescription: string; slug: string; whatsappSupportLink?: string; whatsappChannelLink?: string; role: string }; dataBundles: AgentDataBundle[] }>({
    queryKey: [`/api/store/${role}/${slug}`],
    enabled: !!role && !!slug,
  });

  // Fetch user wallet balance
  const { data: userData } = useQuery<{ user: { walletBalance: string } }>({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });

  const walletBalance = parseFloat(userData?.user?.walletBalance || "0");
  const dataBundles = storeData?.dataBundles || [];

  const filteredBundles = dataBundles?.filter(
    (bundle) => bundle.network === network && bundle.isActive
  );

  const sortedBundles = filteredBundles?.sort(
    (a, b) => parseFloat(a.price) - parseFloat(b.price)
  );

  const selectedBundle = sortedBundles?.find(bundle => bundle.id === selectedBundleId);
  const price = selectedBundle ? parseFloat(selectedBundle.price) : 0;

  const singleForm = useForm<SingleOrderFormData>({
    resolver: zodResolver(singleOrderSchema),
    defaultValues: {
      customerPhone: "",
      customerEmail: "",
    },
  });

  const bulkForm = useForm<BulkOrderFormData>({
    resolver: zodResolver(bulkOrderSchema),
    defaultValues: {
      phoneNumbers: "",
      customerEmail: "",
    },
  });

  // Calculate bulk purchase total with agent markup
  const bulkTotal = useMemo(() => {
    const phoneNumbers = bulkForm.watch("phoneNumbers");
    if (!phoneNumbers?.trim() || !sortedBundles || !storeData?.store) return { total: 0, count: 0 };
    
    const lines = phoneNumbers.split('\n').filter(line => line.trim());
    // Pricing is already resolved on the server side, no additional markup needed
    let total = 0;
    let count = 0;
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 2) {
        const gbAmount = parseFloat(parts[1]);
        if (!isNaN(gbAmount) && gbAmount > 0) {
          const matchingBundle = sortedBundles.find(b => {
            const bundleName = b.name.toLowerCase();
            const gbMatch = bundleName.match(/(\d+(?:\.\d+)?)\s*gb/i);
            if (gbMatch) {
              const bundleGB = parseFloat(gbMatch[1]);
              return bundleGB === gbAmount;
            }
            return false;
          });
          
          if (matchingBundle) {
            const agentPrice = parseFloat(matchingBundle.price);
            total += agentPrice;
            count++;
          }
        }
      }
    }
    
    return { total, count };
  }, [bulkForm.watch("phoneNumbers"), sortedBundles, storeData?.store]);

  const initializePaymentMutation = useMutation({
    mutationFn: async (data: SingleOrderFormData | BulkOrderFormData | {
      orderItems: Array<{ phone: string; bundleId: string; bundleName: string; price: number }>;
      totalAmount: number;
      customerEmail?: string;
    }) => {
      console.log("[Agent Frontend] Payment mutation called with:", data);
      
      const isBulk = 'phoneNumbers' in data;
      
      // Handle new orderItems format (GB-based bulk orders)
      if ('orderItems' in data && data.orderItems) {
        const phoneNumbers = data.orderItems.map(item => item.phone);
        const totalAmount = data.totalAmount;

        console.log("[Agent Frontend] ========== NEW BULK FORMAT PAYMENT ==========");
        console.log("[Agent Frontend] Order items:", data.orderItems);
        console.log("[Agent Frontend] Total amount:", totalAmount);
        console.log("[Agent Frontend] ================================================");
        
        const payload = {
          productType: "data_bundle",
          network: network,
          customerPhone: phoneNumbers[0],
          isBulkOrder: true,
          orderItems: data.orderItems,
          totalAmount: totalAmount,
          customerEmail: data.customerEmail || undefined,
          agentSlug: slug || undefined,
        };
        
        console.log("[Agent Frontend] Paystack payload:", JSON.stringify(payload, null, 2));
        
        const result = await apiRequest("POST", "/api/checkout/initialize", payload);
        
        console.log("[Agent Frontend] ===== SERVER RESPONSE =====");
        console.log("[Agent Frontend] Result:", result);
        console.log("[Agent Frontend] ================================");
        
        return result;
      }
      
      // Handle single purchase or legacy bulk format
      if (!selectedBundle) throw new Error("No bundle selected");

      console.log("[Agent Frontend] Is bulk:", isBulk);
      console.log("[Agent Frontend] Data:", data);

      const phoneNumbers = isBulk 
        ? (data as BulkOrderFormData).phoneNumbers.split(/[\n,]/).map(n => n.trim()).filter(n => n)
        : [(data as SingleOrderFormData).customerPhone];

      console.log("[Agent Frontend] Phone numbers array:", phoneNumbers);
      console.log("[Agent Frontend] First phone:", phoneNumbers[0]);

      const payload = {
        productType: "data_bundle",
        productId: selectedBundle.id,
        customerPhone: phoneNumbers[0],
        phoneNumbers: isBulk ? phoneNumbers : undefined,
        isBulkOrder: isBulk,
        customerEmail: data.customerEmail || undefined,
        agentSlug: slug || undefined,
      };

      console.log("[Agent Frontend] Single/Legacy payload:", JSON.stringify(payload, null, 2));

      return await apiRequest("POST", "/api/checkout/initialize", payload);
    },
    onSuccess: (data: any) => {
      window.location.href = data.paymentUrl;
    },
    onError: (error: any) => {
      toast({
        title: "❌ Payment Failed",
        description: error.message || "Unable to process payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const walletPaymentMutation = useMutation({
    mutationFn: async (data: SingleOrderFormData | BulkOrderFormData | {
      orderItems: Array<{ phone: string; bundleId: string; bundleName: string; price: number }>;
      totalAmount: number;
      customerEmail?: string;
    }) => {
      console.log("[Agent Frontend] Wallet payment mutation called with:", data);
      
      const isBulk = 'phoneNumbers' in data;
      
      // Handle new orderItems format (GB-based bulk orders)
      if ('orderItems' in data && data.orderItems) {
        const phoneNumbers = data.orderItems.map(item => item.phone);
        const totalAmount = data.totalAmount;

        console.log("[Agent Frontend] ========== WALLET BULK FORMAT PAYMENT ==========");
        console.log("[Agent Frontend] Order items:", data.orderItems);
        console.log("[Agent Frontend] Total amount:", totalAmount);
        console.log("[Agent Frontend] ================================================");
        
        const payload = {
          productType: "data_bundle",
          network: network,
          amount: totalAmount.toFixed(2),
          customerPhone: phoneNumbers[0],
          phoneNumbers: phoneNumbers,
          isBulkOrder: true,
          orderItems: data.orderItems,
          customerEmail: data.customerEmail || undefined,
          agentSlug: slug || undefined,
        };
        
        console.log("[Agent Frontend] Wallet payload:", JSON.stringify(payload, null, 2));
        
        const result = await apiRequest("POST", "/api/wallet/pay", payload);
        
        console.log("[Agent Frontend] ===== WALLET SERVER RESPONSE =====");
        console.log("[Agent Frontend] Result:", result);
        console.log("[Agent Frontend] ================================");
        
        return result;
      }
      
      // Handle single purchase or legacy bulk format
      if (!selectedBundle) throw new Error("No bundle selected");

      console.log("[Agent Frontend] Is bulk:", isBulk);
      console.log("[Agent Frontend] Data:", data);

      const phoneNumbers = isBulk 
        ? (data as BulkOrderFormData).phoneNumbers.split(/[\n,]/).map(n => n.trim()).filter(n => n)
        : [(data as SingleOrderFormData).customerPhone];

      console.log("[Agent Frontend] Phone numbers array:", phoneNumbers);
      console.log("[Agent Frontend] First phone:", phoneNumbers[0]);

      const payload = {
        productType: "data_bundle",
        productId: selectedBundle.id,
        amount: price.toFixed(2),
        customerPhone: phoneNumbers[0],
        phoneNumbers: isBulk ? phoneNumbers : undefined,
        isBulkOrder: isBulk,
        customerEmail: data.customerEmail || undefined,
        agentSlug: slug || undefined,
      };

      console.log("[Agent Frontend] Wallet single/legacy payload:", JSON.stringify(payload, null, 2));

      return await apiRequest("POST", "/api/wallet/pay", payload);
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ Payment Successful",
        description: `Data bundle purchased successfully. New balance: GHS ${data.newBalance}`,
        variant: "default",
        duration: 5000,
      });
      setIsProcessing(false);
      // Refresh user data to update wallet balance
      queryClient.invalidateQueries({
        queryKey: ["/api/auth/me"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Payment Failed",
        description: error.message || "Unable to process wallet payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const onSubmit = (data: SingleOrderFormData | BulkOrderFormData) => {
    const isBulk = 'phoneNumbers' in data;
    const totalAmount = isBulk ? bulkTotal.total : price;
    
    // For single purchases, wallet balance check is not needed (always Paystack)
    // For bulk purchases, they always use Paystack
    
    // Handle single purchase
    if (!isBulk) {
      if (!selectedBundle) {
        toast({
          title: "No Bundle Selected",
          description: "Please select a data bundle to continue",
          variant: "destructive",
        });
        return;
      }

      // Handle country code 233 (remove + if present)
      let phoneStr = (data as SingleOrderFormData).customerPhone.trim();
      phoneStr = phoneStr.replace(/^\+/, '');
      
      // If starts with 233, remove it and add 0
      if (phoneStr.startsWith('233')) {
        phoneStr = '0' + phoneStr.substring(3);
      }

      const normalizedPhone = normalizePhoneNumber(phoneStr);
      const validation = validatePhoneNetwork(normalizedPhone, selectedBundle.network);
      
      if (!validation.isValid) {
        const prefixes = getNetworkPrefixes(selectedBundle.network);
        toast({
          title: "❌ Phone Number Mismatch",
          description: validation.error || `Valid prefixes: ${prefixes.join(", ")}`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      setIsProcessing(true);
      
      // Single purchases on agent storefronts always use Paystack
      initializePaymentMutation.mutate({
        customerPhone: normalizedPhone,
        customerEmail: (data as SingleOrderFormData).customerEmail,
      } as SingleOrderFormData);
      return;
    }

    // Handle bulk purchase with GB-based format
    const bulkData = data as BulkOrderFormData;
    if (!bulkData.phoneNumbers.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter phone numbers with GB amounts",
        variant: "destructive",
      });
      return;
    }

    // Parse phone numbers with GB amounts (Format: "0546591622 1" or "233546591622 2")
    const lines = bulkData.phoneNumbers.split('\n').filter(line => line.trim());
    const parsedData: Array<{ phone: string; gb: number }> = [];
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length !== 2) {
        toast({
          title: "❌ Invalid Format",
          description: `Line "${line}" must have format: phone_number GB_amount (e.g., "0241234567 2")`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      let phoneStr = parts[0];
      const gbAmount = parseFloat(parts[1]);

      if (isNaN(gbAmount) || gbAmount <= 0) {
        toast({
          title: "❌ Invalid GB Amount",
          description: `GB amount "${parts[1]}" must be a positive number`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      // Handle country code 233 (remove + if present)
      phoneStr = phoneStr.replace(/^\+/, '');
      
      // If starts with 233, remove it and add 0
      if (phoneStr.startsWith('233')) {
        phoneStr = '0' + phoneStr.substring(3);
      }

      // Normalize the phone number
      const normalizedPhone = normalizePhoneNumber(phoneStr);

      // Validate phone number for the selected network
      const validation = validatePhoneNetwork(normalizedPhone, network || "");
      if (!validation.isValid) {
        const prefixes = getNetworkPrefixes(network || "");
        toast({
          title: "❌ Phone Number Mismatch",
          description: `${phoneStr}: ${validation.error || `Valid prefixes: ${prefixes.join(", ")}`}`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      parsedData.push({ phone: normalizedPhone, gb: gbAmount });
    }

    if (parsedData.length === 0) {
      toast({
        title: "No Data",
        description: "Please enter at least one phone number with GB amount",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate phone numbers
    const phoneSet = new Set(parsedData.map(p => p.phone));
    if (phoneSet.size !== parsedData.length) {
      toast({
        title: 'Duplicate Numbers',
        description: 'Phone numbers must be unique',
        variant: 'destructive',
      });
      return;
    }

    // Find matching bundles for each GB amount
    const orderItems: Array<{ phone: string; bundleId: string; bundleName: string; price: number }> = [];
    let bulkTotalAmount = 0;

    for (const item of parsedData) {
      // Find a bundle that matches the GB amount
      const matchingBundle = sortedBundles?.find(b => {
        const bundleName = b.name.toLowerCase();
        const gbMatch = bundleName.match(/(\d+(?:\.\d+)?)\s*gb/i);
        if (gbMatch) {
          const bundleGB = parseFloat(gbMatch[1]);
          return bundleGB === item.gb;
        }
        return false;
      });

      if (!matchingBundle) {
        toast({
          title: "❌ Bundle Not Found",
          description: `No ${item.gb}GB bundle available for ${info.name}. Please check available bundles.`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      const agentPrice = parseFloat(matchingBundle.price);

      orderItems.push({
        phone: item.phone,
        bundleId: matchingBundle.id,
        bundleName: matchingBundle.name,
        price: agentPrice,
      });

      bulkTotalAmount += agentPrice;
    }

    console.log("[Agent Frontend] Prepared order items:", orderItems);
    console.log("[Agent Frontend] Total amount:", bulkTotalAmount);

    setIsProcessing(true);
    
    // Bulk orders always use Paystack for security and reliability
    initializePaymentMutation.mutate({
      orderItems,
      totalAmount: bulkTotalAmount,
      customerEmail: bulkData.customerEmail,
    });
  };

  if (agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!storeData?.store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-center text-muted-foreground">Agent store not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href={`/store/${role}/${slug}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{storeData?.store.businessName}</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Network Header */}
          <div className="flex items-center gap-4 mb-8">
            {info.logo && (
              <img
                src={info.logo}
                alt={info.name}
                className="w-16 h-16 object-contain rounded-lg"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">{info.name} Data Bundles</h2>
              <p className="text-muted-foreground">Complete your purchase below</p>
            </div>
          </div>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Complete Your Purchase
              </CardTitle>
              <CardDescription>Enter order details and checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Type Selection */}
              <Tabs value={orderType} onValueChange={(v) => {
                  setOrderType(v as "single" | "bulk");
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Single Purchase
                    </TabsTrigger>
                    <TabsTrigger value="bulk" disabled={network === "at_ishare"} className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                      <Package className="h-4 w-4 mr-2" />
                      Bulk Purchase
                      {network === "at_ishare" && (
                        <span className="text-xs text-muted-foreground ml-1">(Disabled)</span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  {network === "at_ishare" && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Bulk purchases are not available for AT iShare network.
                    </p>
                  )}

                  {/* Single Order Form */}
                  <TabsContent value="single" className="space-y-4 mt-4">
                    <Form {...singleForm}>
                      <form onSubmit={singleForm.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Bundle Selection */}
                      <div className="space-y-2">
                        <Label>Select Data Bundle</Label>
                        <Select value={selectedBundleId} onValueChange={(value) => {
                          setSelectedBundleId(value);
                        }}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a data bundle..." />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedBundles?.map((bundle) => (
                              <SelectItem key={bundle.id} value={bundle.id}>
                                  {bundle.name} - {bundle.validity} - {formatCurrency(parseFloat(bundle.price))}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <FormField
                        control={singleForm.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beneficiary Number *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="0241234567" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Network prefixes: {getNetworkPrefixes(network || "").join(", ")}
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
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input type="email" placeholder="your@email.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>For receipt and order updates</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-4 p-4 bg-muted rounded-lg">
                          <span className="text-lg font-semibold">Total Amount:</span>
                          <span className="text-2xl font-bold text-primary">
                            {formatCurrency(price)}
                          </span>
                        </div>

                        {/* Payment Method - Only Paystack for single purchases */}
                        <div className="space-y-3 mb-4">
                          <Label className="text-base font-semibold">Payment Method</Label>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="p-4 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                              <CreditCard className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                              <div className="font-semibold">Paystack</div>
                              <div className="text-sm text-muted-foreground">
                                Pay with card/mobile money
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Storefront purchases must be made through Paystack for proper agent accounting.
                          </p>
                        </div>

                        <Button
                          type="submit"
                          className="w-full gap-2"
                          size="lg"
                          disabled={isProcessing || !selectedBundleId}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-5 w-5" />
                              Proceed to Payment
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                  </TabsContent>

                  {/* Bulk Order Form */}
                  <TabsContent value="bulk" className="space-y-4 mt-4">
                    <Form {...bulkForm}>
                      <form onSubmit={bulkForm.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="bulk-phones">Beneficiary Numbers and GB Amounts</Label>
                            {bulkForm.watch("phoneNumbers") && bulkForm.watch("phoneNumbers").trim() && (
                              <Badge variant="outline" className="text-xs">
                                {bulkForm.watch("phoneNumbers").split('\n').filter(line => line.trim()).length} entries
                              </Badge>
                            )}
                          </div>
                          <FormField
                            control={bulkForm.control}
                            name="phoneNumbers"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    id="bulk-phones"
                                    placeholder="0546591622 1&#10;0247064874 3&#10;0245696072 2&#10;233547897522 10&#10;...add as many as you need (no limit)"
                                    rows={20}
                                    className="font-mono text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Enter one number per line with GB amount (e.g., "0241234567 2" for 2GB). 
                                  Supports formats: 0241234567 or 233241234567 (no + sign). 
                                  <strong className="text-green-600">✓ No limit - add 100+ numbers!</strong>
                                  <br />
                                  All numbers must be for <strong>{info.name}</strong> network. 
                                  Valid prefixes: <strong>{getNetworkPrefixes(network || "").join(", ")}</strong>
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={bulkForm.control}
                          name="customerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Optional)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input type="email" placeholder="your@email.com" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormDescription>For receipt and order updates</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {bulkTotal && bulkTotal.count > 0 && (
                          <div className="pt-4">
                            <div className="flex items-center justify-between mb-4 p-4 bg-muted rounded-lg">
                              <span className="text-lg font-semibold">Total Amount:</span>
                              <span className="text-2xl font-bold text-primary">
                                {formatCurrency(bulkTotal.total)}
                              </span>
                            </div>

                            {/* Payment Method Info for Bulk Orders */}
                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                                <div>
                                  <div className="font-semibold text-blue-900 dark:text-blue-100">Bulk Orders Use Paystack</div>
                                  <div className="text-sm text-blue-700 dark:text-blue-300">
                                    For security and reliability, bulk purchases are processed through Paystack payment gateway.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full gap-2"
                          size="lg"
                          disabled={isProcessing || !bulkForm.watch("phoneNumbers")?.trim()}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-5 w-5" />
                              {bulkTotal ? (
                                <>
                                  Pay {formatCurrency(bulkTotal.total)} with Paystack
                                </>
                              ) : (
                                'Purchase Data Bundles'
                              )}
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
            </CardContent>
          </Card>

          {/* Important Notices */}
          <div className="mt-8 space-y-4">
            <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Data Delivery Time</h3>
                    <p className="text-muted-foreground">
                      All data orders are delivered within 5–45 minutes.
                      Please note that delivery times may vary during network downtime
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-red-200 bg-white text-black dark:bg-black dark:text-white dark:border-red-600">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-red-900 dark:text-red-100">
                      Our DATA REQUEST DOES NOT support:
                    </h3>
                    <ul className="text-red-800 dark:text-red-200 space-y-1 ml-4 opacity-90">
                      <li>• Turbonet SIM</li>
                      <li>• Merchant SIM</li>
                      <li>• EVD SIM</li>
                      <li>• Broadband SIM</li>
                      <li>• Blacklisted SIM</li>
                      <li>• Roaming SIM</li>
                      <li>• Different Network</li>
                      <li>• Wrong Number</li>
                      <li>• Inactive Number</li>
                    </ul>
                    <p className="text-red-800 dark:text-red-200 font-medium mt-3 opacity-95">
                      Important Notice: Any data transferred to the above SIM types is burnt and irreversible.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-amber-200 bg-white text-black dark:bg-black dark:text-white dark:border-amber-600">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-amber-900 dark:text-amber-100">
                      Complaint Resolution Policy
                    </h3>
                    <div className="text-amber-800 dark:text-amber-200 space-y-2">
                      <p>Complaints can only be resolved within 24 hours.</p>
                      <p>If you purchase data and do not receive it, kindly report the issue within 24 hours.</p>
                      <p className="font-medium">Reports made after 24 hours will not be attended to.</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
        </div>
      </main>
    </div>
  );
}

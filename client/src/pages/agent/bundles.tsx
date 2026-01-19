import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AgentSidebarV2 as AgentSidebar } from "@/components/layout/agent-sidebar-v2";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Smartphone, Upload, Menu, Package, AlertCircle, Wallet, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { validatePhoneNetwork, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import type { DataBundle } from "@shared/schema";

type BundleWithPrice = DataBundle & {
  effective_price: string;
  description?: string;
};

interface AgentProfile {
  markupPercentage: number;
}

interface AgentData {
  profile: AgentProfile;
}

interface MutationResponse {
  newBalance: string;
  paymentUrl: string;
}

const NetworkInfo = {
  mtn: {
    name: "MTN",
    color: "bg-yellow-400",
    logo: mtnLogo,
  },
  "at_ishare": {
    name: "AirtelTigo iShare",
    color: "bg-red-500",
    logo: airteltigoLogo,
  },
  "at_bigtime": {
    name: "AirtelTigo BIG TIME",
    color: "bg-red-600",
    logo: airteltigoLogo,
  },
  telecel: {
    name: "Telecel",
    color: "bg-green-500",
    logo: telecelLogo,
  },
};

export default function AgentBundlesPage() {
  const { network } = useParams<{ network: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Single purchase state
  const [selectedBundle, setSelectedBundle] = useState<BundleWithPrice | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "paystack" | undefined>('paystack');
  
  // Bulk purchase state
  const [bulkPhoneNumbers, setBulkPhoneNumbers] = useState("");
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<"wallet" | "paystack" | undefined>('paystack');

  // Fetch bundles for the selected network
  const { data: bundles, isLoading: bundlesLoading } = useQuery({
    queryKey: ["/api/products/data-bundles", network],
    queryFn: async () => {
      // Convert hyphens to underscores for API call
      const apiNetwork = network?.replace(/-/g, '_');
      const response = await apiRequest<BundleWithPrice[]>("GET", `/api/products/data-bundles?network=${apiNetwork}`);
      return response;
    },
    enabled: !!network,
  });

  // Fetch agent data for pricing
  const { data: agentData } = useQuery<AgentData>({
    queryKey: ["/api/profile"],
    queryFn: async () => apiRequest("GET", "/api/profile") as Promise<AgentData>,
  });

  // Fetch wallet balance
  const { data: walletData } = useQuery<{ user: { walletBalance: string } }>({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });

  const walletBalance = walletData?.user?.walletBalance ? parseFloat(walletData.user.walletBalance) : 0;

  // Calculate bulk purchase total
  const bulkTotal = useMemo(() => {
    if (!bulkPhoneNumbers.trim() || !bundles) return null;
    
    const lines = bulkPhoneNumbers.split('\n').filter(line => line.trim());
    let total = 0;
    let count = 0;
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 2) {
        const gbAmount = parseFloat(parts[1]);
        if (!isNaN(gbAmount) && gbAmount > 0) {
          const matchingBundle = bundles.find(b => {
            const dataAmount = b.dataAmount.toLowerCase();
            const gbMatch = dataAmount.match(/(\d+(?:\.\d+)?)/);
            if (gbMatch) {
              const bundleGB = parseFloat(gbMatch[1]);
              return bundleGB === gbAmount;
            }
            return false;
          });
          
          if (matchingBundle) {
            const agentPrice = parseFloat(matchingBundle.effective_price);
            total += agentPrice;
            count++;
          }
        }
      }
    }
    
    return count > 0 ? { total, count } : null;
  }, [bulkPhoneNumbers, bundles]);

  // Single purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (data: { bundleId: string; phoneNumber: string; paymentMethod: "wallet" | "paystack" }) => {
      const bundle = bundles?.find(b => b.id === data.bundleId);
      if (!bundle) throw new Error("Bundle not found");
      
      const phoneNumbers = [data.phoneNumber];
      const agentPrice = parseFloat(bundle.effective_price);
      const isBulk = false;

      console.log("[Frontend] Single order payment initialization");
      console.log("[Frontend] Phone numbers:", phoneNumbers);
      console.log("[Frontend] Is bulk:", isBulk);

      if (data.paymentMethod === "wallet") {
        const payload = {
          productType: "data_bundle",
          productId: bundle.id,
          productName: bundle.name,
          network: bundle.network,
          amount: agentPrice.toFixed(2),
          customerPhone: phoneNumbers[0],
          phoneNumbers: undefined,
          isBulkOrder: isBulk,
        };
        
        console.log("[Frontend] Wallet payload:", JSON.stringify(payload, null, 2));
        
        const response = await apiRequest("POST", "/api/wallet/pay", payload);
        return response as MutationResponse;
      } else {
        const payload = {
          productType: "data_bundle",
          productId: bundle.id,
          customerPhone: phoneNumbers[0],
          phoneNumbers: undefined,
          isBulkOrder: isBulk,
          customerEmail: user?.email || undefined,
        };
        
        console.log("[Frontend] Paystack payload:", JSON.stringify(payload, null, 2));
        
        const response = await apiRequest("POST", "/api/checkout/initialize", payload);
        return response as MutationResponse;
      }
    },
    onSuccess: (data: MutationResponse, variables) => {
      if (variables.paymentMethod === "wallet") {
        toast({
          title: "✅ Payment Successful!",
          description: `Your purchase has been confirmed. New wallet balance: GH₵${data.newBalance}. View Order History to download your receipt.`,
          duration: 5000,
        });
        setSelectedBundle(null);
        setPhoneNumber("");
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
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
    },
  });

  // Bulk purchase mutation
  const bulkPurchaseMutation = useMutation({
    mutationFn: async (data: {
      bundleId: string;
      phoneNumbers: string[];
      paymentMethod: "wallet" | "paystack";
      orderItems?: Array<{ phone: string; bundleId: string; bundleName: string; price: number }>;
      totalAmount?: number;
    }) => {
      const isBulk = true;

      // Use new orderItems format if available
      if (data.orderItems && data.totalAmount !== undefined) {
        const phoneNumbers = data.orderItems.map(item => item.phone);
        const totalAmount = data.totalAmount;

        console.log("[Frontend] ========== NEW BULK FORMAT PAYMENT ==========");
        console.log("[Frontend] Order items:", data.orderItems);
        console.log("[Frontend] Total amount:", totalAmount);
        console.log("[Frontend] ================================================");

        if (data.paymentMethod === "wallet") {
          const payload = {
            productType: "data_bundle",
            productName: `Bulk Order - ${data.orderItems.length} items`,
            network: network,
            amount: totalAmount.toFixed(2),
            customerPhone: phoneNumbers[0],
            isBulkOrder: isBulk,
            orderItems: data.orderItems,
          };

          console.log("[Frontend] Wallet payload:", JSON.stringify(payload, null, 2));

          const response = await apiRequest("POST", "/api/wallet/pay", payload);
          return response as MutationResponse;
        } else {
          const payload = {
            productType: "data_bundle",
            network: network,
            customerPhone: phoneNumbers[0],
            isBulkOrder: isBulk,
            orderItems: data.orderItems,
            totalAmount: totalAmount,
            customerEmail: user?.email || undefined,
          };

          console.log("[Frontend] Paystack payload:", JSON.stringify(payload, null, 2));

          const response = await apiRequest("POST", "/api/checkout/initialize", payload);

          console.log("[Frontend] ===== SERVER RESPONSE =====");
          console.log("[Frontend] Result:", response);
          console.log("[Frontend] ================================");

          return response as MutationResponse;
        }
      } else {
        // Fallback to old format for backward compatibility
        const bundle = bundles?.find(b => b.id === data.bundleId);
        if (!bundle) throw new Error("Bundle not found");

        const phoneNumbers = data.phoneNumbers;
        const basePrice = parseFloat(bundle.basePrice);
        const markup = agentData?.profile?.markupPercentage || 0;
        const agentPrice = basePrice + (basePrice * markup / 100);
        const totalAmount = agentPrice * phoneNumbers.length;

        console.log("[Frontend] ========== LEGACY BULK FORMAT ==========");
        console.log("[Frontend] Phone numbers:", phoneNumbers);
        console.log("[Frontend] Total amount:", totalAmount);
        console.log("[Frontend] ================================================");

        if (data.paymentMethod === "wallet") {
          const payload = {
            productType: "data_bundle",
            productId: bundle.id,
            productName: bundle.name,
            network: bundle.network,
            amount: totalAmount.toFixed(2),
            customerPhone: phoneNumbers[0],
            phoneNumbers: phoneNumbers,
            isBulkOrder: isBulk,
          };

          const response = await apiRequest("POST", "/api/wallet/pay", payload);
          return response as MutationResponse;
        } else {
          const payload = {
            productType: "data_bundle",
            productId: bundle.id,
            customerPhone: phoneNumbers[0],
            phoneNumbers: phoneNumbers,
            isBulkOrder: isBulk,
            customerEmail: user?.email || undefined,
          };

          const response = await apiRequest("POST", "/api/checkout/initialize", payload);
          return response as MutationResponse;
        }
      }
    },
    onSuccess: (data: MutationResponse, variables) => {
      if (variables.paymentMethod === "wallet") {
        toast({
          title: "✅ Payment Successful!",
          description: `Your bulk purchase has been confirmed. New wallet balance: GH₵${data.newBalance}. View Order History to download your receipt.`,
          duration: 5000,
        });
        setBulkPhoneNumbers("");
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
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
    },
  });

  const handleSinglePurchase = () => {
    if (!selectedBundle || !phoneNumber) return;
    
    const agentPrice = parseFloat(selectedBundle.effective_price);
    
    if (paymentMethod === "wallet" && agentPrice > walletBalance) {
      toast({
        title: "⚠️ Insufficient Wallet Balance",
        description: `You need GH₵${(agentPrice - walletBalance).toFixed(2)} more. Please top up your wallet or use Paystack.`,
        variant: "destructive",
        duration: 6000,
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "❌ Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    purchaseMutation.mutate({
      bundleId: selectedBundle.id,
      phoneNumber,
      paymentMethod,
    });
  };

  const handleBulkPurchase = () => {
    if (!bulkPhoneNumbers.trim()) {
      toast({
        title: "❌ Missing Information",
        description: "Please enter phone numbers with GB amounts",
        variant: "destructive",
      });
      return;
    }

    // Parse and validate bulk input
    const lines = bulkPhoneNumbers.split('\n').filter(line => line.trim());
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
      const validation = validatePhoneNetwork(normalizedPhone, network);
      if (!validation.isValid) {
        const prefixes = getNetworkPrefixes(network);
        toast({
          title: "❌ Phone Number Mismatch",
          description: `${phoneStr}: ${validation.error || `Must be for ${networkInfo?.name} network. Valid prefixes: ${prefixes.join(", ")}`}`,
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

    // Find matching bundles for each GB amount from our bundles list
    const orderItems: Array<{ phone: string; bundleId: string; bundleName: string; price: number }> = [];
    let totalAmount = 0;

    for (const item of parsedData) {
      // Find a bundle that matches the GB amount (looking for bundles with the GB in the dataAmount)
      const matchingBundle = bundles?.find(b => {
        const dataAmount = b.dataAmount.toLowerCase();
        // Try to extract GB from dataAmount (e.g., "5GB" -> 5)
        const gbMatch = dataAmount.match(/(\d+(?:\.\d+)?)/);
        if (gbMatch) {
          const bundleGB = parseFloat(gbMatch[1]);
          return bundleGB === item.gb;
        }
        return false;
      });

      if (!matchingBundle) {
        toast({
          title: "❌ Bundle Not Found",
          description: `No ${item.gb}GB bundle available for ${networkInfo?.name}. Please check available bundles.`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      // Validate phone network but don't deny - just alert
      const validation = validatePhoneNetwork(item.phone, network);
      if (!validation.isValid) {
        toast({
          title: "⚠️ Network Mismatch",
          description: `${item.phone}: ${validation.error}. Purchase will proceed but may fail if network doesn't match.`,
          variant: "default",
          duration: 6000,
        });
      }

      const agentPrice = matchingBundle.agentPrice ? parseFloat(matchingBundle.agentPrice) : 
        parseFloat(matchingBundle.basePrice) + (parseFloat(matchingBundle.basePrice) * (agentData?.profile?.markupPercentage || 0) / 100);

      orderItems.push({
        phone: item.phone,
        bundleId: matchingBundle.id,
        bundleName: matchingBundle.name,
        price: agentPrice,
      });

      totalAmount += agentPrice;
    }

    // Check wallet balance if paying with wallet
    if (bulkPaymentMethod === "wallet" && walletBalance < totalAmount) {
      toast({
        title: "⚠️ Insufficient Wallet Balance",
        description: `You need GH₵${(totalAmount - walletBalance).toFixed(2)} more. Please top up your wallet or use Paystack.`,
        variant: "destructive",
        duration: 6000,
      });
      return;
    }

    if (!bulkPaymentMethod) {
      toast({
        title: "❌ Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    bulkPurchaseMutation.mutate({
      bundleId: "", // Not used in new format
      phoneNumbers: [], // Not used in new format
      paymentMethod: bulkPaymentMethod,
      orderItems,
      totalAmount,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const networkInfo = NetworkInfo[(network?.replace(/-/g, '_')) as keyof typeof NetworkInfo];

  if (!networkInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Network Not Found</h1>
          <p className="text-muted-foreground">The requested network is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <AgentSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation for your dashboard</SheetDescription>
          </VisuallyHidden>
          <AgentSidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-6 h-16 shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation for your dashboard</SheetDescription>
                </VisuallyHidden>
                <AgentSidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <img
                src={networkInfo.logo}
                alt={networkInfo.name}
                className="h-8 w-8 rounded"
              />
              <div>
                <h1 className="text-xl font-bold">{networkInfo.name} Bundles</h1>
                <p className="text-sm text-muted-foreground">Purchase data bundles for your customers</p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Network Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${networkInfo.color}`} />
                  <div>
                    <h2 className="text-lg font-semibold">{networkInfo.name} Data Bundles</h2>
                    <p className="text-sm text-muted-foreground">
                      Purchase data bundles for your customers with your markup pricing
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Single Purchase
                </TabsTrigger>
                {network !== "at_ishare" && (
                  <TabsTrigger value="bulk" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
                    <Package className="h-4 w-4 mr-2" />
                    Bulk Purchase
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Single Purchase Tab */}
              <TabsContent value="single" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Data Bundle</CardTitle>
                    <CardDescription>Select a bundle and enter recipient details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Bundle Dropdown */}
                    <div className="space-y-2">
                      <Label>Select Bundle</Label>
                      {bundlesLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                        <Select
                          value={selectedBundle?.id || ""}
                          onValueChange={(value) => {
                            const bundle = bundles?.find(b => b.id === value);
                            setSelectedBundle(bundle || null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a data bundle" />
                          </SelectTrigger>
                          <SelectContent>
                            {bundles && bundles.length > 0 ? (
                              bundles.map((bundle) => {
                                const effectivePrice = parseFloat(bundle.effective_price);
                                return (
                                  <SelectItem key={bundle.id} value={bundle.id}>
                                    {bundle.name} - {bundle.validity} - GH₵{effectivePrice.toFixed(2)}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              <SelectItem value="no-bundles" disabled>
                                No bundles available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Selected Bundle Display */}
                    {selectedBundle && (
                      <div className="p-2 bg-yellow-100 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground">Selected Bundle</p>
                        <p className="font-medium text-lg">{selectedBundle.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedBundle.validity}</p>
                        {selectedBundle.description && (
                          <p className="text-xs text-muted-foreground mt-1">{selectedBundle.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-2xl font-bold text-primary">
                            GH₵{parseFloat(selectedBundle.effective_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="phone">Beneficiary Number</Label>
                      <Input
                        id="phone"
                        placeholder="0241234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        For <strong>{networkInfo?.name}</strong> network only. 
                        Valid prefixes: <strong>{selectedBundle ? getNetworkPrefixes(selectedBundle.network).join(", ") : ""}</strong>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>Payment Method</Label>
                      <RadioGroup 
                        value={paymentMethod || ""} 
                        onValueChange={(value: "wallet" | "paystack") => setPaymentMethod(value)}
                        className="grid gap-3"
                      >
                        {/* Wallet Payment Option */}
                        <div className="relative">
                          <RadioGroupItem
                            value="wallet"
                            id="wallet-single"
                            disabled={selectedBundle ? parseFloat(selectedBundle.effective_price) > walletBalance : false}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="wallet-single"
                            className={`flex items-center justify-between rounded-lg border-2 border-muted bg-white p-4 hover:border-green-500 hover:shadow-md peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:shadow-md cursor-pointer transition-all ${
                              selectedBundle ? parseFloat(selectedBundle.effective_price) > walletBalance : false
                                ? "opacity-50 cursor-not-allowed"
                                : ""
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
                            {paymentMethod === "wallet" && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </Label>
                          {selectedBundle ? parseFloat(selectedBundle.effective_price) > walletBalance : false && (
                            <div className="absolute top-2 right-2">
                              <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                                Insufficient
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Paystack Payment Option */}
                        <div>
                          <RadioGroupItem
                            value="paystack"
                            id="paystack-single"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="paystack-single"
                            className="flex items-center justify-between rounded-lg border-2 border-muted bg-white p-4 hover:border-green-500 hover:shadow-md peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:shadow-md cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-green-600" />
                              <div>
                                <div className="font-medium text-green-700">Pay with MoMo</div>
                                <div className="text-sm text-green-600">
                                  Secure payment via Paystack
                                </div>
                              </div>
                            </div>
                            {paymentMethod === "paystack" && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {selectedBundle && paymentMethod === "wallet" && parseFloat(selectedBundle.effective_price) > walletBalance && (
                      <Alert variant="default" className="border-destructive bg-white text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Insufficient Balance:</strong> You need GH₵{(parseFloat(selectedBundle.effective_price) - walletBalance).toFixed(2)} more.
                          <a href="/agent/wallet" className="underline ml-1 font-medium hover:text-destructive-foreground">Top up wallet</a> or select Paystack.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSinglePurchase}
                      disabled={!selectedBundle || !phoneNumber || !paymentMethod || purchaseMutation.isPending || (paymentMethod === "wallet" && selectedBundle && parseFloat(selectedBundle.effective_price) > walletBalance)}
                    >
                      {purchaseMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Smartphone className="mr-2 h-4 w-4" />
                          Purchase Bundle
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bulk Purchase Tab */}
              {network !== "at_ishare" && (
                <TabsContent value="bulk" className="space-y-6">
                <Card>
                    <CardHeader>
                      <CardTitle>Bulk Purchase</CardTitle>
                      <CardDescription>Enter phone numbers with GB amounts for {networkInfo?.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="bulk-phones">Beneficiary Numbers and GB Amounts</Label>
                          {bulkPhoneNumbers.trim() && (
                            <Badge variant="outline" className="text-xs">
                              {bulkPhoneNumbers.split('\n').filter(line => line.trim()).length} entries
                            </Badge>
                          )}
                        </div>
                        <Textarea
                          id="bulk-phones"
                          placeholder="0546591622 1&#10;0247064874 3&#10;0245696072 2&#10;233547897522 10&#10;...add as many as you need (no limit)"
                          rows={20}
                          value={bulkPhoneNumbers}
                          onChange={(e) => setBulkPhoneNumbers(e.target.value)}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter one number per line with GB amount (e.g., "0241234567 2" for 2GB). 
                          Supports formats: 0241234567 or 233241234567 (no + sign). 
                          <strong className="text-green-600">✓ No limit - add 100+ numbers!</strong>
                          <br />
                          All numbers must be for <strong>{networkInfo?.name}</strong> network.
                          Valid prefixes: <strong>{network ? getNetworkPrefixes(network).join(", ") : ""}</strong>
                        </p>
                      </div>

                    <div className="space-y-3">
                      <Label>Payment Method</Label>
                      <RadioGroup 
                        value={bulkPaymentMethod || ""} 
                        onValueChange={(value: "wallet" | "paystack") => setBulkPaymentMethod(value)}
                        className="grid gap-3"
                      >
                        {/* Wallet Payment Option */}
                        <div className="relative">
                          <RadioGroupItem
                            value="wallet"
                            id="wallet-bulk"
                            disabled={bulkTotal ? walletBalance < bulkTotal.total : false}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="wallet-bulk"
                            className={`flex items-center justify-between rounded-lg border-2 border-muted !bg-white p-4 hover:border-green-500 hover:shadow-md peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:shadow-md cursor-pointer transition-all ${
                              bulkTotal ? walletBalance < bulkTotal.total : false ? "opacity-50 cursor-not-allowed" : ""
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
                            {bulkPaymentMethod === "wallet" && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </Label>
                          {bulkTotal ? walletBalance < bulkTotal.total : false && (
                            <div className="absolute top-2 right-2">
                              <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                                Insufficient
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Paystack Payment Option */}
                        <div>
                          <RadioGroupItem
                            value="paystack"
                            id="paystack-bulk"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="paystack-bulk"
                            className="flex items-center justify-between rounded-lg border-2 border-muted bg-white p-4 hover:border-green-500 hover:shadow-md peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:shadow-md cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5 text-green-600" />
                              <div>
                                <div className="font-medium text-green-700">Pay with MoMo</div>
                                <div className="text-sm text-green-600">
                                  Secure payment via Paystack
                                </div>
                              </div>
                            </div>
                            {bulkPaymentMethod === "paystack" && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Insufficient Balance Alert for Bulk */}
                    {bulkTotal && bulkPaymentMethod === "wallet" && walletBalance < bulkTotal.total && (
                      <Alert variant="default" className="border-destructive bg-white text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Insufficient Balance:</strong> You need GH₵{(bulkTotal.total - walletBalance).toFixed(2)} more.
                          <a href="/agent/wallet" className="underline ml-1 font-medium hover:text-destructive-foreground">Top up wallet</a> or select Paystack.
                        </AlertDescription>
                      </Alert>
                    )}

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleBulkPurchase}
                        disabled={
                          !bulkPhoneNumbers.trim() ||
                          !bulkPaymentMethod ||
                          bulkPurchaseMutation.isPending ||
                          (bulkPaymentMethod === "wallet" && bulkTotal !== null && walletBalance < bulkTotal.total)
                        }
                      >
                        {bulkPurchaseMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {bulkTotal
                              ? `Purchase for GH₵${bulkTotal.total.toFixed(2)} (${bulkTotal.count} items)`
                              : "Purchase Data Bundles"
                            }
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
              </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>


  );
}

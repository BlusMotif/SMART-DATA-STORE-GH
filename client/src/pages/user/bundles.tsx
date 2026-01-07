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
import { UserSidebar } from "@/components/layout/user-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Smartphone, Wifi, Upload, Menu, ShoppingCart, Package, AlertCircle, Wallet, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { validatePhoneNetwork, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";

interface DataBundle {
  id: string;
  name: string;
  network: string;
  validity: string;
  basePrice: string;
  description?: string;
}

const NetworkInfo = {
  mtn: {
    name: "MTN",
    color: "bg-yellow-400",
    logo: mtnLogo,
  },
  "at-ishare": {
    name: "AirtelTigo iShare",
    color: "bg-red-500",
    logo: airteltigoLogo,
  },
  "at-bigtime": {
    name: "AirtelTigo BIG TIME",
    color: "bg-red-600",
    logo: airteltigoLogo,
  },
  telecel: {
    name: "Telecel",
    color: "bg-blue-500",
    logo: telecelLogo,
  },
};

export default function UserBundlesPage() {
  const { network } = useParams<{ network: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Single purchase state
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "paystack">("wallet");
  
  // Bulk purchase state
  const [bulkPhoneNumbers, setBulkPhoneNumbers] = useState("");
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<"wallet" | "paystack">("wallet");

  const networkKey = network as keyof typeof NetworkInfo;
  const networkInfo = NetworkInfo[networkKey];

  // Fetch bundles
  const { data: bundles, isLoading } = useQuery<DataBundle[]>({
    queryKey: ["/api/products/data-bundles", network],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/products/data-bundles?network=${network}`);
      return response.json();
    },
  });

  // Fetch wallet balance
  const { data: stats } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/stats");
      return response.json();
    },
  });

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
            const bundleName = b.name.toLowerCase();
            const gbMatch = bundleName.match(/(\d+(?:\.\d+)?)\s*gb/i);
            if (gbMatch) {
              const bundleGB = parseFloat(gbMatch[1]);
              return bundleGB === gbAmount;
            }
            return false;
          });
          
          if (matchingBundle) {
            total += parseFloat(matchingBundle.basePrice);
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
      const price = parseFloat(bundle.basePrice);
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
          amount: price.toFixed(2),
          customerPhone: phoneNumbers[0],
          phoneNumbers: undefined,
          isBulkOrder: isBulk,
        };
        
        console.log("[Frontend] Wallet payload:", JSON.stringify(payload, null, 2));
        
        const response = await apiRequest("POST", "/api/wallet/pay", payload);
        return response.json();
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
        const result = await response.json();
        return result;
      }
    },
    onSuccess: (data, variables) => {
      if (variables.paymentMethod === "wallet") {
        toast({
          title: "✅ Payment Successful!",
          description: `Your purchase has been confirmed. New wallet balance: GH₵${data.newBalance}. View Order History to download your receipt.`,
          duration: 5000,
        });
        setSelectedBundle(null);
        setPhoneNumber("");
        queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
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
          return response.json();
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
          const result = await response.json();
          
          console.log("[Frontend] ===== SERVER RESPONSE =====");
          console.log("[Frontend] Result:", result);
          console.log("[Frontend] ================================");
          
          return result;
        }
      } else {
        // Fallback to old format for backward compatibility
        const bundle = bundles?.find(b => b.id === data.bundleId);
        if (!bundle) throw new Error("Bundle not found");
        
        const phoneNumbers = data.phoneNumbers;
        const price = parseFloat(bundle.basePrice);
        const totalAmount = price * phoneNumbers.length;

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
          return response.json();
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
          return response.json();
        }
      }
    },
    onSuccess: (data, variables) => {
      if (variables.paymentMethod === "wallet") {
        toast({
          title: "✅ Bulk Purchase Successful!",
          description: `Your bulk order has been processed. New wallet balance: GH₵${data.newBalance}. View Order History to download your receipt.`,
          duration: 5000,
        });
        setBulkPhoneNumbers("");
        queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      } else {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Unable to process payment";
      const isInsufficientBalance = errorMessage.toLowerCase().includes("insufficient");
      
      toast({
        title: isInsufficientBalance ? "⚠️ Insufficient Wallet Balance" : "❌ Bulk Purchase Failed",
        description: isInsufficientBalance 
          ? "Your wallet balance is too low for this purchase. Please top up your wallet or use Paystack."
          : `${errorMessage}. Please try again or contact support if the problem persists.`,
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  const handleSinglePurchase = () => {
    if (!selectedBundle || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please select a bundle and enter a phone number",
        variant: "destructive",
      });
      return;
    }

    // Normalize and validate phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber.trim());
    const validation = validatePhoneNetwork(normalizedPhone, selectedBundle.network);
    
    if (!validation.isValid) {
      const prefixes = getNetworkPrefixes(selectedBundle.network);
      toast({
        title: "❌ Phone Number Mismatch",
        description: validation.error || `This bundle is for ${selectedBundle.network.toUpperCase()} network. Valid prefixes: ${prefixes.join(", ")}`,
        variant: "destructive",
        duration: 8000,
      });
      return;
    }

    // Check wallet balance if paying with wallet
    const price = parseFloat(selectedBundle.basePrice);
    const walletBalance = stats?.walletBalance ? parseFloat(stats.walletBalance) : 0;
    
    if (paymentMethod === "wallet" && walletBalance < price) {
      const shortfall = price - walletBalance;
      toast({
        title: "⚠️ Insufficient Wallet Balance",
        description: `You need GH₵${shortfall.toFixed(2)} more. Current balance: GH₵${walletBalance.toFixed(2)}, Required: GH₵${price.toFixed(2)}. Please top up or use Paystack.`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    purchaseMutation.mutate({
      bundleId: selectedBundle.id,
      phoneNumber: normalizedPhone,
      paymentMethod: paymentMethod,
    });
  };

  const handleBulkPurchase = () => {
    if (!bulkPhoneNumbers.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter phone numbers with GB amounts",
        variant: "destructive",
      });
      return;
    }

    // Parse phone numbers with GB amounts
    // Format: "0546591622 1" or "233546591622 2"
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
      // Find a bundle that matches the GB amount (looking for bundles with the GB in the name)
      const matchingBundle = bundles?.find(b => {
        const bundleName = b.name.toLowerCase();
        // Try to extract GB from bundle name (e.g., "5GB" -> 5)
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
          description: `No ${item.gb}GB bundle available for ${networkInfo?.name}. Please check available bundles.`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      orderItems.push({
        phone: item.phone,
        bundleId: matchingBundle.id,
        bundleName: matchingBundle.name,
        price: parseFloat(matchingBundle.basePrice),
      });

      totalAmount += parseFloat(matchingBundle.basePrice);
    }

    // Check wallet balance if paying with wallet
    const walletBalance = stats?.walletBalance ? parseFloat(stats.walletBalance) : 0;
    
    if (bulkPaymentMethod === "wallet" && walletBalance < totalAmount) {
      const shortfall = totalAmount - walletBalance;
      toast({
        title: "⚠️ Insufficient Wallet Balance",
        description: `You need GH₵${shortfall.toFixed(2)} more. Current balance: GH₵${walletBalance.toFixed(2)}, Required: GH₵${totalAmount.toFixed(2)} for ${parsedData.length} order(s). Please top up or use Paystack.`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    // Send bulk purchase with order items
    // Note: This will need backend support for the new format
    bulkPurchaseMutation.mutate({
      bundleId: orderItems[0].bundleId, // For compatibility, but we'll send full orderItems
      phoneNumbers: orderItems.map(item => item.phone),
      paymentMethod: bulkPaymentMethod,
      // @ts-ignore - adding custom field for new bulk format
      orderItems: orderItems,
      totalAmount: totalAmount,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <UserSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation for bundles</SheetDescription>
          </VisuallyHidden>
          <UserSidebar onClose={() => setSidebarOpen(false)} />
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
                  <SheetDescription>Main navigation for bundles</SheetDescription>
                </VisuallyHidden>
                <UserSidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-xl font-bold">{networkInfo?.name || "Data Bundles"}</h1>
              <p className="text-sm text-muted-foreground">Purchase data bundles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="text-lg font-bold text-primary">GH₵{stats?.walletBalance || '0.00'}</p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Network Header */}
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <img src={networkInfo?.logo} alt={networkInfo?.name} className="h-12 w-12 rounded-lg object-contain" />
                <div>
                  <h2 className="font-semibold text-lg">{networkInfo?.name}</h2>
                  <p className="text-sm text-muted-foreground">Choose from our available data bundles</p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Single Purchase
                </TabsTrigger>
                <TabsTrigger value="bulk">
                  <Package className="h-4 w-4 mr-2" />
                  Bulk Purchase
                </TabsTrigger>
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
                      <Label htmlFor="bundle-select">Select Bundle</Label>
                      {isLoading ? (
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
                          <SelectTrigger id="bundle-select">
                            <SelectValue placeholder="Choose a data bundle" />
                          </SelectTrigger>
                          <SelectContent>
                            {bundles && bundles.length > 0 ? (
                              bundles.map((bundle) => (
                                <SelectItem key={bundle.id} value={bundle.id}>
                                  {bundle.name} - {bundle.validity} - GH₵{bundle.basePrice}
                                </SelectItem>
                              ))
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
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground">Selected Bundle</p>
                        <p className="font-medium text-lg">{selectedBundle.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedBundle.validity}</p>
                        {selectedBundle.description && (
                          <p className="text-xs text-muted-foreground mt-1">{selectedBundle.description}</p>
                        )}
                        <p className="text-2xl font-bold text-primary mt-2">GH₵{selectedBundle.basePrice}</p>
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
                        value={paymentMethod} 
                        onValueChange={(value: "wallet" | "paystack") => setPaymentMethod(value)}
                        className="grid gap-3"
                      >
                        {/* Wallet Payment Option */}
                        <div className="relative">
                          <input
                            type="radio"
                            value="wallet"
                            id="wallet-single"
                            checked={paymentMethod === "wallet"}
                            onChange={() => setPaymentMethod("wallet")}
                            className="peer sr-only"
                            disabled={selectedBundle && parseFloat(selectedBundle.basePrice) > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0) ? true : false}
                          />
                          <Label
                            htmlFor="wallet-single"
                            className={`flex items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:border-primary hover:shadow-md peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-md cursor-pointer transition-all ${
                              selectedBundle && parseFloat(selectedBundle.basePrice) > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0)
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Wallet className="h-5 w-5" />
                              <div>
                                <div className="font-medium">Wallet Balance</div>
                                <div className="text-sm text-muted-foreground">
                                  Available: GH₵{stats?.walletBalance || '0.00'}
                                </div>
                              </div>
                            </div>
                            {paymentMethod === "wallet" && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </Label>
                          {selectedBundle && parseFloat(selectedBundle.basePrice) > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0) && (
                            <div className="absolute top-2 right-2">
                              <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                                Insufficient
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Paystack Payment Option */}
                        <div>
                          <input
                            type="radio"
                            value="paystack"
                            id="paystack-single"
                            checked={paymentMethod === "paystack"}
                            onChange={() => setPaymentMethod("paystack")}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="paystack-single"
                            className="flex items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:border-primary hover:shadow-md peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-md cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5" />
                              <div>
                                <div className="font-medium">Pay with MoMo</div>
                                <div className="text-sm text-muted-foreground">
                                  Secure payment via Paystack
                                </div>
                              </div>
                            </div>
                            {paymentMethod === "paystack" && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Insufficient Balance Alert */}
                    {selectedBundle && paymentMethod === "wallet" && parseFloat(selectedBundle.basePrice) > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0) && (
                      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Insufficient Balance:</strong> You need GH₵{(parseFloat(selectedBundle.basePrice) - (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0)).toFixed(2)} more.
                          <a href="/user/wallet" className="underline ml-1 font-medium hover:text-destructive-foreground">Top up wallet</a> or select Paystack.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSinglePurchase}
                      disabled={!selectedBundle || !phoneNumber || purchaseMutation.isPending || (paymentMethod === "wallet" && selectedBundle && parseFloat(selectedBundle.basePrice) > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0))}
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
                        value={bulkPaymentMethod} 
                        onValueChange={(value: "wallet" | "paystack") => setBulkPaymentMethod(value)}
                        className="grid gap-3"
                      >
                        {/* Wallet Payment Option */}
                        <div className="relative">
                          <input
                            type="radio"
                            value="wallet"
                            id="wallet-bulk"
                            checked={bulkPaymentMethod === "wallet"}
                            onChange={() => setBulkPaymentMethod("wallet")}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="wallet-bulk"
                            className="flex items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:border-primary hover:shadow-md peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-md cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <Wallet className="h-5 w-5" />
                              <div>
                                <div className="font-medium">Wallet Balance</div>
                                <div className="text-sm text-muted-foreground">
                                  Available: GH₵{stats?.walletBalance || '0.00'}
                                </div>
                              </div>
                            </div>
                            {bulkPaymentMethod === "wallet" && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </Label>
                        </div>

                        {/* Paystack Payment Option */}
                        <div>
                          <input
                            type="radio"
                            value="paystack"
                            id="paystack-bulk"
                            checked={bulkPaymentMethod === "paystack"}
                            onChange={() => setBulkPaymentMethod("paystack")}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="paystack-bulk"
                            className="flex items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:border-primary hover:shadow-md peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-md cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5" />
                              <div>
                                <div className="font-medium">Pay with MoMo</div>
                                <div className="text-sm text-muted-foreground">
                                  Secure payment via Paystack
                                </div>
                              </div>
                            </div>
                            {bulkPaymentMethod === "paystack" && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleBulkPurchase}
                        disabled={
                          !bulkPhoneNumbers.trim() || 
                          bulkPurchaseMutation.isPending
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
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

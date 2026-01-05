import { useState } from "react";
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
  const [selectedBulkBundle, setSelectedBulkBundle] = useState<DataBundle | null>(null);
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
          description: `Your purchase has been confirmed. New wallet balance: GH₵${data.newBalance}`,
          duration: 3000,
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
    mutationFn: async (data: { bundleId: string; phoneNumbers: string[]; paymentMethod: "wallet" | "paystack" }) => {
      const bundle = bundles?.find(b => b.id === data.bundleId);
      if (!bundle) throw new Error("Bundle not found");
      
      const phoneNumbers = data.phoneNumbers;
      const price = parseFloat(bundle.basePrice);
      const totalAmount = price * phoneNumbers.length;
      const isBulk = true;

      console.log("[Frontend] ========== PAYMENT INITIALIZATION ==========");
      console.log("[Frontend] Order type: bulk");
      console.log("[Frontend] isBulk:", isBulk);
      console.log("[Frontend] phoneNumbers array:", phoneNumbers);
      console.log("[Frontend] numberOfRecipients:", phoneNumbers.length);
      console.log("[Frontend] ================================================");
      
      if (data.paymentMethod === "wallet") {
        const payload = {
          productType: "data_bundle",
          productId: bundle.id,
          productName: bundle.name,
          network: bundle.network,
          amount: totalAmount.toFixed(2),
          customerPhone: phoneNumbers[0],
          phoneNumbers: isBulk ? phoneNumbers : undefined,
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
          phoneNumbers: isBulk ? phoneNumbers : undefined,
          isBulkOrder: isBulk,
          customerEmail: user?.email || undefined,
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
          title: "✅ Bulk Purchase Successful!",
          description: `Your bulk order has been processed. New wallet balance: GH₵${data.newBalance}`,
          duration: 3000,
        });
        setSelectedBulkBundle(null);
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
    if (!selectedBulkBundle || !bulkPhoneNumbers.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a bundle and enter phone numbers",
        variant: "destructive",
      });
      return;
    }

    // Parse and normalize phone numbers (one per line)
    const numbers = bulkPhoneNumbers
      .split('\n')
      .map(num => normalizePhoneNumber(num.trim()))
      .filter(num => num.length > 0);

    if (numbers.length === 0) {
      toast({
        title: "No Phone Numbers",
        description: "Please enter at least one phone number",
        variant: "destructive",
      });
      return;
    }

    // Validate all phone numbers match the network
    for (const phone of numbers) {
      const validation = validatePhoneNetwork(phone, selectedBulkBundle.network);
      if (!validation.isValid) {
        const prefixes = getNetworkPrefixes(selectedBulkBundle.network);
        toast({
          title: "❌ Phone Number Mismatch",
          description: `${phone}: ${validation.error || `This bundle is for ${selectedBulkBundle.network.toUpperCase()} network. Valid prefixes: ${prefixes.join(", ")}`}`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }
    }

    // Check wallet balance if paying with wallet
    const totalAmount = parseFloat(selectedBulkBundle.basePrice) * numbers.length;
    const walletBalance = stats?.walletBalance ? parseFloat(stats.walletBalance) : 0;
    
    if (bulkPaymentMethod === "wallet" && walletBalance < totalAmount) {
      const shortfall = totalAmount - walletBalance;
      toast({
        title: "⚠️ Insufficient Wallet Balance",
        description: `You need GH₵${shortfall.toFixed(2)} more. Current balance: GH₵${walletBalance.toFixed(2)}, Required: GH₵${totalAmount.toFixed(2)} for ${numbers.length} order(s). Please top up or use Paystack.`,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    bulkPurchaseMutation.mutate({
      bundleId: selectedBulkBundle.id,
      phoneNumbers: numbers,
      paymentMethod: bulkPaymentMethod,
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
                            disabled={selectedBundle && parseFloat(selectedBundle.basePrice) > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0)}
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
                                <div className="font-medium">Pay with Card</div>
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

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
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
                      <CardDescription>Select a bundle and enter multiple phone numbers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {/* Bundle Dropdown */}
                    <div className="space-y-2">
                      <Label htmlFor="bulk-bundle-select">Select Bundle</Label>
                      {isLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                        <Select
                          value={selectedBulkBundle?.id || ""}
                          onValueChange={(value) => {
                            const bundle = bundles?.find(b => b.id === value);
                            setSelectedBulkBundle(bundle || null);
                          }}
                        >
                          <SelectTrigger id="bulk-bundle-select">
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
                    {selectedBulkBundle && (
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground">Selected Bundle</p>
                        <p className="font-medium text-lg">{selectedBulkBundle.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedBulkBundle.validity}</p>
                        <p className="text-lg font-bold text-primary mt-2">
                          GH₵{selectedBulkBundle.basePrice} per number
                        </p>
                        {bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-primary/20">
                            <p className="text-sm text-muted-foreground">
                              {bulkPhoneNumbers.split('\n').filter(n => n.trim()).length} numbers × GH₵{selectedBulkBundle.basePrice}
                            </p>
                            <p className="text-2xl font-bold text-primary">
                              Total: GH₵{(parseFloat(selectedBulkBundle.basePrice) * bulkPhoneNumbers.split('\n').filter(n => n.trim()).length).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

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
                            disabled={
                              selectedBulkBundle && 
                              bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > 0 &&
                              parseFloat(selectedBulkBundle.basePrice) * bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0)
                            }
                          />
                          <Label
                            htmlFor="wallet-bulk"
                            className={`flex items-center justify-between rounded-lg border-2 border-muted bg-card p-4 hover:border-primary hover:shadow-md peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-md cursor-pointer transition-all ${
                              selectedBulkBundle && 
                              bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > 0 &&
                              parseFloat(selectedBulkBundle.basePrice) * bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0)
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
                            {bulkPaymentMethod === "wallet" && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </Label>
                          {selectedBulkBundle && 
                            bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > 0 &&
                            parseFloat(selectedBulkBundle.basePrice) * bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0) && (
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
                                <div className="font-medium">Pay with Card</div>
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

                    {/* Insufficient Balance Alert */}
                    {selectedBulkBundle && 
                      bulkPaymentMethod === "wallet" && 
                      bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > 0 &&
                      parseFloat(selectedBulkBundle.basePrice) * bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0) && (
                      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Insufficient Balance:</strong> You need GH₵{(parseFloat(selectedBulkBundle.basePrice) * bulkPhoneNumbers.split('\n').filter(n => n.trim()).length - (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0)).toFixed(2)} more.
                          <a href="/user/wallet" className="underline ml-1 font-medium hover:text-destructive-foreground">Top up wallet</a> or select Paystack.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="bulk-phones">Phone Numbers</Label>
                        <Textarea
                          id="bulk-phones"
                          placeholder="0241234567&#10;0501234567&#10;0261234567"
                          rows={10}
                          value={bulkPhoneNumbers}
                          onChange={(e) => setBulkPhoneNumbers(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter one {networkInfo?.name} number per line. All numbers must be for <strong>{selectedBulkBundle ? selectedBulkBundle.network.toUpperCase() : networkInfo?.name}</strong> network.
                          Valid prefixes: <strong>{selectedBulkBundle ? getNetworkPrefixes(selectedBulkBundle.network).join(", ") : ""}</strong>
                        </p>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleBulkPurchase}
                        disabled={
                          !selectedBulkBundle || 
                          !bulkPhoneNumbers.trim() || 
                          bulkPurchaseMutation.isPending ||
                          (bulkPaymentMethod === "wallet" && 
                            selectedBulkBundle && 
                            bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > 0 &&
                            parseFloat(selectedBulkBundle.basePrice) * bulkPhoneNumbers.split('\n').filter(n => n.trim()).length > (stats?.walletBalance ? parseFloat(stats.walletBalance) : 0))
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
                            Purchase for {bulkPhoneNumbers.split('\n').filter(n => n.trim()).length} Numbers
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

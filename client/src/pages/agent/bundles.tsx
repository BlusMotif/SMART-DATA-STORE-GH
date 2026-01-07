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
import { AgentSidebar } from "@/components/layout/agent-sidebar";
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
    color: "bg-green-500",
    logo: telecelLogo,
  },
};

export default function AgentBundlesPage() {
  const { network } = useParams();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "paystack">("wallet");
  const [isProcessing, setIsProcessing] = useState(false);

  // Bulk purchase states
  const [bulkPhones, setBulkPhones] = useState("");
  const [bulkMode, setBulkMode] = useState(false);

  // Fetch bundles for the selected network
  const { data: bundles, isLoading: bundlesLoading } = useQuery({
    queryKey: ["/api/bundles", network],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/bundles?network=${network}`);
      return response.json();
    },
    enabled: !!network,
  });

  // Fetch agent data for pricing
  const { data: agentData } = useQuery({
    queryKey: ["/api/agent/profile"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/agent/profile");
      return response.json();
    },
  });

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["/api/agent/wallet"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/agent/wallet");
      return response.json();
    },
  });

  const walletBalance = walletData?.balance || 0;

  // Calculate agent price for selected bundle
  const agentPrice = useMemo(() => {
    if (!selectedBundle || !agentData?.agent) return 0;
    const basePrice = parseFloat(selectedBundle.basePrice);
    const markup = agentData.agent.markupPercentage || 0;
    return basePrice + (basePrice * markup / 100);
  }, [selectedBundle, agentData]);

  // Calculate total for single purchase
  const singleTotal = agentPrice * quantity;

  // Calculate bulk total
  const bulkTotal = useMemo(() => {
    if (!bulkPhones.trim() || !selectedBundle || !agentData?.agent) return 0;

    const phones = bulkPhones
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(/\s+/);
        return parts[0]; // Extract phone number
      })
      .filter(phone => phone.length > 0);

    const basePrice = parseFloat(selectedBundle.basePrice);
    const markup = agentData.agent.markupPercentage || 0;
    const agentPrice = basePrice + (basePrice * markup / 100);

    return agentPrice * phones.length;
  }, [bulkPhones, selectedBundle, agentData]);

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/checkout/initialize", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.paystackUrl) {
        window.location.href = data.paystackUrl;
      } else {
        toast({
          title: "Purchase Successful",
          description: "Your data bundle has been purchased successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/agent/wallet"] });
        // Reset form
        setSelectedBundle(null);
        setPhoneNumber("");
        setQuantity(1);
        setBulkPhones("");
        setBulkMode(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to process purchase",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleSinglePurchase = () => {
    if (!selectedBundle || !phoneNumber || !user) return;

    if (paymentMethod === "wallet" && singleTotal > walletBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Your wallet balance is not enough for this purchase.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const purchaseData = {
      productId: selectedBundle.id,
      customerPhone: phoneNumber,
      customerEmail: user.email,
      quantity,
      paymentMethod,
      agentSlug: agentData?.agent?.storefrontSlug,
    };

    purchaseMutation.mutate(purchaseData);
  };

  const handleBulkPurchase = () => {
    if (!selectedBundle || !bulkPhones.trim() || !user) return;

    if (paymentMethod === "wallet" && bulkTotal > walletBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Your wallet balance is not enough for this purchase.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Parse bulk phones
    const phoneEntries = bulkPhones
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const parts = line.split(/\s+/);
        const phone = parts[0];
        const dataAmount = parts[1] || selectedBundle.name;
        return { phone, bundleName: selectedBundle.name, dataAmount };
      });

    const purchaseData = {
      customerEmail: user.email,
      paymentMethod,
      agentSlug: agentData?.agent?.storefrontSlug,
      orderItems: phoneEntries.map(entry => ({
        phone: entry.phone,
        bundleId: selectedBundle.id,
        bundleName: entry.bundleName,
        price: agentPrice,
      })),
      totalAmount: bulkTotal,
    };

    purchaseMutation.mutate(purchaseData);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const networkInfo = NetworkInfo[network as keyof typeof NetworkInfo];

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
                    <h2 className="text-lg font-semibold">{networkInfo.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Select a data bundle to purchase for your customers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bundles List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Bundles</CardTitle>
                    <CardDescription>
                      Choose a data bundle for your customers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bundlesLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-20 bg-muted rounded-lg" />
                          </div>
                        ))}
                      </div>
                    ) : bundles && bundles.length > 0 ? (
                      <div className="space-y-3">
                        {bundles.map((bundle: DataBundle) => {
                          const basePrice = parseFloat(bundle.basePrice);
                          const markup = agentData?.agent?.markupPercentage || 0;
                          const agentPrice = basePrice + (basePrice * markup / 100);

                          return (
                            <div
                              key={bundle.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedBundle?.id === bundle.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => setSelectedBundle(bundle)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Package className="h-4 w-4" />
                                    <span className="font-medium">{bundle.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {bundle.validity}
                                    </Badge>
                                  </div>
                                  {bundle.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {bundle.description}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-primary">
                                    GH₵{agentPrice.toFixed(2)}
                                  </div>
                                  {markup > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{markup}% markup
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No bundles available for this network.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Purchase Form */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Details</CardTitle>
                    <CardDescription>
                      Complete your purchase information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedBundle ? (
                      <>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{selectedBundle.name}</span>
                            <Badge variant="outline">{selectedBundle.validity}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Base Price: GH₵{selectedBundle.basePrice}
                          </div>
                          <div className="text-sm font-medium text-primary">
                            Your Price: GH₵{agentPrice.toFixed(2)}
                          </div>
                        </div>

                        {/* Purchase Mode Toggle */}
                        <Tabs value={bulkMode ? "bulk" : "single"} onValueChange={(value) => setBulkMode(value === "bulk")}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="single">Single Purchase</TabsTrigger>
                            <TabsTrigger value="bulk">Bulk Purchase</TabsTrigger>
                          </TabsList>

                          <TabsContent value="single" className="space-y-4">
                            <div>
                              <Label htmlFor="phone">Customer Phone Number</Label>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="0541234567"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                              />
                            </div>

                            <div>
                              <Label htmlFor="quantity">Quantity</Label>
                              <Select value={quantity.toString()} onValueChange={(value) => setQuantity(parseInt(value))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      {num}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="text-sm">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>GH₵{singleTotal.toFixed(2)}</span>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="bulk" className="space-y-4">
                            <div>
                              <Label htmlFor="bulk-phones">Phone Numbers & Amounts</Label>
                              <Textarea
                                id="bulk-phones"
                                placeholder={`0541234567 1GB\n0547654321 2GB\n0549876543`}
                                value={bulkPhones}
                                onChange={(e) => setBulkPhones(e.target.value)}
                                rows={6}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Enter one phone number per line. Format: phone [amount]
                              </p>
                            </div>

                            <div className="text-sm">
                              <div className="flex justify-between">
                                <span>Total ({bulkPhones.split('\n').filter(line => line.trim()).length} numbers):</span>
                                <span>GH₵{bulkTotal.toFixed(2)}</span>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>

                        {/* Payment Method */}
                        <div>
                          <Label>Payment Method</Label>
                          <RadioGroup value={paymentMethod} onValueChange={(value: "wallet" | "paystack") => setPaymentMethod(value)}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="wallet" id="wallet" />
                              <Label htmlFor="wallet" className="flex items-center gap-2">
                                <Wallet className="h-4 w-4" />
                                Wallet (GH₵{walletBalance.toFixed(2)})
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="paystack" id="paystack" />
                              <Label htmlFor="paystack" className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                Paystack
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Insufficient Balance Warning */}
                        {paymentMethod === "wallet" && (
                          (bulkMode ? bulkTotal : singleTotal) > walletBalance
                        ) && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Insufficient wallet balance. Please top up your wallet or use Paystack.
                            </AlertDescription>
                          </Alert>
                        )}

                        <Button
                          className="w-full"
                          onClick={bulkMode ? handleBulkPurchase : handleSinglePurchase}
                          disabled={
                            isProcessing ||
                            !selectedBundle ||
                            (bulkMode ? !bulkPhones.trim() : !phoneNumber) ||
                            (paymentMethod === "wallet" && (bulkMode ? bulkTotal : singleTotal) > walletBalance)
                          }
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Purchase {bulkMode ? "Bulk" : "Bundle"}
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Select a bundle to continue
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
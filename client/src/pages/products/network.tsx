import { useParams, Link } from "wouter";
import { getAgentId } from "@/lib/store-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { validatePhoneNetwork, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { ShoppingCart, Package, ArrowLeft, Clock, AlertTriangle, Wallet, CreditCard } from "lucide-react";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";

const networkInfo: Record<string, { name: string; logo: string }> = {
  mtn: { name: "MTN", logo: mtnLogo },
  telecel: { name: "Telecel", logo: telecelLogo },
  at_bigtime: { name: "AT BIG TIME", logo: airteltigoLogo },
  at_ishare: { name: "AT iShare", logo: airteltigoLogo },
};

export default function NetworkProductsPage() {
  const { network } = useParams<{ network: string }>();
  // Handle legacy URLs where "bigtime" should be "at_bigtime" and "ishare" should be "at_ishare"
  const normalizedNetwork = network === 'bigtime' ? 'at_bigtime' : network === 'ishare' ? 'at_ishare' : network;
  const transformedNetwork = normalizedNetwork?.replace(/-/g, '_');
  const info = networkInfo[transformedNetwork || ""] || { name: "Unknown", logo: "" };
  
  // Get agent slug from URL query param or localStorage
  const agentSlugFromQuery = new URLSearchParams(window.location.search).get("agent");
  const agentSlug = agentSlugFromQuery || getAgentId();

  const agentStore = typeof window !== "undefined" ? getAgentId() : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 px-4 pt-16">
        <div className="container mx-auto max-w-4xl">
          <Link href={agentStore ? `/store/${agentStore}` : "/"}>
            <Button variant="ghost" className="gap-2 mb-6" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-8">
            {info.logo && (
              <img
                src={info.logo}
                alt={info.name}
                className="w-16 h-16 object-contain rounded-lg"
                data-testid="img-network-logo"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-network-name">
                {info.name} Data Bundles
              </h1>
              <p className="text-muted-foreground">
                Complete your purchase in one easy flow
              </p>
            </div>
          </div>

          {/* Public Purchase Flow (Single / Bulk) - guest users */}
          <PublicPurchaseFlow network={transformedNetwork || ""} agentSlug={agentSlug} />

          {/* Data Delivery Information */}
          <div className="mt-12 space-y-6">
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

      <Footer />
    </div>
  );
}

function PublicPurchaseFlow({ network, agentSlug }: { network: string; agentSlug?: string | null }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");
  const [orderType, setOrderType] = useState<'single' | 'bulk'>('single');
  const [phone, setPhone] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'wallet'>('paystack');

  // Disable bulk orders for AT Ishare network
  useEffect(() => {
    if (network === "at_ishare" && orderType === "bulk") {
      setOrderType("single");
    }
  }, [network, orderType]);

  // Fetch user stats for wallet balance
  const { data: userStats } = useQuery<{ walletBalance?: string }>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const walletBalance = userStats?.walletBalance ? parseFloat(userStats.walletBalance) : 0;

  const { data: bundles, isLoading } = useQuery<any[]>({
    queryKey: ['/api/products/data-bundles', network, agentSlug],
    queryFn: async () => {
      const apiNetwork = network;
      const url = `/api/products/data-bundles?network=${apiNetwork}`;
      return await apiRequest('GET', url);
    },
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale for agent storefronts
  });

  useQuery({
    queryKey: ['/api/store/agent', agentSlug],
    queryFn: async () => {
      if (!agentSlug) return null;
      const res = await apiRequest('GET', `/api/store/agent/${agentSlug}`);
      return (res as Response).json();
    },
    enabled: !!agentSlug
  });

  const sortedBundles = bundles?.filter((b: any) => b.network === network && b.isActive)
    .sort((a: any, b: any) => {
      const priceA = parseFloat(a.effective_price);
      const priceB = parseFloat(b.effective_price);
      return priceA - priceB;
    });

  const selectedBundle = sortedBundles?.find((b: any) => b.id === selectedBundleId) || null;

  const bulkTotal = useMemo(() => {
    if (!bulkPhones?.trim() || !sortedBundles) return { total: 0, count: 0, invalidCount: 0 };
    const lines = bulkPhones.split('\n').filter(l => l.trim());
    let total = 0; let count = 0; let invalidCount = 0;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 2) {
        const gb = parseFloat(parts[1]);
        if (!isNaN(gb) && gb > 0) {
          const match = sortedBundles.find((b: any) => {
            const m = b.dataAmount.match(/(\d+(?:\.\d+)?)\s*gb/i);
            return m ? parseFloat(m[1]) === gb : false;
          });
          if (match) { 
            const price = parseFloat(match.effective_price);
            total += price; 
            count++; 
          } else {
            invalidCount++;
          }
        }
      }
    }
    return { total, count, invalidCount };
  }, [bulkPhones, sortedBundles]);

  const checkoutMutation = useMutation<any, Error, any>({
    mutationFn: async (payload: any) => {
      if (payload.paymentMethod === "wallet") {
        return await apiRequest('POST', '/api/wallet/pay', payload);
      } else {
        return await apiRequest('POST', '/api/checkout/initialize', payload);
      }
    }
  });

  const handleSingle = async () => {
    if (!selectedBundle) { toast({ title: 'No bundle selected', variant: 'destructive' }); return; }
    const normalized = normalizePhoneNumber(phone.trim());
    if (!normalized) { toast({ title: 'Invalid phone', variant: 'destructive' }); return; }
    const validation = validatePhoneNetwork(normalized, selectedBundle.network);
    if (!validation.isValid) { toast({ title: 'Phone mismatch', description: validation.error || 'Network mismatch', variant: 'destructive' }); return; }

    // Check wallet balance if paying with wallet
    if (paymentMethod === "wallet") {
      if (!user) {
        toast({ title: 'Login required', description: 'Please log in to pay with wallet', variant: 'destructive' });
        return;
      }
      const price = parseFloat(selectedBundle.effective_price);
      if (walletBalance < price) {
        toast({ title: 'Insufficient balance', description: 'Your wallet balance is not enough', variant: 'destructive' });
        return;
      }
    }

    // Fetch bundle to get current price
    try {
      const currentBundleData = await apiRequest('GET', `/api/products/data-bundles/${selectedBundle.id}`) as any;
      
      const amount = parseFloat(currentBundleData.effective_price);
      
      const payload = {
        productType: 'data_bundle',
        productId: selectedBundle.id,
        customerPhone: normalized,
        amount: amount.toFixed(2),
        isBulkOrder: false,
        agentSlug: undefined,
        paymentMethod,
        productName: selectedBundle.name,
        network: selectedBundle.network,
      };

      checkoutMutation.mutate(payload, {
        onSuccess: (data) => {
          if (paymentMethod === "wallet") {
            toast({
              title: "✅ Payment Successful!",
              description: `Your purchase has been confirmed. New wallet balance: GH₵${data.newBalance}. Processing your order...`,
              duration: 5000,
            });
          } else {
            if (data.paymentUrl) window.location.href = data.paymentUrl; else toast({ title: 'Payment init failed', variant: 'destructive' });
          }
        },
        onError: (err: any) => toast({ title: 'Error', description: err.message || 'Checkout failed', variant: 'destructive' })
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch bundle details', variant: 'destructive' });
    }
  };

  const handleBulk = () => {
    if (!bulkPhones.trim()) { toast({ title: 'Missing Information', description: 'Enter phone numbers with GB amounts', variant: 'destructive' }); return; }
    if (!sortedBundles) { toast({ title: 'No bundles', variant: 'destructive' }); return; }

    const lines = bulkPhones.split('\n').filter(l => l.trim());
    const parsed: Array<{ phone: string; gb: number }> = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length !== 2) { toast({ title: 'Invalid Format', description: `Line "${line}" must be "phone GB"`, variant: 'destructive' }); return; }
      let p = parts[0].replace(/^\+/, '');
      if (p.startsWith('233')) p = '0' + p.substring(3);
      const gb = parseFloat(parts[1]);
      if (isNaN(gb) || gb <= 0) { toast({ title: 'Invalid GB', variant: 'destructive' }); return; }
      const normalized = normalizePhoneNumber(p);
      if (!normalized) { toast({ title: 'Invalid phone', description: p, variant: 'destructive' }); return; }
      // validate network
      const validation = validatePhoneNetwork(normalized, network);
      if (!validation.isValid) { toast({ title: 'Phone mismatch', description: `${p}: ${validation.error}`, variant: 'destructive' }); return; }
      parsed.push({ phone: normalized, gb });
    }

    // Check for duplicate phone numbers
    const phoneSet = new Set(parsed.map(p => p.phone));
    if (phoneSet.size !== parsed.length) {
      toast({ title: 'Duplicate Numbers', description: 'Phone numbers must be unique', variant: 'destructive' });
      return;
    }

    // build orderItems
    const orderItems: Array<{ phone: string; bundleId: string; bundleName: string; price: number }> = [];
    let total = 0;
    for (const it of parsed) {
      const match = sortedBundles.find((b: any) => { const m = b.dataAmount.match(/(\d+(?:\.\d+)?)\s*gb/i); return m ? parseFloat(m[1]) === it.gb : false; });
      if (!match) { toast({ title: 'Bundle Not Found', description: `No ${it.gb}GB bundle for ${network}`, variant: 'destructive' }); return; }
      
      // Use effective_price for all bundles
      const price = parseFloat(match.effective_price);
      orderItems.push({ phone: it.phone, bundleId: match.id, bundleName: match.name, price });
      total += price;
    }

    // Bulk orders always use Paystack for security and reliability
    const payload = {
      productType: 'data_bundle',
      network: network,
      customerPhone: orderItems[0]?.phone,
      isBulkOrder: true,
      orderItems,
      totalAmount: total,
      agentSlug: undefined,
      paymentMethod: 'paystack',
    };

    checkoutMutation.mutate(payload, {
      onSuccess: (data) => {
        if (data.paymentUrl) window.location.href = data.paymentUrl; else toast({ title: 'Payment init failed', variant: 'destructive' });
      },
      onError: (err: any) => toast({ title: 'Error', description: err.message || 'Checkout failed', variant: 'destructive' })
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <img src={(networkInfo[network] || { logo: '' }).logo} alt={network} className="h-12 w-12 rounded-lg object-contain" />
          <div>
            <h2 className="font-semibold text-lg">{(networkInfo[network] || { name: network }).name}</h2>
            <p className="text-sm text-muted-foreground">Choose from our available data bundles</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="single" className="w-full" onValueChange={(v) => setOrderType(v as 'single' | 'bulk')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white"><ShoppingCart className="h-4 w-4 mr-2"/>Single Purchase</TabsTrigger>
          <TabsTrigger value="bulk" disabled={network === "at_ishare"} className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
            <Package className="h-4 w-4 mr-2"/>Bulk Purchase
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

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Bundle</Label>
                {isLoading ? <div>Loading...</div> : (
                  <Select value={selectedBundleId} onValueChange={(v) => setSelectedBundleId(v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Choose a data bundle" /></SelectTrigger>
                    <SelectContent>
                      {sortedBundles?.map((b: any) => {
                        const price = parseFloat(b.effective_price);
                        return (
                          <SelectItem key={b.id} value={b.id}>{b.network.toUpperCase()} {b.dataAmount} - {b.validity} - GH₵{price.toFixed(2)}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedBundle && (
                <div className="p-2 bg-yellow-100 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">Selected Bundle</p>
                  <p className="font-medium text-lg">{selectedBundle.network.toUpperCase()} {selectedBundle.dataAmount} - {selectedBundle.validity} - GH₵{parseFloat(selectedBundle.effective_price).toFixed(2)}</p>
                  <p className="text-2xl font-bold text-primary mt-2">GH₵{parseFloat(selectedBundle.effective_price).toFixed(2)}</p>
                </div>
              )}

              <div>
                <Label htmlFor="beneficiary-phone">Beneficiary Number</Label>
                <Input id="beneficiary-phone" autoComplete="tel" placeholder="0241234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <p className="text-xs text-muted-foreground">Enter one number. Supports 0241234567 or 233241234567 (no +). Valid prefixes: {getNetworkPrefixes(network).join(', ')}</p>
              </div>

              <div>
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'paystack' | 'wallet')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paystack" id="paystack" />
                    <Label htmlFor="paystack" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Paystack
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wallet" id="wallet" disabled={!user} />
                    <Label htmlFor="wallet" className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Wallet {user ? `(Balance: GH₵${walletBalance.toFixed(2)})` : '(Login required)'}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSingle} 
                  disabled={
                    !selectedBundle || 
                    (paymentMethod === 'wallet' && (!user || walletBalance < parseFloat(selectedBundle?.effective_price || '0')))
                  }
                >
                  {paymentMethod === 'wallet' ? 'Pay with Wallet' : 'Pay with Paystack'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Purchase</CardTitle>
              <CardDescription>Enter phone numbers with GB amounts for {network.toUpperCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder={`0546591622 1\n0247064874 3\n233547897522 10`} value={bulkPhones} onChange={(e) => setBulkPhones(e.target.value)} rows={8} />
              <p className="text-sm text-muted-foreground">Enter one number per line with GB amount (e.g., "0241234567 2"). Supports 0241234567 or 233241234567 (no +). No limit - add 100+ numbers! All numbers must be for {network.toUpperCase()}. Valid prefixes: {getNetworkPrefixes(network).join(', ')}</p>
              {bulkTotal && (
                <div className="space-y-2">
                  <p className="font-medium">{bulkTotal.count} items • GH₵{bulkTotal.total.toFixed(2)}</p>
                  {bulkTotal.invalidCount > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      ⚠️ {bulkTotal.invalidCount} bundle(s) not found for this network. Please check the GB amounts.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={handleBulk}
                  disabled={bulkTotal.count === 0 || bulkTotal.invalidCount > 0}
                >
                  Pay with Paystack {bulkTotal.count > 0 ? ` ${bulkTotal.count} Bundles - GH₵${bulkTotal.total.toFixed(2)}` : ''}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

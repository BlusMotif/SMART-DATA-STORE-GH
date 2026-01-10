import { useParams, Link } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { validatePhoneNetwork, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { ShoppingCart, Package, Wallet, CreditCard, CheckCircle, ArrowLeft, Clock, AlertTriangle } from "lucide-react";
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
  const info = networkInfo[network || ""] || { name: "Unknown", logo: "" };
  
  // Get agent slug from URL query param or localStorage
  const agentSlugFromQuery = new URLSearchParams(window.location.search).get("agent");
  const agentSlug = agentSlugFromQuery || localStorage.getItem("agentStore");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link href="/">
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
          <PublicPurchaseFlow network={network || ""} agentSlug={agentSlug} />

          {/* Data Delivery Information */}
          <div className="mt-12 space-y-6">
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Data Delivery Time</h3>
                  <p className="text-muted-foreground">
                    Delivery time is between 20min to 4hrs
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-orange-900 dark:text-orange-100">
                    Our DATA REQUEST DOES NOT support:
                  </h3>
                  <ul className="text-muted-foreground space-y-1 ml-4">
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
                  <p className="text-orange-800 dark:text-orange-200 font-medium mt-3">
                    Important Notice: Any data transferred to the above SIM types is burnt and irreversible.
                  </p>
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
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");
  const [orderType, setOrderType] = useState<'single' | 'bulk'>('single');
  const [phone, setPhone] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');

  // Disable bulk orders for AT Ishare network
  useEffect(() => {
    if (network === "at_ishare" && orderType === "bulk") {
      setOrderType("single");
    }
  }, [network, orderType]);

  const { data: bundles, isLoading } = useQuery({
    queryKey: ['/api/products/data-bundles', network, agentSlug],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/products/data-bundles?network=${network}${agentSlug ? `&agent=${agentSlug}` : ''}`);
      return res.json();
    },
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale for agent storefronts
  });

  const { data: agent } = useQuery({
    queryKey: ['/api/store', agentSlug],
    queryFn: async () => {
      if (!agentSlug) return null;
      const res = await apiRequest('GET', `/api/store/${agentSlug}`);
      return res.json();
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
    if (!bulkPhones?.trim() || !sortedBundles) return null;
    const lines = bulkPhones.split('\n').filter(l => l.trim());
    let total = 0; let count = 0;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 2) {
        const gb = parseFloat(parts[1]);
        if (!isNaN(gb) && gb > 0) {
          const match = sortedBundles.find((b: any) => {
            const m = b.name.match(/(\d+(?:\.\d+)?)\s*gb/i);
            return m ? parseFloat(m[1]) === gb : false;
          });
          if (match) { 
            const price = parseFloat(match.effective_price);
            total += price; 
            count++; 
          }
        }
      }
    }
    return count > 0 ? { total, count } : null;
  }, [bulkPhones, sortedBundles]);

  const checkoutMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest('POST', '/api/checkout/initialize', payload);
      return res.json();
    }
  });

  const handleSingle = async () => {
    if (!selectedBundle) { toast({ title: 'No bundle selected', variant: 'destructive' }); return; }
    const normalized = normalizePhoneNumber(phone.trim());
    if (!normalized) { toast({ title: 'Invalid phone', variant: 'destructive' }); return; }
    const validation = validatePhoneNetwork(normalized, selectedBundle.network);
    if (!validation.isValid) { toast({ title: 'Phone mismatch', description: validation.error || 'Network mismatch', variant: 'destructive' }); return; }

    // Re-fetch bundle to validate price
    try {
      const res = await apiRequest('GET', `/api/products/data-bundles/${selectedBundle.id}`);
      const currentBundle = await res.json();
      
      console.log("[Frontend] Price validation:");
      console.log("[Frontend] UI effective_price:", selectedBundle.effective_price);
      console.log("[Frontend] Backend effective_price:", currentBundle.effective_price);
      
      if (Math.abs(parseFloat(selectedBundle.effective_price) - parseFloat(currentBundle.effective_price)) > 0.01) {
        toast({ title: 'Price changed', description: 'Please refresh and try again', variant: 'destructive' });
        return;
      }
      
      const amount = parseFloat(currentBundle.effective_price);
      
      const payload = {
        productType: 'data_bundle',
        productId: selectedBundle.id,
        customerPhone: normalized,
        amount: amount.toFixed(2),
        isBulkOrder: false,
        agentSlug: agentSlug || undefined,
      };

      console.log("[Frontend] Single purchase payload:");
      console.log("[Frontend] amount:", amount);

      checkoutMutation.mutate(payload, {
        onSuccess: (data) => { if (data.paymentUrl) window.location.href = data.paymentUrl; else toast({ title: 'Payment init failed', variant: 'destructive' }); },
        onError: (err: any) => toast({ title: 'Error', description: err.message || 'Checkout failed', variant: 'destructive' })
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to validate price', variant: 'destructive' });
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

    // build orderItems
    const orderItems: Array<{ phone: string; bundleId: string; bundleName: string; price: number }> = [];
    let total = 0;
    for (const it of parsed) {
      const match = sortedBundles.find((b: any) => { const m = b.name.match(/(\d+(?:\.\d+)?)\s*gb/i); return m ? parseFloat(m[1]) === it.gb : false; });
      if (!match) { toast({ title: 'Bundle Not Found', description: `No ${it.gb}GB bundle for ${network}`, variant: 'destructive' }); return; }
      
      // Use effective_price for all bundles
      const price = parseFloat(match.effective_price);
      orderItems.push({ phone: it.phone, bundleId: match.id, bundleName: match.name, price });
      total += price;
    }

    const payload = {
      productType: 'data_bundle',
      network: network,
      customerPhone: orderItems[0]?.phone,
      isBulkOrder: true,
      orderItems,
      totalAmount: total,
      agentSlug: agentSlug || undefined,
    };

    checkoutMutation.mutate(payload, {
      onSuccess: (data) => { if (data.paymentUrl) window.location.href = data.paymentUrl; else toast({ title: 'Payment init failed', variant: 'destructive' }); },
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
          <TabsTrigger value="single"><ShoppingCart className="h-4 w-4 mr-2"/>Single Purchase</TabsTrigger>
          <TabsTrigger value="bulk" disabled={network === "at_ishare"}>
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
                        const price = b.customPrice ? parseFloat(b.customPrice) : parseFloat(b.basePrice);
                        return (
                          <SelectItem key={b.id} value={b.id}>{b.network.toUpperCase()} {b.dataAmount} - {b.validity} - GH₵{price.toFixed(2)}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedBundle && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">Selected Bundle</p>
                  <p className="font-medium text-lg">{selectedBundle.network.toUpperCase()} {selectedBundle.dataAmount} - {selectedBundle.validity} - GH₵{(selectedBundle.customPrice ? parseFloat(selectedBundle.customPrice) : parseFloat(selectedBundle.basePrice)).toFixed(2)}</p>
                  <p className="text-2xl font-bold text-primary mt-2">GH₵{(selectedBundle.customPrice ? parseFloat(selectedBundle.customPrice) : parseFloat(selectedBundle.basePrice)).toFixed(2)}</p>
                </div>
              )}

              <div>
                <Label>Beneficiary Number</Label>
                <Input placeholder="0241234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <p className="text-xs text-muted-foreground">Enter one number. Supports 0241234567 or 233241234567 (no +). Valid prefixes: {getNetworkPrefixes(network).join(', ')}</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSingle} disabled={!selectedBundle}>Pay with Paystack</Button>
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
              {bulkTotal && <p className="font-medium">{bulkTotal.count} items • GH₵{bulkTotal.total.toFixed(2)}</p>}
              <div className="flex justify-end">
                <Button onClick={handleBulk}>Purchase {bulkTotal ? ` ${bulkTotal.count} Bundles - GH₵${bulkTotal.total.toFixed(2)}` : ''}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

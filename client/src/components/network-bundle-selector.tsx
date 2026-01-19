import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Smartphone, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Network {
  network: string;
  basePrice: string;
  name: string;
}

interface Bundle {
  id: string;
  name: string;
  network: string;
  dataAmount: string;
  validity: string;
  effective_price: string;
  profit_margin: string;
}

export function NetworkBundleSelector() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingBundles, setFetchingBundles] = useState(false);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch available networks on component mount
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        setLoading(true);
        const data = await apiRequest("/api/products/networks");
        setNetworks(data);
      } catch (error) {
        console.error("Failed to fetch networks:", error);
        toast({
          title: "Error",
          description: "Failed to load networks. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNetworks();
  }, [toast]);

  // Fetch bundles when network is selected
  useEffect(() => {
    if (!selectedNetwork) {
      setBundles([]);
      setSelectedBundle(null);
      return;
    }

    const fetchBundles = async () => {
      try {
        setFetchingBundles(true);
        const data = await apiRequest(`/api/products/data-bundles?network=${selectedNetwork}`);
        setBundles(data);
      } catch (error) {
        console.error("Failed to fetch bundles:", error);
        toast({
          title: "Error",
          description: "Failed to load bundles. Please try again.",
          variant: "destructive",
        });
      } finally {
        setFetchingBundles(false);
      }
    };

    fetchBundles();
  }, [selectedNetwork, toast]);

  const handleBundleSelect = (bundle: Bundle) => {
    setSelectedBundle(bundle);
  };

  const handlePurchase = () => {
    if (!selectedBundle) return;

    // Navigate to the network page with the selected bundle
    navigate(`/products/${selectedNetwork}#bundle-${selectedBundle.id}`);
  };

  const selectedNetworkData = networks.find(n => n.network === selectedNetwork);

  return (
    <div className="space-y-6">
      {/* Network Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Select Your Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork} disabled={loading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading networks..." : "Choose a network"} />
              </SelectTrigger>
              <SelectContent>
                {networks.map((network) => (
                  <SelectItem key={network.network} value={network.network}>
                    <div className="flex items-center justify-between w-full">
                      <span>{network.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        From ₵{network.basePrice}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedNetworkData && (
              <div className="text-sm text-muted-foreground">
                Starting from ₵{selectedNetworkData.basePrice} for {selectedNetworkData.name} bundles
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bundle Selection */}
      {selectedNetwork && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Choose Your Bundle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fetchingBundles ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading bundles...</p>
              </div>
            ) : bundles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No bundles available for this network.</p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {bundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedBundle?.id === bundle.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleBundleSelect(bundle)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{bundle.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {bundle.dataAmount} • {bundle.validity}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">₵{bundle.effective_price}</div>
                        {parseFloat(bundle.profit_margin) > 0 && user && (
                          <div className="text-xs text-green-600">
                            +₵{bundle.profit_margin} profit
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purchase Button */}
      {selectedBundle && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handlePurchase}
            className="px-8 py-3 text-lg font-semibold"
          >
            Purchase {selectedBundle.name}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
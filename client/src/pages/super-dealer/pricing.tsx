import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AgentSidebarV2 as SuperDealerSidebar } from "@/components/layout/agent-sidebar-v2";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/constants";
import { Menu, TrendingUp, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type PricingData = {
  bundleId: string;
  superDealerPrice: string;
  adminBasePrice: string;
  superDealerProfit: string;
};

type DataBundle = {
  id: string;
  name: string;
  network: string;
  dataAmount: string;
  validity: string;
  basePrice: string;
};

export default function SuperDealerPricingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [priceChanges, setPriceChanges] = useState<Record<string, { superDealerPrice: string; superDealerProfit: string }>>({});

  const { data: pricing, isLoading } = useQuery<PricingData[]>({
    queryKey: ["/api/super-dealer/pricing"],
  });

  const { data: bundles } = useQuery<DataBundle[]>({
    queryKey: ["/api/products/data-bundles"],
  });

  const updateMutation = useMutation({
    mutationFn: (prices: Record<string, { superDealerPrice: string; superDealerProfit: string }>) =>
      apiRequest("POST", "/api/super-dealer/pricing", { prices }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-dealer/pricing"] });
      setPriceChanges({});
      toast({ title: "Pricing updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update pricing", description: error.message, variant: "destructive" });
    },
  });

  const getBundleName = (bundleId: string) => {
    const bundle = bundles?.find(b => b.id === bundleId);
    return bundle ? `${bundle.network.toUpperCase()} ${bundle.dataAmount} - ${bundle.validity}` : bundleId;
  };

  const getCurrentPrice = (bundleId: string) => {
    const existing = pricing?.find(p => p.bundleId === bundleId);
    const changes = priceChanges[bundleId];
    return {
      superDealerPrice: changes?.superDealerPrice || existing?.superDealerPrice || "0.00",
      superDealerProfit: changes?.superDealerProfit || existing?.superDealerProfit || "0.00",
      adminBasePrice: existing?.adminBasePrice || "0.00",
    };
  };

  const handlePriceChange = (bundleId: string, field: 'superDealerPrice' | 'superDealerProfit', value: string) => {
    const current = getCurrentPrice(bundleId);
    const numValue = parseFloat(value) || 0;

    if (field === 'superDealerPrice') {
      // When super dealer price changes, calculate profit
      const basePrice = parseFloat(current.adminBasePrice);
      const profit = Math.max(0, numValue - basePrice);
      setPriceChanges(prev => ({
        ...prev,
        [bundleId]: {
          superDealerPrice: value,
          superDealerProfit: profit.toFixed(2),
        }
      }));
    } else {
      // When profit changes, calculate selling price
      const basePrice = parseFloat(current.adminBasePrice);
      const sellingPrice = basePrice + numValue;
      setPriceChanges(prev => ({
        ...prev,
        [bundleId]: {
          superDealerPrice: sellingPrice.toFixed(2),
          superDealerProfit: value,
        }
      }));
    }
  };

  const handleSave = () => {
    if (Object.keys(priceChanges).length === 0) {
      toast({ title: "No changes to save" });
      return;
    }
    updateMutation.mutate(priceChanges);
  };

  const hasUnsavedChanges = Object.keys(priceChanges).length > 0;

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out">
            <SuperDealerSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <SuperDealerSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg lg:text-xl font-semibold">Pricing Management</h1>
          </div>
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                Unsaved changes
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !hasUnsavedChanges}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Set Your Selling Prices
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Set your selling prices for data bundles. Your profit margin will be calculated automatically.
                </p>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={8} />
                ) : pricing && pricing.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Bundle</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Your Price</TableHead>
                        <TableHead>Your Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricing.map((price) => {
                        const current = getCurrentPrice(price.bundleId);
                        const hasChanges = priceChanges[price.bundleId];

                        return (
                          <TableRow key={price.bundleId} className={hasChanges ? "bg-blue-50" : ""}>
                            <TableCell className="font-medium">
                              {getBundleName(price.bundleId)}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {formatCurrency(current.adminBasePrice)}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={current.superDealerPrice}
                                onChange={(e) => handlePriceChange(price.bundleId, 'superDealerPrice', e.target.value)}
                                className="w-24 tabular-nums"
                                min={current.adminBasePrice}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={current.superDealerProfit}
                                onChange={(e) => handlePriceChange(price.bundleId, 'superDealerProfit', e.target.value)}
                                className="w-24 tabular-nums"
                                min="0"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No pricing data available. Please contact admin to set up base prices.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How Pricing Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Base Price</h4>
                    <p className="text-sm text-muted-foreground">
                      The minimum price set by admin for each role. You cannot sell below this price.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Your Price</h4>
                    <p className="text-sm text-muted-foreground">
                      The price you charge customers. Must be at least the base price.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Your Profit</h4>
                    <p className="text-sm text-muted-foreground">
                      Your Price minus Base Price. This is your profit margin per sale.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
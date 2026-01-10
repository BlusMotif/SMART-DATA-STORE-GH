import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AgentSidebar } from "@/components/layout/agent-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, NETWORKS } from "@/lib/constants";
import { Store, ExternalLink, Copy, Save, Smartphone, Menu } from "lucide-react";
import type { Agent, DataBundle } from "@shared/schema";

const storefrontSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessDescription: z.string().optional(),
});

type StorefrontFormData = z.infer<typeof storefrontSchema>;

interface AgentPricing {
  bundleId: string;
  customPrice: string;
}

interface AgentProfileResponse {
  agent: Agent & {
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
  };
  stats: any;
}

export default function AgentStorefront() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profileData } = useQuery<AgentProfileResponse>({
    queryKey: ["/api/agent/profile"],
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: true,
  });
  
  const agent = profileData?.agent;

  const { data: bundles } = useQuery<DataBundle[]>({
    queryKey: ["/api/products/data-bundles"],
    refetchInterval: 30000, // Refresh every 30 seconds for product updates
    refetchOnWindowFocus: true,
  });

  const { data: agentPricing } = useQuery<AgentPricing[]>({
    queryKey: ["/api/agent/pricing"],
    refetchInterval: 15000, // Refresh every 15 seconds for pricing updates
    refetchOnWindowFocus: true,
  });

  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});

  const form = useForm<StorefrontFormData>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: {
      businessName: "",
      businessDescription: "",
    },
  });

  useEffect(() => {
    if (agent) {
      form.reset({
        businessName: agent.businessName || "",
        businessDescription: agent.businessDescription || "",
      });
    }
  }, [agent, form]);

  useEffect(() => {
    if (agentPricing && agentPricing.length > 0) {
      const prices: Record<string, string> = {};
      agentPricing.forEach((p) => {
        prices[p.bundleId] = p.customPrice;
      });
      setCustomPrices(prices);
    }
  }, [agentPricing]);

  const updateStoreMutation = useMutation({
    mutationFn: (data: StorefrontFormData) =>
      apiRequest("PATCH", "/api/agent/storefront", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/profile"] });
      toast({ title: "Store details updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update store", description: error.message, variant: "destructive" });
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: (prices: Record<string, string>) =>
      apiRequest("POST", "/api/agent/pricing", { prices }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/pricing"] });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === '/api/products/data-bundles'
      });
      toast({ title: "Pricing updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update pricing", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: StorefrontFormData) => {
    updateStoreMutation.mutate(data);
  };

  const handleSavePricing = () => {
    updatePricingMutation.mutate(customPrices);
  };

  const copyStoreLink = () => {
    if (agent) {
      const url = `${window.location.origin}/store/${agent.storefrontSlug}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Store link copied to clipboard!" });
    }
  };

  const getCustomPrice = (bundleId: string) => {
    if (customPrices[bundleId]) return customPrices[bundleId];
    const existing = agentPricing?.find((p) => p.bundleId === bundleId);
    return existing?.customPrice || "";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out">
            <AgentSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AgentSidebar />
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
            <h1 className="text-lg lg:text-xl font-semibold">My Storefront</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Link
                </CardTitle>
                <CardDescription>
                  Share this link with your customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={agent ? `${window.location.origin}/store/${agent.storefrontSlug}` : ""}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-store-url"
                  />
                  <Button variant="outline" size="icon" onClick={copyStoreLink} data-testid="button-copy-link">
                    <Copy className="h-4 w-4" />
                  </Button>
                  {agent && (
                    <a href={`/store/${agent.storefrontSlug}`} target="_blank" rel="noopener noreferrer" aria-label="Open storefront in new tab">
                      <Button variant="outline" size="icon" data-testid="button-open-store">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Store Details</CardTitle>
                <CardDescription>
                  Customize how your store appears to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your business name"
                              data-testid="input-business-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell customers about your business..."
                              className="resize-none"
                              rows={3}
                              data-testid="input-business-description"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This will be shown on your storefront page
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={updateStoreMutation.isPending}
                      data-testid="button-save-details"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateStoreMutation.isPending ? "Saving..." : "Save Details"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Custom Pricing
                  </CardTitle>
                  <CardDescription>
                    Set your own prices for data bundles. Leave blank to use default prices.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSavePricing}
                  disabled={updatePricingMutation.isPending || Object.keys(customPrices).length === 0}
                  data-testid="button-save-pricing"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updatePricingMutation.isPending ? "Saving..." : "Save Pricing"}
                </Button>
              </CardHeader>
              <CardContent>
                {bundles && bundles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Network</TableHead>
                        <TableHead>Bundle</TableHead>
                        <TableHead>Agent Price</TableHead>
                        <TableHead>Your Price</TableHead>
                        <TableHead>Your Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bundles.map((bundle) => {
                        const network = NETWORKS.find((n) => n.id === bundle.network);
                        const customPrice = getCustomPrice(bundle.id);
                        const effectivePrice = customPrice || bundle.basePrice;
                        const agentPrice = bundle.agentPrice || bundle.basePrice;
                        const profit = parseFloat(effectivePrice) - parseFloat(agentPrice);
                        return (
                          <TableRow key={bundle.id} data-testid={`row-bundle-${bundle.id}`}>
                            <TableCell>
                              <Badge
                                style={{
                                  backgroundColor: network?.color,
                                  color: network?.textColor,
                                }}
                              >
                                {network?.name || bundle.network}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{bundle.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {bundle.dataAmount} - {bundle.validity}
                              </div>
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {formatCurrency(bundle.agentPrice || bundle.basePrice)}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder={agentPrice}
                                value={customPrices[bundle.id] || ""}
                                onChange={(e) =>
                                  setCustomPrices((prev) => ({
                                    ...prev,
                                    [bundle.id]: e.target.value,
                                  }))
                                }
                                className="w-24 tabular-nums"
                                data-testid={`input-price-${bundle.id}`}
                              />
                            </TableCell>
                            <TableCell className={`tabular-nums font-medium ${profit > 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(profit)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No data bundles available to customize.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StorefrontAuthDialog } from "@/components/storefront-auth-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { DataBundleCard, DataBundleCardSkeleton } from "@/components/products/data-bundle-card";
import { ResultCheckerCard, ResultCheckerCardSkeleton } from "@/components/products/result-checker-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoDataBundles, NoResultCheckers } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/loading-spinner";
import { NETWORKS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { Smartphone, FileCheck, Store, Shield, LogOut, User } from "lucide-react";
import type { DataBundle, Agent } from "@shared/schema";

interface StorefrontData {
  agent: Agent & { user: { name: string } };
  dataBundles: (DataBundle & { customPrice: number })[];
  resultCheckerStock: { type: string; year: number; price: number; stock: number }[];
}

export default function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const { user, logout } = useAuth();

  // Store the agent slug in localStorage when visiting
  useEffect(() => {
    if (slug) {
      localStorage.setItem("agentStore", slug);
    }
  }, [slug]);

  const { data, isLoading, error } = useQuery<StorefrontData>({
    queryKey: ["/api/store", slug],
    enabled: !!slug,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const handlePurchaseBundle = (bundle: DataBundle & { customPrice: number }) => {
    if (!user) {
      alert("Please login or register to make a purchase");
      return;
    }
    window.location.href = `/checkout/data-bundle/${bundle.id}?agent=${slug}`;
  };

  const handlePurchaseChecker = (type: string, year: number) => {
    if (!user) {
      alert("Please login or register to make a purchase");
      return;
    }
    window.location.href = `/checkout/result-checker/${type}/${year}?agent=${slug}`;
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("agentStore");
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <span className="font-semibold">Loading...</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1">
          <PageLoader text="Loading store..." />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b">
          <div className="container mx-auto flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <span className="font-semibold">Store Not Found</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Store Not Found</h2>
              <p className="text-muted-foreground mb-4">This store doesn't exist or is not available.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { agent, dataBundles, resultCheckerStock } = data;
  const filteredBundles = dataBundles?.filter(
    (bundle) => selectedNetwork === "all" || bundle.network === selectedNetwork
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Storefront Header - Simple, no navigation to main app */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold">
              {agent.businessName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-semibold text-lg">{agent.businessName}</h1>
              <p className="text-xs text-muted-foreground">Agent Store</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
                  <User className="h-4 w-4" />
                  {user.name}
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <StorefrontAuthDialog agentSlug={slug!} agentName={agent.businessName} />
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-12 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto max-w-6xl text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold mx-auto mb-4">
              {agent.businessName.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-store-name">
              {agent.businessName}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {agent.businessDescription || `Welcome to ${agent.businessName}. Browse our selection of data bundles and result checkers.`}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Secure payments powered by Paystack</span>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <Tabs defaultValue="data-bundles" className="space-y-8">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="data-bundles" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  Data Bundles
                </TabsTrigger>
                <TabsTrigger value="result-checkers" className="gap-2">
                  <FileCheck className="h-4 w-4" />
                  Result Checkers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="data-bundles" className="space-y-6">
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant={selectedNetwork === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedNetwork("all")}>
                    All Networks
                  </Button>
                  {NETWORKS.map((network) => (
                    <Button key={network.id} variant={selectedNetwork === network.id ? "default" : "outline"} size="sm" onClick={() => setSelectedNetwork(network.id)}>
                      {network.name}
                    </Button>
                  ))}
                </div>

                {filteredBundles && filteredBundles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBundles.map((bundle) => (
                      <DataBundleCard
                        key={bundle.id}
                        bundle={bundle}
                        customPrice={bundle.customPrice}
                        onPurchase={() => handlePurchaseBundle(bundle)}
                      />
                    ))}
                  </div>
                ) : (
                  <NoDataBundles />
                )}
              </TabsContent>

              <TabsContent value="result-checkers" className="space-y-6">
                {resultCheckerStock && resultCheckerStock.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resultCheckerStock.map((item) => (
                      <ResultCheckerCard
                        key={`${item.type}-${item.year}`}
                        type={item.type as "bece" | "wassce"}
                        year={item.year}
                        price={item.price}
                        stock={item.stock}
                        onPurchase={() => handlePurchaseChecker(item.type, item.year)}
                      />
                    ))}
                  </div>
                ) : (
                  <NoResultCheckers />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {agent.businessName}. Powered by SmartDataStore
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Secure payments • Fast delivery • 24/7 support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

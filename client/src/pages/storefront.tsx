import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StorefrontAuthDialog } from "@/components/storefront-auth-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { Store, Shield, LogOut, User, MessageCircle, Phone } from "lucide-react";
import type { Agent } from "@shared/schema";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";
import resultLogo from "@assets/result_1765780772205.jpg";

interface StorefrontData {
  agent: Agent & { user: { name: string } };
}

export default function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // Store the agent slug in localStorage when visiting
  useEffect(() => {
    if (slug) {
      localStorage.setItem("agentStore", slug);
    }
  }, [slug]);

  // Handle product navigation
  const navigateToProduct = (network: string) => {
    console.log(`Navigating to: /products/${network}?agent=${slug}`);
    setLocation(`/products/${network}?agent=${slug}`);
  };

  const { data, isLoading, error } = useQuery<StorefrontData>({
    queryKey: ["/api/store", slug],
    enabled: !!slug,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

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

  const { agent } = data;

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
            
            {/* WhatsApp Support Links */}
            {(agent.whatsappSupportLink || agent.whatsappChannelLink) && (
              <div className="flex items-center justify-center gap-4 mt-6">
                {agent.whatsappSupportLink && (
                  <a
                    href={agent.whatsappSupportLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">WhatsApp Support</span>
                  </a>
                )}
                {agent.whatsappChannelLink && (
                  <a
                    href={agent.whatsappChannelLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">WhatsApp Channel</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Product Logos Section */}
        <section className="py-12 px-4 bg-background">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-8">Browse Our Products</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* MTN Logo */}
              <Card 
                className="p-4 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3"
                onClick={() => navigateToProduct('mtn')}
              >
                <img
                  src={mtnLogo}
                  alt="MTN Data Bundles"
                  className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-lg"
                />
                <p className="text-sm font-medium text-center text-muted-foreground">
                  MTN Data Bundles
                </p>
              </Card>

              {/* Telecel Logo */}
              <Card 
                className="p-4 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3"
                onClick={() => navigateToProduct('telecel')}
              >
                <img
                  src={telecelLogo}
                  alt="Telecel Data Bundles"
                  className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-lg"
                />
                <p className="text-sm font-medium text-center text-muted-foreground">
                  Telecel Data Bundles
                </p>
              </Card>

              {/* AirtelTigo Logo */}
              <Card 
                className="p-4 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3"
                onClick={() => navigateToProduct('airteltigo')}
              >
                <img
                  src={airteltigoLogo}
                  alt="AirtelTigo Data Bundles"
                  className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-lg"
                />
                <p className="text-sm font-medium text-center text-muted-foreground">
                  AirtelTigo Data Bundles
                </p>
              </Card>

              {/* Result Checker Logo */}
              <Card 
                className="p-4 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3"
                onClick={() => navigateToProduct('result-checkers')}
              >
                <img
                  src={resultLogo}
                  alt="Result Checkers"
                  className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-lg"
                />
                <p className="text-sm font-medium text-center text-muted-foreground">
                  Result Checkers
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-4">
            {/* WhatsApp Links */}
            {(agent.whatsappSupportLink || agent.whatsappChannelLink) && (
              <div className="flex items-center gap-4">
                {agent.whatsappSupportLink && (
                  <a
                    href={agent.whatsappSupportLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-sm font-medium">Support</span>
                  </a>
                )}
                {agent.whatsappChannelLink && (
                  <a
                    href={agent.whatsappChannelLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Channel</span>
                  </a>
                )}
              </div>
            )}
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} {agent.businessName}. Powered by SmartDataStore
              </p>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>Secure payments • Fast delivery • 24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

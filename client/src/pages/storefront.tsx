import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderTracker } from "@/components/order-tracker";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Store, Shield, MessageCircle, Search } from "lucide-react";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";
import banner1 from "@assets/banner1_1765774201032.jpeg";
import banner2 from "@assets/banner2_1765774201033.jpeg";
import banner3 from "@assets/banner3_1765774201030.jpeg";

const bannerImages = [banner1, banner2, banner3];

interface StorefrontData {
  store: {
    businessName: string;
    businessDescription: string;
    slug: string;
    whatsappSupportLink?: string;
    whatsappChannelLink?: string;
    role: string;
  };
  dataBundles: Array<{
    id: string;
    name: string;
    network: string;
    dataAmount: string;
    validity: string;
    apiCode?: string;
    isActive: boolean;
    price: string;
  }>;
}

export default function StorefrontPage() {
  const { role, slug } = useParams<{ role: string; slug: string }>();
  const [, setLocation] = useLocation();
  const [currentBanner, setCurrentBanner] = useState(0);

  // Auto-rotate banner every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Store the agent slug in localStorage when visiting
  useEffect(() => {
    if (slug) {
      localStorage.setItem("agentStore", slug);
    }
  }, [slug]);

  // Handle product navigation
  const navigateToProduct = (network: string) => {
    setLocation(`/store/${role}/${slug}/${network}`);
  };

  const { data, isLoading, error } = useQuery<StorefrontData>({
    queryKey: [`/api/store/${role}/${slug}`],
    enabled: !!role && !!slug,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-white">
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
        <header className="border-b bg-background">
          <div className="container mx-auto flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <span className="font-semibold text-foreground">Store Not Found</span>
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

  const { store } = data;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Storefront Header - Simple, no navigation to main app */}
      <header className="border-b sticky top-0 z-50 bg-blue-100 dark:bg-blue-200">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-semibold text-lg text-black">{store.businessName}</h1>
              {store.businessDescription && (
                <p className="text-sm text-black/70">{store.businessDescription}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-black" onClick={() => {
              document.getElementById('track-orders')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <Search className="h-4 w-4 mr-2" />
              Track Orders
            </Button>
            <ThemeToggle className="text-black" />
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section with Banner */}
        <section className="relative" data-testid="banner-carousel">
          <div className="relative h-[300px] md:h-[400px]">
            {bannerImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Banner ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  index === currentBanner ? "opacity-100" : "opacity-0"
                }`}
                data-testid={`img-banner-${index + 1}`}
              />
            ))}
            <div className="absolute inset-0 bg-black/50" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container mx-auto max-w-6xl text-center px-4">
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                  {store.businessDescription || `Welcome to our store. Browse our selection of data bundles and result checkers.`}
                </p>
                <div className="flex items-center justify-center gap-2 mt-6 text-sm">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span className="font-medium text-white/90">Secure payments powered by Paystack</span>
                </div>

                {/* WhatsApp Support Links */}
                {(store.whatsappSupportLink || store.whatsappChannelLink) && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    {store.whatsappSupportLink && (
                      <a
                        href={store.whatsappSupportLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">WhatsApp Support</span>
                      </a>
                    )}
                    {store.whatsappChannelLink && (
                      <a
                        href={store.whatsappChannelLink}
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
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {bannerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentBanner ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                  data-testid={`button-banner-dot-${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Product Logos Section */}
        <section className="py-12 px-4 bg-background">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-8">Browse Our Products</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* MTN Logo */}
              <Card 
                className="p-4 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3 dark:border-2 dark:border-white"
                onClick={() => navigateToProduct('mtn')}
              >
                <img
                  src={mtnLogo}
                  alt="MTN Data Bundles"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg"
                />
                <div className="text-center">
                  <p className="text-sm font-semibold">MTN Data Bundles</p>
                  <p className="text-xs text-muted-foreground">Buy MTN data bundles.</p>
                </div>
              </Card>

              {/* Telecel Logo */}
              <Card 
                className="p-4 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3 dark:border-2 dark:border-white"
                onClick={() => navigateToProduct('telecel')}
              >
                <img
                  src={telecelLogo}
                  alt="Telecel Data Bundles"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg"
                />
                <div className="text-center">
                  <p className="text-sm font-semibold">Telecel Data Bundles</p>
                  <p className="text-xs text-muted-foreground">Buy Telecel data bundles.</p>
                </div>
              </Card>

              {/* AT BIG TIME Logo */}
              <Card 
                className="p-4 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3 dark:border-2 dark:border-white"
                onClick={() => navigateToProduct('at_bigtime')}
              >
                <img
                  src={airteltigoLogo}
                  alt="AT BIG TIME Bundles"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg"
                />
                <div className="text-center">
                  <p className="text-sm font-semibold">AT BIG TIME Bundles</p>
                  <p className="text-xs text-muted-foreground">Buy AT BIG TIME data bundles.</p>
                </div>
              </Card>

              {/* AT iShare Logo */}
              <Card 
                className="p-4 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3 dark:border-2 dark:border-white"
                onClick={() => navigateToProduct('at_ishare')}
              >
                <img
                  src={airteltigoLogo}
                  alt="AT iShare Bundles"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg"
                />
                <div className="text-center">
                  <p className="text-sm font-semibold">AT iShare Bundles</p>
                  <p className="text-xs text-muted-foreground">Buy AT iShare data bundles.</p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Track Orders Section */}
        <section id="track-orders" className="py-12 px-4 bg-blue-100 dark:bg-blue-950/40 border-y">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-blue-600 dark:text-blue-400">Track Orders</h2>
              <h3 className="text-xl text-black dark:text-white mb-4">Never Lose Track</h3>
              <p className="text-lg text-black dark:text-white max-w-2xl mx-auto">
                Easily track your data bundle and result checker orders using your transaction ID or beneficiary phone number.
              </p>
            </div>

            <OrderTracker />
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-8 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {store.businessName}. All rights reserved.
            </p>
 <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secure payments • Fast delivery • 24/7 support</span>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Developed by <a href="https://bm-portfolio-up2x.onrender.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">BlusMotif</a>
            </p>
           
          </div>
        </div>
      </footer>
    </div>
  );
}

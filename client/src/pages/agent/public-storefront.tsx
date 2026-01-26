import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Store, Search, Loader2, Shield
} from "lucide-react";
import type { Agent } from "@shared/schema";
import banner1 from "@assets/banner1_1765774201032.jpeg";
import banner2 from "@assets/banner2_1765774201033.jpeg";
import banner3 from "@assets/banner3_1765774201030.jpeg";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";
import resultLogo from "@assets/result_1765780772205.jpg";
import { OrderTracker } from "@/components/order-tracker";

const bannerImages = [banner1, banner2, banner3];

// Types
interface StorefrontData {
  agent: Agent & { user: { name: string } };
}

export default function AgentPublicStorefront() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  // State management
  const [currentBanner, setCurrentBanner] = useState(0);

  // Banner carousel effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev => (prev + 1) % bannerImages.length));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Queries
  const { data, isLoading } = useQuery<StorefrontData & { dataBundles?: Array<any> }>({
    queryKey: [`/api/store/agent/${slug}`],
    enabled: !!slug,
    refetchInterval: 30000,
  });

  const agent = data?.agent;

  // Persist agent store context so downstream pages (checkout, receipt) know this is an agent storefront
  useEffect(() => {
    if (slug) {
      try {
        localStorage.setItem("agentStore", slug);
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [slug]);

  // Loading state
  if (isLoading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Use fallback agent data if not loaded yet
  const displayAgent = agent || { 
    businessName: "Smart Data Store", 
    businessDescription: "Purchase data bundles instantly with secure payments." 
  };

  const productCategories = [
    {
      id: "mtn",
      name: "MTN Data Bundles",
      description: "Buy MTN data bundles.",
      image: mtnLogo,
      network: "mtn"
    },
    {
      id: "telecel",
      name: "Telecel Data Bundles",
      description: "Buy Telecel data bundles.",
      image: telecelLogo,
      network: "telecel"
    },
    {
      id: "at_bigtime",
      name: "AT BIG TIME Bundles",
      description: "Buy AT BIG TIME data bundles.",
      image: airteltigoLogo,
      network: "at_bigtime"
    },
    {
      id: "at_ishare",
      name: "AT iShare Bundles",
      description: "Buy AT iShare data bundles.",
      image: airteltigoLogo,
      network: "at_ishare"
    },
    {
      id: "waec-result-checker",
      name: "WAEC Result Checker",
      description: "Purchase BECE & WASSCE result checkers.",
      image: resultLogo,
      network: "result-checkers"
    },
  ];

  const handleProductClick = (network: string) => {
    setLocation(`/store/${slug}/${network}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Store className="h-6 w-6" />
            <span className="font-semibold text-lg">
              {displayAgent.businessName}
              {isLoading && <Loader2 className="inline h-4 w-4 ml-2 animate-spin" />}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => {
              document.getElementById('track-orders')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <Search className="h-4 w-4 mr-2" />
              Track Orders
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with Banner */}
        <section className="relative">
          <div className="relative h-[400px] md:h-[500px]">
            {bannerImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Banner ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  index === currentBanner ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-black/50" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container mx-auto max-w-6xl text-center px-4">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white">
                  Welcome to <span className="text-blue-400">{displayAgent.businessName}</span>
                </h1>
                <p className="text-lg text-white/90 max-w-2xl mx-auto">
                  {displayAgent.businessDescription || "Purchase data bundles instantly with secure payments."}
                </p>

                <div className="mt-4 space-y-2 text-white">
                  <p className="text-xl font-semibold">Your Trusted Platform for Digital Products</p>
                  <p className="text-lg">Purchase data bundles</p>
                </div>
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
                />
              ))}
            </div>
          </div>
        </section>

        {/* Product Categories Section */}
        <section id="products" className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-8">Select Network</h2>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-4 max-w-2xl">
                {productCategories.map((cat) => (
                  <Card
                    key={cat.id}
                    className="p-3 h-full flex flex-col items-center justify-center gap-2 cursor-pointer hover-elevate transition-all min-h-[120px] w-full max-w-[180px]"
                    onClick={() => handleProductClick(cat.network)}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-lg flex-shrink-0"
                    />
                    <div className="flex flex-col items-center gap-1 flex-1 justify-center">
                      <p className="text-sm font-semibold text-center leading-tight">{cat.name}</p>
                      <p className="text-xs text-center text-muted-foreground leading-tight">{cat.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Track Orders Section */}
        <section id="track-orders" className="py-12 px-4 bg-blue-50 dark:bg-blue-950/20 border-y">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-blue-600 dark:text-blue-400">Track Orders</h2>
              <h3 className="text-xl text-muted-foreground mb-4">Never Lose Track</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Easily track your data bundle and result checker orders using your transaction ID or beneficiary phone number.
              </p>
            </div>

            <OrderTracker />
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {displayAgent.businessName}. Powered by SmartDataStore
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

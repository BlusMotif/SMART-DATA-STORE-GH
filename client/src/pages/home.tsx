import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DataBundleCard, DataBundleCardSkeleton } from "@/components/products/data-bundle-card";
import { ResultCheckerCard, ResultCheckerCardSkeleton } from "@/components/products/result-checker-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoDataBundles, NoResultCheckers } from "@/components/ui/empty-state";
import { APP_NAME, NETWORKS, RESULT_CHECKER_TYPES } from "@/lib/constants";
import { Smartphone, FileCheck, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { DataBundle } from "@shared/schema";
import banner1 from "@assets/banner1_1765774201032.jpeg";
import banner2 from "@assets/banner2_1765774201033.jpeg";
import banner3 from "@assets/banner3_1765774201030.jpeg";

const bannerImages = [banner1, banner2, banner3];

interface ResultCheckerStock {
  type: string;
  year: number;
  price: number;
  stock: number;
}

export default function HomePage() {
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);

  const { data: dataBundles, isLoading: bundlesLoading } = useQuery<DataBundle[]>({
    queryKey: ["/api/products/data-bundles"],
  });

  const { data: resultCheckerStock, isLoading: checkersLoading } = useQuery<ResultCheckerStock[]>({
    queryKey: ["/api/products/result-checkers/stock"],
  });

  const filteredBundles = dataBundles?.filter(
    (bundle) => selectedNetwork === "all" || bundle.network === selectedNetwork
  );

  const handlePurchaseBundle = (bundle: DataBundle) => {
    window.location.href = `/checkout/data-bundle/${bundle.id}`;
  };

  const handlePurchaseChecker = (type: string, year: number) => {
    window.location.href = `/checkout/result-checker/${type}/${year}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section with Banner */}
        <section className="relative" data-testid="banner-carousel">
          {/* Banner Images */}
          <div className="relative h-[500px] md:h-[600px]">
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
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Text Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container mx-auto max-w-6xl text-center px-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white" data-testid="text-hero-title">
                  Your Trusted Platform for
                  <span className="text-blue-400"> Digital Products</span>
                </h1>
                <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
                  Purchase data bundles and WAEC result checkers instantly. Fast, secure, and reliable service for all networks.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="#products">
                    <Button size="lg" className="gap-2" data-testid="button-browse-products">
                      Browse Products
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/agent/register">
                    <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20" data-testid="button-become-agent">
                      Become an Agent
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              data-testid="button-banner-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              data-testid="button-banner-next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {bannerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentBanner ? "bg-white" : "bg-white/50"
                  }`}
                  data-testid={`button-banner-dot-${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <Tabs defaultValue="data-bundles" className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Our Products</h2>
                <TabsList className="grid w-full sm:w-auto grid-cols-2">
                  <TabsTrigger value="data-bundles" className="gap-2" data-testid="tab-data-bundles">
                    <Smartphone className="h-4 w-4" />
                    Data Bundles
                  </TabsTrigger>
                  <TabsTrigger value="result-checkers" className="gap-2" data-testid="tab-result-checkers">
                    <FileCheck className="h-4 w-4" />
                    Result Checkers
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="data-bundles" className="space-y-6">
                {/* Network Filter */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedNetwork === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedNetwork("all")}
                    data-testid="filter-all-networks"
                  >
                    All Networks
                  </Button>
                  {NETWORKS.map((network) => (
                    <Button
                      key={network.id}
                      variant={selectedNetwork === network.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedNetwork(network.id)}
                      data-testid={`filter-${network.id}`}
                    >
                      {network.name}
                    </Button>
                  ))}
                </div>

                {/* Bundle Cards */}
                {bundlesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <DataBundleCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredBundles && filteredBundles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBundles.map((bundle) => (
                      <DataBundleCard
                        key={bundle.id}
                        bundle={bundle}
                        onPurchase={handlePurchaseBundle}
                      />
                    ))}
                  </div>
                ) : (
                  <NoDataBundles />
                )}
              </TabsContent>

              <TabsContent value="result-checkers" className="space-y-6">
                {checkersLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <ResultCheckerCardSkeleton key={i} />
                    ))}
                  </div>
                ) : resultCheckerStock && resultCheckerStock.length > 0 ? (
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

        {/* Agent CTA */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Become a {APP_NAME} Agent</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your own digital products business. Get your custom storefront, set your own prices, and earn profits on every sale.
            </p>
            <Link href="/agent/register">
              <Button size="lg" className="gap-2" data-testid="button-cta-agent">
                Start Earning Today
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

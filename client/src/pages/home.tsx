import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import banner1 from "@assets/banner1_1765774201032.jpeg";
import banner2 from "@assets/banner2_1765774201033.jpeg";
import banner3 from "@assets/banner3_1765774201030.jpeg";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";
import resultLogo from "@assets/result_1765780772205.jpg";

const bannerImages = [banner1, banner2, banner3];

const products = [
  {
    id: "mtn",
    name: "MTN Data",
    logo: mtnLogo,
    href: "/products/mtn",
    description: "MTN Data Bundles",
  },
  {
    id: "telecel",
    name: "Telecel Data",
    logo: telecelLogo,
    href: "/products/telecel",
    description: "Telecel Data Bundles",
  },
  {
    id: "airteltigo",
    name: "AirtelTigo Data",
    logo: airteltigoLogo,
    href: "/products/airteltigo",
    description: "AirtelTigo Data Bundles",
  },
  {
    id: "result-checkers",
    name: "Result Checkers",
    logo: resultLogo,
    href: "/products/result-checkers",
    description: "BECE & WASSCE",
  },
];

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section with Banner */}
        <section className="relative" data-testid="banner-carousel">
          <div className="relative h-[400px] md:h-[500px]">
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
                <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white" data-testid="text-hero-title">
                  Your Trusted Platform for
                  <span className="text-blue-400"> Digital Products</span>
                </h1>
                <p className="text-lg text-white/90 max-w-2xl mx-auto">
                  Purchase data bundles and WAEC result checkers instantly.
                </p>
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
                  data-testid={`button-banner-dot-${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Products Section - Logo Grid */}
        <section id="products" className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-8">Select a Product</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={product.href}>
                  <Card 
                    className="p-4 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3"
                    data-testid={`card-product-${product.id}`}
                  >
                    <img
                      src={product.logo}
                      alt={product.name}
                      className="w-20 h-20 md:w-24 md:h-24 object-contain rounded-lg"
                      data-testid={`img-product-${product.id}`}
                    />
                    <p className="text-sm font-medium text-center text-muted-foreground">
                      {product.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Agent CTA */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Become a {APP_NAME} Agent</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your own digital products business. Get your custom storefront and earn profits on every sale.
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

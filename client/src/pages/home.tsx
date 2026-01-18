import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hero } from "@/components/ui/hero";
import { Stats } from "@/components/ui/stats";
import { Features } from "@/components/ui/features";
import { CTA } from "@/components/ui/cta";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  Zap,
  Shield,
  Headphones,
  DollarSign,
  Users,
  Smartphone,
  CheckCircle,
  Award
} from "lucide-react";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";
import resultLogo from "@assets/result_1765780772205.jpg";
import banner1 from "@assets/banner1_1765774201032.jpeg";
import banner2 from "@assets/banner2_1765774201033.jpeg";
import banner3 from "@assets/banner3_1765774201030.jpeg";
import { OrderTracker } from "@/components/order-tracker";

const bannerImages = [banner1, banner2, banner3];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  // Product categories for homepage
  const productCategories = [
    {
      id: "mtn",
      title: "MTN Data Bundles",
      description: "Fast & reliable MTN data packages",
      icon: () => (
        <img
          src={mtnLogo}
          alt="MTN"
          className="w-8 h-8 object-contain"
        />
      ),
      color: "bg-gradient-to-br from-yellow-400 to-orange-500"
    },
    {
      id: "telecel",
      title: "Telecel Data Bundles",
      description: "Affordable Telecel data solutions",
      icon: () => (
        <img
          src={telecelLogo}
          alt="Telecel"
          className="w-8 h-8 object-contain"
        />
      ),
      color: "bg-gradient-to-br from-blue-400 to-blue-600"
    },
    {
      id: "at_bigtime",
      title: "AT BIG TIME Bundles",
      description: "High-speed AirtelTigo bundles",
      icon: () => (
        <img
          src={airteltigoLogo}
          alt="AirtelTigo"
          className="w-8 h-8 object-contain"
        />
      ),
      color: "bg-gradient-to-br from-red-400 to-red-600"
    },
    {
      id: "at_ishare",
      title: "AT iShare Bundles",
      description: "Flexible AirtelTigo iShare plans",
      icon: () => (
        <img
          src={airteltigoLogo}
          alt="AirtelTigo"
          className="w-8 h-8 object-contain"
        />
      ),
      color: "bg-gradient-to-br from-purple-400 to-purple-600"
    },
    {
      id: "waec-result-checker",
      title: "WAEC Result Checker",
      description: "Instant BECE & WASSCE results",
      icon: () => (
        <img
          src={resultLogo}
          alt="WAEC"
          className="w-8 h-8 object-contain"
        />
      ),
      color: "bg-gradient-to-br from-green-400 to-green-600"
    },
  ];

  // Features for homepage
  const features = [
    {
      id: "instant-delivery",
      title: "Instant Delivery",
      description: "Get your data bundles delivered instantly after payment",
      icon: Zap,
      color: "bg-gradient-to-br from-yellow-400/10 to-orange-500/10"
    },
    {
      id: "secured-payment",
      title: "100% Secure Payment",
      description: "Bank-grade security with encrypted transactions",
      icon: Shield,
      color: "bg-gradient-to-br from-green-400/10 to-green-600/10"
    },
    {
      id: "customer-support",
      title: "24/7 Support",
      description: "Round-the-clock customer support for all your needs",
      icon: Headphones,
      color: "bg-gradient-to-br from-blue-400/10 to-blue-600/10"
    },
    {
      id: "best-prices",
      title: "Best Market Prices",
      description: "Competitive pricing with exclusive agent discounts",
      icon: DollarSign,
      color: "bg-gradient-to-br from-purple-400/10 to-purple-600/10"
    },
  ];

  // Stats
  const stats = [
    { label: "Happy Customers", value: "50K+", icon: Users },
    { label: "Data Bundles Sold", value: "1M+", icon: Smartphone },
    { label: "Success Rate", value: "99.9%", icon: CheckCircle },
    { label: "Years of Service", value: "5+", icon: Award },
  ];

  const getAgentCtaLink = () => {
    if (!isAuthenticated || !user) return "/agent/register";
    if (user.role === "agent" || user.role === "dealer" || user.role === "super_dealer") return "/agent/dashboard";
    return "/agent/register";
  };

  const getAgentCtaText = () => {
    if (!isAuthenticated || !user) return "Become an Agent";
    if (user.role === "agent" || user.role === "dealer" || user.role === "super_dealer") return "Go to Dashboard";
    return "Become an Agent";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <Hero
          title={
            <span className="text-xl md:text-4xl lg:text-5xl font-bold text-center block">
              Your Trusted Platform for Digital{" "}
              <span className="text-blue-600">Products</span>
            </span>
          }
          description="Purchase data bundles and WAEC result checkers instantly with secure payments and instant delivery."
          primaryButton={{
            text: "Browse Products",
            href: "/data-bundles",
            icon: ArrowRight,
            className: "bg-yellow-500 hover:bg-yellow-600 dark:text-white text-black"
          }}
          images={bannerImages}
          showNavigation={false}
          background="gradient"
          size="lg"
        />

        {/* Product Categories Section */}
        <section id="products" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Our Products</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Choose Your Network
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Select from our wide range of data bundles and result checkers from all major networks
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {productCategories.map((cat) => (
                <Link key={cat.id} href={`/products/${cat.id}`}>
                  <Card className="group h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 dark:border-white shadow-md bg-card">
                    <CardContent className="p-2 text-center">
                      <div className="w-full h-32 mx-auto mb-1 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <cat.icon />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {cat.description}
                      </p>
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-primary mx-auto" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Stats Section - moved here */}
            <Stats
              stats={stats}
            />
          </div>
        </section>

        {/* Features Section */}
        <Features
          title="Experience Excellence"
          subtitle="Why Choose Us"
          description="We're committed to providing the best digital product experience with top-notch service"
          columns={2}
          className="py-0"
          features={features}
          variant="cards"
          background="muted"
        />

        {/* Order Tracking Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-4">Track Orders</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Never Lose Track
              </h2>
              <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                Easily track your data bundle and result checker orders using your transaction ID or beneficiary phone number.
              </p>
              <OrderTracker />
            </div>
          </div>
        </section>

        {/* Agent CTA Section */}
        <CTA
          title="Start Your Own Business"
          subtitle="Become an Agent"
          description="Join thousands of successful agents earning commissions. Get your custom storefront and start selling digital products today."
          primaryButton={{
            text: getAgentCtaText(),
            href: getAgentCtaLink(),
            icon: ArrowRight
          }}
          background="gradient"
          size="lg"
        />
      </main>

      <Footer />
    </div>
  );
}

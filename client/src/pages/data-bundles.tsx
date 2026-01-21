import { Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import banner1 from "@assets/banner1_1765774201032.jpeg";
import banner2 from "@assets/banner2_1765774201033.jpeg";
import banner3 from "@assets/banner3_1765774201030.jpeg";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";

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
    id: "at_bigtime",
    name: "AT BIG TIME Data",
    logo: airteltigoLogo,
    href: "/products/at_bigtime",
    description: "AT BIG TIME Data Bundles",
  },
  {
    id: "at_ishare",
    name: "AT iShare Data",
    logo: airteltigoLogo,
    href: "/products/at_ishare",
    description: "AT iShare Data Bundles",
  },
];

export default function DataBundlesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16">
        {/* Products Section - Logo Grid */}
        <section id="products" className="py-12 px-4">
          <div className="container mx-auto max-w-4xl space-y-8">
            <h2 className="text-2xl font-bold text-center">Select a Data Bundle</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {products.map((product) => (
                <Link key={product.id} href={product.href}>
                  <Card
                    className="p-0.5 md:p-1 hover-elevate cursor-pointer transition-all aspect-square flex flex-col items-center justify-center gap-3 dark:border-2 dark:border-white"
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
      </main>

      <Footer />
    </div>
  );
}
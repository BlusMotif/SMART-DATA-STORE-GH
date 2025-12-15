import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ResultCheckerCard, ResultCheckerCardSkeleton } from "@/components/products/result-checker-card";
import { Button } from "@/components/ui/button";
import { NoResultCheckers } from "@/components/ui/empty-state";
import { ArrowLeft } from "lucide-react";
import resultLogo from "@assets/result_1765780772205.jpg";

interface ResultCheckerStock {
  type: string;
  year: number;
  price: number;
  stock: number;
}

export default function ResultCheckersPage() {
  const { data: resultCheckerStock, isLoading } = useQuery<ResultCheckerStock[]>({
    queryKey: ["/api/products/result-checkers/stock"],
  });

  const handlePurchaseChecker = (type: string, year: number) => {
    window.location.href = `/checkout/result-checker/${type}/${year}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link href="/">
            <Button variant="ghost" className="gap-2 mb-6" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <img
              src={resultLogo}
              alt="Result Checkers"
              className="w-16 h-16 object-contain rounded-lg"
              data-testid="img-result-logo"
            />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">
                WAEC Result Checkers
              </h1>
              <p className="text-muted-foreground">
                BECE & WASSCE result checker PINs
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <ResultCheckerCardSkeleton key={i} />
              ))}
            </div>
          ) : resultCheckerStock && resultCheckerStock.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { Link } from "wouter";
import { getAgentId } from "@/lib/store-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { UnifiedResultCheckerFlow } from "@/components/products/unified-result-checker-flow";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import resultLogo from "@assets/result_1765780772205.jpg";

export default function ResultCheckersPage() {
  // Get agent slug from URL
  const agentSlug = new URLSearchParams(window.location.search).get("agent");

  const agentStore = typeof window !== "undefined" ? getAgentId() : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 px-4 pt-16">
        <div className="container mx-auto max-w-4xl">
          <Link href={agentStore ? `/store/${agentStore}` : "/"}>
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
                Complete your purchase in one easy flow
              </p>
            </div>
          </div>

          {/* Unified Purchase Flow - All in one place */}
          <UnifiedResultCheckerFlow agentSlug={agentSlug} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

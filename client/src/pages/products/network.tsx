import { useParams, Link } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { NetworkPrefixRules } from "@/components/ui/network-prefix-rules";
import { UnifiedPurchaseFlow } from "@/components/products/unified-purchase-flow";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";

const networkInfo: Record<string, { name: string; logo: string }> = {
  mtn: { name: "MTN", logo: mtnLogo },
  telecel: { name: "Telecel", logo: telecelLogo },
  airteltigo: { name: "AirtelTigo", logo: airteltigoLogo },
};

export default function NetworkProductsPage() {
  const { network } = useParams<{ network: string }>();
  const info = networkInfo[network || ""] || { name: "Unknown", logo: "" };
  
  // Get agent slug from URL
  const agentSlug = new URLSearchParams(window.location.search).get("agent");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link href="/">
            <Button variant="ghost" className="gap-2 mb-6" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-8">
            {info.logo && (
              <img
                src={info.logo}
                alt={info.name}
                className="w-16 h-16 object-contain rounded-lg"
                data-testid="img-network-logo"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-network-name">
                {info.name} Data Bundles
              </h1>
              <p className="text-muted-foreground">
                Complete your purchase in one easy flow
              </p>
            </div>
          </div>

          {/* Unified Purchase Flow - All in one place */}
          <UnifiedPurchaseFlow network={network || ""} agentSlug={agentSlug} />

          {/* Data Delivery Information */}
          <div className="mt-12 space-y-6">
            {/* Network Prefix Rules */}
            <NetworkPrefixRules />

            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Data Delivery Time</h3>
                  <p className="text-muted-foreground">
                    Data takes between 10 to 30 minutes — maximum 60 minutes (1 hour) — to be credited.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-orange-900 dark:text-orange-100">
                    Our DATA REQUEST DOES NOT support:
                  </h3>
                  <ul className="text-muted-foreground space-y-1 ml-4">
                    <li>• Turbonet SIM</li>
                    <li>• Merchant SIM</li>
                    <li>• EVD SIM</li>
                    <li>• Broadband SIM</li>
                    <li>• Blacklisted SIM</li>
                    <li>• Roaming SIM</li>
                    <li>• Different Network</li>
                    <li>• Wrong Number</li>
                    <li>• Inactive Number</li>
                  </ul>
                  <p className="text-orange-800 dark:text-orange-200 font-medium mt-3">
                    Important Notice: Any data transferred to the above SIM types is burnt and irreversible.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

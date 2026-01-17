import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function MasterPricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: pricing, isLoading } = useQuery({
    queryKey: ["/api/master/pricing"],
    queryFn: () => apiRequest("/api/master/pricing"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Master Pricing Plans</h2>
          <p className="mt-2 text-lg text-gray-600">
            Enterprise-level plans for complete system management
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pricing?.plans?.map((plan: any) => (
            <Card
              key={plan.id}
              className={`relative ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.recommended && (
                    <Badge variant="default">Recommended</Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">GH₵{plan.price}</span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6"
                  variant={selectedPlan === plan.id ? "default" : "outline"}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPlan && (
          <div className="mt-12 text-center">
            <Button size="lg" className="px-8">
              Upgrade to Selected Plan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
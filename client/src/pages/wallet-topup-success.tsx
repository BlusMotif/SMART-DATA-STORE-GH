import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Loader2, CheckCircle, XCircle, Wallet } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function WalletTopupSuccessPage() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const reference = searchParams.get("reference");
  const queryClient = useQueryClient();
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  const { data: verificationResult, isLoading, error } = useQuery({
    queryKey: [`/api/wallet/topup/verify/${reference}`],
    queryFn: () => apiRequest(`/api/wallet/topup/verify/${reference}`),
    enabled: !!reference,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Stop refetching if successful or after 10 attempts
      if (data?.success || verificationAttempts >= 10) {
        return false;
      }
      setVerificationAttempts((prev) => prev + 1);
      return 3000; // Retry every 3 seconds
    },
  });

  useEffect(() => {
    if (verificationResult?.success) {
      // Invalidate stats query to refresh wallet balance
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    }
  }, [verificationResult, queryClient]);

  if (!reference) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-6 w-6" />
                ❌ Invalid Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No transaction reference found. This page requires a valid payment reference to verify your wallet top-up.
              </p>
              <Button onClick={() => setLocation("/user/wallet")} className="w-full">
                Go to Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || (!verificationResult && verificationAttempts < 10)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                🔄 Verifying Payment...
              </CardTitle>
              <CardDescription>
                Attempt {verificationAttempts + 1} of 10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Please wait while we confirm your payment with Paystack. This usually takes a few seconds.
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-muted-foreground">Verifying transaction with Paystack...</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-muted rounded-full" />
                  <span className="text-muted-foreground">Updating wallet balance...</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                🛡️ Don't close this page until verification is complete
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !verificationResult?.success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-6 w-6" />
                ❌ Payment Verification Failed
              </CardTitle>
              <CardDescription>
                Transaction reference: {reference}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {verificationResult?.message || "We couldn't verify your payment. If you were charged, please contact support with the transaction reference above."}
              </p>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">ℹ️ What to do next:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Check your email for payment confirmation</li>
                  <li>Wait a few minutes and check your wallet balance</li>
                  <li>Contact support if funds were deducted</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => setLocation("/user/wallet")} className="w-full">
                  Check Wallet Balance
                </Button>
                <Button variant="outline" onClick={() => {
                  const agentStore = localStorage.getItem("agentStore");
                  setLocation(agentStore ? `/store/${agentStore}` : "/");
                }}>
                  {localStorage.getItem("agentStore") ? "Return to Store" : "Return Home"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Top-up Successful!
            </CardTitle>
            <CardDescription>
              Your wallet has been credited
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Amount Added:</span>
                <span className="text-lg font-bold text-green-600">
                  GH₵{verificationResult.amount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Balance:</span>
                <span className="text-xl font-bold text-primary">
                  GH₵{verificationResult.newBalance}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                ✓ Payment verified successfully
              </p>
              <p className="text-sm text-muted-foreground">
                ✓ Wallet balance updated
              </p>
              <p className="text-sm text-muted-foreground">
                ✓ Ready for instant purchases
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => {
                const agentStore = localStorage.getItem("agentStore");
                setLocation(agentStore ? `/store/${agentStore}` : "/");
              }} className="w-full">
                <Wallet className="w-4 h-4 mr-2" />
                {localStorage.getItem("agentStore") ? "Back to Store" : "Start Shopping"}
              </Button>
              <Button variant="outline" onClick={() => {
                const agentStore = localStorage.getItem("agentStore");
                if (agentStore) {
                  setLocation(`/store/${agentStore}`);
                } else {
                  setLocation("/user/dashboard");
                }
              }}>
                {localStorage.getItem("agentStore") ? "Continue Shopping" : "View Dashboard"}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Reference: {reference}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

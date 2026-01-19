import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Loader2, CheckCircle, XCircle, Wallet } from "lucide-react";

interface WalletTopupVerifyResponse {
  success: boolean;
  message?: string;
  amount?: number;
  newBalance?: number;
}

interface WalletTopupSuccessViewProps {
  reference: string | null;
  agent: any;
  authLoading: boolean;
  attempts: number;
  query: {
    data?: WalletTopupVerifyResponse;
    isLoading: boolean;
    isError: boolean;
  };
  setLocation: (path: string) => void;
}

export function WalletTopupSuccessView({
  reference,
  agent,
  authLoading,
  attempts,
  query,
  setLocation,
}: WalletTopupSuccessViewProps) {
  const { data: verificationResult, isLoading, isError } = query;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Restoring Session
              </h2>
              <p className="text-muted-foreground">
                Please wait while we verify your authentication.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!reference) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-6 w-6" />
                Invalid Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                No transaction reference was found.
              </p>
              <Button
                onClick={() => setLocation("/user/wallet")}
                className="w-full"
              >
                Go to Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || (!verificationResult && attempts < 10)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                Verifying Payment
              </CardTitle>
              <CardDescription>
                Attempt {attempts + 1} of 10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !verificationResult?.success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-6 w-6" />
                Payment Verification Failed
              </CardTitle>
              <CardDescription>
                Reference: {reference}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {verificationResult?.message ??
                  "We could not verify your payment."}
              </p>

              <Button
                className="w-full"
                onClick={() =>
                  agent
                    ? setLocation("/agent/wallet")
                    : setLocation("/user/wallet")
                }
              >
                Check Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /**
   * SUCCESS
   */
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Top-up Successful
            </CardTitle>
            <CardDescription>
              Your wallet has been credited
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between">
                <span>Amount Added</span>
                <span className="font-bold">
                  GH₵{verificationResult.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>New Balance</span>
                <span className="font-bold">
                  GH₵{verificationResult.newBalance}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                agent
                  ? setLocation("/agent/dashboard")
                  : setLocation("/user/dashboard")
              }
            >
              <Wallet className="w-4 h-4 mr-2" />
              Continue
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Reference: {reference}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
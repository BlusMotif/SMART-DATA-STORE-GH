import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Loader2, XCircle, AlertCircle } from "lucide-react";
import siteLogo from "@assets/logo_1765774201026.png";
import { APP_NAME } from "@/lib/constants";

export default function AgentActivationCompletePage() {
  const [status, setStatus] = useState<"processing" | "success" | "failed" | "cancelled">("processing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [agentEmail, setAgentEmail] = useState<string>("");

  useEffect(() => {
    // Get reference from URL
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");

    if (!reference) {
      setStatus("failed");
      return;
    }

    // Verify payment status
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await response.json();

        if (data.status === "success") {
          setStatus("success");
          // Store agent email for display
          if (data.data?.user?.email) {
            setAgentEmail(data.data.user.email);
          }
        } else if (data.status === "cancelled") {
          setStatus("cancelled");
          setErrorMessage(data.message || "Payment was cancelled");
        } else {
          setStatus("failed");
          setErrorMessage(data.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setErrorMessage("Network error. Please check your connection and try again.");
      }
    };

    // Wait 3 seconds before verifying to allow webhook to process
    setTimeout(() => {
      verifyPayment();
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background px-4 py-6">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-xl border-2">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={siteLogo} alt="Logo" className="h-16 w-auto object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold">Agent Activation</CardTitle>
            <CardDescription>
              Processing your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === "processing" && (
              <Alert className="bg-blue-50 border-blue-200">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <AlertTitle className="text-blue-900">Processing Payment...</AlertTitle>
                <AlertDescription className="text-blue-800">
                  Please wait while we verify your payment. This may take a few moments.
                </AlertDescription>
              </Alert>
            )}

            {status === "success" && (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertTitle className="text-green-900 text-lg font-semibold">🎉 Account Activated Successfully!</AlertTitle>
                  <AlertDescription className="text-green-800 space-y-3 mt-2">
                    <p className="font-semibold">
                      Congratulations! Your agent account has been successfully created and activated.
                    </p>
                    
                    <div className="bg-white/50 p-3 rounded-md border border-green-300">
                      <p className="font-semibold text-sm mb-2">✉️ Account Details:</p>
                      {agentEmail && (
                        <p className="text-sm">
                          <span className="font-medium">Email:</span> {agentEmail}
                        </p>
                      )}
                      <p className="text-sm mt-1 text-green-900">
                        Please use your registration email and password to login.
                      </p>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p className="font-semibold">🚀 What's next?</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Login to access your agent dashboard</li>
                        <li>Set up your storefront preferences</li>
                        <li>Start selling and earning commissions</li>
                        <li>Share your storefront URL with customers</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-4">
                  <Link href="/login">
                    <Button className="w-full" size="lg">
                      Login to Your Dashboard
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Use your email and password to access your account
                  </p>
                </div>
              </>
            )}

            {status === "cancelled" && (
              <>
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <AlertTitle className="text-amber-900 text-lg font-semibold">Payment Cancelled</AlertTitle>
                  <AlertDescription className="text-amber-800">
                    <p className="font-semibold">{errorMessage || "You cancelled the payment."}</p>
                    <p className="mt-2">
                      Your registration was not completed because payment was cancelled. 
                      No charges have been made to your account.
                    </p>
                    <p className="mt-2 text-sm">
                      You can try again whenever you're ready to complete your agent registration.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Link href="/agent/register" className="flex-1">
                    <Button className="w-full">
                      Try Again
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {status === "failed" && (
              <>
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <AlertTitle className="text-red-900 text-lg font-semibold">Activation Failed</AlertTitle>
                  <AlertDescription className="text-red-800">
                    <p className="font-semibold">{errorMessage || "We couldn't verify your payment."}</p>
                    <p className="mt-2">This could be due to:</p>
                    <ul className="list-disc list-inside mt-2 ml-2 space-y-1 text-sm">
                      <li>Payment failed to process</li>
                      <li>Network connection issues</li>
                      <li>Invalid payment reference</li>
                    </ul>
                    <p className="mt-3 text-sm font-semibold">
                      Please try registering again or contact support if you were charged.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Link href="/agent/register" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Try Again
                    </Button>
                  </Link>
                  <Link href="/" className="flex-1">
                    <Button className="w-full">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

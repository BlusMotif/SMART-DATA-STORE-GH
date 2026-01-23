import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/loading-spinner";
import { formatCurrency, formatDate } from "@/lib/constants";
import { CheckCircle, XCircle, Clock, Copy, ArrowRight, Home, Phone as PhoneIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";
import type { Transaction } from "@shared/schema";

export default function CheckoutSuccessPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const params = new URLSearchParams(search);
  const reference = params.get("reference");
  const paystackReference = params.get("trxref"); // Paystack adds this
  const paystackStatus = params.get("status"); // Paystack payment status

  // Function to get the return URL
  const getReturnUrl = () => {
    try {
      const agentStorefront = localStorage.getItem("agentStorefront");
      if (agentStorefront) {
        const { role, slug, network } = JSON.parse(agentStorefront);
        localStorage.removeItem("agentStorefront"); // Clear after reading
        return `/store/${role}/${slug}/${network}`;
      }
    } catch (e) {
      console.error("Failed to parse agentStorefront:", e);
    }
    return "/";
  };

  // Function to get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return "/";
    if (user.role === "agent" || user.role === "dealer" || user.role === "super_dealer") {
      return `/${user.role}/dashboard`;
    }
    return "/user/dashboard";
  };

  // Determine if this was an agent storefront purchase
  const isAgentStorefrontPurchase = () => {
    try {
      const agentStorefront = localStorage.getItem("agentStorefront");
      return !!agentStorefront;
    } catch {
      return false;
    }
  };

  const [verificationComplete, setVerificationComplete] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(paystackStatus === "failed" || paystackStatus === "cancelled");

  const { data: verifyResult, isLoading, error } = useQuery<{ success: boolean; transaction: Transaction }>({
    queryKey: [`/api/transactions/verify/${reference || paystackReference}`],
    queryFn: async () => {
      const response = await fetch(`/api/transactions/verify/${reference || paystackReference}`, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        cache: 'no-store',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.message || `API request failed: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!(reference || paystackReference) && !paymentFailed,
    retry: 1,
    retryDelay: 1000,
  });

  // Mark verification as complete once we get data
  useEffect(() => {
    if (verifyResult) {
      setVerificationComplete(true);
      if (verifyResult.success === false) {
        setPaymentFailed(true);
      }
    }
  }, [verifyResult]);

  const transaction = verifyResult?.transaction;

  // Show loading while authentication is being restored
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <PageLoader />
              <h2 className="text-xl font-semibold mb-2 mt-4">Restoring Session</h2>
              <p className="text-muted-foreground">Please wait while we verify your authentication...</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Details copied to clipboard",
    });
  };

  if (!reference && !paystackReference) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Request</h2>
              <p className="text-muted-foreground mb-4">No transaction reference provided.</p>
              <Button onClick={() => {
                const agentStore = localStorage.getItem("agentStore");
                setLocation(agentStore ? `/store/agent/${agentStore}` : "/");
              }} data-testid="button-go-home">
                {localStorage.getItem("agentStore") ? "Back to Store" : "Go to Home"}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Show payment failed state if Paystack indicates failure
  if (paymentFailed) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Payment {paystackStatus === "cancelled" ? "Cancelled" : "Failed"}</h2>
              <p className="text-muted-foreground mb-4">
                {paystackStatus === "cancelled" 
                  ? "You cancelled the payment. No charges were made to your account."
                  : "Your payment could not be processed. Please try again."}
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => {
                  const agentStore = localStorage.getItem("agentStore");
                  setLocation(agentStore ? `/store/agent/${agentStore}` : "/");
                }}>
                  {localStorage.getItem("agentStore") ? "Back to Store" : "Go to Home"}
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Show success immediately and verify in background
  const statusConfig = {
    completed: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      title: "Payment Successful!",
      description: verificationComplete ? "Your transaction has been completed successfully." : "Verifying transaction...",
    },
    pending: {
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      title: "Payment Processing",
      description: "Your payment is being processed. Please wait...",
    },
    failed: {
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/30",
      title: "Payment Failed",
      description: "Your payment could not be processed. Please try again.",
    },
  };

  const status = (transaction?.status as keyof typeof statusConfig) || (paystackStatus === "success" ? "completed" : "pending");
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12 px-4 pt-16">
        <div className="container mx-auto max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${config.bgColor} mx-auto mb-4`}>
                <StatusIcon className={`h-8 w-8 ${config.color}`} />
              </div>
              <CardTitle className="text-2xl" data-testid="text-status-title">{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!verificationComplete && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-800 dark:text-blue-300">Verifying transaction details...</p>
                </div>
              )}
              {transaction && (
                <>
                  <div className="bg-muted/80 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Transaction ID</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono" data-testid="text-transaction-id">{transaction.id}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(transaction.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Reference</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono" data-testid="text-reference">{transaction.reference}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(transaction.reference)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Product</span>
                      <span className="text-sm font-medium" data-testid="text-product">{transaction.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="text-sm font-medium" data-testid="text-amount">{formatCurrency(transaction.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm font-medium">{transaction.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Date</span>
                      <span className="text-sm">{formatDate(transaction.createdAt)}</span>
                    </div>
                  </div>

                  {/* Bulk Order Phone Numbers */}
                  {(transaction as any).isBulkOrder && (transaction as any).phoneNumbers && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4" />
                          Bulk Order Recipients ({((transaction as any).phoneNumbers as string[]).length})
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => copyToClipboard(((transaction as any).phoneNumbers as string[]).join('\n'))}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy All
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {((transaction as any).phoneNumbers as string[]).map((phone: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 bg-white dark:bg-black rounded px-2 py-1">
                            <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                            <code className="font-mono">{phone}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {status === "completed" && transaction.type === "result_checker" && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">Download Your Result Checker</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                        Your result checker has been purchased successfully. Download your PDF credentials below.
                      </p>
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `/api/result-checker/${transaction.id}/pdf`;
                          link.download = `${transaction.productName.replace(/\s+/g, '-')}-${transaction.reference}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="w-full gap-2"
                        data-testid="button-download-pdf"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF Credentials
                      </Button>
                    </div>
                  )}

                  {status === "completed" && transaction.type === "data_bundle" && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Your data bundle has been delivered to <strong>{transaction.customerPhone}</strong>. 
                        You should receive an SMS confirmation shortly.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col gap-3">
                {isAgentStorefrontPurchase() ? (
                  <Button onClick={() => setLocation(getReturnUrl())} className="gap-2" data-testid="button-continue-shopping">
                    Continue Shopping
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => setLocation(getDashboardUrl())} className="gap-2" data-testid="button-continue-dashboard">
                    Continue to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

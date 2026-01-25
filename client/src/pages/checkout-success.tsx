import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/loading-spinner";
import { formatCurrency, formatDate } from "@/lib/constants";
import { CheckCircle, XCircle, Clock, Copy, ArrowRight, Phone as PhoneIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
  const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);

  const { data: verifyResult } = useQuery<{ success: boolean; transaction: Transaction }>({
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

  // Auto-download result checker PDF when verification completes
  useEffect(() => {
    console.log("=== Auto-download effect triggered ===");
    console.log("hasTransaction:", !!transaction);
    console.log("verificationComplete:", verificationComplete);
    console.log("authLoading:", authLoading);
    console.log("hasUser:", !!user);
    console.log("transactionType:", transaction?.type);
    console.log("transactionId:", transaction?.id);
    console.log("autoDownloadTriggered:", autoDownloadTriggered);

    // Remove user requirement - rely on credentials in the request
    if (
      transaction &&
      verificationComplete &&
      transaction.type === "result_checker" &&
      transaction.id &&
      !autoDownloadTriggered
    ) {
      console.log("✅ All conditions met! Triggering auto-download for result checker");
      setAutoDownloadTriggered(true);
      
      // Auto-download after a brief delay for better UX
      const timer = setTimeout(async () => {
        try {
          console.log("🔍 Fetching PDF for guest download...");
          
          // Use guest-accessible endpoint with transaction reference
          // No authentication required - validates via reference
          const response = await fetch(`/api/result-checker/download/${transaction.reference}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/pdf',
            },
          });

          if (!response.ok) {
            console.warn("PDF not ready yet, status:", response.status);
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error("PDF error:", errorData);
            
            toast({
              title: "PDF Not Ready",
              description: errorData.error || "Please click the download button manually",
              variant: "destructive",
            });
            return;
          }

          // Get the PDF blob
          const blob = await response.blob();
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${transaction.productName.replace(/\s+/g, '-')}-${transaction.reference}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Download Started",
            description: "Your result checker credentials are downloading",
          });
          
          console.log("📥 Auto-download triggered successfully");
        } catch (error) {
          console.error("Auto-download failed:", error);
          toast({
            title: "Auto-download Failed",
            description: "Please click the download button manually",
            variant: "destructive",
          });
        }
      }, 2000); // Increased delay to allow auth to settle

      return () => clearTimeout(timer);
    }
  }, [transaction, verificationComplete, autoDownloadTriggered, toast]);

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
      color: "text-white",
      bgColor: "bg-green-500 dark:bg-green-600",
      title: "Payment Successful!",
      description: verificationComplete ? "Your transaction has been completed successfully." : "Verifying transaction...",
    },
    pending: {
      icon: Clock,
      color: "text-white",
      bgColor: "bg-orange-500 dark:bg-orange-600",
      title: "Payment Processing",
      description: "Your payment is being processed. Please wait...",
    },
    failed: {
      icon: XCircle,
      color: "text-white",
      bgColor: "bg-red-500 dark:bg-red-600",
      title: "Payment Failed",
      description: "Your payment could not be processed. Please try again.",
    },
  };

  // Determine effective status based on transaction type
  let effectiveStatus: keyof typeof statusConfig;
  
  if (transaction?.type === "data_bundle" && transaction?.paymentStatus === "paid") {
    // Data bundles: show success when payment is confirmed even if delivery is pending
    effectiveStatus = "completed";
  } else if (transaction?.type === "result_checker" && transaction?.paymentStatus === "paid") {
    // Result checkers: show success when payment is confirmed and item is marked as completed
    effectiveStatus = transaction.status === "completed" ? "completed" : "pending";
  } else {
    // Default: use actual transaction status
    effectiveStatus = (transaction?.status as keyof typeof statusConfig) || (paystackStatus === "success" ? "completed" : "pending");
  }
  
  const status = effectiveStatus;
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
                <div className="bg-blue-500 dark:bg-blue-600 rounded-lg p-4 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <p className="text-sm text-white font-medium">Verifying transaction details...</p>
                </div>
              )}
              {transaction && (
                <>
                  <div className="bg-slate-700 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-white/70">Transaction ID</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white" data-testid="text-transaction-id">{transaction.id}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-white hover:bg-white/20"
                          onClick={() => copyToClipboard(transaction.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-white/70">Reference</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-white" data-testid="text-reference">{transaction.reference}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-white hover:bg-white/20"
                          onClick={() => copyToClipboard(transaction.reference)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-white/70">Product</span>
                      <span className="text-sm font-medium text-white" data-testid="text-product">{transaction.productName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-white/70">Amount</span>
                      <span className="text-sm font-medium text-white" data-testid="text-amount">{formatCurrency(transaction.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-white/70">Phone</span>
                      <span className="text-sm font-medium text-white">{transaction.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-white/70">Date</span>
                      <span className="text-sm text-white">{formatDate(transaction.createdAt)}</span>
                    </div>
                  </div>

                  {/* Bulk Order Phone Numbers */}
                  {(transaction as any).isBulkOrder && (transaction as any).phoneNumbers && (
                    <div className="bg-blue-500 dark:bg-blue-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-white flex items-center gap-2">
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
                          <div key={idx} className="flex items-center gap-2 text-sm text-blue-900 dark:text-white bg-white dark:bg-blue-700 rounded px-2 py-1">
                            <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                            <code className="font-mono">{phone}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {transaction.status === "completed" && transaction.type === "result_checker" && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">Download Your Result Checker</h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                        Your result checker has been purchased successfully. Download your PDF credentials below.
                      </p>
                      <Button
                        onClick={async () => {
                          try {
                            // Use guest-accessible endpoint with transaction reference
                            // No authentication required
                            const response = await fetch(`/api/result-checker/download/${transaction.reference}`, {
                              method: 'GET',
                              credentials: 'include',
                              headers: {
                                'Content-Type': 'application/pdf',
                              },
                            });
                            
                            if (!response.ok) {
                              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                              throw new Error(errorData.error || `Failed to download PDF: ${response.status}`);
                            }
                            
                            // Get the PDF blob
                            const blob = await response.blob();
                            
                            // Create download link
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${transaction.productName.replace(/\s+/g, '-')}-${transaction.reference}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            // Clean up
                            window.URL.revokeObjectURL(url);
                            
                            toast({
                              title: "✅ Downloaded",
                              description: "Your PDF credentials have been downloaded successfully",
                            });
                          } catch (error: any) {
                            console.error("PDF Download error:", error);
                            toast({
                              title: "❌ Download Failed",
                              description: error.message || "Failed to download PDF. Please contact support.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="w-full gap-2 bg-green-400 hover:bg-green-300 text-black border-2 border-green-400 font-semibold"
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
                      <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Order Placed Successfully
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Your data bundle order for <strong>{transaction.customerPhone}</strong> has been placed with our provider.
                        {transaction.deliveryStatus === "processing" && (
                          <span className="block mt-1">
                            ⏳ Delivery in progress - you will receive an SMS confirmation shortly.
                          </span>
                        )}
                        {transaction.deliveryStatus === "delivered" && (
                          <span className="block mt-1">
                            ✓ Delivered! Check your phone for confirmation.
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {isAgentStorefrontPurchase() ? (
                  <Button onClick={() => setLocation(getReturnUrl())} className="gap-2 flex-1" variant="outline" data-testid="button-continue-shopping">
                    Continue Shopping
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => setLocation(getDashboardUrl())} className="gap-2 flex-1" variant="outline" data-testid="button-continue-dashboard">
                    Back to Dashboard
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

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Menu, Search, CheckCircle, XCircle, Clock, Layers, Filter, Download, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useToast } from "@/hooks/use-toast";

const getStatusConfig = (status: string) => {
  // Normalize status to match SkyTech conventions
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case 'completed':
    case 'delivered':
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-white',
        bgColor: 'bg-emerald-600',
        borderColor: 'border-emerald-500',
        label: 'Completed'
      };
    case 'processing':
    case 'pending':
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-white',
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-400',
        label: 'Processing'
      };
    case 'cancelled':
    case 'failed':
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-white',
        bgColor: 'bg-red-600',
        borderColor: 'border-red-500',
        label: status === 'failed' ? 'Failed' : 'Cancelled'
      };
    default:
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-white',
        bgColor: 'bg-slate-600',
        borderColor: 'border-slate-500',
        label: status.charAt(0).toUpperCase() + status.slice(1)
      };
  }
};

const mapProviderStatusToOrderStatus = (providerStatus: string): string => {
  const normalized = providerStatus.toLowerCase();
  if (normalized === "success" || normalized === "delivered") return "completed";
  if (normalized === "failed" || normalized === "cancelled") return "failed";
  if (normalized === "pending" || normalized === "processing") return "processing";
  return normalized;
};

export default function UserHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  // Helper to extract SkyTech status from API response for real-time tracking
  const getSkytechStatus = (transaction: any): string | null => {
    try {
      if (!transaction.apiResponse) return null;
      const apiResponse = JSON.parse(transaction.apiResponse);
      
      // Check for latest status check
      if (apiResponse.skytechStatus?.status) {
        return apiResponse.skytechStatus.status;
      }
      
      // Check for initial response
      if (apiResponse.results && apiResponse.results[0]?.status) {
        return apiResponse.results[0].status;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const data = await apiRequest("/api/transactions");
      console.log('[User History] Fetched transactions:', data);
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds - optimized for shared hosting
  });

  // Filter transactions
  const filteredTransactions = transactions?.filter((transaction: any) => {
    // Clean up search query - remove # prefix if present
    const cleanSearch = searchQuery.toLowerCase().replace(/^#/, '');
    
    // Check if searching for a sub-item (e.g., "114003-2")
    const subItemMatch = cleanSearch.match(/^(\d+)-(\d+)$/);
    
    const matchesSearch = searchQuery === "" || 
      transaction.productName?.toLowerCase().includes(cleanSearch) ||
      transaction.customerPhone?.includes(cleanSearch) ||
      transaction.reference?.toLowerCase().includes(cleanSearch) ||
      transaction.id?.toLowerCase().includes(cleanSearch) ||
      (subItemMatch && transaction.reference === subItemMatch[1] && transaction.isBulkOrder);
    
    const providerStatus = getSkytechStatus(transaction);
    const effectiveStatus = providerStatus
      ? mapProviderStatusToOrderStatus(providerStatus)
      : transaction.status;
    const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;
    
    const matchesPaymentStatus = paymentStatusFilter === "all" || 
      (transaction.paymentStatus || "pending") === paymentStatusFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  // Flatten bulk orders into individual rows for easy tracking
  const flattenedTransactions = filteredTransactions?.flatMap((transaction: any) => {
    const isBulkOrder = transaction.isBulkOrder;
    const phoneNumbers = transaction.phoneNumbers 
      ? (typeof transaction.phoneNumbers === 'string' 
          ? (() => { try { return JSON.parse(transaction.phoneNumbers); } catch { return []; } })()
          : transaction.phoneNumbers) as Array<{phone: string, bundleName: string, dataAmount: string, status?: string, price?: number}>
      : undefined;
    
    // If it's a bulk order with phone numbers, split into individual rows
    if (isBulkOrder && phoneNumbers && phoneNumbers.length > 0) {
      const fallbackPrice = parseFloat(transaction.amount) / phoneNumbers.length;
      return phoneNumbers.map((phoneObj: any, index: number) => ({
        ...transaction,
        // Create unique ID for each expanded row
        id: `${transaction.id}-${index}`,
        originalId: transaction.id,
        customerPhone: phoneObj.phone,
        productName: phoneObj.bundleName || transaction.productName,
        dataAmount: phoneObj.dataAmount,
        amount: phoneObj.price ? phoneObj.price.toFixed(2) : fallbackPrice.toFixed(2),
        // Individual item status (if available from API response)
        itemStatus: phoneObj.status || transaction.status,
        isBulkOrder: false, // Mark as non-bulk for display
        isExpandedBulkItem: true, // Flag to identify this is from a bulk order
        bulkOrderIndex: index + 1,
        bulkOrderTotal: phoneNumbers.length,
        originalReference: transaction.reference,
      }));
    }
    
    // Return non-bulk orders as-is
    return [transaction];
  })?.filter((tx: any) => {
    // Post-flattening filter for sub-item search (e.g., "114003-2")
    if (searchQuery) {
      const cleanSearch = searchQuery.toLowerCase().replace(/^#/, '');
      const subItemMatch = cleanSearch.match(/^(\d+)-(\d+)$/);
      if (subItemMatch) {
        const [, baseRef, subIndex] = subItemMatch;
        // Only show the specific sub-item that matches
        if ((tx.reference === baseRef || tx.originalReference === baseRef) && tx.isExpandedBulkItem) {
          return tx.bulkOrderIndex === parseInt(subIndex);
        }
        // Hide non-matching items when searching for sub-item
        return false;
      }
    }
    return true;
  }) || [];

  console.log('[User History] Filtered transactions:', filteredTransactions?.length, 'out of', transactions?.length);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <UserSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-6 h-16 shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation for order history</SheetDescription>
                </VisuallyHidden>
                <UserSidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-xl font-bold">Order History</h1>
              <p className="text-sm text-muted-foreground">View all your transactions</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by product, phone, or reference..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  {flattenedTransactions?.length || 0} order(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : flattenedTransactions && flattenedTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {flattenedTransactions.map((transaction: any) => {
                      const isWalletDeduction = transaction.type === 'wallet_deduction';
                      const providerStatus = getSkytechStatus(transaction);
                      const effectiveStatus = transaction.itemStatus || (providerStatus
                        ? mapProviderStatusToOrderStatus(providerStatus)
                        : transaction.status);
                      const statusConfig = isWalletDeduction 
                        ? {
                            variant: 'destructive' as const,
                            icon: XCircle,
                            color: 'text-white',
                            bgColor: 'bg-red-600',
                            borderColor: 'border-red-500',
                            label: 'Complete'
                          }
                        : getStatusConfig(effectiveStatus);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <div
                          key={transaction.id}
                          className={`p-4 border rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} text-white`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <p className="font-medium text-sm md:text-base text-white">{transaction.productName}</p>
                                <Badge 
                                  variant={
                                    transaction.paymentStatus === 'paid' ? 'default' :
                                    transaction.paymentStatus === 'failed' ? 'destructive' :
                                    transaction.paymentStatus === 'cancelled' ? 'outline' :
                                    'secondary'
                                  } 
                                  className={`flex items-center gap-1 ${
                                    transaction.paymentStatus === 'paid' ? 'bg-green-600 text-white border-green-500' :
                                    transaction.paymentStatus === 'failed' ? 'bg-red-700 text-white border-red-600' :
                                    transaction.paymentStatus === 'cancelled' ? 'bg-orange-600 text-white border-orange-500' :
                                    'bg-yellow-600 text-white border-yellow-500'
                                  }`}
                                >
                                  {transaction.paymentStatus === 'paid' ? '✓ Paid' :
                                   transaction.paymentStatus === 'failed' ? '✗ Payment Failed' :
                                   transaction.paymentStatus === 'cancelled' ? '✗ Cancelled' :
                                   '⏳ Pending Payment'}
                                </Badge>
                                <Badge variant={statusConfig.variant} className="flex items-center gap-1 bg-white text-gray-800">
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                                {transaction.isExpandedBulkItem && (
                                  <Badge variant="secondary" className="flex items-center gap-1 bg-purple-600 text-white border-purple-500">
                                    <Layers className="h-3 w-3" />
                                    {transaction.bulkOrderIndex} of {transaction.bulkOrderTotal}
                                  </Badge>
                                )}
                              </div>

                              <div className="text-xs md:text-sm text-gray-200 space-y-1">
                                <p className="text-gray-200">Phone: {transaction.customerPhone}</p>
                                {transaction.network && <p className="text-gray-200">Network: {transaction.network.toUpperCase()}</p>}
                                <p className="text-xs text-gray-300">Order ID: #{transaction.reference || transaction.originalReference}{transaction.isExpandedBulkItem ? `-${transaction.bulkOrderIndex}` : ''}</p>
                                <p className="text-xs text-gray-300">
                                  {new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString()}
                                </p>
                                {transaction.completedAt && (
                                  <p className="text-green-300 text-xs">
                                    Completed: {new Date(transaction.completedAt).toLocaleDateString()} at {new Date(transaction.completedAt).toLocaleTimeString()}
                                  </p>
                                )}
                                {(() => {
                                  const skytechStatus = getSkytechStatus(transaction);
                                  return skytechStatus ? (
                                    <p className="text-blue-200 text-xs font-semibold" title="Real-time provider status">
                                      Provider Status: {skytechStatus}
                                    </p>
                                  ) : null;
                                })()}
                                {transaction.failureReason && (
                                  <p className="text-red-300 text-xs">Reason: {transaction.failureReason}</p>
                                )}
                              </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <p className="font-medium text-lg text-white">GH₵{transaction.amount}</p>
                              <Badge variant="outline" className="mt-1 bg-white text-gray-800 border-white">
                                {transaction.paymentMethod === 'wallet' ? 'Wallet' : 'MoMo'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No transactions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

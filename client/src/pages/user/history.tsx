import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Menu, Search, CheckCircle, XCircle, Clock, Layers, Filter, Download } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useToast } from "@/hooks/use-toast";

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'Completed'
      };
    case 'pending':
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        label: 'Pending'
      };
    case 'cancelled':
    case 'failed':
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        label: status === 'failed' ? 'Failed' : 'Cancelled'
      };
    default:
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        label: status
      };
  }
};

export default function UserHistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => apiRequest("/api/transactions"),
    refetchInterval: 10000,
  });

  // Filter transactions
  const filteredTransactions = transactions?.filter((transaction: any) => {
    const matchesSearch = searchQuery === "" || 
      transaction.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.customerPhone.includes(searchQuery) ||
      transaction.reference.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
                  {filteredTransactions?.length || 0} transaction(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredTransactions && filteredTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTransactions.map((transaction: any) => {
                      const statusConfig = getStatusConfig(transaction.status);
                      const StatusIcon = statusConfig.icon;
                      const isBulkOrder = transaction.isBulkOrder;
                      const phoneNumbers = transaction.phoneNumbers as Array<{phone: string, bundleName: string, dataAmount: string}> | undefined;

                      return (
                        <div
                          key={transaction.id}
                          className={`p-4 border rounded-lg ${statusConfig.bgColor}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <p className="font-medium text-sm md:text-base">{transaction.productName}</p>
                                <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                                {isBulkOrder && (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    Bulk ({phoneNumbers?.length || 0})
                                  </Badge>
                                )}
                              </div>

                              <div className="text-xs md:text-sm text-gray-600 space-y-1">
                                {isBulkOrder && phoneNumbers ? (
                                  <>
                                    <p className="font-semibold">Recipients: {phoneNumbers.length} numbers</p>
                                    <details className="cursor-pointer">
                                      <summary className="text-blue-600 hover:underline">View all numbers</summary>
                                      <div className="mt-2 ml-2 space-y-1 max-h-32 overflow-y-auto">
                                        {phoneNumbers.map((phoneObj, idx) => (
                                          <p key={idx} className="font-mono text-xs">{idx + 1}. {phoneObj.phone} - {phoneObj.bundleName} ({phoneObj.dataAmount})</p>
                                        ))}
                                      </div>
                                    </details>
                                  </>
                                ) : (
                                  <p>Phone: {transaction.customerPhone}</p>
                                )}
                                {transaction.network && <p>Network: {transaction.network.toUpperCase()}</p>}
                                <p className="text-xs">Ref: {transaction.reference}</p>
                                <p className="text-xs">
                                  {new Date(transaction.createdAt).toLocaleDateString()} at {new Date(transaction.createdAt).toLocaleTimeString()}
                                </p>
                                {transaction.completedAt && (
                                  <p className="text-green-600 text-xs">
                                    Completed: {new Date(transaction.completedAt).toLocaleDateString()} at {new Date(transaction.completedAt).toLocaleTimeString()}
                                  </p>
                                )}
                                {transaction.failureReason && (
                                  <p className="text-red-600 text-xs">Reason: {transaction.failureReason}</p>
                                )}
                              </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <p className="font-medium text-lg">GH₵{transaction.amount}</p>
                              {isBulkOrder && phoneNumbers && (
                                <p className="text-xs text-gray-500">
                                  GH₵{(parseFloat(transaction.amount) / phoneNumbers.length).toFixed(2)} each
                                </p>
                              )}
                              <Badge variant="outline" className="mt-1">
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

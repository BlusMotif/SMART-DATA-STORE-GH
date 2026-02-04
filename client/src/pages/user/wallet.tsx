import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Wallet, TrendingUp, Clock, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Calendar, DollarSign, CreditCard, Menu, Layers } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import { WalletTopup } from "@/components/user/wallet-topup";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Transaction {
  id: string;
  reference: string;
  type: string;
  productName: string;
  amount: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  completedAt: string | null;
}

interface WalletStats {
  walletBalance: string;
  totalTopups: number;
  totalTopupAmount: string;
  totalSpent: string;
  lastTopupDate: string | null;
  lastTopupAmount: string | null;
}

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
        label: status === 'cancelled' ? 'Cancelled' : 'Failed'
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

export default function WalletDashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch wallet stats
  const { data: stats, isLoading: statsLoading } = useQuery<WalletStats>({
    queryKey: ["/api/wallet/stats"],
    queryFn: () => apiRequest("/api/wallet/stats", { disableAutoLogout: true }),
    refetchInterval: 30000, // Refresh every 30 seconds - optimized for shared hosting
  });

  // Fetch all transactions
  const { data: allTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    queryFn: () => apiRequest("/api/transactions", { disableAutoLogout: true }),
    refetchInterval: 30000, // Refresh every 30 seconds - optimized for shared hosting
  });

  // Filter wallet topups
  const walletTopups = allTransactions?.filter(t => t.type === 'wallet_topup') || [];
  
  // Filter wallet payments
  const walletPayments = allTransactions?.filter(t => t.paymentMethod === 'wallet') || [];

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
                  <SheetDescription>Main navigation for your wallet</SheetDescription>
                </VisuallyHidden>
                <UserSidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-xl font-bold">My Wallet</h1>
              <p className="text-sm text-muted-foreground">Manage your wallet balance</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6 mt-4">
        {/* Page Header */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Wallet Overview
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your wallet balance and view transaction history
              </p>
            </div>
            <WalletTopup />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold">GH₵{stats?.walletBalance || '0.00'}</div>
                  <p className="text-xs text-green-100 mt-1">Available to spend</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Topups</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalTopups || 0}</div>
                  <p className="text-xs text-muted-foreground">GH₵{stats?.totalTopupAmount || '0.00'} total</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">GH₵{stats?.totalSpent || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">Via wallet payments</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Topup</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    GH₵{stats?.lastTopupAmount || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.lastTopupDate 
                      ? new Date(stats.lastTopupDate).toLocaleDateString()
                      : 'No topups yet'
                    }
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View your wallet topups and payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="topups">
                  Topups ({walletTopups.length})
                </TabsTrigger>
                <TabsTrigger value="payments">
                  Payments ({walletPayments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : allTransactions && allTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {allTransactions.slice(0, 10).map((transaction) => {
                      const statusConfig = getStatusConfig(transaction.status);
                      const StatusIcon = statusConfig.icon;
                      const isTopup = transaction.type === 'wallet_topup';
                      const isWalletPayment = transaction.paymentMethod === 'wallet';

                      return (
                        <div
                          key={transaction.id}
                          className={`p-4 border rounded-lg ${statusConfig.bgColor} ${statusConfig.borderColor} text-white`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {isTopup ? (
                                  <ArrowUpRight className="h-4 w-4 text-white shrink-0" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-white shrink-0" />
                                )}
                                <p className="font-medium text-sm break-words text-white">
                                  {transaction.productName}
                                </p>
                                <Badge variant={statusConfig.variant} className="ml-auto shrink-0 bg-white text-gray-800">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-200 space-y-1">
                                <p>                                  {isTopup ? 'Topup' : isWalletPayment ? 'Paid with wallet' : 'Paystack'}
                                  {' • '}
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-xs font-mono break-all text-gray-300">Order ID: #{transaction.reference}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-white">
                                {isTopup ? '+' : '-'}GH₵{transaction.amount}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No transactions yet</p>
                    <p className="text-sm text-gray-400 mt-1">Top up your wallet to get started</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="topups">
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : walletTopups.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {walletTopups.map((transaction) => {
                          const statusConfig = getStatusConfig(transaction.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {new Date(transaction.createdAt).toLocaleTimeString()}
                                </span>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                #{transaction.reference}
                              </TableCell>
                              <TableCell>
                                <span className="text-green-600 font-bold">
                                  +GH₵{transaction.amount}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig.variant}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ArrowUpRight className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No topups yet</p>
                    <p className="text-sm text-gray-400 mt-1">Click the "Top Up Wallet" button to add funds</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments">
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : walletPayments.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {walletPayments.map((transaction) => {
                          const statusConfig = getStatusConfig(transaction.status);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                                <br />
                                <span className="text-xs text-gray-500">
                                  {new Date(transaction.createdAt).toLocaleTimeString()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{transaction.productName}</p>
                                  <p className="text-xs text-gray-500 font-mono">
                                    #{transaction.reference}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-blue-600 font-bold">
                                  -GH₵{transaction.amount}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig.variant}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">No wallet payments yet</p>
                    <p className="text-sm text-gray-400 mt-1">Use your wallet to pay for products and see your history here</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
        </main>
      </div>
    </div>
  );
}

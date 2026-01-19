import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgentSidebarV2 as AgentSidebar } from "@/components/layout/agent-sidebar-v2";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Wallet, TrendingUp, Clock, CheckCircle, XCircle, ArrowDownRight, CreditCard, Menu } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { WalletTopup } from "@/components/user/wallet-topup";

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
  balance: string;
  totalTopups: number;
  totalTopupAmount: string;
  totalSpent: string;
  lastTopupDate: string | null;
  lastTopupAmount: string | null;
}

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        label: status === 'completed' ? 'Completed' : 'Delivered'
      };
    case 'confirmed':
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        label: 'Confirmed'
      };
    case 'pending':
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        label: 'Pending'
      };
    case 'failed':
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/30',
        label: 'Failed'
      };
    default:
      return {
        variant: 'outline' as const,
        icon: Clock,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        label: status
      };
  }
};

export default function AgentWalletPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch wallet stats
  const { data: stats, isLoading: statsLoading } = useQuery<WalletStats>({
    queryKey: ["/api/agent/wallet"],
    queryFn: () => apiRequest("/api/agent/wallet", { disableAutoLogout: true }),
    refetchInterval: 30000,
  });

  // Fetch recent transactions (last 10)
  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/agent/transactions"],
    queryFn: () => apiRequest("/api/agent/transactions", { disableAutoLogout: true }),
    refetchInterval: 30000,
    select: (data) => data.slice(0, 10), // Only show 10 most recent
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
        <AgentSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-background">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation for your dashboard</SheetDescription>
          </VisuallyHidden>
          <AgentSidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

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
              <SheetContent side="left" className="p-0 w-64 bg-background">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation for your dashboard</SheetDescription>
                </VisuallyHidden>
                <AgentSidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-xl font-bold">Agent Wallet</h1>
              <p className="text-sm text-muted-foreground">Manage your wallet balance and transactions</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">User Wallet Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    GH₵{user?.walletBalance || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Available for purchases</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agent Profit Balance</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `GH₵${stats?.balance || '0.00'}`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Withdrawable earnings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Top-ups</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      stats?.totalTopups || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Wallet top-up transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `GH₵${stats?.totalSpent || '0.00'}`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Total amount spent</p>
                </CardContent>
              </Card>
            </div>

            {/* Top-up Section */}
            <Card>
              <CardHeader>
                <CardTitle>Top Up User Wallet</CardTitle>
                <CardDescription>Add funds to your user wallet to purchase data bundles and make instant payments</CardDescription>
              </CardHeader>
              <CardContent>
                <WalletTopup />
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest wallet transactions</CardDescription>
                  </div>
                  <Link href="/agent/transactions">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => {
                        const statusConfig = getStatusConfig(transaction.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-mono text-sm">
                              {transaction.reference}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {transaction.type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {transaction.productName}
                            </TableCell>
                            <TableCell className="font-medium tabular-nums">
                              GH₵{transaction.amount}
                            </TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor}`}>
                                <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                                <span className={statusConfig.color}>{statusConfig.label}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions yet. Start by topping up your wallet.
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
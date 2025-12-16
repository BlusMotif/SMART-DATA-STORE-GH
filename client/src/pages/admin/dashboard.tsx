import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader, TableSkeleton } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/constants";
import { DollarSign, ShoppingCart, Users, Wallet, TrendingUp, Package } from "lucide-react";
import type { Transaction } from "@shared/schema";

interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalAgents: number;
  pendingWithdrawals: number;
  todayRevenue: number;
  todayTransactions: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions/recent"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-6">
                      <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                      <div className="h-8 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(stats?.totalRevenue || 0)}
                  icon={DollarSign}
                  description="All time"
                />
                <StatCard
                  title="Total Transactions"
                  value={stats?.totalTransactions || 0}
                  icon={ShoppingCart}
                  description="Completed orders"
                />
                <StatCard
                  title="Active Agents"
                  value={stats?.totalAgents || 0}
                  icon={Users}
                  description="Registered agents"
                />
                <StatCard
                  title="Pending Withdrawals"
                  value={stats?.pendingWithdrawals || 0}
                  icon={Wallet}
                  description="Awaiting approval"
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <TableSkeleton rows={5} />
                  ) : recentTransactions && recentTransactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTransactions.slice(0, 10).map((tx) => (
                          <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                            <TableCell className="font-mono text-sm">{tx.reference}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{tx.productName}</TableCell>
                            <TableCell className="font-medium tabular-nums">{formatCurrency(tx.amount)}</TableCell>
                            <TableCell><StatusBadge status={tx.status} /></TableCell>
                            <TableCell className="text-muted-foreground text-sm">{formatDate(tx.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Today's Revenue</span>
                    </div>
                    <span className="font-bold text-green-700 dark:text-green-400">
                      {formatCurrency(stats?.todayRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">Today's Orders</span>
                    </div>
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {stats?.todayTransactions || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

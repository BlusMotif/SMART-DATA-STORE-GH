import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader, TableSkeleton } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/constants";
import { DollarSign, ShoppingCart, Users, Wallet, TrendingUp, Package, Menu, Trophy, Award, Medal, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderTracker } from "@/components/order-tracker";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";

interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalAgents: number;
  pendingWithdrawals: number;
  pendingAgents: number;
  activationRevenue: number;
  todayRevenue: number;
  todayTransactions: number;
}

interface TopCustomer {
  customerEmail: string;
  customerPhone: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions/recent"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: topCustomers, isLoading: rankingsLoading } = useQuery<TopCustomer[]>({
    queryKey: ["/api/admin/rankings/customers"],
    refetchInterval: 60000, // Refresh every minute
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r transform transition-transform duration-200 ease-in-out">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg lg:text-xl font-semibold">Dashboard</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-4 lg:pt-6">
                      <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                      <div className="h-8 bg-muted rounded w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
                    <div className="overflow-x-auto">
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
                    </div>
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
                  <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-900 dark:text-green-100">Today's Revenue</span>
                    </div>
                    <span className="font-bold text-green-700 dark:text-green-300">
                      {formatCurrency(stats?.todayRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Today's Orders</span>
                    </div>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {stats?.todayTransactions || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-100 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Activation Revenue</span>
                    </div>
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      {formatCurrency(stats?.activationRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Pending Agents</span>
                    </div>
                    <span className="font-bold text-orange-700 dark:text-orange-300">
                      {stats?.pendingAgents || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Customers
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Highest spending customers</p>
                </div>
              </CardHeader>
              <CardContent>
                {rankingsLoading ? (
                  <TableSkeleton rows={5} />
                ) : topCustomers && topCustomers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                          <TableHead className="text-right">Purchases</TableHead>
                          <TableHead className="text-right">Last Purchase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topCustomers.map((customer, index) => (
                          <TableRow key={customer.customerPhone}>
                            <TableCell className="text-center">
                              {getRankIcon(index)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.customerPhone}</span>
                                {customer.customerEmail && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {customer.customerEmail}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(customer.totalSpent)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">
                                {customer.totalPurchases} {customer.totalPurchases === 1 ? 'order' : 'orders'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {formatDate(customer.lastPurchase)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No customer rankings yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* API & Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API & Integrations
              </CardTitle>
              <CardDescription>
                Connect your app, automate actions, and integrate with third-party services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowApiModal(true)}>
                Manage API Keys
              </Button>
            </CardContent>
          </Card>

          {/* Order Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Track Orders</CardTitle>
              <CardDescription>Search and monitor order status across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderTracker />
            </CardContent>
          </Card>
        </main>
      </div>
      <ApiIntegrationsModal open={showApiModal} onOpenChange={setShowApiModal} />
    </div>
  );
}

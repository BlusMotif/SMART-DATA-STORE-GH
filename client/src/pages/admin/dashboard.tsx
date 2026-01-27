import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/constants";
import { DollarSign, ShoppingCart, Users, Wallet, TrendingUp, Package, Menu, Trophy, Award, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderTracker } from "@/components/order-tracker";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";
import { Transaction } from "@shared/schema";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalAgents: number;
  pendingWithdrawals: number;
  pendingAgents: number;
  activationRevenue: number;
  todayRevenue: number;
  todayTransactions: number;
  totalAgentProfits: number;
}

interface TopCustomer {
  customerEmail: string;
  customerPhone: string | null;
  customerName: string | null;
  totalPurchases: number;
  totalSpent: number;
  rank: number;
  lastPurchase: string;
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const { user } = useAuth();
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

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<Array<{ date: string; revenue: number; transactions: number }>>({
    queryKey: ["/api/admin/analytics/revenue"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Format chart data for display
  const chartData = analyticsData ? analyticsData.map(item => ({
    name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    revenue: item.revenue,
    transactions: item.transactions,
  })) : [];

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
            {/* Welcome Message */}
            <Card className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-600 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-full shadow-lg backdrop-blur-sm">
                      <span className="text-3xl animate-bounce">👋</span>
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1 drop-shadow-sm">
                        Welcome back, {user?.name?.toUpperCase() || 'ADMIN'}! 
                      </h2>
                      <p className="text-yellow-100 text-sm lg:text-base font-medium">
                        Here's what's happening with your business today ✨
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-white/90">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">Live Dashboard</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/90">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animate-delay-500"></div>
                          <span className="text-xs font-medium">Real-time Updates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
                      <span className="text-xs text-white font-medium">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-white/80">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                      <span className="text-xs">All systems operational</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
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
                  title="Total Agent Profits"
                  value={formatCurrency(stats?.totalAgentProfits || 0)}
                  icon={TrendingUp}
                  description="Combined agent earnings"
                />
                <StatCard
                  title="Pending Withdrawals"
                  value={stats?.pendingWithdrawals || 0}
                  icon={Wallet}
                  description="Awaiting approval"
                />
              </div>
            )}

            {/* Analytics Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Revenue Analytics
                </CardTitle>
                <CardDescription>Weekly revenue and transaction trends</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
                  </div>
                ) : chartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? formatCurrency(Number(value)) : value,
                            name === 'revenue' ? 'Revenue' : 'Transactions'
                          ]}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-muted-foreground">No analytics data available</div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                            <TableHead>Order ID</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentTransactions.slice(0, 10).map((tx) => (
                            <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                              <TableCell className="font-mono text-sm">{tx.id.slice(0,8)}</TableCell>
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
                  <div className="flex items-center justify-between p-3 bg-green-500 text-white rounded-lg border border-green-600">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-white" />
                      <span className="text-sm font-medium text-white">Today's Revenue</span>
                    </div>
                    <span className="font-bold text-white">
                      {formatCurrency(stats?.todayRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-500 text-white rounded-lg border border-blue-600">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-white" />
                      <span className="text-sm font-medium text-white">Today's Orders</span>
                    </div>
                    <span className="font-bold text-white">
                      {stats?.todayTransactions || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-500 text-white rounded-lg border border-purple-600">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-white" />
                      <span className="text-sm font-medium text-white">Activation Revenue</span>
                    </div>
                    <span className="font-bold text-white">
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
                          <TableRow key={customer.rank}>
                            <TableCell className="text-center">
                              {getRankIcon(index)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {customer.customerName || customer.customerEmail}
                                </span>
                                {customer.customerPhone && (
                                  <span className="text-xs text-muted-foreground">
                                    {customer.customerPhone}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {customer.customerEmail}
                                </span>
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

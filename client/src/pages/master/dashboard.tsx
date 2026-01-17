import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { MasterSidebar } from "@/components/layout/master-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageLoader, TableSkeleton } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/constants";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Wallet,
  ExternalLink,
  ArrowRight,
  Menu,
  Package,
  Code,
  BarChart3,
  Users,
  Target,
  Zap,
  Award,
  Calendar,
  Clock,
  Star,
  Trophy,
  Crown,
  Shield,
  Globe
} from "lucide-react";
import { OrderTracker } from "@/components/order-tracker";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";
import { Agent, Transaction } from "../../../shared/schema.js";

interface MasterStats {
  balance: number;
  totalProfit: number;
  totalSales: number;
  totalTransactions: number;
  todayProfit: number;
  todayTransactions: number;
  networkSize: number;
  superDealerCount: number;
  dealerCount: number;
  agentCount: number;
}

interface MasterProfileResponse {
  profile: Agent & {
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
    profitBalance: number;
    walletBalance: number;
    totalWithdrawals: number;
    role: string;
  };
  stats: any;
}

export default function MasterDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [, setLocation] = useLocation();

  const { data: profileData } = useQuery<MasterProfileResponse>({
    queryKey: ["/api/profile"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const master = profileData?.profile;
  const [location] = useLocation();

  // Redirect to activation if master is not approved
  useEffect(() => {
    if (master && !master.isApproved && location !== "/master/activation-complete") {
      setLocation("/master/activation-complete");
    }
  }, [master?.isApproved, location, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<MasterStats>({
    queryKey: ["/api/master/stats"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/master/transactions/recent"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out">
            <MasterSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <MasterSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold">Master Dashboard</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Welcome back, {master?.user?.name || 'Master'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {master && (
              <a href={`/store/master/${master.storefrontSlug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                  <ExternalLink className="h-4 w-4" />
                  View Store
                </Button>
              </a>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <Card className="bg-card border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      Welcome back, {master?.user?.name?.split(' ')[0] || 'Master'}! 👑
                    </h2>
                    <p className="text-purple-700 dark:text-purple-300 mt-1">
                      Command your empire and shape the future of data distribution
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      <Crown className="h-3 w-3" />
                      {master?.isApproved ? 'Verified Master' : 'Pending Approval'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Empire Balance"
                  value={formatCurrency(stats?.balance || 0)}
                  icon={Wallet}
                  description="Available for withdrawal"
                  trend="+25%"
                  trendLabel="vs last month"
                />
                <StatCard
                  title="Today's Revenue"
                  value={formatCurrency(stats?.todayProfit || 0)}
                  icon={TrendingUp}
                  description={`${stats?.todayTransactions || 0} transactions`}
                  trend="+22%"
                  trendLabel="vs yesterday"
                />
                <StatCard
                  title="Empire Revenue"
                  value={formatCurrency(stats?.totalSales || 0)}
                  icon={DollarSign}
                  description="Total empire sales"
                  trend="+45%"
                  trendLabel="vs last month"
                />
                <StatCard
                  title="Empire Size"
                  value={stats?.networkSize || 0}
                  icon={Globe}
                  description={`${stats?.superDealerCount || 0} super dealers, ${stats?.dealerCount || 0} dealers, ${stats?.agentCount || 0} agents`}
                  trend="+30%"
                  trendLabel="vs last month"
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Empire Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Master Empire Overview
                  </CardTitle>
                  <CardDescription>Your complete network leadership metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Today's Performance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-card rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Today's Earnings</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(stats?.todayProfit || 0)}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {stats?.todayTransactions || 0} empire transactions
                      </p>
                    </div>
                    <div className="p-4 bg-card rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Monthly Target</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                        {formatCurrency((stats?.totalProfit || 0) * 0.6)}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        60% of total profit target
                      </p>
                    </div>
                  </div>

                  {/* Network Hierarchy */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Network Hierarchy
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-card rounded-lg border border-purple-200 dark:border-purple-800">
                        <Crown className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                        <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{stats?.superDealerCount || 0}</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">Super Dealers</p>
                      </div>
                      <div className="text-center p-3 bg-card rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <Award className="h-6 w-6 mx-auto mb-1 text-indigo-600" />
                        <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{stats?.dealerCount || 0}</p>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300">Dealers</p>
                      </div>
                      <div className="text-center p-3 bg-card rounded-lg border border-blue-200 dark:border-blue-800">
                        <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{stats?.agentCount || 0}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Agents</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Link href="/master/bundles/mtn">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Package className="h-4 w-4" />
                          <span className="text-xs">MTN</span>
                        </Button>
                      </Link>
                      <Link href="/master/bundles/telecel">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Package className="h-4 w-4" />
                          <span className="text-xs">Telecel</span>
                        </Button>
                      </Link>
                      <Link href="/master/pricing">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs">Pricing</span>
                        </Button>
                      </Link>
                      <Link href="/master/empire">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Globe className="h-4 w-4" />
                          <span className="text-xs">Empire</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Empire Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <TableSkeleton rows={4} />
                  ) : recentTransactions && recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {recentTransactions.slice(0, 4).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{tx.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              +{formatCurrency(tx.masterProfit || 0)}
                            </p>
                            <StatusBadge status={tx.status} className="text-xs" />
                          </div>
                        </div>
                      ))}
                      <Link href="/master/transactions">
                        <Button variant="ghost" size="sm" className="w-full mt-3">
                          View All Transactions
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                      <p className="text-xs">Start building your empire to see transactions here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Storefront & Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Storefront */}
              {master && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5" />
                      Your Master Storefront
                    </CardTitle>
                    <CardDescription>Showcase your empire leadership and attract super dealers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-card rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{master.businessName}</span>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Master</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Share this link with super dealers and dealers:
                        </p>
                        <code className="text-sm bg-background px-2 py-1 rounded mt-2 inline-block">
                          {window.location.origin}/store/master/{master.storefrontSlug}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store/master/${master.storefrontSlug}`)}
                        >
                          Copy Link
                        </Button>
                        <a href={`/store/master/${master.storefrontSlug}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Visit
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* API & Integrations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Master Tools & API
                  </CardTitle>
                  <CardDescription>Advanced tools for empire management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => setShowApiModal(true)}
                    >
                      <div className="text-left">
                        <div className="font-medium">API Keys</div>
                        <div className="text-xs text-muted-foreground">Bulk operations & integrations</div>
                      </div>
                    </Button>
                    <Link href="/master/settings">
                      <Button variant="outline" className="justify-start h-auto p-4 w-full">
                        <div className="text-left">
                          <div className="font-medium">Settings</div>
                          <div className="text-xs text-muted-foreground">Manage empire & profile</div>
                        </div>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Tracker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Empire Order Tracker
                </CardTitle>
                <CardDescription>Monitor your entire empire's purchase status</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderTracker />
              </CardContent>
            </Card>

            {/* Withdrawal Section */}
            <Card className="bg-card border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                  <Wallet className="h-5 w-5" />
                  Ready to Withdraw Master Profits?
                </CardTitle>
                <CardDescription className="text-purple-700 dark:text-purple-300">
                  Your master profits from the entire empire are waiting for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 tabular-nums">
                      {formatCurrency(stats?.balance || 0)}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Available for withdrawal
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/master/withdrawals">
                      <Button
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        disabled={(stats?.balance || 0) <= 0}
                      >
                        Request Withdrawal
                      </Button>
                    </Link>
                    <Link href="/master/transactions">
                      <Button variant="outline">
                        View History
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-card rounded-lg">
                  <p className="text-xs text-purple-800 dark:text-purple-200 text-center">
                    👑 Master withdrawals require admin approval and are processed within 24-48 hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <ApiIntegrationsModal open={showApiModal} onOpenChange={setShowApiModal} />
    </div>
  );
}

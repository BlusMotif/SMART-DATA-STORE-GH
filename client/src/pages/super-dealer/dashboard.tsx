import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { SuperDealerSidebar } from "@/components/layout/super-dealer-sidebar";
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
  Crown
} from "lucide-react";
import { OrderTracker } from "@/components/order-tracker";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";
import { Agent, Transaction } from "../../../shared/schema.js";

interface SuperDealerStats {
  balance: number;
  totalProfit: number;
  totalSales: number;
  totalTransactions: number;
  todayProfit: number;
  todayTransactions: number;
  networkSize: number;
  dealerCount: number;
}

interface SuperDealerProfileResponse {
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

export default function SuperDealerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [, setLocation] = useLocation();

  const { data: profileData } = useQuery<SuperDealerProfileResponse>({
    queryKey: ["/api/profile"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const superDealer = profileData?.profile;
  const [location] = useLocation();

  // Redirect to activation if super dealer is not approved
  useEffect(() => {
    if (superDealer && !superDealer.isApproved && location !== "/super-dealer/activation-complete") {
      setLocation("/super-dealer/activation-complete");
    }
  }, [superDealer?.isApproved, location, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<SuperDealerStats>({
    queryKey: ["/api/super-dealer/stats"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/super-dealer/transactions/recent"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out">
            <SuperDealerSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <SuperDealerSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
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
              <h1 className="text-lg lg:text-xl font-semibold">Super Dealer Dashboard</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Welcome back, {superDealer?.user?.name || 'Super Dealer'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {superDealer && (
              <a href={`/store/super-dealer/${superDealer.storefrontSlug}`} target="_blank" rel="noopener noreferrer">
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
            <Card className="bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-950/20 dark:via-orange-950/20 dark:to-red-950/20 border-yellow-200 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      Welcome back, {superDealer?.user?.name?.split(' ')[0] || 'Super Dealer'}! ⭐
                    </h2>
                    <p className="text-orange-700 dark:text-orange-300 mt-1">
                      Lead your dealer network and dominate the market
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      <Star className="h-3 w-3" />
                      {superDealer?.isApproved ? 'Verified Super Dealer' : 'Pending Approval'}
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
                  title="Profit Balance"
                  value={formatCurrency(stats?.balance || 0)}
                  icon={Wallet}
                  description="Available for withdrawal"
                  trend="+18%"
                  trendLabel="vs last month"
                />
                <StatCard
                  title="Today's Profit"
                  value={formatCurrency(stats?.todayProfit || 0)}
                  icon={TrendingUp}
                  description={`${stats?.todayTransactions || 0} transactions`}
                  trend="+15%"
                  trendLabel="vs yesterday"
                />
                <StatCard
                  title="Network Revenue"
                  value={formatCurrency(stats?.totalSales || 0)}
                  icon={DollarSign}
                  description="Total network sales"
                  trend="+35%"
                  trendLabel="vs last month"
                />
                <StatCard
                  title="Network Size"
                  value={stats?.networkSize || 0}
                  icon={Users}
                  description={`${stats?.dealerCount || 0} dealers, ${((stats?.networkSize || 0) - (stats?.dealerCount || 0))} agents`}
                  trend="+25%"
                  trendLabel="vs last month"
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Super Dealer Performance
                  </CardTitle>
                  <CardDescription>Your network leadership metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Today's Performance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Today's Earnings</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {formatCurrency(stats?.todayProfit || 0)}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        {stats?.todayTransactions || 0} network transactions
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-200">Monthly Target</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {formatCurrency((stats?.totalProfit || 0) * 0.5)}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        50% of total profit target
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Link href="/super-dealer/bundles/mtn">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Package className="h-4 w-4" />
                          <span className="text-xs">MTN</span>
                        </Button>
                      </Link>
                      <Link href="/super-dealer/bundles/telecel">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Package className="h-4 w-4" />
                          <span className="text-xs">Telecel</span>
                        </Button>
                      </Link>
                      <Link href="/super-dealer/pricing">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs">Pricing</span>
                        </Button>
                      </Link>
                      <Link href="/super-dealer/network">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">Network</span>
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
                    Network Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <TableSkeleton rows={4} />
                  ) : recentTransactions && recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {recentTransactions.slice(0, 4).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{tx.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              +{formatCurrency(tx.agentProfit || 0)}
                            </p>
                            <StatusBadge status={tx.status} className="text-xs" />
                          </div>
                        </div>
                      ))}
                      <Link href="/super-dealer/transactions">
                        <Button variant="ghost" size="sm" className="w-full mt-3">
                          View All Transactions
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                      <p className="text-xs">Start building your network to see transactions here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Storefront & Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Storefront */}
              {superDealer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Your Super Dealer Storefront
                    </CardTitle>
                    <CardDescription>Showcase your network leadership and attract dealers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{superDealer.businessName}</span>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Super Dealer</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Share this link with dealers and agents:
                        </p>
                        <code className="text-sm bg-background px-2 py-1 rounded mt-2 inline-block">
                          {window.location.origin}/store/super-dealer/{superDealer.storefrontSlug}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store/super-dealer/${superDealer.storefrontSlug}`)}
                        >
                          Copy Link
                        </Button>
                        <a href={`/store/super-dealer/${superDealer.storefrontSlug}`} target="_blank" rel="noopener noreferrer">
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
                    Super Dealer Tools & API
                  </CardTitle>
                  <CardDescription>Advanced tools for network management</CardDescription>
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
                    <Link href="/super-dealer/settings">
                      <Button variant="outline" className="justify-start h-auto p-4 w-full">
                        <div className="text-left">
                          <div className="font-medium">Settings</div>
                          <div className="text-xs text-muted-foreground">Manage network & profile</div>
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
                  Network Order Tracker
                </CardTitle>
                <CardDescription>Monitor your entire network's purchase status</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderTracker />
              </CardContent>
            </Card>

            {/* Withdrawal Section */}
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                  <Wallet className="h-5 w-5" />
                  Ready to Withdraw Super Profits?
                </CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">
                  Your super dealer profits are waiting for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 tabular-nums">
                      {formatCurrency(stats?.balance || 0)}
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Available for withdrawal
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/super-dealer/withdrawals">
                      <Button
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        disabled={(stats?.balance || 0) <= 0}
                      >
                        Request Withdrawal
                      </Button>
                    </Link>
                    <Link href="/super-dealer/transactions">
                      <Button variant="outline">
                        View History
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <p className="text-xs text-orange-800 dark:text-orange-200 text-center">
                    ⭐ Super dealer withdrawals require admin approval and are processed within 24-48 hours
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

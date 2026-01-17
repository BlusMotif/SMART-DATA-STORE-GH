import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { AgentSidebarV2 as AgentSidebar } from "@/components/layout/agent-sidebar-v2";
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
  Clock
} from "lucide-react";
import { OrderTracker } from "@/components/order-tracker";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";
import { Agent, Transaction } from "../../../shared/schema.js";

interface AgentStats {
  balance: number;
  totalProfit: number;
  totalSales: number;
  totalTransactions: number;
  todayProfit: number;
  todayTransactions: number;
}

interface AgentProfileResponse {
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

export default function AgentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  const { data: profileData } = useQuery<AgentProfileResponse>({
    queryKey: ["/api/profile"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const agent = profileData?.profile;
  const [location] = useLocation();

  // Redirect to activation if agent is not approved (run only once)
  useEffect(() => {
    if (agent && !agent.isApproved && location !== "/agent/activation-complete" && !hasRedirected.current) {
      hasRedirected.current = true;
      console.log('Redirecting to activation page - agent not approved');
      setLocation("/agent/activation-complete");
    }
  }, [agent, location, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<AgentStats>({
    queryKey: ["/api/agent/stats"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/agent/transactions/recent"],
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
            <AgentSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AgentSidebar />
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
              <h1 className="text-lg lg:text-xl font-semibold">Agent Dashboard</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Welcome back, {agent?.user?.name || 'Agent'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {agent && (
              <a href={`/store/agent/${agent.storefrontSlug}`} target="_blank" rel="noopener noreferrer">
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
            <Card className="bg-card border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">
                      Welcome back, {agent?.user?.name?.split(' ')[0] || 'Agent'}! 👋
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Here's what's happening with your business today
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Award className="h-3 w-3" />
                      {agent?.isApproved ? 'Verified Agent' : 'Pending Approval'}
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
                  title="Available Balance"
                  value={formatCurrency(stats?.balance || 0)}
                  icon={Wallet}
                  description="Ready for withdrawal"
                  trend="+12%"
                  trendLabel="vs last month"
                />
                <StatCard
                  title="Today's Profit"
                  value={formatCurrency(stats?.todayProfit || 0)}
                  icon={TrendingUp}
                  description={`${stats?.todayTransactions || 0} transactions`}
                  trend="+8%"
                  trendLabel="vs yesterday"
                />
                <StatCard
                  title="Total Sales"
                  value={formatCurrency(stats?.totalSales || 0)}
                  icon={DollarSign}
                  description="All-time revenue"
                  trend="+24%"
                  trendLabel="vs last month"
                />
                <StatCard
                  title="Active Orders"
                  value={stats?.totalTransactions || 0}
                  icon={ShoppingCart}
                  description="Completed transactions"
                  trend="+15%"
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
                    Performance Overview
                  </CardTitle>
                  <CardDescription>Your business metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Today's Performance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-card rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">Today's Earnings</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(stats?.todayProfit || 0)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {stats?.todayTransactions || 0} transactions completed
                      </p>
                    </div>
                    <div className="p-4 bg-card rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Monthly Goal</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency((stats?.totalProfit || 0) * 0.3)}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        30% of total profit target
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
                      <Link href="/agent/bundles/mtn">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Package className="h-4 w-4" />
                          <span className="text-xs">MTN</span>
                        </Button>
                      </Link>
                      <Link href="/agent/bundles/telecel">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Package className="h-4 w-4" />
                          <span className="text-xs">Telecel</span>
                        </Button>
                      </Link>
                      <Link href="/agent/bundles/at-bigtime">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Package className="h-4 w-4" />
                          <span className="text-xs">AT BigTime</span>
                        </Button>
                      </Link>
                      <Link href="/agent/wallet">
                        <Button variant="outline" size="sm" className="w-full h-auto py-3 flex-col gap-1">
                          <Wallet className="h-4 w-4" />
                          <span className="text-xs">Top Up</span>
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
                    Recent Activity
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
                              +{formatCurrency(tx.agentProfit || 0)}
                            </p>
                            <StatusBadge status={tx.status} className="text-xs" />
                          </div>
                        </div>
                      ))}
                      <Link href="/agent/transactions">
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
                      <p className="text-xs">Start selling to see transactions here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Storefront & Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Your Storefront */}
              {agent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Your Storefront
                    </CardTitle>
                    <CardDescription>Share your store link with customers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-card rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{agent.businessName}</span>
                          <Badge variant="outline">Live</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Share this link with your customers:
                        </p>
                        <code className="text-sm bg-background px-2 py-1 rounded mt-2 inline-block">
                          {window.location.origin}/store/agent/{agent.storefrontSlug}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store/agent/${agent.storefrontSlug}`)}
                        >
                          Copy Link
                        </Button>
                        <a href={`/store/agent/${agent.storefrontSlug}`} target="_blank" rel="noopener noreferrer">
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
                    API & Tools
                  </CardTitle>
                  <CardDescription>Automate your business operations</CardDescription>
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
                        <div className="text-xs text-muted-foreground">Integrate with external systems</div>
                      </div>
                    </Button>
                    <Link href="/agent/settings">
                      <Button variant="outline" className="justify-start h-auto p-4 w-full">
                        <div className="text-left">
                          <div className="font-medium">Settings</div>
                          <div className="text-xs text-muted-foreground">Manage your profile & links</div>
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
                  Order Tracker
                </CardTitle>
                <CardDescription>Monitor your customers' purchase status</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderTracker />
              </CardContent>
            </Card>

            {/* Withdrawal Section */}
            <Card className="bg-card border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Wallet className="h-5 w-5" />
                  Ready to Withdraw?
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Your profits are waiting for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100 tabular-nums">
                      {formatCurrency(stats?.balance || 0)}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Available for withdrawal
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/agent/withdrawals">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={(stats?.balance || 0) <= 0}
                      >
                        Request Withdrawal
                      </Button>
                    </Link>
                    <Link href="/agent/transactions">
                      <Button variant="outline">
                        View History
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-card rounded-lg">
                  <p className="text-xs text-green-800 dark:text-green-200 text-center">
                    💡 Withdrawals require admin approval and are processed within 24-48 hours
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

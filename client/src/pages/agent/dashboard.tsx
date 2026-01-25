import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { AgentSidebarV2 as AgentSidebar } from "@/components/layout/agent-sidebar-v2";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Wallet,
  ExternalLink,
  Menu,
  Package,
  Code,
  BarChart3,
  Users,
  Zap,
  Award} from "lucide-react";
import { OrderTracker } from "@/components/order-tracker";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";
import { Agent, Transaction } from "@shared/schema";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from "@/hooks/use-auth";

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

// Performance Chart Component
const PerformanceChart = ({ stats }: { stats?: AgentStats }) => {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ["/api/agent/performance-history"],
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Use real data if available, otherwise fallback to sample data
  const chartData = Array.isArray(performanceData) ? performanceData : [
    { day: 'Mon', profit: 25.50, transactions: 3 },
    { day: 'Tue', profit: 45.20, transactions: 5 },
    { day: 'Wed', profit: 32.80, transactions: 4 },
    { day: 'Thu', profit: 67.90, transactions: 8 },
    { day: 'Fri', profit: 89.30, transactions: 12 },
    { day: 'Sat', profit: 54.60, transactions: 7 },
    { day: 'Sun', profit: stats?.todayProfit || 42.10, transactions: stats?.todayTransactions || 5 },
  ];

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium mb-4 text-muted-foreground">Weekly Performance</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `GH₵${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value: number, name: string) => [
              name === 'profit' ? `GH₵${value.toFixed(2)}` : value,
              name === 'profit' ? 'Profit' : 'Transactions'
            ]}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Bar
            dataKey="profit"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            name="profit"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
        <span>Daily profit over the last 7 days</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Profit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AgentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);
  const { user } = useAuth();

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

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AgentStats>({
    queryKey: ["/api/agent/stats"],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
  });

  // Force re-render when stats change
  const [displayProfit, setDisplayProfit] = useState(0);
  useEffect(() => {
    if (stats?.totalProfit !== undefined) {
      setDisplayProfit(stats.totalProfit);
    }
  }, [stats?.totalProfit]);

  // Debug logging
  console.log("[Dashboard] Stats data:", stats);
  console.log("[Dashboard] Stats error:", statsError);
  console.log("[Dashboard] totalProfit:", stats?.totalProfit);
  console.log("[Dashboard] displayProfit:", displayProfit);

  useQuery<Transaction[]>({
    queryKey: ["/api/agent/transactions/recent"],
    refetchInterval: 5000,
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
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r transform transition-transform duration-200 ease-in-out">
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
            {/* Welcome Message */}
            <Card className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 border-yellow-600 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full -translate-y-10 sm:-translate-y-12 lg:-translate-y-16 translate-x-10 sm:translate-x-12 lg:translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white/5 rounded-full translate-y-8 sm:translate-y-10 lg:translate-y-12 -translate-x-8 sm:-translate-x-10 lg:-translate-x-12"></div>
              <CardContent className="p-3 sm:p-4 md:p-6 relative">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 rounded-full shadow-lg backdrop-blur-sm flex-shrink-0">
                      <span className="text-lg sm:text-xl md:text-2xl animate-bounce">👋</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 drop-shadow-sm leading-tight">
                        Welcome back, {user?.name?.toUpperCase() || 'AGENT'}!
                      </h2>
                      <p className="text-yellow-100 text-xs sm:text-sm md:text-base font-medium leading-relaxed">
                        Here's what's happening with your business today ✨
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                        <div className="flex items-center gap-1 text-white/90">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">Live Dashboard</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/90">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                          <span className="text-xs font-medium">Real-time Updates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-2 sm:px-3 py-1 backdrop-blur-sm w-fit">
                      <span className="text-xs text-white font-medium">
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  key={`profit-${displayProfit}`}
                  title="Total Profit"
                  value={formatCurrency(displayProfit)}
                  icon={DollarSign}
                  description={`All-time earnings - Raw value: ${displayProfit}`}
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

            <div className="grid grid-cols-1 gap-6">
              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Overview
                  </CardTitle>
                  <CardDescription>Your business metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Performance Chart */}
                  <div className="h-64 w-full">
                    <PerformanceChart stats={stats} />
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quick Actions
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Link href="/agent/bundles/mtn">
                        <Button variant="outline" size="sm" className="w-full h-auto py-4 flex-col gap-2 text-xs md:text-sm">
                          <Package className="h-5 w-5" />
                          <span>MTN</span>
                        </Button>
                      </Link>
                      <Link href="/agent/bundles/telecel">
                        <Button variant="outline" size="sm" className="w-full h-auto py-4 flex-col gap-2 text-xs md:text-sm">
                          <Package className="h-5 w-5" />
                          <span>Telecel</span>
                        </Button>
                      </Link>
                      <Link href="/agent/bundles/at-bigtime">
                        <Button variant="outline" size="sm" className="w-full h-auto py-4 flex-col gap-2 text-xs md:text-sm">
                          <Package className="h-5 w-5" />
                          <span>AT BigTime</span>
                        </Button>
                      </Link>
                      <Link href="/agent/wallet">
                        <Button variant="outline" size="sm" className="w-full h-auto py-4 flex-col gap-2 text-xs md:text-sm">
                          <Wallet className="h-5 w-5" />
                          <span>Top Up</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Storefront & Order Tracker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="p-4 bg-green-500 text-white rounded-lg border border-green-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">{agent.businessName}</span>
                          <Badge variant="outline" className="bg-white text-green-600 border-green-700">Live</Badge>
                        </div>
                        <p className="text-xs text-white/90 mb-3">
                          Share this link with your customers:
                        </p>
                        <code className="text-xs sm:text-sm bg-white text-green-600 px-2 py-1 rounded mt-2 block sm:inline-block border border-green-700 break-all sm:break-normal">
                          {window.location.origin}/store/agent/{agent.storefrontSlug}
                        </code>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store/agent/${agent.storefrontSlug}`)}
                          className="w-full sm:w-auto"
                        >
                          Copy Link
                        </Button>
                        <a href={`/store/agent/${agent.storefrontSlug}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                          <Button size="sm" className="w-full">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Visit
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
            </div>

            {/* API & Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API & Tools
                </CardTitle>
                <CardDescription>Automate your business operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4 text-left"
                    onClick={() => setShowApiModal(true)}
                  >
                    <div>
                      <div className="font-medium text-sm md:text-base">API Keys</div>
                      <div className="text-xs md:text-sm text-muted-foreground">Integrate with external systems</div>
                    </div>
                  </Button>
                  <Link href="/agent/settings">
                    <Button variant="outline" className="justify-start h-auto p-4 w-full text-left">
                      <div>
                        <div className="font-medium text-sm md:text-base">Settings</div>
                        <div className="text-xs md:text-sm text-muted-foreground">Manage your profile & links</div>
                      </div>
                    </Button>
                  </Link>
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

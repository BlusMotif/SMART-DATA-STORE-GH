import { useState, useEffect } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/constants";
import { DollarSign, ShoppingCart, TrendingUp, Wallet, ExternalLink, ArrowRight, Menu, Package, Code } from "lucide-react";
import { OrderTracker } from "@/components/order-tracker";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";

interface AgentStats {
  balance: number;
  totalProfit: number;
  totalSales: number;
  totalTransactions: number;
  todayProfit: number;
  todayTransactions: number;
}

interface AgentProfileResponse {
  agent: Agent & {
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
  };
  stats: any;
}

export default function AgentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [, setLocation] = useLocation();
  const { data: profileData } = useQuery<AgentProfileResponse>({
    queryKey: ["/api/agent/profile"],
    refetchInterval: 30000, // Refresh every 30 seconds instead of 5
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  
  const agent = profileData?.agent;
  const [location] = useLocation();

  // Redirect to activation if agent is not approved (only if not already on activation page)
  useEffect(() => {
    if (agent && !agent.isApproved && location !== "/agent/activation-complete") {
      setLocation("/agent/activation-complete");
    }
  }, [agent?.isApproved, location, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<AgentStats>({
    queryKey: ["/api/agent/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always consider data stale for real-time updates
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/agent/transactions/recent"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always consider data stale for real-time updates
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
            <h1 className="text-lg lg:text-xl font-semibold">{agent?.businessName || 'Agent'} - Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {agent && (
              <a href={`/store/agent/${agent.storefrontSlug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 hidden sm:flex" data-testid="button-view-store">
                  <ExternalLink className="h-4 w-4" />
                  View Store
                </Button>
              </a>
            )}
            <ThemeToggle />
          </div>
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Available Balance"
                    value={formatCurrency(stats?.balance || 0)}
                    icon={Wallet}
                    description="Profit available for withdrawal"
                  />
                  <StatCard
                    title="Total Profit"
                    value={formatCurrency(stats?.totalProfit || 0)}
                    icon={TrendingUp}
                    description="All time earnings"
                  />
                  <StatCard
                    title="Total Sales"
                    value={formatCurrency(stats?.totalSales || 0)}
                    icon={DollarSign}
                    description="Revenue generated"
                  />
                  <StatCard
                    title="Total Orders"
                    value={stats?.totalTransactions || 0}
                    icon={ShoppingCart}
                    description="Completed transactions"
                  />
                </div>

                {/* Today's Performance Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Today's Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard
                      title="Today's Profit"
                      value={formatCurrency(stats?.todayProfit || 0)}
                      icon={TrendingUp}
                      description="Earnings today"
                    />
                    <StatCard
                      title="Today's Transactions"
                      value={stats?.todayTransactions || 0}
                      icon={ShoppingCart}
                      description="Orders completed today"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start selling data bundles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <Link href="/agent/bundles/mtn">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">MTN Bundles</span>
                    </Button>
                  </Link>
                  <Link href="/agent/bundles/at-ishare">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">AT iShare</span>
                    </Button>
                  </Link>
                  <Link href="/agent/bundles/at-bigtime">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">AT BIG TIME</span>
                    </Button>
                  </Link>
                  <Link href="/agent/bundles/telecel">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">Telecel</span>
                    </Button>
                  </Link>
                  <Link href="/agent/wallet">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Wallet className="h-5 w-5" />
                      <span className="text-xs">Top Up Wallet</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex-col gap-2"
                    onClick={() => setShowApiModal(true)}
                  >
                    <Code className="h-5 w-5" />
                    <span className="text-xs">API & Integrations</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Links */}
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Links</CardTitle>
                <CardDescription>Manage your WhatsApp support and channel links</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">WhatsApp Support Link</p>
                    <p className="text-xs text-muted-foreground">
                      {agent?.whatsappSupportLink ? (
                        <a href={agent.whatsappSupportLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {agent.whatsappSupportLink}
                        </a>
                      ) : (
                        "Not set"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">WhatsApp Channel Link</p>
                    <p className="text-xs text-muted-foreground">
                      {agent?.whatsappChannelLink ? (
                        <a href={agent.whatsappChannelLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {agent.whatsappChannelLink}
                        </a>
                      ) : (
                        "Not set"
                      )}
                    </p>
                  </div>
                  <Link href="/agent/settings">
                    <Button variant="outline" size="sm">
                      Edit Links
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-lg">Recent Sales</CardTitle>
                  <Link href="/agent/transactions">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <TableSkeleton rows={5} />
                  ) : recentTransactions && recentTransactions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTransactions.slice(0, 5).map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="max-w-[200px] truncate">{tx.productName}</TableCell>
                            <TableCell className="font-medium tabular-nums">{formatCurrency(tx.amount)}</TableCell>
                            <TableCell className="text-green-600 font-medium tabular-nums">
                              +{formatCurrency(tx.agentProfit || 0)}
                            </TableCell>
                            <TableCell><StatusBadge status={tx.status} /></TableCell>
                            <TableCell className="text-muted-foreground text-sm">{formatDate(tx.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No sales yet. Share your storefront link to start earning!
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Withdraw Profits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold text-primary tabular-nums" data-testid="text-withdrawable">
                      {formatCurrency(stats?.balance || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Available for withdrawal</p>
                  </div>
                  <Link href="/agent/withdrawals">
                    <Button className="w-full" disabled={(stats?.balance || 0) <= 0} data-testid="button-withdraw">
                      Request Withdrawal
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">
                    Withdrawals require admin approval
                  </p>
                </CardContent>
              </Card>
            </div>

            {agent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Storefront</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{agent.businessName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Share this link with your customers:
                      </p>
                      <code className="text-sm bg-background px-2 py-1 rounded mt-2 inline-block">
                        {window.location.origin}/store/agent/{agent.storefrontSlug}
                      </code>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store/agent/${agent.storefrontSlug}`)}
                      data-testid="button-copy-link"
                    >
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Track Orders</CardTitle>
              <CardDescription>Check the status of your customers' purchases</CardDescription>
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

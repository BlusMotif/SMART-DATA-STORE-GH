import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, ShoppingCart, CreditCard, Wallet, Menu, Package, Code } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
// Using plain inputs for the small upgrade dialog (avoid react-hook-form Controller requirements)
import { OrderTracker } from "@/components/order-tracker";

export default function UserDashboard() {
  const { user } = useAuth();
  useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setShowApiModal] = useState(false);

  // (upgrade UI removed)

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: () => apiRequest("/api/user/stats", { disableAutoLogout: true }),
    refetchInterval: 10000,
  });

  // Fetch recent transactions (last 5)
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => apiRequest("/api/transactions"),
    refetchInterval: 10000,
    select: (data) => data.slice(0, 5), // Only show 5 most recent
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
                  <SheetDescription>Main navigation for your dashboard</SheetDescription>
                </VisuallyHidden>
                <UserSidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-sm sm:text-xl font-bold">Welcome back, {user.name}!</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Here's your account overview</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6 mt-4">
            {/* Upgrade to Agent removed */}
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
                        Welcome back, {user?.name?.toUpperCase() || 'USER'}! 
                      </h2>
                      <p className="text-yellow-100 text-sm lg:text-base font-medium">
                        Here's what's happening with your account today ✨
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-white/90">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium">Live Dashboard</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/90">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.5s]"></div>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `GH₵${stats?.walletBalance || '0.00'}`
                    )}
                  </div>
                  <Link href="/user/wallet">
                    <Button variant="outline" size="sm" className="text-xs mt-3">
                      Top Up Wallet
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      stats?.totalOrders || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">All time purchases</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `GH₵${stats?.totalSpent || 0}`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">All time spending</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start purchasing data bundles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link href="/user/bundles/mtn">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">MTN Bundles</span>
                    </Button>
                  </Link>
                  <Link href="/user/bundles/at-ishare">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">AT iShare</span>
                    </Button>
                  </Link>
                  <Link href="/user/bundles/at-bigtime">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">AT BIG TIME</span>
                    </Button>
                  </Link>
                  <Link href="/user/bundles/telecel">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">Telecel</span>
                    </Button>
                  </Link>
                  <Link href="/user/vouchers">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">Vouchers</span>
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

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest 5 orders</CardDescription>
                  </div>
                  <Link href="/user/history">
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
                  <div className="space-y-3">
                    {transactions.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{transaction.productName}</p>
                          <p className="text-xs text-muted-foreground">{transaction.customerPhone}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">GH₵{transaction.amount}</p>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transactions yet</p>
                    <Link href="/user/bundles/mtn">
                      <Button variant="ghost" className="mt-2">
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Tracker */}
            <Card>
              <CardHeader>
                <CardTitle>Track Your Orders</CardTitle>
                <CardDescription>Check the status of your data bundle purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderTracker />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
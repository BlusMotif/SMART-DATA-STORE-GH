import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, CreditCard, Wallet, Menu, Package, Code, Users, TrendingUp, Crown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/api";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { OrderTracker } from "@/components/order-tracker";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";

export default function SuperDealerDashboard() {
  const { user, agent } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  // Fetch super dealer stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/super-dealer/stats"],
    queryFn: () => apiRequest("/api/super-dealer/stats", { disableAutoLogout: true }),
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <SheetTitle>Super Dealer Dashboard</SheetTitle>
              <SheetDescription>
                <VisuallyHidden>Navigation menu for super dealer dashboard</VisuallyHidden>
              </SheetDescription>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <Link href="/super-dealer/dashboard" className="block px-3 py-2 rounded-md hover:bg-gray-100">
                <Crown className="inline w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <Link href="/super-dealer/bundles" className="block px-3 py-2 rounded-md hover:bg-gray-100">
                <Package className="inline w-4 h-4 mr-2" />
                Data Bundles
              </Link>
              <Link href="/super-dealer/wallet" className="block px-3 py-2 rounded-md hover:bg-gray-100">
                <Wallet className="inline w-4 h-4 mr-2" />
                Wallet
              </Link>
              <Link href="/super-dealer/transactions" className="block px-3 py-2 rounded-md hover:bg-gray-100">
                <CreditCard className="inline w-4 h-4 mr-2" />
                Transactions
              </Link>
              <Link href="/super-dealer/dealers" className="block px-3 py-2 rounded-md hover:bg-gray-100">
                <Users className="inline w-4 h-4 mr-2" />
                Manage Dealers
              </Link>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center">
                <Crown className="w-8 h-8 text-yellow-500 mr-2" />
                <h1 className="text-xl font-bold text-gray-900">Super Dealer</h1>
              </div>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                <Link href="/super-dealer/dashboard" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-900">
                  <Crown className="mr-3 flex-shrink-0 h-5 w-5" />
                  Dashboard
                </Link>
                <Link href="/super-dealer/bundles" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <Package className="mr-3 flex-shrink-0 h-5 w-5" />
                  Data Bundles
                </Link>
                <Link href="/super-dealer/wallet" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <Wallet className="mr-3 flex-shrink-0 h-5 w-5" />
                  Wallet
                </Link>
                <Link href="/super-dealer/transactions" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <CreditCard className="mr-3 flex-shrink-0 h-5 w-5" />
                  Transactions
                </Link>
                <Link href="/super-dealer/dealers" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  <Users className="mr-3 flex-shrink-0 h-5 w-5" />
                  Manage Dealers
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="md:pl-64 flex flex-col flex-1">
          <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow md:hidden">
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex justify-between">
              <div className="flex-1 flex">
                <h1 className="text-xl font-semibold text-gray-900">Super Dealer Dashboard</h1>
              </div>
            </div>
          </div>

          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="flex items-center">
                  <Crown className="w-4 sm:w-8 h-4 sm:h-8 text-yellow-500 mr-3" />
                  <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Welcome back, {user.name}!</h1>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">Super Dealer Dashboard - Advanced management and analytics.</p>

                {/* Stats Cards */}
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          `GH₵${stats?.walletBalance || '0.00'}`
                        )}
                      </div>
                      <Link href="/super-dealer/wallet">
                        <Button variant="outline" size="sm" className="mt-2">
                          Top Up Wallet
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          stats?.totalSales || 0
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">+25.5% from last month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          `GH₵${stats?.totalProfit || '0.00'}`
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">+22.1% from last month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Managed Dealers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          stats?.managedDealers || 0
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Dealers under your supervision</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Transactions */}
                <div className="mt-8">
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Your latest transaction activity</p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {transactionsLoading ? (
                        <li className="px-4 py-4">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </li>
                      ) : transactions?.length > 0 ? (
                        transactions.map((transaction: any) => (
                          <li key={transaction.id} className="px-4 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Package className="flex-shrink-0 h-5 w-5 text-gray-400" />
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">
                                    {transaction.type === 'purchase' ? 'Data Purchase' : 'Wallet Top-up'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(transaction.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                                  {transaction.status}
                                </Badge>
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                  GH₵{transaction.amount}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-4 text-center text-gray-500">
                          No recent transactions
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <Package className="h-8 w-8 text-blue-600" />
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">Sell Data Bundles</h4>
                            <p className="text-sm text-gray-500">Manage your data bundle offerings</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link href="/super-dealer/bundles">
                            <Button className="w-full">View Bundles</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <Wallet className="h-8 w-8 text-green-600" />
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">Wallet Management</h4>
                            <p className="text-sm text-gray-500">Top up and manage your wallet</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link href="/super-dealer/wallet">
                            <Button variant="outline" className="w-full">Manage Wallet</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <Users className="h-8 w-8 text-purple-600" />
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">Manage Dealers</h4>
                            <p className="text-sm text-gray-500">Oversee your dealer network</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link href="/super-dealer/dealers">
                            <Button variant="outline" className="w-full">Manage Dealers</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center">
                          <Code className="h-8 w-8 text-indigo-600" />
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">API Integrations</h4>
                            <p className="text-sm text-gray-500">Integrate with external systems</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowApiModal(true)}
                          >
                            API Settings
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* API Integrations Modal */}
      <ApiIntegrationsModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
      />

      {/* Order Tracker */}
      <OrderTracker />
    </div>
  );
}

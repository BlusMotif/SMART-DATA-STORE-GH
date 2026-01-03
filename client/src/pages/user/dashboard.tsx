import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, ShoppingCart, CreditCard, History, User, Upload, MessageCircle, Phone, FileText, Clock, CheckCircle, XCircle, AlertCircle, Wallet } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkUploadSection } from "@/components/user/bulk-upload-section";
import { SupportChat } from "@/components/user/support-chat";
import { WalletTopup } from "@/components/user/wallet-topup";

// Status display utility
const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'Completed'
      };
    case 'delivered':
      return {
        variant: 'default' as const,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'Delivered'
      };
    case 'confirmed':
      return {
        variant: 'secondary' as const,
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        label: 'Confirmed'
      };
    case 'pending':
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        label: 'Pending'
      };
    case 'cancelled':
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        label: 'Cancelled'
      };
    case 'failed':
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        label: 'Failed'
      };
    case 'refunded':
      return {
        variant: 'outline' as const,
        icon: AlertCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        label: 'Refunded'
      };
    default:
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        label: status
      };
  }
};

const TransactionCard = ({ transaction, showDetails = false }: { transaction: any, showDetails?: boolean }) => {
  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`p-3 md:p-4 border rounded-lg ${statusConfig.bgColor}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="font-medium text-sm md:text-base break-words">{transaction.productName}</p>
            <Badge variant={statusConfig.variant} className="flex items-center gap-1 shrink-0">
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="text-xs md:text-sm text-gray-600 space-y-1">
            <p className="break-all">Phone: {transaction.customerPhone}</p>
            {transaction.network && <p>Network: {transaction.network.toUpperCase()}</p>}
            <p className="break-all text-xs">Ref: {transaction.reference}</p>
            <p className="text-xs">
              Created: {new Date(transaction.createdAt).toLocaleDateString()}
              <span className="hidden sm:inline"> at {new Date(transaction.createdAt).toLocaleTimeString()}</span>
            </p>
            {transaction.completedAt && (
              <p className="text-green-600 text-xs">
                Completed: {new Date(transaction.completedAt).toLocaleDateString()}
                <span className="hidden sm:inline"> at {new Date(transaction.completedAt).toLocaleTimeString()}</span>
              </p>
            )}
            {transaction.failureReason && (
              <p className="text-red-600 text-xs break-words">Reason: {transaction.failureReason}</p>
            )}
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <p className="font-medium text-base md:text-lg">GH₵{transaction.amount}</p>
          {showDetails && transaction.profit && (
            <p className="text-xs md:text-sm text-gray-500">Profit: GH₵{transaction.profit}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function UserDashboard() {
  const { user } = useAuth();

  // Fetch user transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => apiRequest("/api/transactions"),
    refetchInterval: 10000, // Refresh every 10 seconds for real-time data
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: () => apiRequest("/api/user/stats"),
    refetchInterval: 10000, // Refresh every 10 seconds for real-time data
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  // Calculate status counts
  const statusCounts = transactions ? transactions.reduce((acc: Record<string, number>, transaction: any) => {
    acc[transaction.status] = (acc[transaction.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back, {user.name}!
            </h1>
            <p className="text-sm text-gray-600">
              Manage your account and view your purchase history
            </p>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 mb-6">
              <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
              <TabsTrigger value="bulk-upload" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Bulk Upload</TabsTrigger>
              <TabsTrigger value="support" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Support</TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-0">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <div className="flex gap-2 mt-3">
                      <WalletTopup />
                      <Link href="/user/wallet">
                        <Button variant="outline" size="sm" className="text-xs">
                          View Wallet
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {statsLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        stats?.totalOrders || 0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {statsLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        `GH₵${stats?.totalSpent || 0}`
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-sm">
                      {user.role === "user" ? "Regular User" : user.role}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Order Status Summary */}
              {transactions && transactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Order Status Summary</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Overview of your order statuses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                      {Object.entries(statusCounts).map(([status, count]) => {
                        const statusConfig = getStatusConfig(status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <div key={status} className={`p-3 md:p-4 rounded-lg ${statusConfig.bgColor} border`}>
                            <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                              <StatusIcon className={`h-4 w-4 md:h-5 md:w-5 ${statusConfig.color}`} />
                              <span className="font-medium text-xs md:text-sm break-words">{statusConfig.label}</span>
                            </div>
                            <p className="text-lg md:text-xl font-bold">{String(count)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                      Browse Products
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Explore data bundles and result checkers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href="/data-bundles">
                      <Button className="w-full text-sm">Shop Now</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Upload className="h-4 w-4 md:h-5 md:w-5" />
                      Bulk Upload
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Upload multiple data bundles at once
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant="outline"
                      className="w-full text-sm"
                      onClick={() => (document.querySelector('[data-value="bulk-upload"]') as HTMLElement)?.click()}
                    >
                      Upload Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                      Get Support
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Chat, WhatsApp, or call our support team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant="outline"
                      className="w-full text-sm"
                      onClick={() => (document.querySelector('[data-value="support"]') as HTMLElement)?.click()}
                    >
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Recent Transactions</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Your latest purchase activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.slice(0, 5).map((transaction: any) => (
                        <TransactionCard key={transaction.id} transaction={transaction} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions yet</p>
                      <p className="text-sm">Start shopping to see your order history here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk-upload" className="mt-0">
              <BulkUploadSection />
            </TabsContent>

            <TabsContent value="support" className="mt-0">
              <SupportChat />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Order History</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Complete history of all your purchases with detailed status tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.map((transaction: any) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          showDetails={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions yet</p>
                      <p className="text-sm">Start shopping to see your order history here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
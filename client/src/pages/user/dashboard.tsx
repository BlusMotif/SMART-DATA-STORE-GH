import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Loader2, ShoppingCart, CreditCard, History, User, Upload, MessageCircle, Phone, FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BulkUploadSection } from "@/components/user/bulk-upload-section";
import { SupportChat } from "@/components/user/support-chat";

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
    case 'pending':
      return {
        variant: 'secondary' as const,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        label: 'Pending'
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
    <div className={`p-4 border rounded-lg ${statusConfig.bgColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium">{transaction.productName}</p>
            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>Phone: {transaction.customerPhone}</p>
            {transaction.network && <p>Network: {transaction.network.toUpperCase()}</p>}
            <p>Reference: {transaction.reference}</p>
            <p>
              Created: {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
              {new Date(transaction.createdAt).toLocaleTimeString()}
            </p>
            {transaction.completedAt && (
              <p className="text-green-600">
                Completed: {new Date(transaction.completedAt).toLocaleDateString()} at{' '}
                {new Date(transaction.completedAt).toLocaleTimeString()}
              </p>
            )}
            {transaction.failureReason && (
              <p className="text-red-600">Reason: {transaction.failureReason}</p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="font-medium text-lg">GH₵{transaction.amount}</p>
          {showDetails && transaction.profit && (
            <p className="text-sm text-gray-500">Profit: GH₵{transaction.profit}</p>
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
  });

  // Calculate status counts
  const statusCounts = transactions ? transactions.reduce((acc, transaction) => {
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
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-600">
              Manage your account and view your purchase history
            </p>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
              <TabsTrigger value="history">Order History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
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
                    <div className="text-2xl font-bold">
                      {statsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
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
                    <CardTitle>Order Status Summary</CardTitle>
                    <CardDescription>
                      Overview of your order statuses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(statusCounts).map(([status, count]) => {
                        const statusConfig = getStatusConfig(status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <div key={status} className={`p-4 rounded-lg ${statusConfig.bgColor} border`}>
                            <div className="flex items-center gap-2 mb-2">
                              <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                              <span className="font-medium text-sm">{statusConfig.label}</span>
                            </div>
                            <p className="text-2xl font-bold">{count}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Browse Products
                    </CardTitle>
                    <CardDescription>
                      Explore data bundles and result checkers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/data-bundles">
                      <Button className="w-full">Shop Now</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Bulk Upload
                    </CardTitle>
                    <CardDescription>
                      Upload multiple data bundles at once
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => document.querySelector('[data-value="bulk-upload"]')?.click()}
                    >
                      Upload Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Get Support
                    </CardTitle>
                    <CardDescription>
                      Chat, WhatsApp, or call our support team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => document.querySelector('[data-value="support"]')?.click()}
                    >
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
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

            <TabsContent value="bulk-upload">
              <BulkUploadSection />
            </TabsContent>

            <TabsContent value="support">
              <SupportChat />
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
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
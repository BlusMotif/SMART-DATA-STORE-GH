import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgentSidebar } from "@/components/layout/agent-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { formatCurrency, formatDate, NETWORKS } from "@/lib/constants";
import { BarChart3, Search, DollarSign, TrendingUp, ShoppingCart, Menu, CheckCircle, Clock, XCircle, AlertCircle, Layers } from "lucide-react";
import type { Transaction } from "@shared/schema";

// Status display utility
const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return 'default';
    case 'confirmed':
    case 'pending':
      return 'secondary';
    case 'cancelled':
    case 'failed':
      return 'destructive';
    case 'refunded':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed': return 'Completed';
    case 'delivered': return 'Delivered';
    case 'confirmed': return 'Confirmed';
    case 'pending': return 'Pending';
    case 'cancelled': return 'Cancelled';
    case 'failed': return 'Failed';
    case 'refunded': return 'Refunded';
    default: return status;
  }
};

interface AgentTransactionStats {
  totalTransactions: number;
  totalRevenue: number;
  totalProfit: number;
  todayTransactions: number;
}

export default function AgentTransactions() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/agent/transactions"],
    refetchInterval: 15000, // Refresh every 15 seconds for real-time updates
    refetchOnWindowFocus: true,
  });

  const { data: stats } = useQuery<AgentTransactionStats>({
    queryKey: ["/api/agent/transactions/stats"],
    refetchInterval: 15000, // Refresh every 15 seconds for real-time stats
    refetchOnWindowFocus: true,
  });

  const filteredTransactions = transactions?.filter((tx) => {
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !tx.reference.toLowerCase().includes(term) &&
        !tx.productName.toLowerCase().includes(term) &&
        !tx.customerPhone.includes(term)
      ) {
        return false;
      }
    }
    return true;
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
            <h1 className="text-lg lg:text-xl font-semibold">My Transactions</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Transactions"
                value={stats?.totalTransactions || 0}
                icon={ShoppingCart}
                description="All time"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats?.totalRevenue || 0)}
                icon={DollarSign}
                description="From sales"
              />
              <StatCard
                title="Total Profit"
                value={formatCurrency(stats?.totalProfit || 0)}
                icon={TrendingUp}
                description="Your earnings"
              />
              <StatCard
                title="Today"
                value={stats?.todayTransactions || 0}
                icon={BarChart3}
                description="Transactions today"
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>
                    View all your customer orders and earnings
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48"
                      data-testid="input-search"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32" data-testid="filter-status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40" data-testid="filter-type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="data_bundle">Data Bundles</SelectItem>
                      <SelectItem value="result_checker">Result Checkers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={10} />
                ) : filteredTransactions && filteredTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Network</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>My Profit</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((tx) => {
                          const network = NETWORKS.find((n) => n.id === tx.network);
                          const isBulkOrder = (tx as any).isBulkOrder;
                          const phoneNumbers = (tx as any).phoneNumbers as Array<{phone: string, bundleName: string, dataAmount: string}> | undefined;
                          return (
                            <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                              <TableCell className="font-mono text-sm">{tx.reference}</TableCell>
                              <TableCell>
                                <div className="max-w-[200px]">
                                  <div className="font-medium truncate">{tx.productName}</div>
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                      {tx.type === "data_bundle" ? "Data Bundle" : "Result Checker"}
                                    </Badge>
                                    {isBulkOrder && (
                                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                        <Layers className="h-3 w-3" />
                                        Bulk ({phoneNumbers?.length || 0})
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {network ? (
                                  <Badge
                                    style={{
                                      backgroundColor: network.color,
                                      color: network.textColor,
                                    }}
                                  >
                                    {network.name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium tabular-nums">
                                <div>{formatCurrency(tx.amount)}</div>
                                {isBulkOrder && phoneNumbers && (
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(parseFloat(tx.amount) / phoneNumbers.length)} each
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-green-600 tabular-nums font-medium">
                                <div>+{formatCurrency(tx.agentProfit || 0)}</div>
                                {isBulkOrder && phoneNumbers && (
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(parseFloat(tx.agentProfit || "0") / phoneNumbers.length)} each
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {isBulkOrder && phoneNumbers ? (
                                  <div className="text-xs">
                                    <div className="font-semibold">{phoneNumbers.length} numbers</div>
                                    <div className="text-muted-foreground truncate max-w-[120px]">
                                      {phoneNumbers[0]?.phone}
                                    </div>
                                  </div>
                                ) : (
                                  tx.customerPhone
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    (tx as any).paymentStatus === "paid" ? "default" :
                                    (tx as any).paymentStatus === "failed" ? "destructive" :
                                    (tx as any).paymentStatus === "cancelled" ? "outline" :
                                    "secondary"
                                  }
                                >
                                  {(tx as any).paymentStatus || "pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={tx.status} />
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(tx.createdAt)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No transactions found. Share your store link to start making sales!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

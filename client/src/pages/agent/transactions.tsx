"use client"

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgentSidebarV2 as AgentSidebar } from "@/components/layout/agent-sidebar-v2";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { formatCurrency, formatDate, NETWORKS } from "@/lib/constants";
import { BarChart3, Search, DollarSign, TrendingUp, ShoppingCart, Menu, Layers } from "lucide-react";
import type { Transaction } from "@shared/schema";
import { Input } from "@/components/ui/input";

// Status display utility

const mapProviderStatusToOrderStatus = (providerStatus: string): string => {
  const normalized = providerStatus.toLowerCase();
  if (normalized === "success" || normalized === "delivered") return "completed";
  if (normalized === "failed" || normalized === "cancelled") return "failed";
  if (normalized === "pending" || normalized === "processing") return "processing";
  return normalized;
};

const getSkytechStatus = (transaction: any): string | null => {
  try {
    if (!transaction.apiResponse) return null;
    const apiResponse = JSON.parse(transaction.apiResponse);

    if (apiResponse.skytechStatus?.status) {
      return apiResponse.skytechStatus.status;
    }

    if (apiResponse.results && apiResponse.results[0]?.status) {
      return apiResponse.results[0].status;
    }

    return null;
  } catch {
    return null;
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
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    refetchOnWindowFocus: true,
  });

  const { data: stats } = useQuery<AgentTransactionStats>({
    queryKey: ["/api/agent/transactions/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time stats
    refetchOnWindowFocus: true,
  });

  const filteredTransactions = transactions?.filter((tx) => {
    const providerStatus = getSkytechStatus(tx);
    const effectiveStatus = providerStatus
      ? mapProviderStatusToOrderStatus(providerStatus)
      : tx.status;

    if (statusFilter !== "all" && effectiveStatus !== statusFilter) return false;
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (searchTerm) {
      // Clean up search term - remove # prefix if present
      const term = searchTerm.toLowerCase().replace(/^#/, '');
      
      // Check if searching for a sub-item (e.g., "114003-2")
      const subItemMatch = term.match(/^(\d+)-(\d+)$/);
      if (subItemMatch) {
        const [, baseRef, subIndex] = subItemMatch;
        // Match the base reference for bulk orders
        if (tx.reference === baseRef && tx.isBulkOrder) {
          return true;
        }
      }
      
      if (
        !tx.reference.toLowerCase().includes(term) &&
        !tx.productName.toLowerCase().includes(term) &&
        !(tx.customerPhone && tx.customerPhone.toLowerCase().includes(term))
      ) {
        return false;
      }
    }
    return true;
  });

  // Flatten bulk orders into individual rows for display
  const flattenedTransactions = filteredTransactions?.flatMap((transaction: any) => {
    const isBulkOrder = transaction.isBulkOrder;
    const rawPhoneNumbers = transaction.phoneNumbers;
    const phoneNumbers = rawPhoneNumbers 
      ? (typeof rawPhoneNumbers === 'string' 
          ? (() => { try { return JSON.parse(rawPhoneNumbers); } catch { return []; } })()
          : rawPhoneNumbers) as Array<{phone: string, bundleName: string, dataAmount: string, price?: number, agentProfit?: number}>
      : undefined;

    if (isBulkOrder && phoneNumbers && phoneNumbers.length > 0) {
      const fallbackPrice = parseFloat(transaction.amount) / phoneNumbers.length;
      const fallbackProfit = parseFloat(transaction.agentProfit || '0') / phoneNumbers.length;
      return phoneNumbers.map((phoneObj, index) => ({
        ...transaction,
        id: `${transaction.id}-${index}`,
        originalId: transaction.id,
        customerPhone: phoneObj.phone,
        productName: phoneObj.bundleName || transaction.productName,
        amount: phoneObj.price ? phoneObj.price.toFixed(2) : fallbackPrice.toFixed(2),
        agentProfit: phoneObj.agentProfit ? phoneObj.agentProfit.toFixed(2) : fallbackProfit.toFixed(2),
        isExpandedBulkItem: true,
        bulkOrderIndex: index + 1,
        bulkOrderTotal: phoneNumbers.length,
        dataAmount: phoneObj.dataAmount,
      }));
    }
    return [{ ...transaction, originalId: transaction.id }];
  })?.filter((tx: any) => {
    // Post-flattening filter for sub-item search (e.g., "114003-2")
    if (searchTerm) {
      const term = searchTerm.toLowerCase().replace(/^#/, '');
      const subItemMatch = term.match(/^(\d+)-(\d+)$/);
      if (subItemMatch) {
        const [, baseRef, subIndex] = subItemMatch;
        // Only show the specific sub-item that matches
        if (tx.reference === baseRef && tx.isExpandedBulkItem) {
          return tx.bulkOrderIndex === parseInt(subIndex);
        }
        // Hide non-matching items when searching for sub-item
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
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <StatCard
                title="Total Transactions"
                value={stats?.totalTransactions || 0}
                icon={ShoppingCart}
                description="All time"
                className="text-sm md:text-base"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats?.totalRevenue || 0)}
                icon={DollarSign}
                description="From sales"
                className="text-sm md:text-base"
              />
              <StatCard
                title="Total Profit"
                value={formatCurrency(stats?.totalProfit || 0)}
                icon={TrendingUp}
                description="Your earnings"
                className="text-sm md:text-base"
              />
              <StatCard
                title="Today"
                value={stats?.todayTransactions || 0}
                icon={BarChart3}
                description="Transactions today"
                className="text-sm md:text-base"
              />
            </div>

            <Card className="bg-card text-card-foreground border-border md:col-span-2 lg:col-span-3">
              <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 md:pb-6">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg text-black">
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="truncate">Transaction History</span>
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-gray-600">
                    View all your customer orders and earnings
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-full sm:w-48 text-sm"
                      data-testid="input-search"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-32 text-xs md:text-sm" data-testid="filter-status">
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
                      <SelectTrigger className="w-full sm:w-36 md:w-40 text-xs md:text-sm" data-testid="filter-type">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="data_bundle">Data Bundles</SelectItem>
                        <SelectItem value="result_checker">Result Checkers</SelectItem>
                        <SelectItem value="wallet_topup">Wallet Top-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                {isLoading ? (
                  <TableSkeleton rows={5} />
                ) : flattenedTransactions && flattenedTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs md:text-sm">Order ID</TableHead>
                          <TableHead className="text-xs md:text-sm">Product</TableHead>
                          <TableHead className="hidden sm:table-cell text-xs md:text-sm">Network</TableHead>
                          <TableHead className="text-xs md:text-sm">Amount</TableHead>
                          <TableHead className="hidden md:table-cell text-xs md:text-sm">My Profit</TableHead>
                          <TableHead className="text-xs md:text-sm">Customer</TableHead>
                          <TableHead className="text-xs md:text-sm">Payment</TableHead>
                          <TableHead className="text-xs md:text-sm">Status</TableHead>
                          <TableHead className="hidden md:table-cell text-xs md:text-sm">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {flattenedTransactions.slice(0, 50).map((tx) => {
                          let network = NETWORKS.find((n) => n.id === tx.network);
                          const providerStatus = getSkytechStatus(tx);
                          const effectiveStatus = providerStatus
                            ? mapProviderStatusToOrderStatus(providerStatus)
                            : tx.status;
                          const isWalletTopup = tx.type === "wallet_topup";
                          
                          // For expanded bulk items, try to extract network from product name
                          if (!network && tx.isExpandedBulkItem) {
                            const productName = tx.productName;
                            if (productName) {
                              const lower = productName.toLowerCase();
                              if (lower.includes('mtn')) {
                                network = NETWORKS.find(n => n.id === 'mtn');
                              } else if (lower.includes('telecel')) {
                                network = NETWORKS.find(n => n.id === 'telecel');
                              } else if (lower.includes('bigtime')) {
                                network = NETWORKS.find(n => n.id === 'at_bigtime');
                              } else if (lower.includes('ishare')) {
                                network = NETWORKS.find(n => n.id === 'at_ishare');
                              }
                            }
                          }
                          
                          return (
                            <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                              <TableCell className="font-mono text-xs md:text-sm">#{tx.reference}{tx.isExpandedBulkItem ? `-${tx.bulkOrderIndex}` : ''}</TableCell>
                              <TableCell className="max-w-[150px] md:max-w-[200px]">
                                <div className="font-medium truncate text-xs md:text-sm">{tx.productName}</div>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    {tx.type === "data_bundle" ? "Data" :
                                     tx.type === "result_checker" ? "Result" :
                                     tx.type === "wallet_topup" ? "Wallet" : tx.type}
                                  </Badge>
                                  {tx.isExpandedBulkItem && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0 flex items-center gap-1 bg-purple-100 text-purple-700">
                                      <Layers className="h-2.5 w-2.5" />
                                      {tx.bulkOrderIndex} of {tx.bulkOrderTotal}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {isWalletTopup ? (
                                  <span className="text-muted-foreground">-</span>
                                ) : network ? (
                                  <Badge
                                    style={{
                                      backgroundColor: network.color,
                                      color: network.textColor,
                                    }}
                                    className="text-xs px-1 py-0"
                                  >
                                    {network.name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium tabular-nums text-xs md:text-sm">
                                <div>{formatCurrency(tx.amount)}</div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-green-600 tabular-nums font-medium text-xs md:text-sm">
                                {isWalletTopup ? (
                                  <span className="text-muted-foreground">-</span>
                                ) : (
                                  <div>+{formatCurrency(tx.agentProfit || 0)}</div>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs md:text-sm">
                                {isWalletTopup ? (
                                  <span className="text-muted-foreground">Self</span>
                                ) : (
                                  <div>
                                    <div className="truncate max-w-[80px] md:max-w-[100px]">
                                      {tx.customerPhone}
                                    </div>
                                    {tx.isExpandedBulkItem && tx.dataAmount && (
                                      <div className="text-xs text-muted-foreground">{tx.dataAmount}</div>
                                    )}
                                  </div>
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
                                  className="text-xs"
                                >
                                  {(tx as any).paymentStatus || "pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={effectiveStatus} />
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground text-xs md:text-sm">
                                {formatDate(tx.createdAt)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-12 text-muted-foreground text-sm md:text-base">
                    No transactions found. Share your store link to start making sales!
                  </div>
                )}
                {filteredTransactions && filteredTransactions.length > 20 && (
                  <div className="text-center py-2 md:py-4 text-xs md:text-sm text-muted-foreground">
                    Showing 20 of {filteredTransactions.length} items
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

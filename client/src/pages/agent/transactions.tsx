import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AgentSidebar } from "@/components/layout/agent-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { formatCurrency, formatDate, NETWORKS } from "@/lib/constants";
import { BarChart3, Search, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import type { Transaction } from "@shared/schema";

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

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/agent/transactions"],
  });

  const { data: stats } = useQuery<AgentTransactionStats>({
    queryKey: ["/api/agent/transactions/stats"],
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
      <AgentSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-6">
          <h1 className="text-xl font-semibold">My Transactions</h1>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
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
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
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
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((tx) => {
                          const network = NETWORKS.find((n) => n.id === tx.network);
                          return (
                            <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                              <TableCell className="font-mono text-sm">{tx.reference}</TableCell>
                              <TableCell>
                                <div className="max-w-[200px]">
                                  <div className="font-medium truncate">{tx.productName}</div>
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {tx.type === "data_bundle" ? "Data Bundle" : "Result Checker"}
                                  </Badge>
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
                                {formatCurrency(tx.amount)}
                              </TableCell>
                              <TableCell className="text-green-600 tabular-nums font-medium">
                                +{formatCurrency(tx.agentProfit || 0)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {tx.customerPhone}
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

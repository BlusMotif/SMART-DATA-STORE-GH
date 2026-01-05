import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { formatCurrency, formatDate, NETWORKS } from "@/lib/constants";
import { BarChart3, Search, Menu, Layers } from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function AdminTransactions() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    refetchInterval: 15000, // Refetch every 15 seconds for transactions
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

  const stats = {
    total: transactions?.length || 0,
    completed: transactions?.filter((t) => t.status === "completed").length || 0,
    pending: transactions?.filter((t) => t.status === "pending").length || 0,
    failed: transactions?.filter((t) => t.status === "failed").length || 0,
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg lg:text-xl font-semibold">Transactions</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Transactions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    All Transactions
                  </CardTitle>
                  <CardDescription>
                    View and track all customer orders
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
                          <TableHead>Profit</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((tx) => {
                          const network = NETWORKS.find((n) => n.id === tx.network);
                          const isBulkOrder = (tx as any).isBulkOrder;
                          const phoneNumbers = (tx as any).phoneNumbers as string[] | undefined;
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
                              <TableCell className="text-green-600 tabular-nums">
                                {formatCurrency(tx.profit)}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {isBulkOrder && phoneNumbers ? (
                                  <div className="text-xs">
                                    <div className="font-semibold">{phoneNumbers.length} numbers</div>
                                    <div className="text-muted-foreground truncate max-w-[120px]">
                                      {phoneNumbers[0]}
                                    </div>
                                  </div>
                                ) : (
                                  tx.customerPhone
                                )}
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
                    No transactions found matching your criteria.
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

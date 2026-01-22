import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { BarChart3, Search, Menu, Layers, Download, Edit, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Transaction } from "@shared/schema";

interface SortableTableHeadProps {
  field: string;
  children: React.ReactNode;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

function SortableTableHead({ field, children, sortField, sortDirection, onSort }: SortableTableHeadProps) {
  return (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        )}
      </div>
    </TableHead>
  );
}

export default function AdminTransactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingDeliveryStatus, setEditingDeliveryStatus] = useState<string | null>(null);
  const [deliveryStatusValue, setDeliveryStatusValue] = useState<string>("");
  const [exportPaymentStatus, setExportPaymentStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    refetchInterval: 15000, // Refetch every 15 seconds for transactions
    refetchOnWindowFocus: true,
  });

  // Update delivery status mutation
  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async ({ transactionId, deliveryStatus }: { transactionId: string; deliveryStatus: string }) => {
      return apiRequest("PATCH", `/api/admin/transactions/${transactionId}/delivery-status`, { deliveryStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({ title: "Delivery status updated successfully" });
      setEditingDeliveryStatus(null);
      setDeliveryStatusValue("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to update delivery status", description: error?.message || 'Unknown error', variant: "destructive" });
    },
  });

  // Export transactions mutation
  const exportTransactionsMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (exportPaymentStatus !== 'all') {
        params.append('paymentStatus', exportPaymentStatus);
      }
      const response = await apiRequest("GET", `/api/admin/transactions/export?${params.toString()}`);
      return response;
    },
    onSuccess: (data) => {
      // Convert to CSV and download
      if (data && Array.isArray(data)) {
        const csvContent = convertToCSV(data);
        const statusLabel = exportPaymentStatus === 'all' ? 'all' : exportPaymentStatus;
        downloadCSV(csvContent, `transactions-${statusLabel}-${new Date().toISOString().split('T')[0]}.csv`);
        toast({ title: "Transactions exported successfully" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Failed to export transactions", description: error?.message || 'Unknown error', variant: "destructive" });
    },
  });

  const filteredTransactions = transactions?.filter((tx) => {
    if (statusFilter !== "all" && tx.status !== statusFilter) return false;
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !tx.reference.toLowerCase().includes(term) &&
        !tx.productName.toLowerCase().includes(term) &&
        (!tx.customerPhone || !tx.customerPhone.includes(term))
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

  // Sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort transactions
  const sortedTransactions = filteredTransactions?.sort((a, b) => {
    let aValue: any = a[sortField as keyof Transaction];
    let bValue: any = b[sortField as keyof Transaction];

    // Handle special cases
    if (sortField === "amount" || sortField === "profit") {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    } else if (sortField === "createdAt") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (sortField === "productName") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    } else if (sortField === "customerPhone") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Helper functions
  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle arrays and objects
        if (Array.isArray(value)) {
          return `"${value.map(item => 
            typeof item === 'object' ? JSON.stringify(item) : item
          ).join('; ')}"`;
        }
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value)}"`;
        }
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditDeliveryStatus = (transactionId: string, currentStatus: string) => {
    setEditingDeliveryStatus(transactionId);
    setDeliveryStatusValue(currentStatus || "pending");
  };

  const handleSaveDeliveryStatus = (transactionId: string) => {
    if (deliveryStatusValue) {
      updateDeliveryStatusMutation.mutate({ transactionId, deliveryStatus: deliveryStatusValue });
    }
  };

  const handleCancelEdit = () => {
    setEditingDeliveryStatus(null);
    setDeliveryStatusValue("");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r transform transition-transform duration-200 ease-in-out">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="text-sm md:text-base">
                <CardContent className="pt-4 md:pt-6">
                  <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Transactions</p>
                </CardContent>
              </Card>
              <Card className="text-sm md:text-base">
                <CardContent className="pt-4 md:pt-6">
                  <div className="text-xl md:text-2xl font-bold text-green-600">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card className="text-sm md:text-base">
                <CardContent className="pt-4 md:pt-6">
                  <div className="text-xl md:text-2xl font-bold text-orange-600">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card className="text-sm md:text-base">
                <CardContent className="pt-4 md:pt-6">
                  <div className="text-xl md:text-2xl font-bold text-red-600">{stats.failed}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
            </div>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 md:pb-6">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="truncate">All Transactions</span>
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    View and track all customer orders
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
                  <div className="flex gap-2">
                    <Select value={exportPaymentStatus} onValueChange={setExportPaymentStatus}>
                      <SelectTrigger className="w-full sm:w-36 md:w-40 text-xs md:text-sm" data-testid="export-payment-status">
                        <SelectValue placeholder="Export Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="paid">Paid Only</SelectItem>
                        <SelectItem value="pending">Pending Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => exportTransactionsMutation.mutate()}
                      disabled={exportTransactionsMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs px-2 py-1 h-8"
                    >
                      <Download className="h-3 w-3 md:h-4 md:w-4" />
                      {exportTransactionsMutation.isPending ? "Exporting..." : "Export CSV"}
                    </Button>
                  </div>
                  <div className="flex gap-2">
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-32 text-xs md:text-sm" data-testid="filter-status">
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
                      <SelectTrigger className="w-full sm:w-36 md:w-40 text-xs md:text-sm" data-testid="filter-type">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="data_bundle">Data Bundles</SelectItem>
                        <SelectItem value="result_checker">Result Checkers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                {isLoading ? (
                  <TableSkeleton rows={5} />
                ) : sortedTransactions && sortedTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs md:text-sm">Reference</TableHead>
                          <SortableTableHead field="productName" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                            <span className="text-xs md:text-sm">Product</span>
                          </SortableTableHead>
                          <TableHead className="hidden sm:table-cell text-xs md:text-sm">Network</TableHead>
                          <SortableTableHead field="amount" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                            <span className="text-xs md:text-sm">Amount</span>
                          </SortableTableHead>
                          <SortableTableHead field="profit" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                            <span className="text-xs md:text-sm">Profit</span>
                          </SortableTableHead>
                          <TableHead className="hidden lg:table-cell text-xs md:text-sm">Customer</TableHead>
                          <TableHead className="hidden xl:table-cell text-xs md:text-sm">Payment</TableHead>
                          <TableHead className="text-xs md:text-sm">Status</TableHead>
                          <TableHead className="hidden md:table-cell text-xs md:text-sm">Delivery</TableHead>
                          <SortableTableHead field="createdAt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                            <span className="text-xs md:text-sm">Date</span>
                          </SortableTableHead>
                          <TableHead className="text-xs md:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTransactions.map((tx) => {
                          let network = NETWORKS.find((n) => n.id === tx.network);
                          const isBulkOrder = (tx as any).isBulkOrder;
                          const phoneNumbersRaw = (tx as any).phoneNumbers;
                          const phoneNumbers = phoneNumbersRaw ? (typeof phoneNumbersRaw === 'string' ? (() => { try { return JSON.parse(phoneNumbersRaw); } catch (e) { console.error('Failed to parse phoneNumbers:', e, phoneNumbersRaw); return []; } })() : phoneNumbersRaw) as Array<{phone: string, bundleName: string, dataAmount: string}> : undefined;
                          const deliveryStatus = (tx as any).deliveryStatus || "pending";
                          
                          // For bulk orders, if network is not found, try to extract from bundle name
                          if (!network && isBulkOrder && phoneNumbers && phoneNumbers.length > 0) {
                            const bundleName = phoneNumbers[0].bundleName;
                            if (bundleName) {
                              const lower = bundleName.toLowerCase();
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
                              <TableCell className="font-mono text-xs md:text-sm">{tx.reference}</TableCell>
                              <TableCell className="max-w-[150px] md:max-w-[200px]">
                                <div className="font-medium truncate text-xs md:text-sm">{tx.productName}</div>
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    {tx.type === "data_bundle" ? "Data" : "Result"}
                                  </Badge>
                                  {isBulkOrder && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0 flex items-center gap-1">
                                      <Layers className="h-2.5 w-2.5" />
                                      {phoneNumbers?.length || 0}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {network ? (
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
                                {isBulkOrder && phoneNumbers && (
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(parseFloat(tx.amount) / phoneNumbers.length)} each
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-green-600 tabular-nums text-xs md:text-sm">
                                {formatCurrency(tx.profit)}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground text-xs md:text-sm">
                                {isBulkOrder && phoneNumbers ? (
                                  <div className="text-xs">
                                    <div className="font-semibold">
                                      {phoneNumbers.length} items: {phoneNumbers.map(p => p.dataAmount).join(', ')}
                                    </div>
                                    <div className="text-muted-foreground truncate max-w-[80px] md:max-w-[120px]">
                                      {phoneNumbers[0]?.phone || 'Unknown'}
                                    </div>
                                  </div>
                                ) : (
                                  tx.customerPhone
                                )}
                              </TableCell>
                              <TableCell className="hidden xl:table-cell">
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
                                <StatusBadge status={tx.status} />
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {editingDeliveryStatus === tx.id ? (
                                  <div className="flex items-center gap-2">
                                    <Select value={deliveryStatusValue} onValueChange={setDeliveryStatusValue}>
                                      <SelectTrigger className="w-24 md:w-32 h-7 md:h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveDeliveryStatus(tx.id)}
                                      disabled={updateDeliveryStatusMutation.isPending}
                                      className="h-7 px-2 text-xs"
                                    >
                                      {updateDeliveryStatusMutation.isPending ? "..." : "Save"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                      className="h-7 px-2 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Badge
                                    variant={
                                      deliveryStatus === "delivered" ? "default" :
                                      deliveryStatus === "processing" ? "secondary" :
                                      deliveryStatus === "failed" ? "destructive" :
                                      "outline"
                                    }
                                    className="cursor-pointer text-xs"
                                    onClick={() => handleEditDeliveryStatus(tx.id, deliveryStatus)}
                                  >
                                    {deliveryStatus}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs md:text-sm">
                                {formatDate(tx.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditDeliveryStatus(tx.id, deliveryStatus)}
                                  disabled={editingDeliveryStatus === tx.id}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
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

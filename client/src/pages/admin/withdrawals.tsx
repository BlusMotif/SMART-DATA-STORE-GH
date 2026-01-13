import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, WITHDRAWAL_STATUSES } from "@/lib/constants";
import { Wallet, CheckCircle, XCircle, Clock, Banknote, Menu } from "lucide-react";
import type { Withdrawal } from "@shared/schema";

interface WithdrawalWithAgent extends Withdrawal {
  agent: { businessName: string } | null;
  user: { name: string } | null;
}

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: withdrawals, isLoading } = useQuery<WithdrawalWithAgent[]>({
    queryKey: ["/api/admin/withdrawals"],
    refetchInterval: 20000, // Refetch every 20 seconds for withdrawals
    refetchOnWindowFocus: true,
  });

  const filteredWithdrawals = withdrawals?.filter((w) => {
    if (statusFilter === "all") return true;
    return w.status === statusFilter;
  });

  const stats = {
    total: withdrawals?.length || 0,
    pending: withdrawals?.filter((w) => w.status === "pending").length || 0,
    approved: withdrawals?.filter((w) => w.status === "approved").length || 0,
    rejected: withdrawals?.filter((w) => w.status === "rejected").length || 0,
    paid: withdrawals?.filter((w) => w.status === "paid").length || 0,
    totalAmount: withdrawals?.reduce((sum, w) => sum + parseFloat(w.amount), 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = WITHDRAWAL_STATUSES[status as keyof typeof WITHDRAWAL_STATUSES];
    return (
      <Badge className={statusConfig?.color || ""}>
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" | "mark_paid" }) => {
      const response = await apiRequest(`/api/admin/withdrawals/${id}/${action}`, {
        method: "POST",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      toast({
        title: "Success",
        description: "Withdrawal request updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update withdrawal request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string) => {
    actionMutation.mutate({ id, action: "approve" });
  };

  const handleReject = (id: string) => {
    actionMutation.mutate({ id, action: "reject" });
  };

  const handleMarkPaid = (id: string) => {
    actionMutation.mutate({ id, action: "mark_paid" });
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
            <h1 className="text-lg lg:text-xl font-semibold">Withdrawals</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Requests"
                value={stats.total}
                icon={Wallet}
                description="All time"
              />
              <StatCard
                title="Pending"
                value={stats.pending}
                icon={Clock}
                description="Awaiting approval"
              />
              <StatCard
                title="Approved"
                value={stats.approved}
                icon={CheckCircle}
                description="Ready for manual payout"
              />
              <StatCard
                title="Paid"
                value={stats.paid}
                icon={CheckCircle}
                description="Manually paid out"
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Withdrawal Requests
                  </CardTitle>
                  <CardDescription>
                    Track all agent withdrawal requests and their transfer status
                  </CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="filter-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={8} />
                ) : filteredWithdrawals && filteredWithdrawals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Account Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWithdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id} data-testid={`row-withdrawal-${withdrawal.id}`}>
                          <TableCell>
                            <div className="font-medium">{withdrawal.agent?.businessName}</div>
                            <div className="text-sm text-muted-foreground">{withdrawal.user?.name}</div>
                          </TableCell>
                          <TableCell className="font-bold tabular-nums text-lg">
                            {formatCurrency(withdrawal.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {withdrawal.paymentMethod === "bank" ? (
                                <Banknote className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Wallet className="h-4 w-4 text-green-600" />
                              )}
                              <span className="text-sm font-medium capitalize">
                                {withdrawal.paymentMethod?.replace("_", " ") || "Bank"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{withdrawal.accountName}</div>
                              <div className="text-muted-foreground">{withdrawal.accountNumber}</div>
                              {withdrawal.paymentMethod === "bank" && withdrawal.bankName && (
                                <div className="text-muted-foreground text-xs">{withdrawal.bankName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(withdrawal.createdAt)}
                          </TableCell>
                          <TableCell>
                            {withdrawal.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(withdrawal.id)}
                                  disabled={actionMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(withdrawal.id)}
                                  disabled={actionMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {withdrawal.status === "approved" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkPaid(withdrawal.id)}
                                disabled={actionMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark as Paid
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No withdrawal requests found.
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

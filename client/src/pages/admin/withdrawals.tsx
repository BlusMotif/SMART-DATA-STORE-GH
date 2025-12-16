import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, WITHDRAWAL_STATUSES } from "@/lib/constants";
import { Wallet, CheckCircle, XCircle, Clock, Banknote } from "lucide-react";
import type { Withdrawal } from "@shared/schema";

interface WithdrawalWithAgent extends Withdrawal {
  agent: { businessName: string } | null;
  user: { name: string } | null;
}

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processingWithdrawal, setProcessingWithdrawal] = useState<WithdrawalWithAgent | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data: withdrawals, isLoading } = useQuery<WithdrawalWithAgent[]>({
    queryKey: ["/api/admin/withdrawals"],
  });

  const processMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote: string }) =>
      apiRequest("PATCH", `/api/admin/withdrawals/${id}`, { status, adminNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      setProcessingWithdrawal(null);
      setAdminNote("");
      toast({ title: "Withdrawal processed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to process withdrawal", description: error.message, variant: "destructive" });
    },
  });

  const filteredWithdrawals = withdrawals?.filter((w) => {
    if (statusFilter === "all") return true;
    return w.status === statusFilter;
  });

  const stats = {
    total: withdrawals?.length || 0,
    pending: withdrawals?.filter((w) => w.status === "pending").length || 0,
    approved: withdrawals?.filter((w) => w.status === "approved" || w.status === "completed").length || 0,
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

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-6">
          <h1 className="text-xl font-semibold">Withdrawals</h1>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
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
                description="Awaiting review"
              />
              <StatCard
                title="Processed"
                value={stats.approved}
                icon={CheckCircle}
                description="Approved/completed"
              />
              <StatCard
                title="Total Amount"
                value={formatCurrency(stats.totalAmount)}
                icon={Banknote}
                description="All requests"
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
                    Review and process agent withdrawal requests
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
                        <TableHead>Bank Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                            <div className="text-sm">
                              <div className="font-medium">{withdrawal.bankName}</div>
                              <div className="text-muted-foreground">{withdrawal.accountNumber}</div>
                              <div className="text-muted-foreground">{withdrawal.accountName}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(withdrawal.createdAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {withdrawal.processedAt ? formatDate(withdrawal.processedAt) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {withdrawal.status === "pending" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => setProcessingWithdrawal(withdrawal)}
                                  data-testid={`button-process-${withdrawal.id}`}
                                >
                                  Process
                                </Button>
                              </div>
                            )}
                            {withdrawal.adminNote && (
                              <div className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                                Note: {withdrawal.adminNote}
                              </div>
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

      <Dialog open={!!processingWithdrawal} onOpenChange={(open) => !open && setProcessingWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
          </DialogHeader>
          {processingWithdrawal && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent:</span>
                  <span className="font-medium">{processingWithdrawal.agent?.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-lg">{formatCurrency(processingWithdrawal.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span>{processingWithdrawal.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account:</span>
                  <span>{processingWithdrawal.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{processingWithdrawal.accountName}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNote">Admin Note (Optional)</Label>
                <Textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add a note about this withdrawal..."
                  data-testid="input-admin-note"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() =>
                    processMutation.mutate({
                      id: processingWithdrawal.id,
                      status: "rejected",
                      adminNote,
                    })
                  }
                  disabled={processMutation.isPending}
                  data-testid="button-reject"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() =>
                    processMutation.mutate({
                      id: processingWithdrawal.id,
                      status: "approved",
                      adminNote,
                    })
                  }
                  disabled={processMutation.isPending}
                  data-testid="button-approve"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

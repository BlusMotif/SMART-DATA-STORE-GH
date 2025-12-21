import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AgentSidebar } from "@/components/layout/agent-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, WITHDRAWAL_STATUSES } from "@/lib/constants";
import { Wallet, Plus, DollarSign, Clock, CheckCircle, Menu } from "lucide-react";
import type { Withdrawal, Agent } from "@shared/schema";

const withdrawalSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(5, "Account number is required"),
  accountName: z.string().min(2, "Account name is required"),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export default function AgentWithdrawals() {
  const { toast } = useToast();
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: agent } = useQuery<Agent>({
    queryKey: ["/api/agent/profile"],
  });

  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/agent/withdrawals"],
  });

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const requestMutation = useMutation({
    mutationFn: (data: WithdrawalFormData) =>
      apiRequest("POST", "/api/agent/withdrawals", { ...data, amount: parseFloat(data.amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/profile"] });
      setIsRequestOpen(false);
      form.reset();
      toast({ title: "Withdrawal request submitted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit request", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: WithdrawalFormData) => {
    if (parseFloat(data.amount) > parseFloat(agent?.balance || "0")) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    requestMutation.mutate(data);
  };

  const stats = {
    pending: withdrawals?.filter((w) => w.status === "pending").length || 0,
    approved: withdrawals?.filter((w) => w.status === "approved" || w.status === "completed").length || 0,
    totalWithdrawn: withdrawals
      ?.filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + parseFloat(w.amount), 0) || 0,
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
            <h1 className="text-lg lg:text-xl font-semibold">Withdrawals</h1>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-request-withdrawal">
                  <Plus className="h-4 w-4 mr-2" />
                  Request Withdrawal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Withdrawal</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground">Available Balance</p>
                      <p className="text-2xl font-bold">{formatCurrency(agent?.balance || 0)}</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (GHS)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              data-testid="input-amount"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., MTN Mobile Money, Access Bank"
                              data-testid="input-bank-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account/Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter account or phone number"
                              data-testid="input-account-number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Name on account"
                              data-testid="input-account-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={requestMutation.isPending}
                      data-testid="button-submit-withdrawal"
                    >
                      {requestMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Available Balance"
                value={formatCurrency(agent?.balance || 0)}
                icon={Wallet}
                description="Ready to withdraw"
              />
              <StatCard
                title="Pending Requests"
                value={stats.pending}
                icon={Clock}
                description="Awaiting approval"
              />
              <StatCard
                title="Approved"
                value={stats.approved}
                icon={CheckCircle}
                description="Processed requests"
              />
              <StatCard
                title="Total Withdrawn"
                value={formatCurrency(stats.totalWithdrawn)}
                icon={DollarSign}
                description="All time"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Withdrawal History
                </CardTitle>
                <CardDescription>
                  Track your withdrawal requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={8} />
                ) : withdrawals && withdrawals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Bank Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id} data-testid={`row-withdrawal-${withdrawal.id}`}>
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
                          <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                            {withdrawal.adminNote || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No withdrawal requests yet. Click "Request Withdrawal" to cash out your earnings.
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

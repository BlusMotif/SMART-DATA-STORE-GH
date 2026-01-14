import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AgentSidebarV2 as AgentSidebar } from "@/components/layout/agent-sidebar-v2";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, WITHDRAWAL_STATUSES } from "@/lib/constants";
import { Wallet, Plus, DollarSign, Clock, CheckCircle, Menu, Smartphone, Building2 } from "lucide-react";
import type { Withdrawal, Agent } from "@shared/schema";

const withdrawalSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => parseFloat(val) >= 10, "Minimum withdrawal amount is GH₵10")
    .refine((val) => parseFloat(val) <= 100000, "Maximum withdrawal amount is GH₵100,000"),
  paymentMethod: z.enum(["bank", "mtn_momo", "telecel_cash", "airtel_tigo_cash", "vodafone_cash"], {
    required_error: "Please select a payment method"
  }),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  accountNumber: z.string().min(5, "Account/Phone number is required"),
  accountName: z.string().min(2, "Account name is required"),
}).refine((data) => {
  // For bank transfers, bank name and code are required
  if (data.paymentMethod === "bank") {
    return data.bankName && data.bankCode;
  }
  return true;
}, {
  message: "Bank name and code are required for bank transfers",
  path: ["bankName"],
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export default function AgentWithdrawals() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const { data: profileData } = useQuery<{ profile: Agent & { profitBalance: number; walletBalance: number; totalWithdrawals: number; role: string } }>({
    queryKey: ["/api/profile"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time balance updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always fetch fresh data
  });

  const agent = profileData?.profile;

  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/agent/withdrawals"],
    refetchInterval: 30000, // Refresh every 30 seconds for real-time withdrawal status updates
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Always fetch fresh data
  });

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "bank",
      bankName: "",
      bankCode: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const watchedPaymentMethod = form.watch("paymentMethod");

  const paymentMethods = [
    { value: "bank", label: "Bank Transfer", icon: Building2, description: "Transfer to bank account" },
    { value: "mtn_momo", label: "MTN Mobile Money", icon: Smartphone, description: "Send to MTN MoMo number" },
    { value: "telecel_cash", label: "Telecel Cash", icon: Smartphone, description: "Send to Telecel Cash number" },
    { value: "airtel_tigo_cash", label: "AirtelTigo Cash", icon: Smartphone, description: "Send to AirtelTigo Cash number" },
    { value: "vodafone_cash", label: "Vodafone Cash", icon: Smartphone, description: "Send to Vodafone Cash number" },
  ];

  const requestMutation = useMutation({
    mutationFn: (data: WithdrawalFormData) =>
      apiRequest("POST", "/api/agent/withdrawals", { ...data, amount: parseFloat(data.amount) }),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/profile"] });
      setIsRequestOpen(false);
      form.reset();
      toast({ 
        title: "Withdrawal Requested!", 
        description: response.message || "Your withdrawal request has been submitted and is pending admin approval."
      });
    },
    onError: (error: Error) => {
      toast({ title: "Withdrawal failed", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: WithdrawalFormData) => {
    const amount = parseFloat(data.amount);
    const balance = parseFloat(agent?.profitBalance || "0");
    
    if (amount < 10) {
      toast({ 
        title: "Amount too low", 
        description: "Minimum withdrawal amount is GH₵10",
        variant: "destructive" 
      });
      return;
    }
    
    if (amount > balance) {
      toast({ 
        title: "Insufficient balance", 
        description: `Available balance: ${formatCurrency(balance)}`,
        variant: "destructive" 
      });
      return;
    }
    requestMutation.mutate(data);
  };

  const stats = {
    pending: withdrawals?.filter((w) => w.status === "pending").length || 0,
    approved: withdrawals?.filter((w) => w.status === "approved" || w.status === "paid").length || 0,
    totalWithdrawn: withdrawals
      ?.filter((w) => w.status === "paid")
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
                  <DialogTitle>Request Profit Withdrawal</DialogTitle>
                  <DialogDescription>
                    Request profit withdrawal (Minimum: GH₵10). Funds will be transferred after admin approval.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground">Profit Balance</p>
                      <p className="text-2xl font-bold">{formatCurrency(agent?.profitBalance || 0)}</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (GHS) - Minimum GH₵10</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="10"
                              placeholder="10.00"
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
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  <div className="flex items-center gap-2">
                                    <method.icon className="h-4 w-4" />
                                    <div>
                                      <div className="font-medium">{method.label}</div>
                                      <div className="text-xs text-muted-foreground">{method.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedPaymentMethod === "bank" && (
                      <>
                        <FormField
                          control={form.control}
                          name="bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Access Bank, GTBank"
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
                          name="bankCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., 030100 (Access Bank)"
                                  data-testid="input-bank-code"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {watchedPaymentMethod === "bank" ? "Account Number" : "Phone Number"}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                watchedPaymentMethod === "bank"
                                  ? "Enter account number"
                                  : "Enter phone number (e.g., 0241234567)"
                              }
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
                title="Profit Balance"
                value={formatCurrency(agent?.profitBalance || 0)}
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
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Account Details</TableHead>
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
                            <div className="flex items-center gap-2">
                              {withdrawal.paymentMethod === "bank" ? (
                                <Building2 className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Smartphone className="h-4 w-4 text-green-600" />
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
                    No withdrawal requests yet. Click "Request Withdrawal" to submit a withdrawal request (Min: GH₵10).
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

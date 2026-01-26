import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/constants";
import { Wallet, Menu, Search, Plus, User, Users } from "lucide-react";

interface UserOrAgent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  walletBalance: number;
  createdAt: string;
}

interface TopupData {
  userId: string;
  amount: number;
  reason: string;
}

interface TopupResponse {
  success: boolean;
  userName: string;
  amount: number;
  newBalance: number;
  transaction: any;
}

export default function AdminManualTopup() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOrAgent | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupReason, setTopupReason] = useState("");
  const [showTopupDialog, setShowTopupDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: usersAndAgents, isLoading } = useQuery<UserOrAgent[]>({
    queryKey: ["/api/admin/users-agents"],
    refetchInterval: 30000,
  });

  const topupMutation = useMutation<TopupResponse, Error, TopupData>({
    mutationFn: (data: TopupData) =>
      apiRequest<TopupResponse>("POST", "/api/admin/manual-topup", data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users-agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "✅ Manual top-up successful",
        description: `${formatCurrency(data.amount)} added to ${data.userName}'s wallet`
      });
      setShowTopupDialog(false);
      setSelectedUser(null);
      setTopupAmount("");
      setTopupReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to process top-up",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const filteredUsers = usersAndAgents?.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone && user.phone.includes(searchQuery))
  ) || [];

  const handleTopup = () => {
    if (!selectedUser || !topupAmount || !topupReason) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive amount",
        variant: "destructive"
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmTopup = () => {
    if (!selectedUser) return;

    topupMutation.mutate({
      userId: selectedUser.id,
      amount: parseFloat(topupAmount),
      reason: topupReason
    });
    setShowConfirmDialog(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'agent':
      case 'dealer':
      case 'super_dealer':
      case 'master':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'master':
        return 'bg-purple-100 text-purple-800';
      case 'super_dealer':
        return 'bg-blue-100 text-blue-800';
      case 'dealer':
        return 'bg-green-100 text-green-800';
      case 'agent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r transform transition-transform duration-200 ease-in-out">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
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
            <div>
              <h1 className="text-lg font-semibold">Manual Top-up</h1>
              <p className="text-sm text-muted-foreground">
                Manually add funds to user/agent wallets
              </p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Search and Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Manual Wallet Top-up
                </CardTitle>
                <CardDescription>
                  Search for users or agents and manually add funds to their wallets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Users/Agents</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Users & Agents ({filteredUsers.length})</CardTitle>
                <CardDescription>
                  Select a user or agent to manually top-up their wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Wallet Balance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(user.role)}
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.phone || 'N/A'}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(user.walletBalance)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowTopupDialog(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Top-up
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {!isLoading && filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No users found matching your search.' : 'No users or agents found.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Top-up Dialog */}
      <Dialog open={showTopupDialog} onOpenChange={setShowTopupDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 border-0 shadow-lg text-white dark:text-white">
          <DialogHeader>
            <DialogTitle>Manual Wallet Top-up</DialogTitle>
            <DialogDescription>
              Add funds to {selectedUser?.name}'s wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (GHS)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select value={topupReason} onValueChange={setTopupReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compensation">Compensation</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="adjustment">Balance Adjustment</SelectItem>
                  <SelectItem value="promotion">Promotional Credit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <strong>Current Balance:</strong> {formatCurrency(selectedUser.walletBalance)}
                </div>
                <div className="text-sm">
                  <strong>New Balance:</strong> {formatCurrency(selectedUser.walletBalance + (parseFloat(topupAmount) || 0))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTopupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTopup} disabled={topupMutation.isPending}>
              {topupMutation.isPending ? "Processing..." : "Top-up Wallet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-0 shadow-lg text-white dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Manual Top-up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add {formatCurrency(parseFloat(topupAmount) || 0)} to {selectedUser?.name}'s wallet?
              <br />
              <strong>Reason:</strong> {topupReason}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTopup} className="bg-green-600 hover:bg-green-700">
              Confirm Top-up
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
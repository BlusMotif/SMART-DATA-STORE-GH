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
import { formatCurrency, formatDate } from "@/lib/constants";
import { UserCircle, Trash2, ShoppingBag, Menu } from "lucide-react";

interface UserWithLastPurchase {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  lastPurchase: {
    date: string;
    amount: number;
    productType: string;
  } | null;
  totalPurchases: number;
  totalSpent: number;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery<UserWithLastPurchase[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "✅ User deleted successfully" });
      setDeleteUserId(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete user", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const filteredUsers = users?.filter((user) => {
    if (roleFilter === "guest") return user.role === "guest";
    if (roleFilter === "agent") return user.role === "agent";
    if (roleFilter === "admin") return user.role === "admin";
    return true;
  });

  const stats = {
    total: users?.length || 0,
    guests: users?.filter((u) => u.role === "guest").length || 0,
    agents: users?.filter((u) => u.role === "agent").length || 0,
    admins: users?.filter((u) => u.role === "admin").length || 0,
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
            <h1 className="text-lg lg:text-xl font-semibold">Users</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats.total}
                icon={UserCircle}
                description="All registered users"
              />
              <StatCard
                title="Guests"
                value={stats.guests}
                icon={UserCircle}
                description="Regular users"
              />
              <StatCard
                title="Agents"
                value={stats.agents}
                icon={UserCircle}
                description="Agent accounts"
              />
              <StatCard
                title="Admins"
                value={stats.admins}
                icon={UserCircle}
                description="Administrator accounts"
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    All Users
                  </CardTitle>
                  <CardDescription>
                    Manage user accounts and track purchases
                  </CardDescription>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="guest">Guests</SelectItem>
                    <SelectItem value="agent">Agents</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={10} />
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Last Purchase</TableHead>
                          <TableHead>Total Purchases</TableHead>
                          <TableHead>Total Spent</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="font-medium">{user.name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{user.phone || "—"}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                user.role === "admin" ? "default" :
                                user.role === "agent" ? "secondary" :
                                "outline"
                              }>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.lastPurchase ? (
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {formatCurrency(user.lastPurchase.amount)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.lastPurchase.productType} • {formatDate(user.lastPurchase.date)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">No purchases</span>
                              )}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              <div className="flex items-center gap-1">
                                <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                                {user.totalPurchases}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium tabular-nums">
                              {formatCurrency(user.totalSpent)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(user.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteUserId(user.id)}
                                disabled={user.role === "admin"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No users found.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              All user data and transactions will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

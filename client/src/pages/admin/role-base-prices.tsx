import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/constants";
import { Plus, Pencil, Trash2, Menu, Settings } from "lucide-react";

type RoleBasePrice = {
  bundleId: string;
  role: string;
  basePrice: string;
};

type DataBundle = {
  id: string;
  name: string;
  network: string;
  dataAmount: string;
  validity: string;
};

export default function AdminRoleBasePrices() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<RoleBasePrice | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: roleBasePrices, isLoading } = useQuery<RoleBasePrice[]>({
    queryKey: ["/api/admin/role-base-prices"],
  });

  const { data: bundles } = useQuery<DataBundle[]>({
    queryKey: ["/api/admin/data-bundles"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { bundleId: string; role: string; basePrice: string }) =>
      apiRequest("POST", "/api/admin/role-base-prices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-base-prices"] });
      setIsCreateOpen(false);
      toast({ title: "Role base price set successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to set role base price", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ bundleId, role, basePrice }: { bundleId: string; role: string; basePrice: string }) =>
      apiRequest("POST", "/api/admin/role-base-prices", { bundleId, role, basePrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-base-prices"] });
      setEditingPrice(null);
      toast({ title: "Role base price updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update role base price", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ bundleId, role }: { bundleId: string; role: string }) =>
      apiRequest("DELETE", `/api/admin/role-base-prices/${bundleId}/${role}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-base-prices"] });
      toast({ title: "Role base price deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete role base price", description: error.message, variant: "destructive" });
    },
  });

  const getBundleName = (bundleId: string) => {
    const bundle = bundles?.find(b => b.id === bundleId);
    return bundle ? `${bundle.network.toUpperCase()} ${bundle.dataAmount} - ${bundle.validity}` : bundleId;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      agent: "Agent",
      dealer: "Dealer",
      super_dealer: "Super Dealer",
      master: "Master",
    };
    return labels[role] || role;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-black border-r transform transition-transform duration-200 ease-in-out">
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
            <h1 className="text-lg lg:text-xl font-semibold">Role Base Prices</h1>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-price">
                  <Plus className="h-4 w-4 mr-2" />
                  Set Base Price
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Role Base Price</DialogTitle>
                </DialogHeader>
                <PriceForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
                  bundles={bundles}
                />
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Role Base Prices
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {roleBasePrices?.length || 0} prices configured
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={8} />
                ) : roleBasePrices && roleBasePrices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Bundle</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roleBasePrices.map((price, index) => (
                        <TableRow key={`${price.bundleId}-${price.role}-${index}`}>
                          <TableCell className="font-medium">
                            {getBundleName(price.bundleId)}
                          </TableCell>
                          <TableCell>
                            {getRoleLabel(price.role)}
                          </TableCell>
                          <TableCell className="font-medium tabular-nums">
                            {formatCurrency(price.basePrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingPrice(price)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this base price?")) {
                                    deleteMutation.mutate({ bundleId: price.bundleId, role: price.role });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No role base prices configured. Click "Set Base Price" to create one.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!editingPrice} onOpenChange={(open) => !open && setEditingPrice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role Base Price</DialogTitle>
          </DialogHeader>
          {editingPrice && (
            <PriceForm
              price={editingPrice}
              onSubmit={(data) => updateMutation.mutate(data)}
              isLoading={updateMutation.isPending}
              bundles={bundles}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PriceForm({
  price,
  onSubmit,
  isLoading,
  bundles,
}: {
  price?: RoleBasePrice;
  onSubmit: (data: { bundleId: string; role: string; basePrice: string }) => void;
  isLoading: boolean;
  bundles?: DataBundle[];
}) {
  const [formData, setFormData] = useState({
    bundleId: price?.bundleId || "",
    role: price?.role || "agent",
    basePrice: price?.basePrice || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(formData.basePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      return;
    }

    onSubmit({
      bundleId: formData.bundleId,
      role: formData.role,
      basePrice: priceNum.toFixed(2),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Data Bundle</Label>
        <Select
          value={formData.bundleId}
          onValueChange={(value) => setFormData({ ...formData, bundleId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a data bundle" />
          </SelectTrigger>
          <SelectContent>
            {bundles?.map((bundle) => (
              <SelectItem key={bundle.id} value={bundle.id}>
                {bundle.network.toUpperCase()} {bundle.dataAmount} - {bundle.validity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="dealer">Dealer</SelectItem>
            <SelectItem value="super_dealer">Super Dealer</SelectItem>
            <SelectItem value="master">Master</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="basePrice">Base Price (GHS)</Label>
        <Input
          id="basePrice"
          type="number"
          step="0.01"
          value={formData.basePrice}
          onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
          placeholder="0.00"
          required
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : price ? "Update Price" : "Set Price"}
        </Button>
      </div>
    </form>
  );
}
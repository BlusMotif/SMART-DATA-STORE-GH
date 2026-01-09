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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, NETWORKS } from "@/lib/constants";
import { Plus, Pencil, Trash2, Smartphone, Menu } from "lucide-react";
import type { DataBundle } from "@shared/schema";

export default function AdminDataBundles() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<DataBundle | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: bundles, isLoading } = useQuery<DataBundle[]>({
    queryKey: ["/api/admin/data-bundles"],
    refetchInterval: 60000, // Refetch every minute for product data
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<DataBundle>) =>
      apiRequest("POST", "/api/admin/data-bundles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/data-bundles"] });
      setIsCreateOpen(false);
      toast({ title: "Data bundle created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create bundle", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DataBundle> }) =>
      apiRequest("PATCH", `/api/admin/data-bundles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/data-bundles"] });
      setEditingBundle(null);
      toast({ title: "Data bundle updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update bundle", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/admin/data-bundles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/data-bundles"] });
      toast({ title: "Data bundle deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete bundle", description: error.message, variant: "destructive" });
    },
  });

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
            <h1 className="text-lg lg:text-xl font-semibold">Data Bundles</h1>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-bundle">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bundle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Data Bundle</DialogTitle>
                </DialogHeader>
                <BundleForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
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
                  <Smartphone className="h-5 w-5" />
                  All Data Bundles
                </CardTitle>
                <Badge variant="secondary">{bundles?.length || 0} bundles</Badge>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={8} />
                ) : bundles && bundles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Network</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Validity</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Dealer</TableHead>
                        <TableHead>Super Dealer</TableHead>
                        <TableHead>Master</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bundles.map((bundle) => {
                        const network = NETWORKS.find((n) => n.id === bundle.network);
                        return (
                          <TableRow key={bundle.id} data-testid={`row-bundle-${bundle.id}`}>
                            <TableCell>
                              <Badge
                                style={{
                                  backgroundColor: network?.color,
                                  color: network?.textColor,
                                }}
                              >
                                {network?.name || bundle.network.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{bundle.network.toUpperCase()} {bundle.dataAmount} - {bundle.validity}</TableCell>
                            <TableCell>{bundle.dataAmount}</TableCell>
                            <TableCell>{bundle.validity}</TableCell>
                            <TableCell className="font-medium tabular-nums">
                              {formatCurrency(bundle.basePrice)}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {bundle.agentPrice ? formatCurrency(bundle.agentPrice) : '-'}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {bundle.dealerPrice ? formatCurrency(bundle.dealerPrice) : '-'}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {bundle.superDealerPrice ? formatCurrency(bundle.superDealerPrice) : '-'}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {bundle.masterPrice ? formatCurrency(bundle.masterPrice) : '-'}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {bundle.adminPrice ? formatCurrency(bundle.adminPrice) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={bundle.isActive ? "default" : "secondary"}>
                                {bundle.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingBundle(bundle)}
                                  data-testid={`button-edit-${bundle.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this bundle?")) {
                                      deleteMutation.mutate(bundle.id);
                                    }
                                  }}
                                  data-testid={`button-delete-${bundle.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No data bundles found. Click "Add Bundle" to create one.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!editingBundle} onOpenChange={(open) => !open && setEditingBundle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Bundle</DialogTitle>
          </DialogHeader>
          {editingBundle && (
            <BundleForm
              bundle={editingBundle}
              onSubmit={(data) => updateMutation.mutate({ id: editingBundle.id, data })}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BundleForm({
  bundle,
  onSubmit,
  isLoading,
}: {
  bundle?: DataBundle;
  onSubmit: (data: Partial<DataBundle>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: bundle?.name || "",
    network: bundle?.network || "mtn",
    dataAmount: bundle?.dataAmount || "",
    validity: bundle?.validity || "",
    basePrice: bundle?.basePrice || "",
    agentPrice: bundle?.agentPrice || "",
    dealerPrice: bundle?.dealerPrice || "",
    superDealerPrice: bundle?.superDealerPrice || "",
    masterPrice: bundle?.masterPrice || "",
    adminPrice: bundle?.adminPrice || "",
    isActive: bundle?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert empty strings to null for price fields
    const processedData = {
      ...formData,
      basePrice: formData.basePrice === "" ? null : formData.basePrice,
      agentPrice: formData.agentPrice === "" ? null : formData.agentPrice,
      dealerPrice: formData.dealerPrice === "" ? null : formData.dealerPrice,
      superDealerPrice: formData.superDealerPrice === "" ? null : formData.superDealerPrice,
      masterPrice: formData.masterPrice === "" ? null : formData.masterPrice,
      adminPrice: formData.adminPrice === "" ? null : formData.adminPrice,
    };
    
    onSubmit(processedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., MTN 1GB Daily"
            required
            data-testid="input-bundle-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="network">Network</Label>
          <Select
            value={formData.network}
            onValueChange={(value) => setFormData({ ...formData, network: value })}
          >
            <SelectTrigger data-testid="select-bundle-network">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NETWORKS.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataAmount">Data Amount</Label>
          <Input
            id="dataAmount"
            value={formData.dataAmount}
            onChange={(e) => setFormData({ ...formData, dataAmount: e.target.value })}
            placeholder="e.g., 1GB, 500MB"
            required
            data-testid="input-bundle-data"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="validity">Validity</Label>
          <Input
            id="validity"
            value={formData.validity}
            onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
            placeholder="e.g., 1 Day, 30 Days"
            required
            data-testid="input-bundle-validity"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            data-testid="input-bundle-price"
          />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agentPrice">Agent Price (GHS)</Label>
          <Input
            id="agentPrice"
            type="number"
            step="0.01"
            value={formData.agentPrice}
            onChange={(e) => setFormData({ ...formData, agentPrice: e.target.value })}
            placeholder="0.00"
            data-testid="input-bundle-agent-price"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dealerPrice">Dealer Price (GHS)</Label>
          <Input
            id="dealerPrice"
            type="number"
            step="0.01"
            value={formData.dealerPrice}
            onChange={(e) => setFormData({ ...formData, dealerPrice: e.target.value })}
            placeholder="0.00"
            data-testid="input-bundle-dealer-price"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="superDealerPrice">Super Dealer Price (GHS)</Label>
          <Input
            id="superDealerPrice"
            type="number"
            step="0.01"
            value={formData.superDealerPrice}
            onChange={(e) => setFormData({ ...formData, superDealerPrice: e.target.value })}
            placeholder="0.00"
            data-testid="input-bundle-super-dealer-price"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="masterPrice">Master Price (GHS)</Label>
          <Input
            id="masterPrice"
            type="number"
            step="0.01"
            value={formData.masterPrice}
            onChange={(e) => setFormData({ ...formData, masterPrice: e.target.value })}
            placeholder="0.00"
            data-testid="input-bundle-master-price"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminPrice">Admin Price (GHS)</Label>
          <Input
            id="adminPrice"
            type="number"
            step="0.01"
            value={formData.adminPrice}
            onChange={(e) => setFormData({ ...formData, adminPrice: e.target.value })}
            placeholder="0.00"
            data-testid="input-bundle-admin-price"
          />
        </div>
      </div>

      {/* Per-bundle API selection removed; system-wide API configuration used instead */}

      {(formData.network && formData.dataAmount && formData.validity && formData.basePrice) && (
        <div className="p-4 bg-muted rounded-lg border">
          <Label className="text-sm font-medium text-muted-foreground mb-2 block">Preview (How users will see this bundle)</Label>
          <div className="text-sm font-medium">
            {formData.network.toUpperCase()} {formData.dataAmount} - {formData.validity} - GH₵{formData.basePrice}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="switch-bundle-active"
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <Button type="submit" disabled={isLoading} data-testid="button-submit-bundle">
          {isLoading ? "Saving..." : bundle ? "Update Bundle" : "Create Bundle"}
        </Button>
      </div>
    </form>
  );
}

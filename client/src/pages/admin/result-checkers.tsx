import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, RESULT_CHECKER_TYPES } from "@/lib/constants";
import { Plus, FileCheck, Package, AlertCircle, Menu } from "lucide-react";
import type { ResultChecker } from "@shared/schema";

interface StockSummary {
  type: string;
  year: number;
  total: number;
  available: number;
  sold: number;
}

export default function AdminResultCheckers() {
  const { toast } = useToast();
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingChecker, setEditingChecker] = useState<ResultChecker | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: checkers, isLoading } = useQuery<ResultChecker[]>({
    queryKey: ["/api/admin/result-checkers"],
    refetchInterval: 60000, // Refetch every minute for stock data
    refetchOnWindowFocus: true,
  });

  const { data: stockSummary } = useQuery<StockSummary[]>({
    queryKey: ["/api/admin/result-checkers/summary"],
    refetchInterval: 60000, // Refetch every minute for stock summary
    refetchOnWindowFocus: true,
  });

  const bulkAddMutation = useMutation<{ added: number }, Error, { type: string; year: number; basePrice: string; costPrice: string; checkers: string; file?: File }>({
    mutationFn: async (data: { type: string; year: number; basePrice: string; costPrice: string; checkers: string; file?: File }) => {
      if (data.file) {
        // Handle file upload
        const formData = new FormData();
        formData.append('type', data.type);
        formData.append('year', data.year.toString());
        formData.append('basePrice', data.basePrice);
        formData.append('costPrice', data.costPrice);
        formData.append('file', data.file);

        const response = await fetch('/api/admin/result-checkers/bulk-upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: await(async () => {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;
            const headers: Record<string, string> = {};
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            return headers;
          })(),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(errorData.message || 'Upload failed');
        }

        return response.json();
      } else {
        // Handle text input
        const response = await apiRequest("POST", "/api/admin/result-checkers/bulk", {
          type: data.type,
          year: data.year,
          basePrice: data.basePrice,
          costPrice: data.costPrice,
          checkers: data.checkers,
        });
        return response;
      }
    },
    onSuccess: (data: { added: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/result-checkers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/result-checkers/summary"] });
      setIsBulkAddOpen(false);
      toast({ title: `${data.added} result checkers added successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add checkers", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<ResultChecker> }) => {
      const response = await apiRequest("PUT", `/api/admin/result-checkers/${data.id}`, data.updates);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/result-checkers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/result-checkers/summary"] });
      setIsEditOpen(false);
      setEditingChecker(null);
      toast({ title: "Result checker updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update checker", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/result-checkers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/result-checkers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/result-checkers/summary"] });
      toast({ title: "Result checker deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete checker", description: error.message, variant: "destructive" });
    },
  });

  const filteredCheckers = checkers?.filter((checker) => {
    if (selectedType !== "all" && checker.type !== selectedType) return false;
    if (selectedYear !== "all" && checker.year.toString() !== selectedYear) return false;
    return true;
  });

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const totalStock = stockSummary?.reduce((acc, s) => acc + s.total, 0) || 0;
  const availableStock = stockSummary?.reduce((acc, s) => acc + s.available, 0) || 0;
  const soldStock = stockSummary?.reduce((acc, s) => acc + s.sold, 0) || 0;

  const handleEdit = (checker: ResultChecker) => {
    setEditingChecker(checker);
    setIsEditOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this result checker?")) {
      deleteMutation.mutate(id);
    }
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
            <h1 className="text-lg lg:text-xl font-semibold">Result Checkers</h1>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-bulk-add">
                  <Plus className="h-4 w-4 mr-2" />
                  Bulk Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Bulk Add Result Checkers</DialogTitle>
                </DialogHeader>
                <BulkAddForm
                  onSubmit={(data) => bulkAddMutation.mutate(data)}
                  isLoading={bulkAddMutation.isPending}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Result Checker</DialogTitle>
                </DialogHeader>
                {editingChecker && (
                  <EditForm
                    checker={editingChecker}
                    onSubmit={(updates) => updateMutation.mutate({ id: editingChecker.id, updates })}
                    isLoading={updateMutation.isPending}
                  />
                )}
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Stock"
                value={totalStock}
                icon={Package}
                description="All result checkers"
              />
              <StatCard
                title="Available"
                value={availableStock}
                icon={FileCheck}
                description="Ready for sale"
              />
              <StatCard
                title="Sold"
                value={soldStock}
                icon={AlertCircle}
                description="Delivered to customers"
              />
            </div>

            {stockSummary && stockSummary.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stockSummary.map((item) => (
                  <Card key={`${item.type}-${item.year}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {item.type.toUpperCase()} {item.year}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold">{item.available}</span>
                        <span className="text-sm text-muted-foreground">/ {item.total} total</span>
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        {/* eslint-disable-next-line react/forbid-dom-props */}
                        {/* Dynamic width for progress bar - inline style required for calculated percentage */}
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min((item.available / item.total) * 100, 100)}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3 md:pb-6">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <FileCheck className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="truncate">Result Checker Inventory</span>
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    View and manage PIN/Serial inventory
                  </CardDescription>
                </div>
                <div className="flex gap-1 md:gap-2 flex-shrink-0">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-24 md:w-32 text-xs md:text-sm" data-testid="filter-type">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {RESULT_CHECKER_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-20 md:w-32 text-xs md:text-sm" data-testid="filter-year">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="px-3 md:px-6">
                {isLoading ? (
                  <TableSkeleton rows={5} />
                ) : filteredCheckers && filteredCheckers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs md:text-sm">Type</TableHead>
                          <TableHead className="text-xs md:text-sm">Year</TableHead>
                          <TableHead className="text-xs md:text-sm">Serial</TableHead>
                          <TableHead className="text-xs md:text-sm">PIN</TableHead>
                          <TableHead className="text-xs md:text-sm">Price</TableHead>
                          <TableHead className="text-xs md:text-sm">Status</TableHead>
                          <TableHead className="hidden md:table-cell text-xs md:text-sm">Sold To</TableHead>
                          <TableHead className="hidden lg:table-cell text-xs md:text-sm">Date</TableHead>
                          <TableHead className="text-xs md:text-sm">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCheckers.slice(0, 20).map((checker) => (
                          <TableRow key={checker.id} data-testid={`row-checker-${checker.id}`}>
                            <TableCell className="text-xs md:text-sm">
                              <Badge variant="outline" className="text-xs">{checker.type.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell className="font-medium text-xs md:text-sm">{checker.year}</TableCell>
                            <TableCell className="font-mono text-xs md:text-sm">{checker.serialNumber}</TableCell>
                            <TableCell className="font-mono text-xs md:text-sm">
                              {checker.isSold ? checker.pin : "****"}
                            </TableCell>
                            <TableCell className="tabular-nums text-xs md:text-sm">
                              {formatCurrency(checker.basePrice)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={checker.isSold ? "secondary" : "default"} className="text-xs">
                                {checker.isSold ? "Sold" : "Available"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-xs md:text-sm">
                              {checker.soldToPhone || "-"}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                              {checker.soldAt ? formatDate(checker.soldAt) : formatDate(checker.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 md:gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(checker)}
                                  disabled={checker.isSold}
                                  className="text-xs px-2 py-1 h-7"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(checker.id)}
                                  className="text-destructive hover:text-destructive text-xs px-2 py-1 h-7"
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-12 text-muted-foreground text-sm md:text-base">
                    No result checkers found. Use "Bulk Add" to add inventory.
                  </div>
                )}
                {filteredCheckers && filteredCheckers.length > 20 && (
                  <div className="text-center py-2 md:py-4 text-xs md:text-sm text-muted-foreground">
                    Showing 20 of {filteredCheckers.length} items
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

function BulkAddForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: { type: string; year: number; basePrice: string; costPrice: string; checkers: string; file?: File }) => void;
  isLoading: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    type: "bece",
    year: currentYear.toString(),
    basePrice: "",
    costPrice: "",
    checkers: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      year: parseInt(formData.year),
      file: uploadedFile || undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Clear manual input when file is selected
      setFormData({ ...formData, checkers: "" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger data-testid="select-checker-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESULT_CHECKER_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Year</Label>
          <Select
            value={formData.year}
            onValueChange={(value) => setFormData({ ...formData, year: value })}
          >
            <SelectTrigger data-testid="select-checker-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear, currentYear + 1, currentYear - 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="costPrice">Cost Price (GHS)</Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            placeholder="0.00"
            required
            data-testid="input-checker-cost"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="basePrice">Selling Price (GHS)</Label>
          <Input
            id="basePrice"
            type="number"
            step="0.01"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
            placeholder="0.00"
            required
            data-testid="input-checker-price"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkers">PIN/Serial Pairs</Label>
        <Textarea
          id="checkers"
          value={formData.checkers}
          onChange={(e) => setFormData({ ...formData, checkers: e.target.value })}
          placeholder="Enter one per line in format: SERIAL,PIN&#10;e.g.,&#10;ABC123456,1234567890&#10;DEF789012,0987654321"
          rows={8}
          required={!uploadedFile}
          disabled={!!uploadedFile}
          data-testid="input-checker-pairs"
        />
        <p className="text-xs text-muted-foreground">
          Format: SERIAL,PIN (one per line) - OR upload a CSV file below
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Upload CSV File (Optional)</Label>
        <Input
          id="file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          data-testid="input-checker-file"
        />
        <p className="text-xs text-muted-foreground">
          CSV format: SERIAL,PIN (one pair per line, no headers)
        </p>
        {uploadedFile && (
          <p className="text-sm text-green-600">
            File selected: {uploadedFile.name}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-checkers">
        {isLoading ? "Adding..." : "Add Result Checkers"}
      </Button>
    </form>
  );
}

function EditForm({
  checker,
  onSubmit,
  isLoading,
}: {
  checker: ResultChecker;
  onSubmit: (updates: Partial<ResultChecker>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    type: checker.type,
    year: checker.year.toString(),
    serialNumber: checker.serialNumber,
    pin: checker.pin,
    basePrice: checker.basePrice,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: formData.type,
      year: parseInt(formData.year),
      serialNumber: formData.serialNumber,
      pin: formData.pin,
      basePrice: formData.basePrice,
    });
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESULT_CHECKER_TYPES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Year</Label>
          <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="edit-serial">Serial Number</Label>
        <Input
          id="edit-serial"
          value={formData.serialNumber}
          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="edit-pin">PIN</Label>
        <Input
          id="edit-pin"
          value={formData.pin}
          onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-base-price">Base Price</Label>
          <Input
            id="edit-base-price"
            type="number"
            step="0.01"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Updating..." : "Update Result Checker"}
      </Button>
    </form>
  );
}

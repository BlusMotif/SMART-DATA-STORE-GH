import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Plus, FileCheck, Package, AlertCircle } from "lucide-react";
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
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const { data: checkers, isLoading } = useQuery<ResultChecker[]>({
    queryKey: ["/api/admin/result-checkers"],
  });

  const { data: stockSummary } = useQuery<StockSummary[]>({
    queryKey: ["/api/admin/result-checkers/summary"],
  });

  const bulkAddMutation = useMutation({
    mutationFn: (data: { type: string; year: number; basePrice: string; costPrice: string; checkers: string }) =>
      apiRequest("/api/admin/result-checkers/bulk", { method: "POST", body: JSON.stringify(data) }),
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

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-6">
          <h1 className="text-xl font-semibold">Result Checkers</h1>
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
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
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
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(item.available / item.total) * 100}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5" />
                    Result Checker Inventory
                  </CardTitle>
                  <CardDescription>
                    View and manage PIN/Serial inventory
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-32" data-testid="filter-type">
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
                    <SelectTrigger className="w-32" data-testid="filter-year">
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
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={10} />
                ) : filteredCheckers && filteredCheckers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>PIN</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sold To</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCheckers.slice(0, 50).map((checker) => (
                        <TableRow key={checker.id} data-testid={`row-checker-${checker.id}`}>
                          <TableCell>
                            <Badge variant="outline">{checker.type.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{checker.year}</TableCell>
                          <TableCell className="font-mono text-sm">{checker.serialNumber}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {checker.isSold ? checker.pin : "****"}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatCurrency(checker.basePrice)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={checker.isSold ? "secondary" : "default"}>
                              {checker.isSold ? "Sold" : "Available"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {checker.soldToPhone || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {checker.soldAt ? formatDate(checker.soldAt) : formatDate(checker.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No result checkers found. Use "Bulk Add" to add inventory.
                  </div>
                )}
                {filteredCheckers && filteredCheckers.length > 50 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Showing 50 of {filteredCheckers.length} items
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
  onSubmit: (data: { type: string; year: number; basePrice: string; costPrice: string; checkers: string }) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      year: parseInt(formData.year),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
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
          <Label htmlFor="year">Year</Label>
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
          required
          data-testid="input-checker-pairs"
        />
        <p className="text-xs text-muted-foreground">
          Format: SERIAL,PIN (one per line)
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-checkers">
        {isLoading ? "Adding..." : "Add Result Checkers"}
      </Button>
    </form>
  );
}

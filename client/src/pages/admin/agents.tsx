import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/constants";
import { Users, CheckCircle, XCircle, Clock, Store, Menu, Trash2, Edit } from "lucide-react";
import type { Agent } from "@shared/schema";

const whatsappSchema = z.object({
  whatsappSupportLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  whatsappChannelLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type WhatsappFormData = z.infer<typeof whatsappSchema>;

interface AgentWithUser extends Agent {
  user: { name: string; email: string; phone: string } | null;
}

export default function AdminAgents() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [editAgentId, setEditAgentId] = useState<string | null>(null);

  const whatsappForm = useForm<WhatsappFormData>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      whatsappSupportLink: "",
      whatsappChannelLink: "",
    },
  });

  const { data: agents, isLoading } = useQuery<AgentWithUser[]>({
    queryKey: ["/api/admin/agents"],
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/agents/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "✅ Agent deleted successfully" });
      setDeleteAgentId(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete agent", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateWhatsappMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WhatsappFormData }) =>
      apiRequest("PATCH", `/api/admin/agents/${id}/whatsapp`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      toast({ title: "✅ WhatsApp links updated successfully" });
      setEditAgentId(null);
      whatsappForm.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update WhatsApp links", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const filteredAgents = agents?.filter((agent) => {
    if (statusFilter === "approved") return agent.isApproved;
    if (statusFilter === "pending") return !agent.isApproved;
    return true;
  });

  const stats = {
    total: agents?.length || 0,
    approved: agents?.filter((a) => a.isApproved).length || 0,
    pending: agents?.filter((a) => !a.isApproved).length || 0,
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
            <h1 className="text-lg lg:text-xl font-semibold">Agents</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Agents"
                value={stats.total}
                icon={Users}
                description="Registered agents"
              />
              <StatCard
                title="Approved"
                value={stats.approved}
                icon={CheckCircle}
                description="Active agents"
              />
              <StatCard
                title="Pending Approval"
                value={stats.pending}
                icon={Clock}
                description="Awaiting review"
              />
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    All Agents
                  </CardTitle>
                  <CardDescription>
                    Manage agent accounts and approvals
                  </CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="filter-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <TableSkeleton rows={8} />
                ) : filteredAgents && filteredAgents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Storefront</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Total Sales</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAgents.map((agent) => (
                        <TableRow key={agent.id} data-testid={`row-agent-${agent.id}`}>
                          <TableCell>
                            <div className="font-medium">{agent.businessName}</div>
                            {agent.businessDescription && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {agent.businessDescription}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{agent.user?.name}</div>
                            <div className="text-xs text-muted-foreground">{agent.user?.email}</div>
                            <div className="text-xs text-muted-foreground">{agent.user?.phone}</div>
                          </TableCell>
                          <TableCell>
                            <a
                              href={`/store/${agent.storefrontSlug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-mono text-sm"
                            >
                              /store/{agent.storefrontSlug}
                            </a>
                          </TableCell>
                          <TableCell className="font-medium tabular-nums">
                            {formatCurrency(agent.balance)}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatCurrency(agent.totalSales)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={agent.isApproved ? "default" : "secondary"}>
                              {agent.isApproved ? "Approved" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(agent.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditAgentId(agent.id);
                                  whatsappForm.reset({
                                    whatsappSupportLink: agent.whatsappSupportLink || "",
                                    whatsappChannelLink: agent.whatsappChannelLink || "",
                                  });
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteAgentId(agent.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No agents found.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteAgentId} onOpenChange={(open) => !open && setDeleteAgentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agent? This action cannot be undone.
              The agent's storefront, transactions, and all related data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAgentId && deleteMutation.mutate(deleteAgentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit WhatsApp Links Dialog */}
      <Dialog open={!!editAgentId} onOpenChange={(open) => !open && setEditAgentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit WhatsApp Links</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={whatsappForm.handleSubmit((data) => {
              if (editAgentId) {
                updateWhatsappMutation.mutate({ id: editAgentId, data });
              }
            })}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="whatsappSupportLink">WhatsApp Support Link</Label>
              <Input
                id="whatsappSupportLink"
                placeholder="https://wa.me/1234567890"
                {...whatsappForm.register("whatsappSupportLink")}
              />
              {whatsappForm.formState.errors.whatsappSupportLink && (
                <p className="text-sm text-destructive mt-1">
                  {whatsappForm.formState.errors.whatsappSupportLink.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="whatsappChannelLink">WhatsApp Channel Link</Label>
              <Input
                id="whatsappChannelLink"
                placeholder="https://whatsapp.com/channel/..."
                {...whatsappForm.register("whatsappChannelLink")}
              />
              {whatsappForm.formState.errors.whatsappChannelLink && (
                <p className="text-sm text-destructive mt-1">
                  {whatsappForm.formState.errors.whatsappChannelLink.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditAgentId(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateWhatsappMutation.isPending}
              >
                {updateWhatsappMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

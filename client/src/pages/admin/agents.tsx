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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/constants";
import { Users, CheckCircle, XCircle, Clock, Store } from "lucide-react";
import type { Agent } from "@shared/schema";

interface AgentWithUser extends Agent {
  user: { name: string; email: string; phone: string } | null;
}

export default function AdminAgents() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: agents, isLoading } = useQuery<AgentWithUser[]>({
    queryKey: ["/api/admin/agents"],
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      apiRequest(`/api/admin/agents/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ isApproved }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      toast({ title: "Agent status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update agent", description: error.message, variant: "destructive" });
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
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-6">
          <h1 className="text-xl font-semibold">Agents</h1>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
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
                              {agent.isApproved ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    approveMutation.mutate({ id: agent.id, isApproved: false })
                                  }
                                  disabled={approveMutation.isPending}
                                  data-testid={`button-revoke-${agent.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Revoke
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    approveMutation.mutate({ id: agent.id, isApproved: true })
                                  }
                                  disabled={approveMutation.isPending}
                                  data-testid={`button-approve-${agent.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              )}
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
    </div>
  );
}

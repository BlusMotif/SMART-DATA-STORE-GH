import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/constants";
import { Trophy, Award, Medal, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopCustomer {
  customerEmail: string;
  customerPhone: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
}

export default function AdminRankings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: topCustomers, isLoading: rankingsLoading } = useQuery<TopCustomer[]>({
    queryKey: ["/api/admin/rankings/customers"],
    refetchInterval: 60000, // Refresh every minute
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-black border-r transform transition-transform duration-200 ease-in-out">
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
            <h1 className="text-lg lg:text-xl font-semibold">Users Ranking</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Customers
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Highest spending customers</p>
                </div>
              </CardHeader>
              <CardContent>
                {rankingsLoading ? (
                  <TableSkeleton rows={10} />
                ) : topCustomers && topCustomers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                          <TableHead className="text-right">Purchases</TableHead>
                          <TableHead className="text-right">Last Purchase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topCustomers.map((customer, index) => (
                          <TableRow key={customer.customerPhone}>
                            <TableCell className="text-center">
                              {getRankIcon(index)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.customerPhone}</span>
                                {customer.customerEmail && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {customer.customerEmail}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(customer.totalSpent)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary">
                                {customer.totalPurchases} {customer.totalPurchases === 1 ? 'order' : 'orders'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {formatDate(customer.lastPurchase)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No customer rankings yet</p>
                    <p className="text-sm">Customer rankings will appear here once transactions are completed</p>
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

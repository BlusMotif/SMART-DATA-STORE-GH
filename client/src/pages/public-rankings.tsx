import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { TableSkeleton } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Medal, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopCustomer {
  rank: number;
  displayName: string;
  displayPhone: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
}

export default function PublicRankings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const { data: topCustomers, isLoading: rankingsLoading } = useQuery<TopCustomer[]>({
    queryKey: ["/api/rankings/customers"],
    refetchInterval: 60000, // Refresh every minute
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                        <TableHead className="text-right">Purchases</TableHead>
                        <TableHead className="text-right">Total Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topCustomers.map((customer, index) => (
                        <TableRow key={customer.rank}>
                          <TableCell className="text-center">
                            {getRankIcon(index)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <span className="font-medium">{customer.displayName}</span>
                              {customer.displayPhone && (
                                <span className="text-xs text-muted-foreground">
                                  {customer.displayPhone}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {customer.totalPurchases}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₵{customer.totalSpent.toFixed(2)}
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
  );
}
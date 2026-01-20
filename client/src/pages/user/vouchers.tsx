import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, Menu, FileCheck, ShoppingCart, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/api";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import resultLogo from "@assets/result_1765780772205.jpg";

interface ResultCheckerStock {
  type: string;
  year: number;
  price: number;
  stock: number;
}

export default function UserVouchersPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch result checker stock
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["result-checker-stock"],
    queryFn: () => apiRequest("/api/result-checkers/stock"),
  });

  // Fetch user stats for wallet balance
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => apiRequest("/api/user/stats"),
  });

  const resultCheckers = stockData || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b px-6 h-16 shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-white dark:bg-black">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation for your dashboard</SheetDescription>
                </VisuallyHidden>
                <UserSidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-xl font-bold">Vouchers</h1>
              <p className="text-sm text-muted-foreground">Purchase result checkers and vouchers</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Wallet Balance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    `GH₵${userStats?.walletBalance || 0}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Available for purchases</p>
                <Link href="/user/wallet">
                  <Button variant="outline" size="sm" className="text-xs mt-3">
                    Top Up Wallet
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Result Checkers Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <img
                    src={resultLogo}
                    alt="Result Checkers"
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                  <div>
                    <CardTitle>WAEC Result Checkers</CardTitle>
                    <CardDescription>
                      Purchase WAEC result checking vouchers for different years
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stockLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : resultCheckers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resultCheckers.map((checker: ResultCheckerStock) => (
                      <Card key={`${checker.type}-${checker.year}`} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {checker.type.toUpperCase()} {checker.year}
                            </CardTitle>
                            <Badge variant={checker.stock > 0 ? "default" : "destructive"}>
                              {checker.stock > 0 ? `${checker.stock} in stock` : "Out of stock"}
                            </Badge>
                          </div>
                          <CardDescription>
                            WAEC Result Checker Voucher
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-2xl font-bold text-primary">
                              GH₵{checker.price}
                            </div>
                            <Link href={`/checkout/result_checker/${checker.type}-${checker.year}`}>
                              <Button
                                className="w-full"
                                disabled={checker.stock === 0}
                              >
                                <FileCheck className="h-4 w-4 mr-2" />
                                {checker.stock > 0 ? "Purchase Now" : "Out of Stock"}
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No result checkers available at the moment.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Other Vouchers Section - Placeholder for future vouchers */}
            <Card>
              <CardHeader>
                <CardTitle>Other Vouchers</CardTitle>
                <CardDescription>
                  More voucher types coming soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>More voucher types will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
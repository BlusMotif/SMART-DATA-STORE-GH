import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, ShoppingCart, CreditCard, Wallet, Menu, Package } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/api";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [upgradeErrors, setUpgradeErrors] = useState<{ businessName?: string; storefrontSlug?: string }>({});
  const [storefrontSlugValue, setStorefrontSlugValue] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const slugTimerRef = useRef<number | null>(null);

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: () => apiRequest("/api/user/stats"),
    refetchInterval: 10000,
  });

  // Fetch recent transactions (last 5)
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => apiRequest("/api/transactions"),
    refetchInterval: 10000,
    select: (data) => data.slice(0, 5), // Only show 5 most recent
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <UserSidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation for your dashboard</SheetDescription>
          </VisuallyHidden>
          <UserSidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

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
              <SheetContent side="left" className="p-0 w-64">
                <VisuallyHidden>
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription>Main navigation for your dashboard</SheetDescription>
                </VisuallyHidden>
                <UserSidebar onClose={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-xl font-bold">Welcome back, {user.name}!</h1>
              <p className="text-sm text-muted-foreground">Here's your account overview</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6 mt-4">
            {/* Upgrade to Agent */}
            <Card>
              <CardHeader>
                <CardTitle>Upgrade to Agent</CardTitle>
                <CardDescription>Become an agent and start earning commissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => setUpgradeOpen(true)} variant="outline">Use Same Account</Button>
                  <a href={`/agent/register?email=${encodeURIComponent(user.email)}`}>
                    <Button variant="ghost">Create New Agent Account</Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade dialog */}
            <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upgrade Using Your Current Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <Form onSubmit={() => {}}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setUpgradeErrors({});
                        const form = e.target as HTMLFormElement;
                        const businessName = (form.elements.namedItem("businessName") as HTMLInputElement).value.trim();
                        const storefrontSlug = (form.elements.namedItem("storefrontSlug") as HTMLInputElement).value.trim().toLowerCase();

                        const errors: { businessName?: string; storefrontSlug?: string } = {};
                        if (!businessName || businessName.length < 2) errors.businessName = "Business name must be at least 2 characters";
                        if (!storefrontSlug || storefrontSlug.length < 3) errors.storefrontSlug = "URL must be at least 3 characters";
                        else if (!/^[a-z0-9-]+$/.test(storefrontSlug)) errors.storefrontSlug = "Only lowercase letters, numbers and hyphens are allowed";

                        if (Object.keys(errors).length > 0) {
                          setUpgradeErrors(errors);
                          return;
                        }

                        setUpgradeSubmitting(true);
                        // Call upgrade endpoint
                        fetch("/api/agent/upgrade", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ businessName, storefrontSlug }),
                        })
                          .then((r) => r.json())
                          .then((data) => {
                            if (data.paymentUrl) {
                              toast({ title: "Redirecting to payment..." });
                              window.location.href = data.paymentUrl;
                            } else {
                              toast({ title: "Upgrade failed", description: data.error || "Unable to start upgrade", variant: "destructive" });
                            }
                          })
                          .catch((err) => {
                            toast({ title: "Upgrade failed", description: err.message || "Something went wrong", variant: "destructive" });
                          })
                          .finally(() => setUpgradeSubmitting(false));
                      }}
                      className="space-y-3"
                    >
                      <FormField
                        name="businessName"
                        render={() => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input name="businessName" defaultValue={user.name || ""} />
                            </FormControl>
                            {upgradeErrors.businessName && <p className="text-sm text-red-600 mt-1">{upgradeErrors.businessName}</p>}
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="storefrontSlug"
                        render={() => (
                          <FormItem>
                            <FormLabel>Storefront Slug</FormLabel>
                            <FormControl>
                              <Input
                                name="storefrontSlug"
                                placeholder="my-store"
                                value={storefrontSlugValue}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setStorefrontSlugValue(v);
                                  setSlugAvailable(null);
                                  setUpgradeErrors((s) => ({ ...s, storefrontSlug: undefined }));
                                  if (slugTimerRef.current) window.clearTimeout(slugTimerRef.current);
                                  slugTimerRef.current = window.setTimeout(() => {
                                    const slug = v.trim().toLowerCase();
                                    if (!slug || slug.length < 3 || !/^[a-z0-9-]+$/.test(slug)) {
                                      setSlugAvailable(null);
                                      setSlugChecking(false);
                                      return;
                                    }
                                    setSlugChecking(true);
                                    fetch(`/api/agent/check-slug?slug=${encodeURIComponent(slug)}`)
                                      .then((r) => r.json())
                                      .then((data) => {
                                        setSlugAvailable(!!data.available);
                                      })
                                      .catch(() => setSlugAvailable(null))
                                      .finally(() => setSlugChecking(false));
                                  }, 500);
                                }}
                              />
                            </FormControl>
                            {upgradeErrors.storefrontSlug && <p className="text-sm text-red-600 mt-1">{upgradeErrors.storefrontSlug}</p>}
                            {slugChecking && <p className="text-sm text-muted-foreground mt-1">Checking availability...</p>}
                            {slugAvailable === true && <p className="text-sm text-green-600 mt-1">Available</p>}
                            {slugAvailable === false && <p className="text-sm text-red-600 mt-1">Taken</p>}
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button type="submit" disabled={upgradeSubmitting}>
                          {upgradeSubmitting ? "Processing…" : "Proceed to Payment (GH₵60.00)"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `GH₵${stats?.walletBalance || '0.00'}`
                    )}
                  </div>
                  <Link href="/user/wallet">
                    <Button variant="outline" size="sm" className="text-xs mt-3">
                      Top Up Wallet
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      stats?.totalOrders || 0
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">All time purchases</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      `GH₵${stats?.totalSpent || 0}`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">All time spending</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start purchasing data bundles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link href="/user/bundles/mtn">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">MTN Bundles</span>
                    </Button>
                  </Link>
                  <Link href="/user/bundles/at-ishare">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">AT iShare</span>
                    </Button>
                  </Link>
                  <Link href="/user/bundles/at-bigtime">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">AT BIG TIME</span>
                    </Button>
                  </Link>
                  <Link href="/user/bundles/telecel">
                    <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                      <Package className="h-5 w-5" />
                      <span className="text-xs">Telecel</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest 5 orders</CardDescription>
                  </div>
                  <Link href="/user/history">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{transaction.productName}</p>
                          <p className="text-xs text-muted-foreground">{transaction.customerPhone}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">GH₵{transaction.amount}</p>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transactions yet</p>
                    <Link href="/user/bundles/mtn">
                      <Button variant="ghost" className="mt-2">
                        Start Shopping
                      </Button>
                    </Link>
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
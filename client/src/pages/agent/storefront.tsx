import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AgentSidebarV2 as AgentSidebar } from "@/components/layout/agent-sidebar-v2";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Store, ExternalLink, Copy, Save, Smartphone, Menu } from "lucide-react";
import type { Agent } from "../../../../src/shared/schema";

const storefrontSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessDescription: z.string().optional(),
});

type StorefrontFormData = z.infer<typeof storefrontSchema>;

interface AgentProfileResponse {
  profile: Agent & {
    walletBalance: number;
    profitBalance: number;
    totalWithdrawals: number;
    role: string;
    user: {
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  stats: any;
}

export default function AgentStorefront() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profileData, isLoading: profileLoading } = useQuery<AgentProfileResponse>({
    queryKey: ["/api/profile"],
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });
  
  const agent = profileData?.profile;

  const form = useForm<StorefrontFormData>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: {
      businessName: "",
      businessDescription: "",
    },
  });

  useEffect(() => {
    if (agent) {
      form.reset({
        businessName: agent.businessName || "",
        businessDescription: agent.businessDescription || "",
      });
    }
  }, [agent, form]);

  const updateStoreMutation = useMutation({
    mutationFn: (data: StorefrontFormData) =>
      apiRequest("PATCH", "/api/agent/storefront", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Store details updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update store", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: StorefrontFormData) => {
    updateStoreMutation.mutate(data);
  };

  const copyStoreLink = () => {
    if (agent) {
      const url = `${window.location.origin}/store/agent/${agent.storefrontSlug}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Store link copied to clipboard!" });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out">
            <AgentSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AgentSidebar />
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
            <h1 className="text-lg lg:text-xl font-semibold">My Storefront</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 rounded-lg p-8 border">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {agent?.businessName || "Your Storefront"}
                  </h2>
                  <p className="text-muted-foreground">
                    Manage and customize your online store
                  </p>
                </div>
              </div>
              
              <div className="bg-background/50 rounded-md p-4 border">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {agent?.businessDescription || "No business description provided. Update it below to tell customers about your store."}
                </p>
              </div>
              
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span>Active Storefront</span>
                </div>
                {agent?.storefrontSlug && (
                  <Badge variant="secondary" className="text-xs">
                    /{agent.storefrontSlug}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Store Link
                </CardTitle>
                <CardDescription>
                  Share this link with your customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={agent ? `${window.location.origin}/store/agent/${agent.storefrontSlug}` : ""}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-store-url"
                  />
                  <Button variant="outline" size="icon" onClick={copyStoreLink} data-testid="button-copy-link">
                    <Copy className="h-4 w-4" />
                  </Button>
                  {agent && (
                    <a href={`/store/agent/${agent.storefrontSlug}`} target="_blank" rel="noopener noreferrer" aria-label="Open storefront in new tab">
                      <Button variant="outline" size="icon" data-testid="button-open-store">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Store Details</CardTitle>
                <CardDescription>
                  Customize how your store appears to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your business name"
                              disabled={profileLoading}
                              data-testid="input-business-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell customers about your business..."
                              className="resize-none"
                              rows={3}
                              disabled={profileLoading}
                              data-testid="input-business-description"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This will be shown on your storefront page
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={updateStoreMutation.isPending || profileLoading}
                      data-testid="button-save-details"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateStoreMutation.isPending ? "Saving..." : profileLoading ? "Loading..." : "Save Details"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

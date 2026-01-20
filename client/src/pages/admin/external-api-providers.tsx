import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Menu, Plus, Edit, Trash2, Star, StarOff, Eye, EyeOff, TestTube } from "lucide-react";

interface ExternalApiProvider {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  apiSecret: string;
  endpoint: string;
  isActive: boolean;
  isDefault: boolean;
  networkMappings: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminExternalApiProviders() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [providers, setProviders] = useState<ExternalApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ExternalApiProvider | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    provider: "",
    apiKey: "",
    apiSecret: "",
    endpoint: "",
    isActive: true,
    isDefault: false,
    networkMappings: JSON.stringify({
      "mtn": "MTN",
      "telecel": "TELECEL",
      "at_bigtime": "AIRTELTIGO",
      "at_ishare": "AIRTELTIGO",
      "airteltigo": "AIRTELTIGO"
    }, null, 2)
  });

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await apiRequest("GET", "/api/admin/external-providers") as ExternalApiProvider[];
      setProviders(data);
    } catch (error) {
      console.error("Failed to load providers:", error);
      toast({
        title: "Error",
        description: "Failed to load external API providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      provider: "",
      apiKey: "",
      apiSecret: "",
      endpoint: "",
      isActive: true,
      isDefault: false,
      networkMappings: JSON.stringify({
        "mtn": "MTN",
        "telecel": "TELECEL",
        "at_bigtime": "AIRTELTIGO",
        "at_ishare": "AIRTELTIGO",
        "airteltigo": "AIRTELTIGO"
      }, null, 2)
    });
    setEditingProvider(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (provider: ExternalApiProvider) => {
    setForm({
      name: provider.name,
      provider: provider.provider,
      apiKey: provider.apiKey,
      apiSecret: provider.apiSecret,
      endpoint: provider.endpoint,
      isActive: provider.isActive,
      isDefault: provider.isDefault,
      networkMappings: provider.networkMappings || JSON.stringify({
        "mtn": "MTN",
        "telecel": "TELECEL",
        "at_bigtime": "AIRTELTIGO",
        "at_ishare": "AIRTELTIGO",
        "airteltigo": "AIRTELTIGO"
      }, null, 2)
    });
    setEditingProvider(provider);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validate JSON
      JSON.parse(form.networkMappings);

      const payload = {
        ...form,
        networkMappings: form.networkMappings
      };

      if (editingProvider) {
        await apiRequest("PUT", `/api/admin/external-providers/${editingProvider.id}`, payload);
        toast({
          title: "Success",
          description: "External API provider updated successfully",
        });
      } else {
        await apiRequest("POST", "/api/admin/external-providers", payload);
        toast({
          title: "Success",
          description: "External API provider created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      loadProviders();
    } catch (error: any) {
      console.error("Failed to save provider:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save external API provider",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this external API provider?")) return;

    try {
      await apiRequest("DELETE", `/api/admin/external-providers/${id}`);
      toast({
        title: "Success",
        description: "External API provider deleted successfully",
      });
      loadProviders();
    } catch (error) {
      console.error("Failed to delete provider:", error);
      toast({
        title: "Error",
        description: "Failed to delete external API provider",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiRequest("POST", `/api/admin/external-providers/${id}/set-default`);
      toast({
        title: "Success",
        description: "Default external API provider updated successfully",
      });
      loadProviders();
    } catch (error) {
      console.error("Failed to set default provider:", error);
      toast({
        title: "Error",
        description: "Failed to set default external API provider",
        variant: "destructive",
      });
    }
  };

  const testProvider = async (provider: ExternalApiProvider) => {
    setTestingProvider(provider.id);
    try {
      const result = await apiRequest("GET", `/api/admin/external-balance?providerId=${provider.id}`) as { success: boolean; error?: string; balance?: any; celebrate?: any };
      if (result.success) {
        toast({
          title: "Test Successful",
          description: `Balance check successful for ${provider.name}`,
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Balance check failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "Balance check failed",
        variant: "destructive",
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const toggleSecretVisibility = (providerId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-lg lg:text-xl font-semibold">External API Providers</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-muted-foreground">
                Manage external API providers for data bundle purchases
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProvider ? "Edit" : "Add"} External API Provider
                    </DialogTitle>
                    <DialogDescription>
                      {editingProvider
                        ? "Update the external API provider configuration."
                        : "Configure a new external API provider for data bundle purchases."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Provider Name</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g., SkyTech GH"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="provider">Provider Type</Label>
                        <Select value={form.provider} onValueChange={(value) => setForm({ ...form, provider: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skytech">SkyTech</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="endpoint">API Endpoint</Label>
                      <Input
                        id="endpoint"
                        value={form.endpoint}
                        onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                        placeholder="https://api.example.com/v1/orders"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          value={form.apiKey}
                          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="apiSecret">API Secret</Label>
                        <Input
                          id="apiSecret"
                          type="password"
                          value={form.apiSecret}
                          onChange={(e) => setForm({ ...form, apiSecret: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="networkMappings">Network Mappings (JSON)</Label>
                      <Textarea
                        id="networkMappings"
                        value={form.networkMappings}
                        onChange={(e) => setForm({ ...form, networkMappings: e.target.value })}
                        placeholder='{"mtn": "MTN", "telecel": "TELECEL"}'
                        rows={6}
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        JSON mapping of internal network names to external API network codes
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={form.isActive}
                          onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isDefault"
                          checked={form.isDefault}
                          onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
                        />
                        <Label htmlFor="isDefault">Set as Default</Label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                        {isSaving ? "Saving..." : (editingProvider ? "Update" : "Create")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Providers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {providers.map((provider) => (
                <Card key={provider.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2 flex-wrap">
                        <span className="truncate">{provider.name}</span>
                        {provider.isDefault && (
                          <Badge variant="default" className="text-xs shrink-0">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {!provider.isActive && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Inactive
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex space-x-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => testProvider(provider)}
                          disabled={testingProvider === provider.id}
                          title="Test Provider"
                          className="h-8 w-8"
                        >
                          <TestTube className={`h-4 w-4 ${testingProvider === provider.id ? 'animate-pulse' : ''}`} />
                        </Button>
                        {!provider.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSetDefault(provider.id)}
                            title="Set as Default"
                            className="h-8 w-8"
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(provider)}
                          title="Edit Provider"
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(provider.id)}
                          title="Delete Provider"
                          className="text-destructive hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Provider Type</Label>
                      <p className="text-sm">{provider.provider}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Endpoint</Label>
                      <p className="text-sm font-mono break-all text-xs">{provider.endpoint}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">API Key</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={showSecrets[provider.id] ? provider.apiKey : "••••••••••••••••"}
                          readOnly
                          className="text-sm font-mono h-8 text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSecretVisibility(provider.id)}
                          className="h-8 w-8 shrink-0"
                        >
                          {showSecrets[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Network Mappings</Label>
                      <div className="text-xs bg-muted p-2 rounded max-h-20 overflow-y-auto">
                        <pre className="whitespace-pre-wrap break-words">{provider.networkMappings || "{}"}</pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {providers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <p className="text-lg mb-2">No external API providers configured</p>
                  <p className="text-sm">Add your first provider to enable external data bundle purchases</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
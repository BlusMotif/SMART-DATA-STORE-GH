import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Key, Trash2, Copy, Check, AlertCircle, Code } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: Record<string, any>;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

interface ApiIntegrationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiIntegrationsModal({ open, onOpenChange }: ApiIntegrationsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: apiKeys, isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/user/api-keys"],
    enabled: !!user && open,
  });

  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest<ApiKey>("POST", "/api/user/api-keys", { name });
    },
    onSuccess: (newKey) => {
      setCreatedKey(newKey.key);
      setNewKeyName("");
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/api-keys"] });
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated. Copy it now - it won't be shown again.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiRequest("DELETE", `/api/user/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/api-keys"] });
      toast({
        title: "API Key Revoked",
        description: "The API key has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    createKeyMutation.mutate(newKeyName.trim());
  };

  const handleDeleteKey = (keyId: string) => {
    if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      deleteKeyMutation.mutate(keyId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
            <Code className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">API & Integrations</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm leading-relaxed">
            Generate secure API keys to connect your app or third-party services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Created Key Alert */}
          {createdKey && (
            <Alert className="border-yellow-200 bg-yellow-50 p-3 sm:p-4">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
              <AlertDescription className="text-yellow-800 text-xs sm:text-sm leading-relaxed">
                <strong>New API Key Created:</strong> {createdKey}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 mt-2 sm:mt-0 h-6 px-2 text-xs sm:h-7 sm:px-3"
                  onClick={() => copyToClipboard(createdKey, "created")}
                >
                  {copiedKey === "created" ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                  <span className="ml-1 hidden sm:inline">Copy</span>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* API Keys Section */}
          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="pb-2 sm:pb-3 px-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Key className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    API Keys
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Manage your API keys for secure access to our platform
                  </CardDescription>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm">
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span>Create API Key</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:w-full max-w-md mx-4 sm:mx-auto">
                    <DialogHeader className="pb-3 sm:pb-4">
                      <DialogTitle className="text-sm sm:text-base">Create New API Key</DialogTitle>
                      <DialogDescription className="text-xs sm:text-sm leading-relaxed">
                        Enter a name for your API key. This will help you identify it later.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName" className="text-xs sm:text-sm font-medium">API Key Name</Label>
                        <Input
                          id="keyName"
                          placeholder="e.g., My App, Production API"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                          className="h-9 sm:h-10 text-sm"
                        />
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                          size="sm"
                          className="w-full sm:w-auto h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateKey}
                          disabled={!newKeyName.trim() || createKeyMutation.isPending}
                          size="sm"
                          className="w-full sm:w-auto h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                        >
                          {createKeyMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          Create Key
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
                </div>
              ) : apiKeys && apiKeys.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm sm:text-base truncate">{key.name}</span>
                            <Badge 
                              variant={key.isActive ? "default" : "secondary"} 
                              className="text-xs px-2 py-0.5"
                            >
                              {key.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                            <div>Created {new Date(key.createdAt).toLocaleDateString()}</div>
                            {key.lastUsed && (
                              <div>Last used {new Date(key.lastUsed).toLocaleDateString()}</div>
                            )}
                          </div>
                          <div className="font-mono text-xs sm:text-sm bg-muted px-2 py-1.5 rounded break-all sm:break-normal">
                            sk_••••••••••••••••••••••••••••••••
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(`sk_••••••••••••••••••••••••••••••••`, key.id)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9 sm:p-2"
                            title="Copy API Key"
                          >
                            {copiedKey === key.id ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteKey(key.id)}
                            disabled={deleteKeyMutation.isPending}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-9 sm:p-2 text-destructive hover:text-destructive"
                            title="Delete API Key"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <Code className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-xs sm:text-sm">No API keys yet. Create your first key to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Documentation */}
          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="pb-2 sm:pb-3 px-0">
              <CardTitle className="text-sm sm:text-base">API Documentation</CardTitle>
              <CardDescription className="text-xs sm:text-sm leading-relaxed">
                Example API calls using your API keys
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-0 space-y-3 sm:space-y-4">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Get Account Balance</h4>
                  <div className="bg-muted p-3 sm:p-4 rounded-md font-mono text-xs sm:text-sm overflow-x-auto">
                    <div className="whitespace-nowrap sm:whitespace-normal">GET /api/v1/user/balance</div>
                    <div className="text-muted-foreground mt-1 whitespace-nowrap sm:whitespace-normal">Authorization: Bearer YOUR_API_KEY</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm sm:text-base">Get Transaction History</h4>
                  <div className="bg-muted p-3 sm:p-4 rounded-md font-mono text-xs sm:text-sm overflow-x-auto">
                    <div className="whitespace-nowrap sm:whitespace-normal">GET /api/v1/user/transactions?limit=10&offset=0</div>
                    <div className="text-muted-foreground mt-1 whitespace-nowrap sm:whitespace-normal">Authorization: Bearer YOUR_API_KEY</div>
                  </div>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-2 border-t">
                All API endpoints require Bearer token authentication with your API key.
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
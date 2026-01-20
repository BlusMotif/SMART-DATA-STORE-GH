import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, CheckCircle, XCircle, Settings, Code, Webhook } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
}

const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdKey, setCreatedKey] = useState<string>('');
  const [showCreatedKey, setShowCreatedKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/user/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      } else {
        toast.error('Failed to fetch API keys');
      }
    } catch (error) {
      toast.error('Error fetching API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedKey(data.key);
        setShowCreatedKey(true);
        setNewKeyName('');
        setShowCreateDialog(false);
        fetchApiKeys();
        toast.success('API key created successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create API key');
      }
    } catch (error) {
      toast.error('Error creating API key');
    } finally {
      setCreating(false);
    }
  };

  const toggleApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}/toggle`, {
        method: 'PUT'
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(keys => keys.map(key =>
          key.id === keyId ? { ...key, isActive: data.isActive } : key
        ));
        toast.success(`API key ${data.isActive ? 'activated' : 'deactivated'}`);
      } else {
        toast.error('Failed to update API key status');
      }
    } catch (error) {
      toast.error('Error updating API key status');
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setApiKeys(keys => keys.filter(key => key.id !== keyId));
        toast.success('API key deleted successfully');
      } else {
        toast.error('Failed to delete API key');
      }
    } catch (error) {
      toast.error('Error deleting API key');
    }
  };

  const updatePermissions = async (keyId: string, permissions: Record<string, boolean>) => {
    try {
      const response = await fetch(`/api/user/api-keys/${keyId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      });

      if (response.ok) {
        setApiKeys(keys => keys.map(key =>
          key.id === keyId ? { ...key, permissions: JSON.stringify(permissions) } : key
        ));
        toast.success('Permissions updated successfully');
      } else {
        toast.error('Failed to update permissions');
      }
    } catch (error) {
      toast.error('Error updating permissions');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const maskApiKey = (key: string) => {
    return `${key.substring(0, 8)}****${key.substring(key.length - 4)}`;
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const getPermissions = (permissions: string) => {
    try {
      return JSON.parse(permissions);
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys & Integrations</h1>
          <p className="text-muted-foreground">
            Manage your API keys and integrate with third-party services
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to access our services programmatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">API Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production App, Development"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createApiKey} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Key'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Created Key Dialog */}
      <Dialog open={showCreatedKey} onOpenChange={setShowCreatedKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your new API key has been created. Copy it now - you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <code className="text-sm break-all">{createdKey}</code>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(createdKey)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Key
              </Button>
              <Button onClick={() => setShowCreatedKey(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Key className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No API Keys Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first API key to start integrating with our services.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First API Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Key className="w-5 h-5" />
                        <div>
                          <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                          <CardDescription>
                            Created {new Date(apiKey.createdAt).toLocaleDateString()}
                            {apiKey.lastUsed && ` • Last used ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                          {apiKey.isActive ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                          )}
                        </Badge>
                        <Switch
                          checked={apiKey.isActive}
                          onCheckedChange={() => toggleApiKey(apiKey.id)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">API Key</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                            {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Permissions
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>API Key Permissions</DialogTitle>
                                <DialogDescription>
                                  Configure what this API key can access.
                                </DialogDescription>
                              </DialogHeader>
                              <PermissionsEditor
                                permissions={getPermissions(apiKey.permissions)}
                                onSave={(permissions) => updatePermissions(apiKey.id, permissions)}
                              />
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this API key? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteApiKey(apiKey.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>
                Connect your applications and services to our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Code className="w-5 h-5 mr-2" />
                      REST API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use our REST API to programmatically access data bundles, result checkers, and transactions.
                    </p>
                    <Button variant="outline" size="sm">
                      View API Docs
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Webhook className="w-5 h-5 mr-2" />
                      Webhooks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Receive real-time notifications about transaction status changes and other events.
                    </p>
                    <Button variant="outline" size="sm">
                      Configure Webhooks
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Set up webhooks to receive real-time notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    placeholder="https://your-app.com/webhooks/resellers-hub-gh-pro"
                  />
                </div>
                <div>
                  <Label>Events to Subscribe</Label>
                  <div className="space-y-2 mt-2">
                    {['transaction.completed', 'transaction.failed', 'bundle.delivered'].map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <Switch id={event} />
                        <Label htmlFor={event} className="text-sm">{event}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button>Save Webhook Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Complete documentation for integrating with our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="justify-start">
                  <Code className="w-4 h-4 mr-2" />
                  REST API Reference
                </Button>
                <Button variant="outline" className="justify-start">
                  <Webhook className="w-4 h-4 mr-2" />
                  Webhook Documentation
                </Button>
                <Button variant="outline" className="justify-start">
                  <Key className="w-4 h-4 mr-2" />
                  Authentication Guide
                </Button>
                <Button variant="outline" className="justify-start">
                  Download Postman Collection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PermissionsEditor: React.FC<{
  permissions: Record<string, boolean>;
  onSave: (permissions: Record<string, boolean>) => void;
}> = ({ permissions, onSave }) => {
  const [localPermissions, setLocalPermissions] = useState(permissions);

  const permissionOptions = [
    { key: 'read', label: 'Read Data', description: 'Access bundles, transactions, and user data' },
    { key: 'purchase', label: 'Make Purchases', description: 'Purchase data bundles and result checkers' },
    { key: 'webhook', label: 'Receive Webhooks', description: 'Receive webhook notifications' },
  ];

  return (
    <div className="space-y-4">
      {permissionOptions.map((option) => (
        <div key={option.key} className="flex items-start space-x-3">
          <Switch
            id={option.key}
            checked={localPermissions[option.key] || false}
            onCheckedChange={(checked) =>
              setLocalPermissions(prev => ({ ...prev, [option.key]: checked }))
            }
          />
          <div className="flex-1">
            <Label htmlFor={option.key} className="font-medium">
              {option.label}
            </Label>
            <p className="text-sm text-muted-foreground">{option.description}</p>
          </div>
        </div>
      ))}
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => setLocalPermissions(permissions)}>
          Reset
        </Button>
        <Button onClick={() => onSave(localPermissions)}>
          Save Permissions
        </Button>
      </div>
    </div>
  );
};

export default ApiKeysPage;
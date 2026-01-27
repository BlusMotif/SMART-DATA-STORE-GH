import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AgentSidebarV2 as AgentSidebar } from "@/components/layout/agent-sidebar-v2";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Copy, CheckCircle, XCircle, Code, Webhook, Menu } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";

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
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createdKey, setCreatedKey] = useState<string>('');
  const [showCreatedKey, setShowCreatedKey] = useState(false);
  const [] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('keys');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      // Get the access token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in to manage API keys');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/api-keys', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      } else {
        if (response.status === 401) {
          toast.error('Please log in to manage API keys');
        } else {
          toast.error('Failed to fetch API keys');
        }
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

    if (newKeyName.trim().length > 100) {
      toast.error('API key name must be 100 characters or less');
      return;
    }

    setCreating(true);
    try {
      // Get the access token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in to create API keys');
        setCreating(false);
        return;
      }

      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name: newKeyName.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedKey(data.key);
        setShowCreatedKey(true);
        setNewKeyName('');
        setShowCreateDialog(false);
        fetchApiKeys();
        
        // Show remaining rate limit
        if (data.remaining !== undefined) {
          toast.success(`API key created! You can create ${data.remaining} more keys this hour.`);
        } else {
          toast.success('API key created successfully');
        }
      } else {
        const error = await response.json();
        
        // Handle auth error
        if (response.status === 401) {
          toast.error('Please log in to create API keys');
        } else if (response.status === 429) {
          toast.error(error.error || 'Rate limit exceeded. Please try again later.');
        } else {
          toast.error(error.error || 'Failed to create API key');
        }
      }
    } catch (error) {
      toast.error('Error creating API key');
    } finally {
      setCreating(false);
    }
  };


  const deleteApiKey = async (keyId: string) => {
    try {
      // Get the access token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in to revoke API keys');
        return;
      }

      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchApiKeys(); // Refetch to get updated list
        toast.success('API key revoked successfully');
      } else {
        const error = await response.json();
        if (response.status === 401) {
          toast.error('Please log in to revoke API keys');
        } else {
          toast.error(error.error || 'Failed to revoke API key');
        }
      }
    } catch (error) {
      toast.error('Error revoking API key');
    }
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };




  const renderSidebar = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return <AdminSidebar onClose={() => setSidebarOpen(false)} />;
      case 'agent':
      case 'dealer':
      case 'super_dealer':
      case 'master':
        return <AgentSidebar onClose={() => setSidebarOpen(false)} />;
      case 'user':
        return <UserSidebar onClose={() => setSidebarOpen(false)} />;
      default:
        return <AdminSidebar onClose={() => setSidebarOpen(false)} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        {renderSidebar()}
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
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r transform transition-transform duration-200 ease-in-out">
            {renderSidebar()}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        {renderSidebar()}
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
            <h1 className="text-lg lg:text-xl font-semibold">API Keys & Integrations</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
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
          <DialogContent className="bg-black text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New API Key</DialogTitle>
              <DialogDescription className="text-gray-300">
                Create a new API key to access our services programmatically.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-md">
              <p className="text-yellow-400 text-sm font-semibold mb-1">⚠️ Security Notice</p>
              <ul className="text-yellow-300 text-xs space-y-1 ml-4 list-disc">
                <li>Maximum 10 active keys per account</li>
                <li>Maximum 5 key creations per hour</li>
                <li>Keys are shown only once - save immediately!</li>
                <li>Keys cannot be recovered if lost</li>
              </ul>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName" className="text-white">API Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production App, Development"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  maxLength={100}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">{newKeyName.length}/100 characters</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-600 text-white hover:bg-gray-800">
                  Cancel
                </Button>
                <Button onClick={createApiKey} disabled={creating} className="bg-yellow-500 text-black hover:bg-yellow-600">
                  {creating ? 'Creating...' : 'Create Key'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Created Key Dialog */}
      <Dialog open={showCreatedKey} onOpenChange={setShowCreatedKey}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Key className="w-6 h-6 text-yellow-500" />
              API Key Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg mt-4">
            <p className="text-red-600 dark:text-red-400 font-bold text-sm mb-2">
              🔐 CRITICAL: Save Your API Key Now!
            </p>
            <ul className="text-red-600 dark:text-red-400 text-xs space-y-1 ml-4 list-disc">
              <li>This is the ONLY time you'll see this key in full</li>
              <li>Copy and store it securely (e.g., password manager)</li>
              <li>Once you close this dialog, the key will be masked forever</li>
              <li>If lost, you must revoke and create a new key</li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg border-2 border-yellow-500">
              <Label className="text-sm font-semibold mb-2 block">Your API Key:</Label>
              <code className="text-sm break-all block p-3 bg-black text-green-400 rounded font-mono">
                {createdKey}
              </code>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  copyToClipboard(createdKey);
                  toast.success('API key copied! Make sure to save it securely.');
                }}
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button 
                onClick={() => {
                  setShowCreatedKey(false);
                  toast.info('API key dialog closed. The key is now masked in your list.');
                }}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                I've Saved It Securely
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keys" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">API Keys</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">Webhooks</TabsTrigger>
          <TabsTrigger value="docs" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">Documentation</TabsTrigger>
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
                            <><XCircle className="w-3 h-3 mr-1" /> Revoked</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">API Key</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="flex-1 p-2 bg-muted rounded text-sm font-mono overflow-x-auto">
                            {apiKey.key}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                            title="Copy masked key"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Key is masked for security. Full key was shown only once at creation.
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={!apiKey.isActive}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Revoke Key
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke this API key? This action cannot be undone and any applications using this key will immediately lose access.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteApiKey(apiKey.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Revoke Permanently
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <div className="text-sm text-muted-foreground">
                            {apiKey.isActive ? (
                              <span className="text-green-600">✓ Key is active and functional</span>
                            ) : (
                              <span className="text-red-600">⨯ Key has been revoked</span>
                            )}
                          </div>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate('/dashboard/api-documentation')}
                    >
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
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('webhooks')}>
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
                Receive real-time notifications when order status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 How to Use Webhooks</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    Include the <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-xs">webhookUrl</code> parameter when creating orders via API:
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "productId": "mtn-1gb",
  "customerPhone": "0241234567",
  "amount": "5.00",
  "webhookUrl": "https://your-app.com/webhooks/order-status"
}`}
                  </pre>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                    When the order status changes (pending → completed/failed), we'll send a POST request to your webhook URL with the updated order details.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Webhook Payload Example</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Here's what you'll receive when an order status updates:
                    </p>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
{`{
  "event": "order.status_updated",
  "reference": "TXN_1234567890",
  "status": "completed",
  "deliveryStatus": "delivered",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "order": {
    "id": "uuid-here",
    "reference": "TXN_1234567890",
    "amount": 5.00,
    "previousStatus": "pending",
    "currentStatus": "completed"
  },
  "products": [
    {
      "bundleId": "mtn-1gb",
      "bundleName": "MTN 1GB",
      "phone": "0241234567",
      "network": "mtn"
    }
  ]
}`}
                    </pre>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => navigate('/dashboard/api-documentation')} className="flex-1">
                      View Full Documentation
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        window.open('https://webhook.site', '_blank');
                        toast.success('Opening webhook.site for testing!');
                      }}
                      className="flex-1"
                    >
                      <Webhook className="w-4 h-4 mr-2" />
                      Test with webhook.site
                    </Button>
                  </div>
                </div>
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
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/api-documentation')}>
                  <Code className="w-4 h-4 mr-2" />
                  REST API Reference
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/api-documentation')}>
                  <Webhook className="w-4 h-4 mr-2" />
                  Webhook Documentation
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard/api-documentation')}>
                  <Key className="w-4 h-4 mr-2" />
                  Authentication Guide
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => {
                  window.open('https://documenter.getpostman.com/view/your-collection-id', '_blank');
                  toast.info('Opening Postman Collection...');
                }}>
                  Download Postman Collection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};


export default ApiKeysPage;
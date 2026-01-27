import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AgentSidebarV2 as AgentSidebar } from "@/components/layout/agent-sidebar-v2";
import { UserSidebar } from "@/components/layout/user-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from "@/hooks/use-auth";
import { 
  BookOpen, 
  Code, 
  Key, 
  Server, 
  Package, 
  Menu,
  Copy,
  Check,
  ExternalLink,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

const ApiDocumentationPage: React.FC = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const baseUrl = 'https://resellershubprogh.com';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Determine sidebar based on user role
  const renderSidebar = () => {
    if (!user) return null;
    
    switch(user.role) {
      case 'admin':
        return <AdminSidebar onClose={() => setSidebarOpen(false)} />;
      case 'agent':
      case 'dealer':
      case 'super_dealer':
      case 'master':
        return <AgentSidebar onClose={() => setSidebarOpen(false)} />;
      default:
        return <UserSidebar onClose={() => setSidebarOpen(false)} />;
    }
  };

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
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg lg:text-xl font-semibold">API Documentation</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:text-green-500">
                  <BookOpen className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="authentication" className="flex items-center gap-2 data-[state=active]:text-green-500">
                  <Key className="w-4 h-4" />
                  Authentication
                </TabsTrigger>
                <TabsTrigger value="endpoints" className="flex items-center gap-2 data-[state=active]:text-green-500">
                  <Server className="w-4 h-4" />
                  Endpoints
                </TabsTrigger>
                <TabsTrigger value="examples" className="flex items-center gap-2 data-[state=active]:text-green-500">
                  <Code className="w-4 h-4" />
                  Code Examples
                </TabsTrigger>
              </TabsList>

              {/* Overview Section */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary" />
                      Offers & Orders API
                    </CardTitle>
                    <CardDescription>
                      Browse data bundle offers and create single/bulk orders with agent store slugs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Base URL</h3>
                      <div className="bg-muted p-4 rounded-lg border font-mono text-sm flex items-center justify-between">
                        <code>{baseUrl}/api</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${baseUrl}/api`, 'baseUrl')}
                        >
                          {copiedCode === 'baseUrl' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">What This API Does</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                            <Package className="w-4 h-4" />
                            Browse Offers
                          </h4>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            View data bundles from MTN, Vodafone, AirtelTigo with pricing per network
                          </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-900 dark:text-green-100">
                            <ShoppingCart className="w-4 h-4" />
                            Single Orders
                          </h4>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            Purchase one bundle at a time with phone number for delivery
                          </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                          <h4 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">📦 Bulk Orders</h4>
                          <p className="text-sm text-purple-800 dark:text-purple-200">
                            Buy multiple bundles in one transaction for different phone numbers
                          </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                          <h4 className="font-semibold mb-2 text-yellow-900 dark:text-yellow-100">🏪 Agent Store Slug</h4>
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            Use agent slugs to access custom pricing and track commissions
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-3">Key Concepts</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg text-foreground">
                          <h4 className="font-medium mb-2">🔖 What is a Slug?</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            A slug is a unique identifier for an agent's storefront. Example: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-blue-600 dark:text-blue-400">john-data-store</code>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Use slugs to access agent-specific offers at: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-blue-600 dark:text-blue-400">/api/store/agent/{'{slug}'}</code>
                          </p>
                        </div>

                        <div className="p-4 bg-muted rounded-lg text-foreground">
                          <h4 className="font-medium mb-2">📱 Single vs Bulk Orders</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Single:</strong> One bundle to one phone number
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Bulk:</strong> Multiple bundles to different phone numbers in one API call
                          </p>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-500/50 rounded-lg">
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-blue-900 dark:text-white">
                            📞 Phone Number Requirements
                          </h4>
                          <div className="space-y-2 text-sm text-blue-900 dark:text-white">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-600 dark:text-blue-300 font-bold">•</span>
                              <div className="text-blue-900 dark:text-white">
                                <strong>Format:</strong> Must be exactly 10 digits starting with 0<br/>
                                <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs text-blue-900 dark:text-white">0241234567, 0501234567, 0261234567</code>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-blue-600 dark:text-blue-300 font-bold">•</span>
                              <div className="text-blue-900 dark:text-white">
                                <strong>No Network Validation:</strong> Phone numbers are NOT validated against network prefixes<br/>
                                <span className="text-xs text-blue-700 dark:text-blue-200">The API accepts any valid 10-digit phone regardless of network</span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-blue-600 dark:text-blue-300 font-bold">•</span>
                              <div className="text-blue-900 dark:text-white">
                                <strong>Cooldown Period:</strong> 20-minute wait between orders for same phone number<br/>
                                <span className="text-xs text-blue-700 dark:text-blue-200">Prevents duplicate orders and abuse</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-500/50 rounded-lg">
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-purple-900 dark:text-white">
                            🌐 Network-Specific Rules
                          </h4>
                          <div className="space-y-3 text-sm text-purple-900 dark:text-white">
                            <div className="p-3 bg-white dark:bg-purple-800/30 rounded border border-purple-200 dark:border-purple-700">
                              <div className="font-semibold mb-1 text-purple-900 dark:text-white">MTN, Telecel, AT Bigtime</div>
                              <div className="text-xs space-y-1 text-purple-800 dark:text-purple-100">
                                <div>✅ Single orders supported</div>
                                <div>✅ Bulk orders supported</div>
                                <div>✅ Wallet payment supported</div>
                                <div>✅ Paystack payment supported</div>
                              </div>
                            </div>
                            <div className="p-3 bg-white dark:bg-purple-800/30 rounded border border-red-300 dark:border-red-600">
                              <div className="font-semibold mb-1 text-red-700 dark:text-red-300">AT iShare</div>
                              <div className="text-xs space-y-1 text-purple-800 dark:text-purple-100">
                                <div>✅ Single orders supported</div>
                                <div>❌ Bulk orders NOT supported</div>
                                <div>✅ Wallet payment supported</div>
                                <div>✅ Paystack payment supported</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-3">Status Codes</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 border rounded">
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">200</Badge>
                          <span className="text-sm">Success - Offers retrieved or order created</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 border rounded">
                          <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">400</Badge>
                          <span className="text-sm">Bad Request - Invalid phone or insufficient balance</span>
                        </div>
                        <div className="flex items-center gap-3 p-2 border rounded">
                          <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">404</Badge>
                          <span className="text-sm">Not Found - Invalid slug or bundle doesn't exist</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Authentication Section */}
              <TabsContent value="authentication" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary" />
                      API Key Authentication
                    </CardTitle>
                    <CardDescription>
                      Secure your API requests with API keys
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Header Format</h3>
                      <div className="bg-black p-4 rounded-lg">
                        <pre className="text-green-400 text-sm">
{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Example Request</h3>
                      <div className="bg-black p-4 rounded-lg overflow-x-auto">
                        <pre className="text-green-400 text-sm">
{`curl -X GET "${baseUrl}/api/products/data-bundles" \\
  -H "Authorization: Bearer sk_1234567890abcdef..." \\
  -H "Content-Type: application/json"`}
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-500/50 rounded-lg">
                      <Key className="w-5 h-5 text-blue-500 dark:text-blue-300 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-700 dark:text-white mb-2">
                          Get Your API Key
                        </p>
                        <p className="text-sm text-blue-600 dark:text-white mb-3">
                          Generate your API key from the API Keys & Integrations page. Maximum 10 active keys per account.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/api-integrations')}>
                          <Key className="w-4 h-4 mr-2" />
                          Go to API Keys
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Endpoints Section */}
              <TabsContent value="endpoints" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-primary" />
                      API Endpoints
                    </CardTitle>
                    <CardDescription>
                      Browse offers and create single/bulk orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Browse Offers */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 pb-2 border-b">1. Browse Offers</h3>
                      
                      <div className="space-y-6">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-blue-500 text-white">GET</Badge>
                            <code className="text-sm font-mono">/api/products/data-bundles</code>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Get all available data bundle offers across all networks
                          </p>
                          
                          <div className="mb-3">
                            <p className="text-sm font-semibold mb-2">Query Parameters (Optional):</p>
                            <div className="bg-muted p-3 rounded text-sm text-foreground">
                              <div><code className="text-blue-600 dark:text-blue-400 font-semibold">network</code>: Filter by network (use: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 font-bold">mtn</code>, <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 font-bold">telecel</code>, <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 font-bold">at_bigtime</code>, or <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 font-bold">at_ishare</code>)</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Example: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-blue-600 dark:text-blue-400">/api/products/data-bundles?network=mtn</code></p>
                          </div>

                          <div>
                            <p className="text-sm font-semibold mb-2">Response Example:</p>
                            <div className="bg-black p-3 rounded">
                              <pre className="text-green-400 text-xs">
{`[
  {
    "id": 123,
    "network": "mtn",
    "volume": "1GB",
    "validity": "daily",
    "price": 5.00,
    "description": "MTN 1GB Daily Bundle"
  },
  {
    "id": 124,
    "network": "mtn",
    "volume": "2GB",
    "validity": "weekly",
    "price": 15.00,
    "description": "MTN 2GB Weekly Bundle"
  }
]`}
                              </pre>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-blue-500 text-white">GET</Badge>
                            <code className="text-sm font-mono">/api/store/agent/{'{slug}'}</code>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Get offers from a specific agent's store using their slug
                          </p>
                          
                          <div className="mb-3">
                            <p className="text-sm font-semibold mb-2">Path Parameters:</p>
                            <div className="bg-muted p-3 rounded text-sm text-foreground">
                              <code className="text-primary">slug</code>: Agent's storefront slug (e.g., "john-data-store")
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold mb-2">Response Example:</p>
                            <div className="bg-black p-3 rounded">
                              <pre className="text-green-400 text-xs">
{`{
  "agent": {
    "id": 1,
    "businessName": "John's Data Store",
    "storefrontSlug": "john-data-store"
  },
  "bundles": [
    {
      "id": 123,
      "network": "mtn",
      "volume": "1GB",
      "price": 4.50
    }
  ]
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Create Orders */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 pb-2 border-b">2. Create Orders - Volume + Network Method</h3>
                      
                      {/* Network Names Notice */}
                      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-500 rounded-lg shadow-sm">
                        <h4 className="font-bold mb-3 text-yellow-900 dark:text-white text-base flex items-center gap-2">
                          <span className="text-2xl">⚠️</span> IMPORTANT: Use These Exact Network Names
                        </h4>
                        <p className="text-sm mb-3 font-medium text-yellow-900 dark:text-white">When specifying the <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded text-yellow-900 dark:text-white font-bold">network</code> parameter, use these <strong className="text-yellow-900 dark:text-white">exact lowercase spellings</strong>:</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <span className="text-green-600 dark:text-green-400 font-bold text-lg">✓</span> 
                            <code className="text-blue-600 dark:text-blue-400 font-bold text-base">mtn</code>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <span className="text-green-600 dark:text-green-400 font-bold text-lg">✓</span> 
                            <code className="text-blue-600 dark:text-blue-400 font-bold text-base">telecel</code>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <span className="text-green-600 dark:text-green-400 font-bold text-lg">✓</span> 
                            <code className="text-blue-600 dark:text-blue-400 font-bold text-base">at_bigtime</code>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <span className="text-green-600 dark:text-green-400 font-bold text-lg">✓</span> 
                            <code className="text-blue-600 dark:text-blue-400 font-bold text-base">at_ishare</code>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-400">
                          <p className="text-xs font-medium mb-2 text-gray-900 dark:text-gray-100">✅ All code examples in this documentation use these exact spellings</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">Note: While network names are case-insensitive (server converts to lowercase), we recommend using lowercase in your code</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Single Order: Volume + Network */}
                        <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-green-500 text-white">POST</Badge>
                            <code className="text-sm font-mono">/api/checkout/initialize</code>
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">SINGLE ORDER</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            <strong>Single Order</strong> - Order one bundle for one phone number using volume and network
                          </p>
                          
                          <div className="mb-3">
                            <p className="text-sm font-semibold mb-2">Required Fields:</p>
                            <div className="bg-muted p-3 rounded text-sm space-y-2 mb-3 text-foreground">
                              <div><code className="text-primary">volume</code>: Bundle size (e.g., "1GB", "2GB", "5GB")</div>
                              <div><code className="text-primary">network</code>: Network name ("mtn", "telecel", "at_bigtime", "at_ishare")</div>
                              <div><code className="text-primary">productType</code>: "data_bundle"</div>
                              <div><code className="text-primary">customerPhone</code>: Recipient's 10-digit phone (e.g., "0241234567")</div>
                              <div><code className="text-primary">paymentMethod</code>: "wallet" (API orders use wallet balance)</div>
                              <div><code className="text-primary">agentSlug</code>: Agent's storefront slug (optional)</div>
                            </div>
                            <p className="text-sm font-semibold mb-2">Request Body Example:</p>
                            <div className="bg-black p-3 rounded">
                              <pre className="text-green-400 text-xs">
{`{
  "volume": "1GB",
  "network": "mtn",
  "productType": "data_bundle",
  "customerPhone": "0241234567",
  "paymentMethod": "wallet",
  "agentSlug": "john-data-store"
}`}
                              </pre>
                            </div>
                            <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/40 border border-green-500/50 rounded">
                              <p className="text-sm font-semibold text-green-800 dark:text-white mb-1">✅ Why Use This Method:</p>
                              <ul className="text-xs text-green-700 dark:text-green-100 space-y-1 ml-4 list-disc">
                                <li>No need to look up bundle IDs - just specify volume and network</li>
                                <li>Automatic price calculation based on user role</li>
                                <li>System finds the matching bundle automatically</li>
                                <li>Perfect for simple integrations</li>
                              </ul>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold mb-2">Success Response (200):</p>
                            <div className="bg-black p-3 rounded">
                              <pre className="text-green-400 text-xs">
{`{
  "success": true,
  "message": "Order created successfully. Amount deducted from wallet.",
  "transaction": {
    "id": "67131c28-21e2-4cfa-ab4e-ef9716ce5ee6",
    "reference": "CLEC-MKVUPCNI-4438D1BC",
    "amount": "4.70",
    "status": "confirmed",
    "productName": "MTN 1GB - Non Expiry"
  },
  "wallet": {
    "previousBalance": "50.00",
    "amountDeducted": "4.70",
    "newBalance": "45.30"
  }
}`}
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Bulk Order: Volume + Network */}
                        <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-purple-500 text-white">POST</Badge>
                            <code className="text-sm font-mono">/api/checkout/initialize</code>
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">BULK ORDER</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            <strong>Bulk Order:</strong> Send the same bundle to multiple phone numbers using volume and network
                          </p>
                          
                          <div className="mb-3">
                            <p className="text-sm font-semibold mb-2">Required Fields:</p>
                            <div className="bg-muted p-3 rounded text-sm space-y-2 mb-3 text-foreground">
                              <div><code className="text-primary">volume</code>: Bundle size (e.g., "1GB", "2GB", "5GB")</div>
                              <div><code className="text-primary">network</code>: Network name ("mtn", "telecel", "at_bigtime", "at_ishare")</div>
                              <div><code className="text-primary">productType</code>: "data_bundle"</div>
                              <div><code className="text-primary">customerPhones</code>: Array of 10-digit phone numbers</div>
                              <div><code className="text-primary">paymentMethod</code>: "wallet" (API orders use wallet balance)</div>
                              <div><code className="text-primary">agentSlug</code>: Agent's storefront slug (optional)</div>
                              <div><code className="text-primary">isBulkOrder</code>: true (automatically detected when using customerPhones array)</div>
                            </div>
                            <p className="text-sm font-semibold mb-2">Request Body:</p>
                            <div className="bg-black p-3 rounded">
                              <pre className="text-green-400 text-xs">
{`{
  "volume": "1GB",
  "network": "mtn",
  "productType": "data_bundle",
  "customerPhones": [
    "0241234567",
    "0207654321",
    "0551122334"
  ],
  "paymentMethod": "wallet",
  "agentSlug": "john-data-store",
  "isBulkOrder": true
}`}
                              </pre>
                            </div>
                            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-500/50 rounded">
                              <p className="text-sm font-semibold text-yellow-800 dark:text-white mb-1">⚠️ Important Notes:</p>
                              <ul className="text-xs text-yellow-700 dark:text-yellow-100 space-y-1 ml-4 list-disc">
                                <li>All phones must be 10 digits starting with 0</li>
                                <li>Phone numbers are validated server-side</li>
                                <li>No duplicate phones allowed in one bulk order</li>
                                <li>20-minute cooldown per phone number enforced</li>
                                <li>Same volume and network sent to all recipients</li>
                                <li>Bulk orders NOT supported for AT iShare network</li>
                              </ul>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold mb-2">Success Response (200):</p>
                            <div className="bg-black p-3 rounded">
                              <pre className="text-green-400 text-xs">
{`{
  "success": true,
  "message": "Bulk order created successfully. Amount deducted from wallet.",
  "transaction": {
    "id": "67131c28-21e2-4cfa-ab4e-ef9716ce5ee6",
    "reference": "CLEC-BULK-XYZ789",
    "amount": "14.10",
    "status": "confirmed",
    "productName": "MTN 1GB - Bulk Order (3 recipients)"
  },
  "wallet": {
    "previousBalance": "50.00",
    "amountDeducted": "14.10",
    "newBalance": "35.90"
  },
  "recipients": [
    {"phone": "0241234567", "bundleName": "MTN 1GB - Non Expiry", "dataAmount": "1GB"},
    {"phone": "0207654321", "bundleName": "MTN 1GB - Non Expiry", "dataAmount": "1GB"},
    {"phone": "0551122334", "bundleName": "MTN 1GB - Non Expiry", "dataAmount": "1GB"}
  ]
}`}
                              </pre>
                            </div>
                          </div>
                        </div>

                        <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-900/20">
                          <p className="font-semibold text-sm mb-2 text-red-700 dark:text-red-400">
                            ❌ Error Responses:
                          </p>
                          <div className="bg-black p-3 rounded">
                            <pre className="text-red-400 text-xs">
{`// 400 - Invalid Phone
{
  "error": "Invalid phone number length. Phone number must be exactly 10 digits including the prefix (e.g., 0241234567)"
}

// 400 - Insufficient Balance (Wallet Payment)
{
  "error": "Insufficient wallet balance",
  "balance": "20.00",
  "required": "50.00"
}

// 429 - Cooldown Active
{
  "error": "Please wait 15 minute(s) before purchasing another bundle for 0241234567.",
  "cooldownMinutes": 15,
  "phone": "0241234567"
}

// 404 - Bundle Not Found (Volume+Network)
{
  "error": "No 1GB bundle found for mtn network",
  "hint": "Available volumes can be fetched from /api/products/data-bundles?network=mtn"
}`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Network-Specific Examples */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 pb-2 border-b">3. Network-Specific Order Examples</h3>
                      
                      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 rounded-lg shadow-sm">
                        <h4 className="font-bold mb-3 text-blue-900 dark:text-white text-base flex items-center gap-2">
                          <span className="text-2xl">📡</span> Use These Exact Network Names in Your Code
                        </h4>
                        <p className="text-sm mb-3 font-medium text-blue-900 dark:text-white">All examples below use these exact network spellings:</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <code className="text-blue-600 dark:text-blue-400 font-bold text-base">"mtn"</code>
                            <span className="text-xs text-gray-600 dark:text-gray-400">MTN Ghana</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <code className="text-blue-600 dark:text-blue-400 font-bold text-base">"telecel"</code>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Telecel</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <code className="text-blue-600 dark:text-blue-400 font-bold text-base">"at_bigtime"</code>
                            <span className="text-xs text-gray-600 dark:text-gray-400">AT Bigtime</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <code className="text-blue-600 dark:text-blue-400 font-bold text-base">"at_ishare"</code>
                            <span className="text-xs text-gray-600 dark:text-gray-400">AT iShare</span>
                          </div>
                        </div>
                        <p className="text-xs font-semibold bg-white dark:bg-gray-800 p-2 rounded text-gray-900 dark:text-gray-100">✅ Copy these exact spellings from the examples below</p>
                      </div>

                      <div className="space-y-6">
                        {/* MTN Examples */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 text-lg">MTN Network</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold mb-2">Single Order (MTN):</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`{
  "volume": "1GB",
  "network": "mtn",
  "productType": "data_bundle",
  "customerPhone": "0241234567",
  "paymentMethod": "wallet",
  "agentSlug": "john-data-store"
}`}
                                </pre>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-semibold mb-2">Bulk Order (MTN) - ✅ Supported:</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`{
  "volume": "1GB",
  "network": "mtn",
  "productType": "data_bundle",
  "customerPhones": [
    "0241234567",
    "0254567890"
  ],
  "paymentMethod": "wallet",
  "agentSlug": "john-data-store",
  "isBulkOrder": true
}`}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Telecel Examples */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 text-lg">Telecel Network</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold mb-2">Single Order (Telecel):</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`{
  "volume": "2GB",
  "network": "telecel",
  "productType": "data_bundle",
  "customerPhone": "0201234567",
  "paymentMethod": "wallet"
}`}
                                </pre>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-semibold mb-2">Bulk Order (Telecel) - ✅ Supported:</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`{
  "volume": "2GB",
  "network": "telecel",
  "productType": "data_bundle",
  "customerPhones": [
    "0201234567",
    "0501234567"
  ],
  "paymentMethod": "wallet",
  "isBulkOrder": true
}`}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AT Bigtime Examples */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 text-lg">AT Bigtime Network</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold mb-2">Single Order (AT Bigtime):</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`{
  "volume": "1.5GB",
  "network": "at_bigtime",
  "productType": "data_bundle",
  "customerPhone": "0261234567",
  "paymentMethod": "wallet"
}`}
                                </pre>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-semibold mb-2">Bulk Order (AT Bigtime) - ✅ Supported:</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`{
  "volume": "1.5GB",
  "network": "at_bigtime",
  "productType": "data_bundle",
  "customerPhones": [
    "0261234567",
    "0271234567"
  ],
  "paymentMethod": "wallet",
  "isBulkOrder": true
}`}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AT iShare Examples */}
                        <div className="border rounded-lg p-4 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10">
                          <h4 className="font-semibold mb-3 text-lg text-red-700 dark:text-red-400">AT iShare Network</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold mb-2">Single Order (AT iShare) - ✅ Supported:</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`{
  "volume": "1GB",
  "network": "at_ishare",
  "productType": "data_bundle",
  "customerPhone": "0561234567",
  "paymentMethod": "wallet"
}`}
                                </pre>
                              </div>
                            </div>

                            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-500/50 rounded">
                              <p className="text-sm font-semibold mb-2 text-red-800 dark:text-red-300">❌ Bulk Order (AT iShare) - NOT SUPPORTED</p>
                              <p className="text-xs text-red-700 dark:text-red-400">
                                AT iShare network does not support bulk orders. Attempting to create a bulk order with network="at_ishare" will result in an error:
                              </p>
                              <div className="bg-black p-2 rounded mt-2">
                                <pre className="text-red-400 text-xs">
{`{
  "error": "Bulk purchases are not available for AT iShare network"
}`}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verify Order */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 pb-2 border-b">4. Verify Order Status</h3>
                      
                      <div className="space-y-6">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-blue-500 text-white">GET</Badge>
                            <code className="text-sm font-mono">/api/transactions/verify/{'{reference}'}</code>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Check order status after payment using the reference code
                          </p>
                          
                          <div className="mb-3">
                            <p className="text-sm font-semibold mb-2">Path Parameters:</p>
                            <div className="bg-muted p-3 rounded text-sm text-foreground">
                              <code className="text-primary">reference</code>: Transaction reference (e.g., "CLEC-ABC123")
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-semibold mb-2">Success Response (200):</p>
                            <div className="bg-black p-3 rounded">
                              <pre className="text-green-400 text-xs">
{`{
  "status": "success",
  "transaction": {
    "id": 789,
    "reference": "CLEC-ABC123",
    "amount": 5.00,
    "status": "completed"
  },
  "products": [
    {
      "type": "data_bundle",
      "network": "mtn",
      "volume": "1GB",
      "phone": "0241234567"
    }
  ]
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Webhooks Section */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 pb-2 border-b">5. Webhooks - Automatic Status Updates</h3>
                      
                      <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-500 rounded-lg">
                        <h4 className="font-bold mb-2 text-green-900 dark:text-white">🔔 Automatic Notifications</h4>
                        <p className="text-sm text-green-900 dark:text-white">Instead of constantly checking order status, provide a webhook URL when creating orders. Our system will automatically notify you when the order status changes (paid, processing, completed, failed).</p>
                      </div>

                      <div className="space-y-6">
                        {/* How to Use Webhooks */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 text-lg">How to Receive Status Updates</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold mb-2">Step 1: Add webhookUrl to Your Order Request</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`{
  "volume": "1GB",
  "network": "mtn",
  "productType": "data_bundle",
  "customerPhone": "0241234567",
  "paymentMethod": "wallet",
  "webhookUrl": "https://yoursite.com/api/webhook"
}`}
                                </pre>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-semibold mb-2">Step 2: We'll POST to Your Webhook URL on Every Status Change</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`POST https://yoursite.com/api/webhook
Content-Type: application/json
User-Agent: Resellers-Hub-Webhook/1.0
X-Webhook-Signature: [base64_signature]

{
  "event": "order.status_updated",
  "reference": "CLEC-ABC123",
  "status": "completed",
  "deliveryStatus": "delivered",
  "timestamp": "2026-01-27T00:30:00.000Z",
  "order": {
    "id": "67131c28-21e2-4cfa-ab4e-ef9716ce5ee6",
    "reference": "CLEC-ABC123",
    "amount": 4.70,
    "customerEmail": null,
    "isBulkOrder": false,
    "createdAt": "2026-01-27T00:21:19.578Z",
    "completedAt": "2026-01-27T00:30:00.000Z",
    "previousStatus": "processing",
    "currentStatus": "completed"
  },
  "products": [
    {
      "bundleId": "9706a8cb-c33c-445b-9569-83d07799b7ca",
      "bundleName": "MTN 1GB - Non Expiry",
      "phone": "0241234567",
      "network": "mtn"
    }
  ]
}`}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Status Flow */}
                        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/30">
                          <h4 className="font-semibold mb-3 text-lg text-blue-900 dark:text-white">Order Status Flow</h4>
                          <div className="space-y-2 text-sm text-blue-900 dark:text-white">
                            <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded">
                              <span className="font-mono font-bold text-yellow-600">pending</span>
                              <span>→</span>
                              <span className="text-muted-foreground">Order created, awaiting payment</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded">
                              <span className="font-mono font-bold text-blue-600">confirmed</span>
                              <span>→</span>
                              <span className="text-muted-foreground">Payment confirmed (paid), order queued for processing</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded">
                              <span className="font-mono font-bold text-purple-600">pending (deliveryStatus: processing)</span>
                              <span>→</span>
                              <span className="text-muted-foreground">Bundle being sent to network provider</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded">
                              <span className="font-mono font-bold text-green-600">completed (deliveryStatus: delivered)</span>
                              <span>→</span>
                              <span className="text-muted-foreground">Bundle delivered successfully ✅</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded">
                              <span className="font-mono font-bold text-red-600">failed</span>
                              <span>→</span>
                              <span className="text-muted-foreground">Delivery failed, will auto-refund ❌</span>
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-800/40 border border-blue-500/50 rounded">
                            <p className="text-sm font-semibold text-blue-800 dark:text-white mb-1">📝 Note:</p>
                            <p className="text-xs text-blue-700 dark:text-blue-100">Webhooks are sent when <strong>status</strong> or <strong>deliveryStatus</strong> changes. Monitor both fields to track the complete order lifecycle.</p>
                          </div>
                        </div>

                        {/* Webhook Implementation Guide */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-3 text-lg">Implement Your Webhook Endpoint</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-semibold mb-2">Example Webhook Handler (Node.js/Express):</p>
                              <div className="bg-black p-3 rounded">
                                <pre className="text-green-400 text-xs">
{`app.post('/api/webhook', express.json(), (req, res) => {
  const { event, reference, status, deliveryStatus, order, products } = req.body;
  
  console.log(\`Webhook received: \${event}\`);
  console.log(\`Order \${reference}: status=\${status}, delivery=\${deliveryStatus}\`);
  
  // Verify webhook signature (recommended for production)
  const signature = req.headers['x-webhook-signature'];
  // if (!verifySignature(req.body, signature)) {
  //   return res.status(401).json({ error: 'Invalid signature' });
  // }
  
  // Update your database based on status
  if (status === 'completed' && deliveryStatus === 'delivered') {
    // Bundle successfully delivered
    database.updateOrder(reference, { 
      status: 'completed',
      deliveredAt: order.completedAt
    });
    
    // Notify customer(s)
    products.forEach(product => {
      sendSMS(product.phone, 
        \`Your \${product.bundleName} has been delivered!\`
      );
    });
    
  } else if (status === 'failed') {
    // Delivery failed - handle refund if needed
    database.updateOrder(reference, { 
      status: 'failed',
      refundProcessed: true 
    });
    
    // Notify admin
    notifyAdmin(\`Order \${reference} failed - check logs\`);
    
  } else if (status === 'confirmed') {
    // Payment confirmed, order being processed
    database.updateOrder(reference, { status: 'paid' });
  }
  
  // CRITICAL: Always respond with 200 OK within 10 seconds
  res.status(200).json({ received: true });
});`}
                                </pre>
                              </div>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-500/50 rounded p-3">
                              <p className="text-sm font-semibold text-yellow-800 dark:text-white mb-2">⚠️ Important Webhook Requirements:</p>
                              <ul className="text-xs text-yellow-700 dark:text-yellow-100 space-y-1 ml-4 list-disc">
                                <li><strong>Response Time:</strong> Your endpoint MUST return HTTP 200 within 10 seconds (timeout enforced)</li>
                                <li><strong>Retry Logic:</strong> Failed webhooks are retried up to 3 times with exponential backoff (1s, 2s, 4s)</li>
                                <li><strong>Idempotency:</strong> Handle duplicate webhooks gracefully - same status may be sent multiple times</li>
                                <li><strong>Async Processing:</strong> If processing takes &gt;5s, respond 200 immediately and process async</li>
                                <li><strong>Security:</strong> Use HTTPS for production webhook URLs</li>
                                <li><strong>Signature Verification:</strong> Check X-Webhook-Signature header to verify authenticity</li>
                                <li><strong>Status Transitions:</strong> pending → confirmed → pending(processing) → completed(delivered) or failed</li>
                              </ul>
                            </div>
                            
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-500/50 rounded">
                              <p className="text-sm font-semibold text-blue-800 dark:text-white mb-2">🔐 Webhook Security (Optional):</p>
                              <p className="text-xs text-blue-700 dark:text-blue-100 mb-2">Each webhook includes an <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded text-blue-900 dark:text-white">X-Webhook-Signature</code> header for verification. While optional, it's recommended for production to prevent unauthorized webhook calls.</p>
                              <div className="bg-black p-2 rounded mt-2">
                                <pre className="text-green-400 text-xs">
{`// Verify webhook signature (optional but recommended)
const signature = req.headers['x-webhook-signature'];
const isValid = verifyWebhookSignature(req.body, signature);
if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}`}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Testing Webhooks */}
                        <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/30">
                          <h4 className="font-semibold mb-3 text-lg text-purple-800 dark:text-white">🧪 Testing Webhooks</h4>
                          <p className="text-sm mb-3 text-purple-900 dark:text-white">Use these services to test your webhook before going live:</p>
                          <div className="space-y-2 text-sm text-purple-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">webhook.site</code>
                              <span className="text-muted-foreground">Get a temporary webhook URL and see incoming requests</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-blue-600 dark:text-blue-400">ngrok</code>
                              <span className="text-muted-foreground">Expose your local development server to the internet</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Code Examples Section */}
              <TabsContent value="examples" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-primary" />
                      Code Examples
                    </CardTitle>
                    <CardDescription>
                      Complete examples for browsing offers and creating single/bulk orders
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-500/50 rounded inline-block">
                        <p className="text-xs font-semibold mb-1 text-yellow-900 dark:text-white">📌 Network names in all examples:</p>
                        <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">mtn</code> | <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">telecel</code> | <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">at_bigtime</code> | <code className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">at_ishare</code>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* JavaScript Examples */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">JavaScript</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">1. Browse Offers</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('js1-code', 'js1')}
                            >
                              {copiedCode === 'js1' ? (
                                <><Check className="w-4 h-4 mr-2 text-green-500" />Copied!</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-2" />Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`const API_KEY = 'sk_your_api_key_here';
const BASE_URL = '${baseUrl}/api';

async function getBundleOffers(network = 'MTN') {
  const response = await fetch(
    \`\${BASE_URL}/products/data-bundles?network=\${network}\`,
    {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const bundles = await response.json();
  console.log('Available offers:', bundles);
  return bundles;
}

getBundleOffers('MTN');`}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">2. Browse Agent Store by Slug</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('js2-code', 'js2')}
                            >
                              {copiedCode === 'js2' ? (
                                <><Check className="w-4 h-4 mr-2 text-green-500" />Copied!</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-2" />Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`async function getAgentStore(slug) {
  const response = await fetch(
    \`\${BASE_URL}/store/agent/\${slug}\`,
    {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    console.error('Store not found:', slug);
    return null;
  }
  
  const store = await response.json();
  console.log('Store:', store.agent.businessName);
  console.log('Bundles:', store.bundles);
  return store;
}

getAgentStore('john-data-store');`}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">3. Create Order (Volume + Network - SIMPLEST ⭐)</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(`async function createOrder(volume, network, phone, agentSlug = null) {
  const response = await fetch(\`\${BASE_URL}/checkout/initialize\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      volume: volume,           // \"1GB\", \"2GB\", \"5GB\", etc.
      network: network,         // \"mtn\", \"telecel\", \"at_bigtime\", \"at_ishare\"
      productType: 'data_bundle',
      customerPhone: phone,     // 10-digit phone: \"0241234567\"
      paymentMethod: 'paystack',
      agentSlug: agentSlug      // Optional agent slug
    })
  });
  
  const result = await response.json();
  
  if (result.paymentUrl) {
    console.log('Order created!');
    console.log('Reference:', result.transaction.reference);
    console.log('Amount:', result.transaction.amount);
    console.log('Redirect to:', result.paymentUrl);
    // Redirect user to complete payment
    window.location.href = result.paymentUrl;
    return result;
  } else {
    console.error('Order failed:', result.error);
    throw new Error(result.error);
  }
}

// Examples:
createOrder('1GB', 'mtn', '0241234567', 'john-data-store');
createOrder('5GB', 'telecel', '0501234567');
createOrder('2GB', 'at_bigtime', '0261234567');`, 'js3')}
                            >
                              {copiedCode === 'js3' ? (
                                <><Check className="w-4 h-4 mr-2 text-green-500" />Copied!</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-2" />Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`async function createOrder(volume, network, phone, agentSlug = null) {
  const response = await fetch(\`\${BASE_URL}/checkout/initialize\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      volume: volume,           // \"1GB\", \"2GB\", \"5GB\", etc.
      network: network,         // \"mtn\", \"telecel\", \"at_bigtime\", \"at_ishare\"
      productType: 'data_bundle',
      customerPhone: phone,     // 10-digit phone: \"0241234567\"
      paymentMethod: 'paystack',
      agentSlug: agentSlug      // Optional agent slug
    })
  });
  
  const result = await response.json();
  
  if (result.paymentUrl) {
    console.log('Order created!');
    console.log('Reference:', result.transaction.reference);
    console.log('Amount:', result.transaction.amount);
    console.log('Redirect to:', result.paymentUrl);
    // Redirect user to complete payment
    window.location.href = result.paymentUrl;
    return result;
  } else {
    console.error('Order failed:', result.error);
    throw new Error(result.error);
  }
}

// Examples:
createOrder('1GB', 'mtn', '0241234567', 'john-data-store');
createOrder('5GB', 'telecel', '0501234567');
createOrder('2GB', 'at_bigtime', '0261234567');`}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">4. Create Bulk Order</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('js4-code', 'js4')}
                            >
                              {copiedCode === 'js4' ? (
                                <><Check className="w-4 h-4 mr-2 text-green-500" />Copied!</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-2" />Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`async function createBulkOrder(orders, network, agentSlug = null) {
  const response = await fetch(\`\${BASE_URL}/checkout/initialize\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderItems: orders.map(order => ({
        bundleId: order.bundleId,
        phone: order.phone,
        bundleName: order.bundleName
      })),
      productType: 'data_bundle',
      network: network,  // \"mtn\", \"telecel\", \"at_bigtime\" (NOT at_ishare)
      paymentMethod: 'paystack',
      agentSlug: agentSlug,
      isBulkOrder: true
    })
  });
  
  const result = await response.json();
  
  if (result.paymentUrl) {
    console.log(\`Bulk order created: \${orders.length} bundles\`);
    console.log('Reference:', result.transaction.reference);
    console.log('Total:', result.debug.totalAmount);
    console.log('Recipients:', result.debug.numberOfRecipients);
    window.location.href = result.paymentUrl;
    return result;
  } else {
    console.error('Bulk order failed:', result.error);
    throw new Error(result.error);
  }
}

// Example: 3 MTN bundles for different phones
const bulkOrders = [
  { bundleId: '123', phone: '0241234567', bundleName: 'MTN 1GB Daily' },
  { bundleId: '124', phone: '0207654321', bundleName: 'MTN 2GB Weekly' },
  { bundleId: '125', phone: '0551122334', bundleName: 'MTN 5GB Monthly' }
];

createBulkOrder(bulkOrders, 'mtn', 'john-data-store');`}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">5. Verify Order</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('js5-code', 'js5')}
                            >
                              {copiedCode === 'js5' ? (
                                <><Check className="w-4 h-4 mr-2 text-green-500" />Copied!</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-2" />Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`async function verifyOrder(reference) {
  const response = await fetch(
    \`\${BASE_URL}/transactions/verify/\${reference}\`,
    {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const result = await response.json();
  
  if (result.status === 'success') {
    console.log('✅ Order completed!');
    console.log('Products delivered:', result.products);
    return result;
  } else if (result.status === 'pending') {
    console.log('⏳ Payment processing...');
  } else {
    console.error('❌ Order failed');
  }
  
  return result;
}

verifyOrder('CLEC-ABC123');`}
                            </pre>
                          </div>
                        </div>

                        {/* Network-Specific Examples */}
                        <div className="border-t pt-6 mt-6">
                          <h4 className="font-medium mb-4 text-lg">6. All Networks Examples</h4>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`// ============================================
// ALL SUPPORTED NETWORKS
// ============================================

// MTN Network (Single & Bulk Supported)
const mtnSingle = {
  productId: '123',
  productType: 'data_bundle',
  customerPhone: '0241234567',
  amount: 5.00
};

const mtnBulk = {
  orderItems: [
    { bundleId: '123', phone: '0241234567', bundleName: 'MTN 1GB' },
    { bundleId: '124', phone: '0254567890', bundleName: 'MTN 5GB' }
  ],
  productType: 'data_bundle',
  network: 'mtn',
  isBulkOrder: true
};

// Telecel Network (Single & Bulk Supported)
const telecelSingle = {
  productId: '456',
  productType: 'data_bundle',
  customerPhone: '0201234567',
  amount: 4.50
};

const telecelBulk = {
  orderItems: [
    { bundleId: '456', phone: '0201234567', bundleName: 'Telecel 2GB' },
    { bundleId: '457', phone: '0501234567', bundleName: 'Telecel 10GB' }
  ],
  productType: 'data_bundle',
  network: 'telecel',
  isBulkOrder: true
};

// AT Bigtime Network (Single & Bulk Supported)
const atBigtimeSingle = {
  productId: '789',
  productType: 'data_bundle',
  customerPhone: '0261234567',
  amount: 6.00
};

const atBigtimeBulk = {
  orderItems: [
    { bundleId: '789', phone: '0261234567', bundleName: 'AT Bigtime 1.5GB' },
    { bundleId: '790', phone: '0271234567', bundleName: 'AT Bigtime 3GB' }
  ],
  productType: 'data_bundle',
  network: 'at_bigtime',
  isBulkOrder: true
};

// AT iShare Network (ONLY Single Supported - NO BULK)
const atIshareSingle = {
  productId: '999',
  productType: 'data_bundle',
  customerPhone: '0561234567',
  amount: 3.50
};

// ❌ AT iShare Bulk NOT SUPPORTED - Will return error
const atIshareBulk = {
  // This will FAIL with error:
  // "Bulk purchases are not available for AT iShare network"
  orderItems: [...],
  network: 'at_ishare',  // ❌ Will be rejected
  isBulkOrder: true
};

// Usage examples for all networks
await createSingleOrder('123', '0241234567', 'agent-slug', 5.00);    // MTN
await createSingleOrder('456', '0201234567', 'agent-slug', 4.50);    // Telecel
await createSingleOrder('789', '0261234567', 'agent-slug', 6.00);    // AT Bigtime
await createSingleOrder('999', '0561234567', 'agent-slug', 3.50);    // AT iShare

// Bulk orders (NOT for at_ishare)
await createBulkOrder(mtnOrders, 'agent-slug', 'mtn');           // ✅ Works
await createBulkOrder(telecelOrders, 'agent-slug', 'telecel');   // ✅ Works
await createBulkOrder(atBigOrders, 'agent-slug', 'at_bigtime');  // ✅ Works
// await createBulkOrder(orders, 'agent-slug', 'at_ishare');     // ❌ Will fail`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Python Examples */}
                    <div className="border-t pt-8">
                      <h3 className="text-xl font-semibold mb-4">Python</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">Browse Offers & Create Single Order</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('py1-code', 'py1')}
                            >
                              {copiedCode === 'py1' ? (
                                <><Check className="w-4 h-4 mr-2 text-green-500" />Copied!</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-2" />Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`import requests

API_KEY = 'sk_your_api_key_here'
BASE_URL = '${baseUrl}/api'
headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def get_bundles(network='mtn'):
    """Browse offers by network"""
    response = requests.get(
        f'{BASE_URL}/products/data-bundles?network={network}',
        headers=headers
    )
    bundles = response.json()
    for b in bundles:
        print(f"{b['network']} {b['volume']} - GHS {b['price']}")
    return bundles

def create_single_order(bundle_id, phone, agent_slug, amount):
    """Create single order"""
    payload = {
        'productId': str(bundle_id),
        'productType': 'data_bundle',
        'customerPhone': phone,
        'agentSlug': agent_slug,
        'amount': amount
    }
    
    response = requests.post(
        f'{BASE_URL}/checkout/initialize',
        headers=headers,
        json=payload
    )
    
    result = response.json()
    if response.status_code == 200:
        print(f"✅ Order: {result['reference']}")
        return result
    else:
        print(f"❌ Error: {result.get('error')}")

# Usage
bundles = get_bundles('mtn')
create_single_order('123', '0241234567', 'john-data-store', 5.00)`}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">Create Bulk Order</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard('py2-code', 'py2')}
                            >
                              {copiedCode === 'py2' ? (
                                <><Check className="w-4 h-4 mr-2 text-green-500" />Copied!</>
                              ) : (
                                <><Copy className="w-4 h-4 mr-2" />Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`def create_bulk_order(orders, agent_slug, network):
    """Create bulk order for multiple recipients"""
    order_items = [
        {
            'bundleId': str(order['bundleId']),
            'phone': order['phone'],
            'bundleName': order['bundleName']
        }
        for order in orders
    ]
    
    payload = {
        'orderItems': order_items,
        'productType': 'data_bundle',
        'network': network,
        'agentSlug': agent_slug,
        'isBulkOrder': True
    }
    
    response = requests.post(
        f'{BASE_URL}/checkout/initialize',
        headers=headers,
        json=payload
    )
    
    result = response.json()
    if response.status_code == 200:
        print(f"✅ Bulk order: {len(order_items)} bundles")
        print(f"Total: GHS {result['totalAmount']}")
        print(f"Reference: {result['reference']}")
        return result
    else:
        print(f"❌ Error: {result.get('error')}")

# Buy 3 MTN bundles for 3 different phones
bulk_orders = [
    {'bundleId': '123', 'phone': '0241234567', 'bundleName': 'MTN 1GB Daily'},
    {'bundleId': '124', 'phone': '0207654321', 'bundleName': 'MTN 2GB Weekly'},
    {'bundleId': '125', 'phone': '0551122334', 'bundleName': 'MTN 5GB Monthly'}
]

create_bulk_order(bulk_orders, 'john-data-store', 'mtn')`}
                            </pre>
                          </div>
                        </div>

                        {/* All Networks Python Examples */}
                        <div className="border-t pt-6 mt-6">
                          <h4 className="font-medium mb-4 text-lg">All Networks Examples (Python)</h4>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`# ============================================
# PYTHON - ALL SUPPORTED NETWORKS
# ============================================

# MTN Network (Single & Bulk)
mtn_single = create_single_order('123', '0241234567', 'agent-slug', 5.00)

mtn_bulk = [
    {'bundleId': '123', 'phone': '0241234567', 'bundleName': 'MTN 1GB'},
    {'bundleId': '124', 'phone': '0254567890', 'bundleName': 'MTN 5GB'}
]
create_bulk_order(mtn_bulk, 'agent-slug', 'mtn')

# Telecel Network (Single & Bulk)
telecel_single = create_single_order('456', '0201234567', 'agent-slug', 4.50)

telecel_bulk = [
    {'bundleId': '456', 'phone': '0201234567', 'bundleName': 'Telecel 2GB'},
    {'bundleId': '457', 'phone': '0501234567', 'bundleName': 'Telecel 10GB'}
]
create_bulk_order(telecel_bulk, 'agent-slug', 'telecel')

# AT Bigtime Network (Single & Bulk)
at_bigtime_single = create_single_order('789', '0261234567', 'agent-slug', 6.00)

at_bigtime_bulk = [
    {'bundleId': '789', 'phone': '0261234567', 'bundleName': 'AT Bigtime 1.5GB'},
    {'bundleId': '790', 'phone': '0271234567', 'bundleName': 'AT Bigtime 3GB'}
]
create_bulk_order(at_bigtime_bulk, 'agent-slug', 'at_bigtime')

# AT iShare Network (ONLY Single - NO BULK)
at_ishare_single = create_single_order('999', '0561234567', 'agent-slug', 3.50)

# ❌ AT iShare Bulk NOT SUPPORTED
# create_bulk_order(orders, 'agent-slug', 'at_ishare')  # This will fail!

# Summary of usage
print("Single orders for all networks:")
get_bundles('mtn')      # Browse MTN offers
get_bundles('telecel')  # Browse Telecel offers
get_bundles('at_bigtime')  # Browse AT Bigtime offers
get_bundles('at_ishare')   # Browse AT iShare offers

# Bulk orders (MTN, Telecel, AT Bigtime only)
create_bulk_order(mtn_bulk, 'agent-slug', 'mtn')         # ✅ Works
create_bulk_order(telecel_bulk, 'agent-slug', 'telecel') # ✅ Works
create_bulk_order(at_big_bulk, 'agent-slug', 'at_bigtime')  # ✅ Works`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* cURL Examples */}
                    <div className="border-t pt-8">
                      <h3 className="text-xl font-semibold mb-4">cURL Commands</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-2">Browse Offers</h4>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`curl -X GET "${baseUrl}/api/products/data-bundles?network=mtn" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Browse Agent Store</h4>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`curl -X GET "${baseUrl}/api/store/agent/john-data-store" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Single Order</h4>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "123",
    "productType": "data_bundle",
    "customerPhone": "0241234567",
    "agentSlug": "john-data-store",
    "amount": 5.00
  }'`}
                            </pre>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Bulk Order</h4>
                          <div className="bg-black rounded-lg overflow-x-auto">
                            <pre className="p-4 text-sm text-green-400">
{`curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderItems": [
      {
        "bundleId": "123",
        "phone": "0241234567",
        "bundleName": "MTN 1GB Daily"
      },
      {
        "bundleId": "124",
        "phone": "0207654321",
        "bundleName": "MTN 2GB Weekly"
      },
      {
        "bundleId": "125",
        "phone": "0551122334",
        "bundleName": "MTN 5GB Monthly"
      }
    ],
    "productType": "data_bundle",
    "network": "mtn",
    "agentSlug": "john-data-store",
    "isBulkOrder": true
  }'`}
                            </pre>
                          </div>
                        </div>

                        {/* All Networks cURL Examples */}
                        <div className="border-t pt-6 mt-6">
                          <h4 className="font-medium mb-4 text-lg">All Networks Examples (cURL)</h4>
                          
                          {/* MTN */}
                          <div className="mb-6">
                            <h5 className="font-medium mb-2 text-blue-400">MTN Network</h5>
                            <div className="bg-black rounded-lg overflow-x-auto mb-3">
                              <pre className="p-4 text-sm text-green-400">
{`# MTN Single Order
curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "123",
    "productType": "data_bundle",
    "customerPhone": "0241234567",
    "amount": 5.00
  }'

# MTN Bulk Order
curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderItems": [
      {"bundleId": "123", "phone": "0241234567", "bundleName": "MTN 1GB"},
      {"bundleId": "124", "phone": "0254567890", "bundleName": "MTN 5GB"}
    ],
    "productType": "data_bundle",
    "network": "mtn",
    "isBulkOrder": true
  }'`}
                              </pre>
                            </div>
                          </div>

                          {/* Telecel */}
                          <div className="mb-6">
                            <h5 className="font-medium mb-2 text-blue-400">Telecel Network</h5>
                            <div className="bg-black rounded-lg overflow-x-auto mb-3">
                              <pre className="p-4 text-sm text-green-400">
{`# Telecel Single Order
curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "456",
    "productType": "data_bundle",
    "customerPhone": "0201234567",
    "amount": 4.50
  }'

# Telecel Bulk Order
curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderItems": [
      {"bundleId": "456", "phone": "0201234567", "bundleName": "Telecel 2GB"},
      {"bundleId": "457", "phone": "0501234567", "bundleName": "Telecel 10GB"}
    ],
    "productType": "data_bundle",
    "network": "telecel",
    "isBulkOrder": true
  }'`}
                              </pre>
                            </div>
                          </div>

                          {/* AT Bigtime */}
                          <div className="mb-6">
                            <h5 className="font-medium mb-2 text-blue-400">AT Bigtime Network</h5>
                            <div className="bg-black rounded-lg overflow-x-auto mb-3">
                              <pre className="p-4 text-sm text-green-400">
{`# AT Bigtime Single Order
curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "789",
    "productType": "data_bundle",
    "customerPhone": "0261234567",
    "amount": 6.00
  }'

# AT Bigtime Bulk Order
curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderItems": [
      {"bundleId": "789", "phone": "0261234567", "bundleName": "AT Bigtime 1.5GB"},
      {"bundleId": "790", "phone": "0271234567", "bundleName": "AT Bigtime 3GB"}
    ],
    "productType": "data_bundle",
    "network": "at_bigtime",
    "isBulkOrder": true
  }'`}
                              </pre>
                            </div>
                          </div>

                          {/* AT iShare */}
                          <div className="mb-6">
                            <h5 className="font-medium mb-2 text-blue-400">AT iShare Network (Single Only)</h5>
                            <div className="bg-black rounded-lg overflow-x-auto mb-3">
                              <pre className="p-4 text-sm text-green-400">
{`# AT iShare Single Order (✅ Supported)
curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "999",
    "productType": "data_bundle",
    "customerPhone": "0561234567",
    "amount": 3.50
  }'

# AT iShare Bulk Order (❌ NOT SUPPORTED - Will Fail)
curl -X POST "${baseUrl}/api/checkout/initialize" \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "orderItems": [...],
    "network": "at_ishare",
    "isBulkOrder": true
  }'
# Error response:
# {
#   "error": "Bulk purchases are not available for AT iShare network"
# }`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
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

export default ApiDocumentationPage;

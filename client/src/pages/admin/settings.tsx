import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Bell, CreditCard, Shield, Smartphone, Upload, Image as ImageIcon, Save, X } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: string}>({});

  const { data: paystackConfig } = useQuery({
    queryKey: ["/api/paystack/config"],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append(type, file);
      return apiRequest("POST", `/api/admin/upload/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: (data: { url: string; filename: string }, { type }) => {
      setUploadedFiles(prev => ({ ...prev, [type]: data.url }));
      toast({ title: "File uploaded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate({ file, type });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-6">
          <h1 className="text-xl font-semibold">Settings</h1>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure basic application settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    defaultValue="CLECTECH"
                    data-testid="input-app-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    placeholder="support@clectech.com"
                    data-testid="input-support-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    placeholder="+233 XX XXX XXXX"
                    data-testid="input-support-phone"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
                <CardDescription>
                  Configure payment gateway integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paystackKey">Paystack Public Key</Label>
                  <Input
                    id="paystackKey"
                    type="password"
                    placeholder="pk_live_..."
                    data-testid="input-paystack-key"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <Label>Paystack Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {paystackConfig?.isConfigured 
                        ? (paystackConfig.isTestMode ? "Test Mode Active" : "Live Mode Active")
                        : "Not Configured"
                      }
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    paystackConfig?.isConfigured 
                      ? (paystackConfig.isTestMode 
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        )
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  }`}>
                    {paystackConfig?.isConfigured 
                      ? (paystackConfig.isTestMode ? "TEST" : "LIVE")
                      : "ERROR"
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  API Settings
                </CardTitle>
                <CardDescription>
                  Configure third-party API integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smsApiKey">SMS API Key</Label>
                  <Input
                    id="smsApiKey"
                    type="password"
                    placeholder="Enter SMS provider API key"
                    data-testid="input-sms-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataBundleApiKey">Data Bundle API Key</Label>
                  <Input
                    id="dataBundleApiKey"
                    type="password"
                    placeholder="Enter data bundle provider API key"
                    data-testid="input-bundle-api-key"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email alerts for important events
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-email-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send SMS alerts to customers on purchase
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-sms-notifications" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Agent Withdrawal Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when agents request withdrawals
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-withdrawal-alerts" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-approve Agents</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve new agent registrations
                    </p>
                  </div>
                  <Switch data-testid="switch-auto-approve" />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="minWithdrawal">Minimum Withdrawal (GHS)</Label>
                  <Input
                    id="minWithdrawal"
                    type="number"
                    defaultValue="10"
                    data-testid="input-min-withdrawal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxWithdrawal">Maximum Withdrawal (GHS)</Label>
                  <Input
                    id="maxWithdrawal"
                    type="number"
                    defaultValue="5000"
                    data-testid="input-max-withdrawal"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Media Uploads
                </CardTitle>
                <CardDescription>
                  Upload logos, banners, and network images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Site Logo</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "logo")}
                      className="flex-1"
                      disabled={uploadMutation.isPending}
                    />
                    {uploadedFiles.logo && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">✓ Uploaded</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(uploadedFiles.logo, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Home Page Banners</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "banner")}
                      className="flex-1"
                      disabled={uploadMutation.isPending}
                    />
                    {uploadedFiles.banner && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">✓ Uploaded</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(uploadedFiles.banner, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload banner images for the home page (recommended: 1200x400px)
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Network Provider Logos</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "network-logo")}
                      className="flex-1"
                      disabled={uploadMutation.isPending}
                    />
                    {uploadedFiles["network-logo"] && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">✓ Uploaded</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(uploadedFiles["network-logo"], '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload logos for network providers (MTN, Telecel, AirtelTigo)
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" data-testid="button-save-settings">
                Save Settings
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

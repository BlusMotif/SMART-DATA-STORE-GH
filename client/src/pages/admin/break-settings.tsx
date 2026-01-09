import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Save, Menu, Settings, Lock, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";

interface BreakSettings {
  isEnabled: boolean;
  message: string;
}

export default function AdminBreakSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch current break settings
  const { data: breakSettings, isLoading } = useQuery<BreakSettings>({
    queryKey: ["/api/admin/break-settings"],
  });

  useEffect(() => {
    if (breakSettings) {
      setIsEnabled(breakSettings.isEnabled);
      setMessage(breakSettings.message);
    }
  }, [breakSettings]);

  // Update break settings mutation
  const updateMutation = useMutation({
    mutationFn: async (settings: BreakSettings) => {
      const response = await apiRequest("POST", "/api/admin/break-settings", settings);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch the break settings query
      queryClient.invalidateQueries({ queryKey: ["/api/admin/break-settings"] });
      // Also invalidate the public break settings query used by BreakModeGuard
      queryClient.invalidateQueries({ queryKey: ["/api/break-settings"] });
      toast({
        title: "Settings Updated",
        description: `Site break mode ${data.isEnabled ? "enabled" : "disabled"} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update break settings.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (isEnabled && !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message when enabling break mode.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      isEnabled,
      message: message.trim(),
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
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
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h1 className="text-lg lg:text-xl font-semibold">Break Settings</h1>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Warning Alert */}
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Warning:</strong> Enabling break mode will make the entire site unavailable to all users except administrators.
                Only enable this during maintenance or emergency situations.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Site Maintenance Mode
                </CardTitle>
                <CardDescription>
                  Control site availability and display custom maintenance messages to users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Break Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Enable Break Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, the site will be unavailable to all users
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                    disabled={updateMutation.isPending}
                  />
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label htmlFor="break-message">Maintenance Message</Label>
                  <Textarea
                    id="break-message"
                    placeholder="Enter a message to display to users when the site is in break mode..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={!isEnabled || updateMutation.isPending}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    This message will be displayed to users when they try to access the site.
                    Keep it clear and informative about when the site will be available again.
                  </p>
                </div>

                {/* Preview */}
                {isEnabled && message && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="p-4 bg-muted rounded-lg border">
                      <div className="text-center space-y-4">
                        <div className="flex justify-center">
                          <div className="relative">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                              <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <X className="h-2.5 w-2.5 text-white" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                            Site Closed
                          </h2>
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="min-w-32"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className="font-medium">
                    Break Mode: {isEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                {isEnabled && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Site is currently unavailable to users
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
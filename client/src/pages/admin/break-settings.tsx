import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, X, Menu, Settings, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface BreakSettings {
  isEnabled: boolean;
  message: string;
}

export default function AdminBreakSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch current break settings
  const { data: breakSettings } = useQuery<BreakSettings>({
    queryKey: ["/api/admin/break-settings"],
    enabled: !!user,
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
      return await apiRequest<BreakSettings>("POST", "/api/admin/break-settings", settings);
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Break Mode Toggle - Slide Switch */}
            <div className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-red-500">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Label className="text-lg font-bold flex items-center gap-3 text-white">
                    <Lock className="h-6 w-6 text-white drop-shadow-lg" />
                    Enable Break Mode
                  </Label>
                  <p className="text-base leading-relaxed text-white">
                    ⚠️ When enabled, the site will be completely unavailable to all users except administrators
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold min-w-[100px] text-center ${
                    isEnabled
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-green-500 text-white shadow-md'
                  }`}>
                    {isEnabled ? '🚫 ENABLED' : '✅ DISABLED'}
                  </span>
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="break-mode-toggle" className="text-sm font-medium text-white">
                      {isEnabled ? 'ON' : 'OFF'}
                    </Label>
                    <Switch
                      id="break-mode-toggle"
                      checked={isEnabled}
                      onCheckedChange={setIsEnabled}
                      disabled={updateMutation.isPending}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 [&_[data-radix-switch-thumb]]:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-4 p-4 bg-white rounded-lg border-2 border-gray-300 text-black">
              <Label htmlFor="break-message" className="text-lg font-semibold">Maintenance Message</Label>
              <Textarea
                id="break-message"
                placeholder="Enter a message to display to users when the site is in break mode..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!isEnabled || updateMutation.isPending}
                rows={5}
                className="resize-none text-base p-4 border-2 border-gray-400"
              />
              <p className="text-sm text-black leading-relaxed">
                This message will be displayed to users when they try to access the site.
                Keep it clear and informative about when the site will be available again.
              </p>
            </div>

            {/* Preview */}
            {isEnabled && message && (
              <div className="space-y-4 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <Label className="text-lg font-semibold text-blue-900 dark:text-blue-100">Preview</Label>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner">
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="relative">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shadow-lg">
                          <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <X className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">
                        Site Closed
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-base leading-relaxed">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="min-w-40 h-12 text-lg font-semibold"
                size="lg"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-3" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
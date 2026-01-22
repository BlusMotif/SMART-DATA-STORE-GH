import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Settings, Bell, Smartphone, Save, X, Menu, Key, Plus, Trash2, ExternalLink } from "lucide-react";

interface Setting {
  key: string;
  value: string;
  description?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isActive: boolean;
  walletBalance: string;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

// Function to parse URLs from text and create clickable links
function parseMessageWithLinks(text: string) {
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Split text by URLs and create elements
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
        >
          {part}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return part;
  });
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({
    data_bundle_auto_processing: "false", // Default to disabled
  });
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [credentialForm, setCredentialForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Fetch settings from database
  const { data: settingsData } = useQuery<Setting[]>({
    queryKey: ["/api/admin/settings"],
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Fetch users for credential management
  const { data: usersData } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 30000,
  });

  // Fetch announcements
  const { data: announcementsData } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    refetchInterval: 30000,
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      return apiRequest("PUT", `/api/admin/settings/${key}`, { value, description });
    },
    onMutate: async ({ key, value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/admin/settings"] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<Setting[]>(["/api/admin/settings"]);

      // Optimistically update the cache
      queryClient.setQueryData<Setting[]>(["/api/admin/settings"], (old) => {
        if (!old) return old;
        return old.map(setting =>
          setting.key === key ? { ...setting, value } : setting
        );
      });

      // Also update local state optimistically
      setSettings(prev => ({ ...prev, [key]: value }));

      // Return a context object with the snapshotted value
      return { previousSettings };
    },
    onError: (err, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSettings) {
        queryClient.setQueryData(["/api/admin/settings"], context.previousSettings);
        // Also rollback local state
        const previousMap: Record<string, string> = {};
        context.previousSettings.forEach(setting => {
          previousMap[setting.key] = setting.value;
        });
        setSettings(previousMap);
      }
      toast({ title: "Failed to update setting", description: err.message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Setting updated successfully" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
  });

  // Update user credentials mutation
  const updateCredentialsMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      return apiRequest("PUT", `/api/admin/users/${userId}/credentials`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
      setCredentialForm({ email: "", password: "", name: "", phone: "" });
      toast({ title: "User credentials updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update credentials", description: error.message, variant: "destructive" });
    },
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; message: string }) => {
      return apiRequest("POST", "/api/admin/announcements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setAnnouncementForm({ title: "", message: "" });
      toast({ title: "Announcement created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create announcement", description: error.message, variant: "destructive" });
    },
  });

  // Update announcement mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/announcements/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "Announcement updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update announcement", description: error.message, variant: "destructive" });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "Announcement deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete announcement", description: error.message, variant: "destructive" });
    },
  });

  // Initialize settings when data loads
  useEffect(() => {
    if (settingsData) {
      const settingsMap: Record<string, string> = {
        data_bundle_auto_processing: "false", // Default to disabled
      };
      settingsData.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings(settingsMap);
    }
  }, [settingsData]);

  useEffect(() => {
    if (usersData) {
      setUsers(usersData);
    }
  }, [usersData]);

  useEffect(() => {
    if (announcementsData) {
      setAnnouncements(announcementsData);
    }
  }, [announcementsData]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSetting = (key: string, description?: string) => {
    const value = settings[key];
    if (value !== undefined) {
      updateSettingMutation.mutate({ key, value, description });
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setCredentialForm({
      email: user.email,
      password: "",
      name: user.name,
      phone: user.phone || "",
    });
  };

  const handleUpdateCredentials = () => {
    if (!selectedUser) return;

    const data: any = {};
    if (credentialForm.email && credentialForm.email !== selectedUser.email) data.email = credentialForm.email;
    if (credentialForm.password) data.password = credentialForm.password;
    if (credentialForm.name && credentialForm.name !== selectedUser.name) data.name = credentialForm.name;
    if (credentialForm.phone !== selectedUser.phone) data.phone = credentialForm.phone;

    if (Object.keys(data).length === 0) {
      toast({ title: "No changes detected", variant: "destructive" });
      return;
    }

    updateCredentialsMutation.mutate({ userId: selectedUser.id, data });
  };

  const handleCreateAnnouncement = () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }

    createAnnouncementMutation.mutate({
      title: announcementForm.title.trim(),
      message: announcementForm.message.trim(),
    });
  };

  const handleToggleAnnouncement = (id: string, isActive: boolean) => {
    updateAnnouncementMutation.mutate({ id, isActive: !isActive });
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteAnnouncementMutation.mutate(id);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r transform transition-transform duration-200 ease-in-out">
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
            <h1 className="text-lg lg:text-xl font-semibold">Settings</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* General Settings */}
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
                  <div className="flex gap-2">
                    <Input
                      id="appName"
                      value={settings.app_name || ""}
                      onChange={(e) => handleSettingChange("app_name", e.target.value)}
                      placeholder="CLECTECH"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveSetting("app_name", "Application name displayed in the UI")}
                      disabled={updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="supportEmail"
                      type="email"
                      autoComplete="email"
                      value={settings.support_email || ""}
                      onChange={(e) => handleSettingChange("support_email", e.target.value)}
                      placeholder="support@clectech.com"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveSetting("support_email", "Support email for customer inquiries")}
                      disabled={updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <div className="flex gap-2">
                    <Input
                      id="supportPhone"
                      autoComplete="tel"
                      value={settings.support_phone || ""}
                      onChange={(e) => handleSettingChange("support_phone", e.target.value)}
                      placeholder="+233 XX XXX XXXX"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveSetting("support_phone", "Support phone number")}
                      disabled={updateSettingMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Credential Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  User Credential Management
                </CardTitle>
                <CardDescription>
                  Manage user credentials and account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Select User to Manage
                    <select
                      className="w-full p-2 border rounded-md mt-1"
                      value={selectedUser?.id || ""}
                      onChange={(e) => {
                        const user = users.find(u => u.id === e.target.value);
                        if (user) handleUserSelect(user);
                      }}
                    >
                    <option value="">Choose a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                  </Label>
                </div>

                {selectedUser && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="font-medium">Update Credentials for {selectedUser.name}</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="userEmail">Email</Label>
                        <Input
                          id="userEmail"
                          type="email"
                          autoComplete="email"
                          value={credentialForm.email}
                          onChange={(e) => setCredentialForm(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userName">Name</Label>
                        <Input
                          id="userName"
                          autoComplete="name"
                          value={credentialForm.name}
                          onChange={(e) => setCredentialForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userPhone">Phone</Label>
                        <Input
                          id="userPhone"
                          autoComplete="tel"
                          value={credentialForm.phone}
                          onChange={(e) => setCredentialForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userPassword">New Password (leave empty to keep current)</Label>
                        <Input
                          id="userPassword"
                          type="password"
                          autoComplete="new-password"
                          value={credentialForm.password}
                          onChange={(e) => setCredentialForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter new password"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateCredentials}
                          disabled={updateCredentialsMutation.isPending}
                        >
                          {updateCredentialsMutation.isPending ? "Updating..." : "Update Credentials"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(null);
                            setCredentialForm({ email: "", password: "", name: "", phone: "" });
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Announcement Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Announcement Management
                </CardTitle>
                <CardDescription>
                  Create and manage system announcements for users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="announcementTitle">Title</Label>
                    <Input
                      id="announcementTitle"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Announcement title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcementMessage">Message</Label>
                    <textarea
                      id="announcementMessage"
                      className="w-full p-2 border rounded-md resize-none"
                      rows={3}
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Announcement message"
                    />
                  </div>

                  <Button
                    onClick={handleCreateAnnouncement}
                    disabled={createAnnouncementMutation.isPending}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Existing Announcements</Label>
                  {announcements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No announcements yet</p>
                  ) : (
                    <div className="space-y-2">
                      {announcements.map(announcement => (
                        <div key={announcement.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex-1">
                            <h4 className="font-medium">{announcement.title}</h4>
                            <div className="text-sm text-muted-foreground">
                              {parseMessageWithLinks(announcement.message)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              By {announcement.createdBy} • {new Date(announcement.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={announcement.isActive}
                              onCheckedChange={() => handleToggleAnnouncement(announcement.id, announcement.isActive)}
                              className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 [&_[data-radix-switch-thumb]]:bg-white"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

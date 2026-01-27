import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/constants";
import { Bell, Plus, Trash2, Menu, Eye, EyeOff, ExternalLink } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  isActive: boolean;
  audiences?: string[] | string; // Support both old string format and new array format
  audience?: string; // Legacy field for backwards compatibility
  createdAt: string;
  createdBy: string;
}

// Helper function to safely parse audiences
function getAudiencesArray(announcement: Announcement): string[] {
  // If audiences exists and is already an array, return it
  if (Array.isArray(announcement.audiences)) {
    return announcement.audiences;
  }
  
  // If audiences is a JSON string, parse it
  if (typeof announcement.audiences === 'string') {
    try {
      const parsed = JSON.parse(announcement.audiences);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [announcement.audiences];
    }
  }
  
  // Fallback to legacy audience field
  if (announcement.audience) {
    return [announcement.audience];
  }
  
  // Default to "all"
  return ["all"];
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
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-start gap-1 flex-wrap break-words break-all overflow-wrap-anywhere whitespace-pre-wrap text-left"
        >
          <span className="min-w-0 break-words break-all overflow-wrap-anywhere whitespace-pre-wrap">{part}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      );
    }
    return part;
  });
}

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    audiences: ["all"],
  });
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    refetchInterval: 30000,
    onSuccess: (data) => {
      console.log("[Admin] Fetched announcements:", data?.map(a => ({ id: a.id, title: a.title, audiences: a.audiences })));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; message: string; audiences: string[] }) => {
      console.log("[Admin] Sending to API:", data);
      return apiRequest("POST", "/api/admin/announcements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "✅ Announcement created successfully" });
      setNewAnnouncement({ title: "", message: "", audiences: ["all"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create announcement",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/announcements/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "✅ Announcement updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update announcement",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/announcements/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "✅ Announcement deleted successfully" });
      setDeleteAnnouncementId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete announcement",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleCreate = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and message",
        variant: "destructive"
      });
      return;
    }
    console.log("Creating announcement with audiences:", newAnnouncement.audiences);
    createMutation.mutate(newAnnouncement);
  };

  const activeAnnouncements = announcements?.filter(a => a.isActive) || [];
  const inactiveAnnouncements = announcements?.filter(a => !a.isActive) || [];

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
            <h1 className="text-lg lg:text-xl font-semibold">Announcements</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Create Announcement Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Announcement
                </CardTitle>
                <CardDescription>
                  Create announcements that will be shown to all registered users when they login
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Textarea
                    id="title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="Enter announcement title"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    placeholder="Enter announcement message"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Audiences (Select One or More)</Label>
                  <div className="grid grid-cols-2 gap-3 border rounded-lg p-4">
                    {[
                      { value: "all", label: "Everyone" },
                      { value: "guest", label: "Guests Only" },
                      { value: "loggedIn", label: "Logged In Users" },
                      { value: "agent", label: "Agents" },
                      { value: "storefront", label: "Storefront Visitors" },
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newAnnouncement.audiences.includes(value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // If selecting "all", clear all others
                              if (value === "all") {
                                setNewAnnouncement({
                                  ...newAnnouncement,
                                  audiences: ["all"],
                                });
                              } else {
                                // Remove "all" and add the selected value
                                const updatedAudiences = newAnnouncement.audiences
                                  .filter(a => a !== "all")
                                  .concat(value);
                                setNewAnnouncement({
                                  ...newAnnouncement,
                                  audiences: updatedAudiences,
                                });
                              }
                            } else {
                              // Remove the unchecked value
                              const updatedAudiences = newAnnouncement.audiences.filter(a => a !== value);
                              // If nothing is selected, default to "all"
                              setNewAnnouncement({
                                ...newAnnouncement,
                                audiences: updatedAudiences.length > 0 ? updatedAudiences : ["all"],
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "Creating..." : "Create Announcement"}
                </Button>
              </CardContent>
            </Card>

            {/* Active Announcements */}
            {activeAnnouncements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    Active Announcements ({activeAnnouncements.length})
                  </CardTitle>
                  <CardDescription>
                    These announcements are currently visible to users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {activeAnnouncements.map((announcement) => (
                      <div key={announcement.id} className="border rounded-lg p-3 md:p-4">
                        {/* Debug info */}
                        <div className="text-xs text-muted-foreground mb-2 font-mono">
                          Raw audiences: {JSON.stringify(announcement.audiences)}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base leading-tight break-words">{announcement.title}</h3>
                            <div className="text-muted-foreground mt-1 md:mt-2 text-xs md:text-sm leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">
                              {parseMessageWithLinks(announcement.message)}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground">
                              <span>Created: {formatDate(announcement.createdAt)}</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs w-fit">
                                Active
                              </Badge>
                              <div className="flex flex-wrap gap-2">
                                {getAudiencesArray(announcement).map((aud) => (
                                  <Badge key={aud} variant="outline" className="text-xs w-fit capitalize">
                                    {aud === "all" ? "Everyone" : 
                                     aud === "guest" ? "Guests" :
                                     aud === "loggedIn" ? "Logged In" :
                                     aud === "agent" ? "Agents" :
                                     aud === "storefront" ? "Storefront" : aud}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleMutation.mutate({ id: announcement.id, isActive: false })}
                              disabled={toggleMutation.isPending}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                            >
                              <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="sr-only sm:not-sr-only sm:ml-1">Hide</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                              onClick={() => setDeleteAnnouncementId(announcement.id)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inactive Announcements */}
            {inactiveAnnouncements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                    Inactive Announcements ({inactiveAnnouncements.length})
                  </CardTitle>
                  <CardDescription>
                    These announcements are hidden from users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {inactiveAnnouncements.map((announcement) => (
                      <div key={announcement.id} className="border rounded-lg p-3 md:p-4 opacity-75">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base leading-tight break-words">{announcement.title}</h3>
                            <div className="text-muted-foreground mt-1 md:mt-2 text-xs md:text-sm leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">
                              {parseMessageWithLinks(announcement.message)}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground">
                              <span>Created: {formatDate(announcement.createdAt)}</span>
                              <Badge variant="outline" className="w-fit">
                                Inactive
                              </Badge>
                              <div className="flex flex-wrap gap-2">
                                {getAudiencesArray(announcement).map((aud) => (
                                  <Badge key={aud} variant="outline" className="text-xs w-fit capitalize">
                                    {aud === "all" ? "Everyone" : 
                                     aud === "guest" ? "Guests" :
                                     aud === "loggedIn" ? "Logged In" :
                                     aud === "agent" ? "Agents" :
                                     aud === "storefront" ? "Storefront" : aud}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleMutation.mutate({ id: announcement.id, isActive: true })}
                              disabled={toggleMutation.isPending}
                              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="sr-only sm:not-sr-only sm:ml-1">Show</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                              onClick={() => setDeleteAnnouncementId(announcement.id)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {announcements?.length === 0 && !isLoading && (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Announcements Yet</h3>
                  <p className="text-muted-foreground">
                    Create your first announcement to communicate with users
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteAnnouncementId} onOpenChange={(open) => !open && setDeleteAnnouncementId(null)}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 text-white shadow-xl border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAnnouncementId && deleteMutation.mutate(deleteAnnouncementId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
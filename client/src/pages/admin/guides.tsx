import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/constants";
import { PlayCircle, Plus, Trash2, Menu, Eye, EyeOff } from "lucide-react";

interface VideoGuide {
  id: string;
  title: string;
  description?: string;
  category: "guest" | "customer" | "agent";
  url: string;
  provider?: string;
  isPublished: boolean;
  createdAt?: string;
}

export default function AdminGuides() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newGuide, setNewGuide] = useState<Partial<VideoGuide>>({
    title: "",
    description: "",
    category: "guest",
    url: "",
    provider: undefined,
    isPublished: true,
  });
  const [deleteGuideId, setDeleteGuideId] = useState<string | null>(null);

  const { data: guides } = useQuery<VideoGuide[]>({
    queryKey: ["/api/admin/guides"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<VideoGuide>) => apiRequest("POST", "/api/admin/guides", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guides"] });
      toast({ title: "✅ Guide created successfully" });
      setNewGuide({ title: "", description: "", category: "guest", url: "", provider: undefined, isPublished: true });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create guide", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VideoGuide> }) => apiRequest("PATCH", `/api/admin/guides/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guides"] });
      toast({ title: "✅ Guide updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update guide", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/guides/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/guides"] });
      toast({ title: "✅ Guide deleted successfully" });
      setDeleteGuideId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete guide", description: error.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!newGuide.title?.trim() || !newGuide.url?.trim() || !newGuide.category) {
      toast({ title: "Validation Error", description: "Please fill in title, URL and category", variant: "destructive" });
      return;
    }
    createMutation.mutate(newGuide);
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
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg lg:text-xl font-semibold">Video Guides</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Create Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Guide
                </CardTitle>
                <CardDescription>
                  You can use any YouTube/Vimeo URL - it will be automatically converted to embed format.
                  <br />
                  <span className="text-xs mt-1 block">
                    ✅ Supported: youtube.com/watch, youtube.com/shorts, youtu.be, vimeo.com, or direct MP4 links
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={newGuide.title || ""} onChange={(e) => setNewGuide({ ...newGuide, title: e.target.value })} placeholder="Guide title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newGuide.category} onValueChange={(v) => setNewGuide({ ...newGuide, category: v as VideoGuide["category"] })}>
                      <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guest">Guest</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="url">Video URL</Label>
                    <Input 
                      id="url" 
                      value={newGuide.url || ""} 
                      onChange={(e) => setNewGuide({ ...newGuide, url: e.target.value })} 
                      placeholder="Paste any YouTube or Vimeo link (e.g., youtube.com/watch?v=xxx or youtube.com/shorts/xxx)"
                    />
                    <p className="text-xs text-muted-foreground">
                      The URL will be automatically converted to the correct embed format
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={newGuide.description || ""} onChange={(e) => setNewGuide({ ...newGuide, description: e.target.value })} placeholder="Optional description" rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="published" checked={newGuide.isPublished ?? true} onCheckedChange={(checked) => setNewGuide({ ...newGuide, isPublished: checked })} />
                    <Label htmlFor="published">Published</Label>
                  </div>
                </div>

                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Creating..." : "Create Guide"}
                </Button>
              </CardContent>
            </Card>

            {/* Guides List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  All Guides ({guides?.length || 0})
                </CardTitle>
                <CardDescription>Manage visibility and update details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(guides || []).map((guide) => (
                    <div key={guide.id} className="border rounded-lg p-3 md:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">{guide.category}</Badge>
                            {guide.isPublished ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Published</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Draft</Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm md:text-base leading-tight mt-1">{guide.title}</h3>
                          {guide.description && (
                            <div className="text-muted-foreground mt-1 text-xs md:text-sm leading-relaxed">{guide.description}</div>
                          )}
                          {guide.createdAt && (
                            <div className="text-xs text-muted-foreground mt-2">Created: {formatDate(guide.createdAt)}</div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0 items-center">
                          <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: guide.id, data: { isPublished: !guide.isPublished } })} disabled={updateMutation.isPending}>
                            {guide.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="ml-1 hidden sm:inline">{guide.isPublished ? "Unpublish" : "Publish"}</span>
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteGuideId(guide.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="ml-1 hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteGuideId} onOpenChange={(open) => !open && setDeleteGuideId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guide</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the guide.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGuideId && deleteMutation.mutate(deleteGuideId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

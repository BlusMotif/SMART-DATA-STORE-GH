import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "./ui/button.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog.js";
import { Alert, AlertDescription } from "./ui/alert.js";
import { apiRequest } from "../lib/queryClient.js";

interface Announcement {
  id: string;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: string;
}

export function AnnouncementPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedAnnouncements');
    if (dismissed) {
      setDismissedAnnouncements(JSON.parse(dismissed));
    }
  }, []);

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => apiRequest('/api/announcements/active'),
    enabled: true,
  });

  // Check if there are any active announcements that haven't been dismissed
  useEffect(() => {
    if (announcements.length > 0) {
      const hasUndismissed = announcements.some((announcement: Announcement) =>
        !dismissedAnnouncements.includes(announcement.id)
      );
      setIsOpen(hasUndismissed);
    }
  }, [announcements, dismissedAnnouncements]);

  const handleDismiss = (announcementId: string) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const handleClose = () => {
    // Dismiss all current announcements
    const newDismissed = [...dismissedAnnouncements, ...announcements.map((a: Announcement) => a.id)];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
    setIsOpen(false);
  };

  if (!isOpen || announcements.length === 0) return null;

  // Show only undismissed announcements
  const undismissedAnnouncements = announcements.filter((announcement: Announcement) =>
    !dismissedAnnouncements.includes(announcement.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Important Announcements
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {undismissedAnnouncements.map((announcement: Announcement) => (
            <Alert key={announcement.id} className="relative">
              <AlertDescription className="pr-8">
                <div className="font-semibold mb-2">{announcement.title}</div>
                <div className="whitespace-pre-wrap">{announcement.message}</div>
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(announcement.id)}
                className="absolute top-2 right-2 h-6 w-6 p-0"
                title="Dismiss this announcement"
              >
                <X className="h-3 w-3" />
              </Button>
            </Alert>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={handleClose}>
            Close All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
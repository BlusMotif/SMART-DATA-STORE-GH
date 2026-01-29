import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { X, Bell, Megaphone, ExternalLink } from "lucide-react";
import { Button } from "./ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.js";
import { Badge } from "./ui/badge.js";
import { apiRequest } from "../lib/queryClient.js";

interface Announcement {
  id: string;
  title: string;
  message: string;
  isActive: boolean;
  audiences?: string[] | string; // Support both old string format and new array format
  audience?: string; // Legacy field for backwards compatibility
  createdAt: string;
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
          className="text-blue-600 hover:text-blue-800 underline inline-flex items-start gap-1 break-all sm:items-center sm:gap-1"
        >
          <span className="break-all">{part}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5 sm:mt-0" />
        </a>
      );
    }
    return part;
  });
}

export function AnnouncementPopup() {
  const { user } = useAuth();
  const [pathname] = useLocation();
  const isStorefrontView = pathname?.startsWith("/store/") ?? false;
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);

  // Load dismissed announcements from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedAnnouncements');
    if (dismissed) {
      setDismissedAnnouncements(JSON.parse(dismissed));
    }
  }, []);

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => apiRequest('GET', '/api/announcements/active'),
    enabled: !isStorefrontView,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on tab focus
  });

  // Filter announcements based on user audience
  const getFilteredAnnouncements = (announcements: Announcement[]) => {
    const userRole = user?.role?.toLowerCase();
    const isLoggedIn = !!user;

    console.log("Filtering announcements:", {
      isStorefrontView,
      userRole,
      isLoggedIn,
      pathname,
      totalAnnouncements: announcements.length
    });

    return announcements.filter((announcement) => {
      const audiences = getAudiencesArray(announcement).map((a) => a.toLowerCase());
      
      console.log("Announcement:", announcement.title, "audiences:", audiences);

      // If "all" is in the audiences, show to everyone
      if (audiences.includes("all")) {
        console.log("  -> Showing (has 'all')");
        return true;
      }

      // "guest" is only shown to non-logged-in users
      if (audiences.includes("guest") && !isLoggedIn) {
        console.log("  -> Showing (guest match)");
        return true;
      }

      // "loggedIn" is only shown to logged-in users
      if (audiences.includes("loggedin") && isLoggedIn) {
        console.log("  -> Showing (loggedIn match)");
        return true;
      }

      // "agent" is only shown to agents
      if (audiences.includes("agent") && userRole === "agent") {
        console.log("  -> Showing (agent match)");
        return true;
      }

      // "storefront" is only shown on storefront pages (guests or agents viewing the store)
      if (audiences.includes("storefront") && isStorefrontView) {
        console.log("  -> Showing (storefront match)");
        return true;
      }

      console.log("  -> Hiding (no match)");
      return false;
    });
  };

  const filteredAnnouncements = getFilteredAnnouncements(announcements);

  // Check if there are any active announcements that haven't been dismissed
  useEffect(() => {
    if (filteredAnnouncements.length > 0) {
      const hasUndismissed = filteredAnnouncements.some((announcement) =>
        !dismissedAnnouncements.includes(announcement.id)
      );
      setIsOpen(hasUndismissed);
    }
  }, [filteredAnnouncements, dismissedAnnouncements]);

  const handleDismiss = (announcementId: string) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const handleClose = () => {
    // Dismiss all current announcements
    const newDismissed = [...dismissedAnnouncements, ...filteredAnnouncements.map((a) => a.id)];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
    setIsOpen(false);
  };

  if (isStorefrontView) return null;
  if (!isOpen || filteredAnnouncements.length === 0) return null;

  // Show only undismissed announcements
  const undismissedAnnouncements = filteredAnnouncements.filter((announcement) =>
    !dismissedAnnouncements.includes(announcement.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] md:max-h-[80vh] overflow-y-auto">
        <Card className="relative shadow-2xl border-0 bg-white text-black">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                  <Megaphone className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Important Announcements
                  </CardTitle>
                  <p className="text-sm md:text-base text-gray-600">
                    Stay updated with the latest news
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-gray-100 hover:text-gray-800 text-gray-600 flex-shrink-0"
              >
                <X className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 md:space-y-4">
            {undismissedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="relative group p-3 md:p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-blue-50/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="p-1 md:p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
                      <Bell className="h-3 w-3 md:h-3 md:w-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1 md:mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base break-words">
                          {announcement.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs md:text-sm bg-blue-100 text-blue-700 border-blue-200 px-1.5 py-0.5 flex-shrink-0">
                          New
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(announcement.id)}
                        className="flex-shrink-0 h-6 w-6 md:h-6 md:w-6 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-gray-200 text-gray-500 hover:text-gray-800"
                        title="Dismiss this announcement"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-sm md:text-base text-gray-700 leading-relaxed break-words overflow-wrap-anywhere">
                      {parseMessageWithLinks(announcement.message)}
                    </div>
                    <div className="mt-2 md:mt-3 text-xs md:text-sm text-gray-500">
                      {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 md:pt-4 border-t border-gray-200 gap-3 sm:gap-0">
              <p className="text-xs md:text-sm text-gray-500">
                {undismissedAnnouncements.length} announcement{undismissedAnnouncements.length !== 1 ? 's' : ''} remaining
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  className="hover:bg-gray-100 text-gray-700 border-gray-300 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 flex-1 sm:flex-initial"
                >
                  Dismiss All
                </Button>
                <Button
                  onClick={handleClose}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 flex-1 sm:flex-initial"
                >
                  Got it!
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
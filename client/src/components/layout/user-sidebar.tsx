import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Smartphone,
  Wallet,
  History,
  MessageCircle,
  LogOut,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { APP_NAME } from "@/lib/constants";
import siteLogo from "@assets/logo_1765774201026.png";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/user/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "MTN Bundles",
    href: "/user/bundles/mtn",
    icon: Smartphone,
  },
  {
    title: "AT iShare Bundles",
    href: "/user/bundles/at-ishare",
    icon: Smartphone,
  },
  {
    title: "AT BIG TIME Bundles",
    href: "/user/bundles/at-bigtime",
    icon: Smartphone,
  },
  {
    title: "TELECEL Bundles",
    href: "/user/bundles/telecel",
    icon: Smartphone,
  },
  {
    title: "Top Up Wallet",
    href: "/user/wallet",
    icon: Wallet,
  },
  {
    title: "Order History",
    href: "/user/history",
    icon: History,
  },
  {
    title: "Support",
    href: "/user/support",
    icon: MessageCircle,
  },
];

export function UserSidebar({ onClose }: { onClose?: () => void } = {}) {
  const [location] = useLocation();
  const { logout, isLoggingOut, user } = useAuth();

  // Get unread message count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/support/unread-count"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/support/unread-count");
        const data = await response.json();
        return data.count || 0;
      } catch (error) {
        return 0;
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background relative">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <img
          src={siteLogo}
          alt="Logo"
          className="h-8 w-8 rounded-lg object-contain"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{APP_NAME}</span>
          <span className="text-xs text-muted-foreground">My Account</span>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            const isSupport = item.href === "/user/support";
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={onClose}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.title}</span>
                  {isSupport && unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={() => {
            logout();
            onClose?.();
          }}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}

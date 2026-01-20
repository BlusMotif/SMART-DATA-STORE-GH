import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Smartphone,
  FileCheck,
  Users,
  UserCircle,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  X,
  MessageCircle,
  AlertTriangle,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Data Bundles",
    href: "/admin/data-bundles",
    icon: Smartphone,
  },
  {
    title: "Role Base Prices",
    href: "/admin/role-base-prices",
    icon: Settings,
  },
  {
    title: "Result Checkers",
    href: "/admin/result-checkers",
    icon: FileCheck,
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: UserCircle,
  },
  {
    title: "Agents",
    href: "/admin/agents",
    icon: Users,
  },
  {
    title: "Withdrawals",
    href: "/admin/withdrawals",
    icon: Wallet,
  },
  {
    title: "Chat Support",
    href: "/admin/chat-support",
    icon: MessageCircle,
  },
  {
    title: "Announcements",
    href: "/admin/announcements",
    icon: Bell,
  },
  {
    title: "API Configuration",
    href: "/admin/api-configuration",
    icon: Settings,
  },
  {
    title: "API & Integrations",
    href: "/dashboard/api-integrations",
    icon: Code,
  },
  {
    title: "Break Settings",
    href: "/admin/break-settings",
    icon: AlertTriangle,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar({ onClose }: { onClose?: () => void } = {}) {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  // Get unread message count for admin
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/support/admin/unread-count"],
    queryFn: async () => {
      try {
        const data = await apiRequest<{ count: number }>("GET", "/api/support/admin/unread-count");
        return data.count || 0;
      } catch (error) {
        return 0;
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  return (
    <div 
      className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground relative"
    >
      {onClose && (
        <div className="absolute top-4 right-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className={`flex h-16 items-center gap-2 border-b px-6 ${onClose ? 'pr-16' : ''}`}>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{user?.name || 'Admin'}</span>
          <span className="text-xs text-muted-foreground">Admin Panel</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {sidebarNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            const isChatSupport = item.href === "/admin/chat-support";
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 px-2 py-1.5 text-xs font-normal relative",
                    isActive && "bg-yellow-500 text-white font-medium shadow-sm"
                  )}
                  onClick={onClose}
                  data-testid={`link-admin-${item.title.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {isChatSupport && unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 py-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logout()}
          disabled={isLoggingOut}
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  );
}

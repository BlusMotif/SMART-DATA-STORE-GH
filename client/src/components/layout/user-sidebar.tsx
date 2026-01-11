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
  Settings,
  Trophy,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { APP_NAME } from "@/lib/constants";
import siteLogo from "@assets/logo_1765774201026.png";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
    href: "/user/bundles/at_ishare",
    icon: Smartphone,
  },
  {
    title: "AT BIG TIME Bundles",
    href: "/user/bundles/at_bigtime",
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
    title: "API & Integrations",
    href: "/dashboard/api-integrations",
    icon: Code,
  },
  {
    title: "Settings",
    href: "/user/settings",
    icon: Settings,
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
  const { logout, isLoggingOut, user, agent } = useAuth();

  const { data: rankData } = useQuery({
    queryKey: ["user-rank"],
    queryFn: () => apiRequest("/api/user/rank"),
    enabled: !!user,
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
        {/* Rank Badge */}
        {rankData && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
              <Trophy className="h-3 w-3" />
              <span>
                {rankData.rank && rankData.rank > 0 ? `Rank #${rankData.rank}` : 'Unranked'}
              </span>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
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
                  <span>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        {!agent && (
          <Button
            variant="default"
            className="w-full justify-start gap-3 mb-3 bg-primary text-primary-foreground"
            onClick={() => {
              window.location.href = '/user/dashboard?upgrade=true';
            }}
          >
            <Smartphone className="h-4 w-4" />
            Become an agent
          </Button>
        )}
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

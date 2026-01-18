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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { APP_NAME } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/theme-provider";

// Function to get ranking badge based on user role
const getRankingBadge = (role: string) => {
  const rankings = {
    admin: { label: "Administrator", variant: "destructive" as const, icon: "👑" },
    master: { label: "Master Reseller", variant: "default" as const, icon: "🏆" },
    super_dealer: { label: "Super Dealer", variant: "secondary" as const, icon: "⭐" },
    dealer: { label: "Dealer", variant: "outline" as const, icon: "💎" },
    agent: { label: "Agent", variant: "outline" as const, icon: "🔹" },
    user: { label: "User", variant: "outline" as const, icon: "👤" },
    guest: { label: "Guest", variant: "outline" as const, icon: "👋" },
  };

  return rankings[role as keyof typeof rankings] || rankings.user;
};

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

export function UserSidebar({ onClose, onApiIntegrationsClick }: { onClose?: () => void; onApiIntegrationsClick?: () => void } = {}) {
  const [location] = useLocation();
  const { logout, isLoggingOut, user, agent } = useAuth();
  const { theme } = useTheme();

  const { data: rankData, error: rankError } = useQuery({
    queryKey: ["user-rank"],
    queryFn: () => apiRequest("/api/user/rank"),
    enabled: !!user,
  });

  return (
    <div 
      className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground relative"
      style={{ backgroundColor: theme === 'dark' ? '#000000' : '#ffffff' }}
    >
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">My Account</span>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary text-center leading-tight">
              VIVIAN OTOO
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">VIVIAN OTOO</p>
            <p className="text-xs text-muted-foreground truncate">vivian@gmail.com</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-1.5 rounded-full bg-green-500 px-2.5 py-1 text-xs font-medium text-white border border-green-600">
                <Trophy className="h-3 w-3" />
                <span>
                  {rankError ? 'Rank #1' : rankData ? `Rank #${rankData.rank || 'N/A'}` : 'Rank #1'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            const isApiIntegrations = item.title === "API & Integrations";
            
            if (isApiIntegrations && onApiIntegrationsClick) {
              return (
                <div key={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => {
                      onApiIntegrationsClick();
                      onClose?.();
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                </div>
              );
            }
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-yellow-500 text-white"
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
          <Link href="/agent/register">
            <Button
              variant="default"
              className="w-full justify-start gap-3 mb-3 bg-yellow-500 text-white hover:bg-yellow-600"
              onClick={onClose}
            >
              <Smartphone className="h-4 w-4" />
              Become an agent
            </Button>
          </Link>
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

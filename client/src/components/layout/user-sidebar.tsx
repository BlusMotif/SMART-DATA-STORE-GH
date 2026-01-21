import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Smartphone,
  Wallet,
  History,
  MessageCircle,
  LogOut,
  Settings,
  Trophy,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/theme-provider";

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

  const { data: rankData, error: rankError, isLoading: rankLoading } = useQuery<{ rank: number }>({
    queryKey: ["user-rank"],
    queryFn: () => apiRequest("GET", "/api/user/rank"),
    enabled: !!user,
    refetchInterval: 15000, // Refetch every 15 seconds for more real-time updates
    refetchOnWindowFocus: true, // Update when user comes back to the tab
  });

  // Handle success and error logging
  React.useEffect(() => {
    if (rankData) {
      console.log('Real-time rank data:', rankData);
    }
  }, [rankData]);

  React.useEffect(() => {
    if (rankError) {
      console.error('Rank API error:', rankError);
    }
  }, [rankError]);

  return (
    <div 
      className={`flex h-full w-64 flex-col border-r text-sidebar-foreground relative ${
        onClose ? 'bg-white' : 'bg-sidebar'
      }`}
    >
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            {user?.role === 'agent' ? 'Agent' : 'My Account'}
          </span>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-1.5 rounded-full bg-green-500 px-2.5 py-1 text-xs font-medium text-white border border-green-600">
                <Trophy className="h-3 w-3" />
                <span>
                  {rankLoading ? 'Loading...' : 
                   rankError ? 'Rank #1' : 
                   rankData ? `Rank #${rankData.rank || 'N/A'}` : 
                   'Rank #1'}
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

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-4 text-sm font-medium transition-colors cursor-pointer md:px-2 md:py-1.5 md:text-xs md:gap-2",
                    "sm:px-6 sm:py-5 sm:text-base sm:gap-4",
                    isActive
                      ? "bg-yellow-500 text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={item.title === "API & Integrations" ? onApiIntegrationsClick || onClose : onClose}
                >
                  <Icon className="h-4 w-4 shrink-0 md:h-4 md:w-4 sm:h-6 sm:w-6" />
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
              size="sm"
              variant="default"
              className="w-full justify-start gap-4 mb-4 bg-yellow-500 text-white hover:bg-yellow-600 md:gap-3 md:text-sm md:mb-3 md:py-2 sm:gap-5 sm:text-lg sm:py-4"
              onClick={onClose}
            >
              <Smartphone className="h-4 w-4" />
              Become an agent
            </Button>
          </Link>
        )}
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start gap-4 md:gap-3 md:text-sm sm:gap-5 sm:text-lg sm:py-4"
          onClick={() => {
            logout();
            onClose?.();
          }}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
        
        {/* Developer Credit */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Developed by{' '}
            <a
              href="https://bm-portfolio-up2x.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium"
            >
              BlusMotif
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

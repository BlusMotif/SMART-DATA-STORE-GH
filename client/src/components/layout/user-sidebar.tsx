import { Link, useLocation } from "wouter";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/theme-provider";

const sidebarNavItems = [
  { title: "Dashboard", href: "/user/dashboard", icon: LayoutDashboard },
  { title: "MTN Bundles", href: "/user/bundles/mtn", icon: Smartphone },
  { title: "AT iShare Bundles", href: "/user/bundles/at_ishare", icon: Smartphone },
  { title: "AT BIG TIME Bundles", href: "/user/bundles/at_bigtime", icon: Smartphone },
  { title: "TELECEL Bundles", href: "/user/bundles/telecel", icon: Smartphone },
  { title: "Top Up Wallet", href: "/user/wallet", icon: Wallet },
  { title: "API Keys & Integrations", href: "/dashboard/api-integrations", icon: Code },
  { title: "Settings", href: "/user/settings", icon: Settings },
  { title: "Order History", href: "/user/history", icon: History },
  { title: "Support", href: "/user/support", icon: MessageCircle },
];

export function UserSidebar({ onClose }: { onClose?: () => void } = {}) {
  const [location] = useLocation();
  const { logout, isLoggingOut, user, agent } = useAuth();
  const { theme } = useTheme();

  // Get user rank
  const { data: rankData } = useQuery<{ rank: number }>({
    queryKey: ["user-rank"],
    queryFn: () => apiRequest("GET", "/api/user/rank"),
    enabled: !!user,
  });

  return (
    <div className={`flex h-full w-64 flex-col border-r text-sidebar-foreground relative ${
      onClose ? 'bg-white dark:bg-black dark:text-white' : 'bg-sidebar dark:bg-black dark:text-white'
    }`}>
      <div className={`flex h-16 items-center justify-center border-b px-6 ${onClose ? 'pr-4' : ''} dark:border-gray-700`}>
        <div className="flex flex-col items-center text-center w-full">
          <div className="flex items-center justify-center gap-4 mb-1 w-full">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium dark:text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground dark:text-gray-300">{user?.email}</p>
            </div>
            {rankData && (
              <div className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white border border-green-600 dark:bg-green-600 dark:border-green-700">
                <Trophy className="h-2.5 w-2.5" />
                <span>
                  {rankData.rank && rankData.rank > 0 ? `#${rankData.rank}` : 'Unranked'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {sidebarNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/user/dashboard" && location.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-normal relative dark:text-white dark:hover:bg-gray-700",
                    isActive && "bg-yellow-500 text-white font-medium shadow-sm dark:bg-yellow-600"
                  )}
                  onClick={() => onClose && onClose()}
                >
                  <item.icon className="h-4 w-4 dark:text-white" />
                  <span className="flex-1 text-left dark:text-white">{item.title}</span>
                </Button>
              </Link>
            );
          })}

          {!agent && (
            <Link href="/agent/register">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 mt-2 bg-green-500 text-white border-green-500 hover:bg-green-600 hover:border-green-600 dark:bg-green-600 dark:border-green-600 dark:hover:bg-green-700"
                onClick={() => onClose && onClose()}
              >
                <Smartphone className="h-4 w-4" />
                Become an Agent
              </Button>
            </Link>
          )}
        </nav>
      </ScrollArea>

      <div className="border-t p-3 dark:border-gray-700">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 dark:text-red-400 dark:hover:bg-red-900/20"
          onClick={() => { onClose && onClose(); logout(); }}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4 dark:text-red-400" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>

        {/* Developer Credit */}
        <div className="mt-3 pt-3 border-t border-border/50 dark:border-gray-600">
          <p className="text-xs text-muted-foreground text-center dark:text-gray-400">
            Developed by{' '}
            <a
              href="https://bm-portfolio-up2x.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium dark:text-blue-400 dark:hover:text-blue-300"
            >
              BlusMotif
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

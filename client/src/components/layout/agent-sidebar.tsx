import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Store,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { APP_NAME, formatCurrency } from "@/lib/constants";
import type { Agent } from "@shared/schema";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/agent",
    icon: LayoutDashboard,
  },
  {
    title: "My Storefront",
    href: "/agent/storefront",
    icon: Store,
  },
  {
    title: "Transactions",
    href: "/agent/transactions",
    icon: BarChart3,
  },
  {
    title: "Withdrawals",
    href: "/agent/withdrawals",
    icon: Wallet,
  },
  {
    title: "Settings",
    href: "/agent/settings",
    icon: Settings,
  },
];

export function AgentSidebar({ onClose }: { onClose?: () => void } = {}) {
  const [location] = useLocation();
  const { logout, isLoggingOut } = useAuth();

  const { data: agent, error } = useQuery<Agent>({
    queryKey: ["/api/agent/profile"],
  });

  // If there's an error loading the profile, show a basic sidebar
  if (error) {
    return (
      <div className="flex h-screen w-64 flex-col border-r bg-background relative">
        {onClose && (
          <div className="absolute top-4 right-4 lg:hidden z-10">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className={`flex h-16 items-center gap-2 border-b px-6 ${onClose ? 'pr-16' : ''}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            CT
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{APP_NAME}</span>
            <span className="text-xs text-muted-foreground">Agent Portal</span>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {sidebarNavItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/agent" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-normal",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={onClose}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background relative">
      {onClose && (
        <div className="absolute top-4 right-4 lg:hidden z-10">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className={`flex h-16 items-center gap-2 border-b px-6 ${onClose ? 'pr-16' : ''}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
          CT
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{APP_NAME}</span>
          <span className="text-xs text-muted-foreground">Agent Portal</span>
        </div>
      </div>

      {agent && (
        <div className="border-b p-4">
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl font-bold tabular-nums" data-testid="text-agent-balance">
              {formatCurrency(agent.balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Total Profit: {formatCurrency(agent.totalProfit)}
            </p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {sidebarNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/agent" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                  data-testid={`link-agent-${item.title.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}

          {agent && (
            <a
              href={`/store/${agent.storefrontSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2"
            >
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                data-testid="link-view-storefront"
              >
                <ExternalLink className="h-4 w-4" />
                View Public Store
              </Button>
            </a>
          )}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logout()}
          disabled={isLoggingOut}
          data-testid="button-agent-logout"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  );
}

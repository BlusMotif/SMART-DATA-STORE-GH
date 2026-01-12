import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Store,
  BarChart3,
  Wallet,
  Settings,
  MessageCircle,
  LogOut,
  ExternalLink,
  X,
  Smartphone,
  CreditCard,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { APP_NAME, formatCurrency } from "@/lib/constants";
import type { Agent, User } from "@shared/schema";
import siteLogo from "@assets/logo_1765774201026.png";

interface AgentProfileResponse {
  agent: Agent & {
    user: User;
  };
  stats: any;
}

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
  { title: "Dashboard", href: "/agent/dashboard", icon: LayoutDashboard },
  { title: "My Storefront", href: "/agent/storefront", icon: Store },
  { title: "Transactions", href: "/agent/transactions", icon: BarChart3 },
  { title: "MTN Bundles", href: "/agent/bundles/mtn", icon: Smartphone },
  { title: "AT iShare Bundles", href: "/agent/bundles/at_ishare", icon: Smartphone },
  { title: "AT BIG TIME Bundles", href: "/agent/bundles/at_bigtime", icon: Smartphone },
  { title: "TELECEL Bundles", href: "/agent/bundles/telecel", icon: Smartphone },
  { title: "Top Up Wallet", href: "/agent/wallet", icon: CreditCard },
  { title: "Pricing Management", href: "/agent/pricing", icon: BarChart3 },
  { title: "API & Integrations", href: "/dashboard/api-integrations", icon: Code },
  { title: "Withdrawals", href: "/agent/withdrawals", icon: Wallet },
  { title: "Settings", href: "/agent/settings", icon: Settings },
  { title: "Support Chat", href: "/agent/support", icon: MessageCircle },
];

export function AgentSidebarV2({ onClose }: { onClose?: () => void } = {}) {
  const [location] = useLocation();
  const { logout, isLoggingOut, user } = useAuth();

  const { data: profileData, error } = useQuery<AgentProfileResponse>({
    queryKey: ["/api/agent/profile"],
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/support/admin/unread-count"],
    enabled: user?.role === 'admin',
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/support/admin/unread-count");
        const data = await res.json();
        return data.count || 0;
      } catch (error) {
        return 0;
      }
    },
    refetchInterval: 5000,
  });

  const agent = profileData?.agent;

  if (error) {
    return (
      <div className="flex h-full w-64 flex-col border-r bg-background relative">
        <div className={`flex h-16 items-center gap-2 border-b px-6 ${onClose ? 'pr-4' : ''}`}>
          <img src={siteLogo} alt="Logo" className="h-8 w-8 rounded-lg object-contain" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{APP_NAME}</span>
            <span className="text-xs text-muted-foreground">{user?.role === 'agent' ? 'Agent Portal' : user?.role === 'dealer' ? 'Dealer Portal' : user?.role === 'super_dealer' ? 'Super Dealer Portal' : 'Reseller Portal'}</span>
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {sidebarNavItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/agent/dashboard" && location.startsWith(item.href));
              const isSupport = item.href === "/agent/support";
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-normal relative",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => onClose && onClose()}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {isSupport && unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">{unreadCount}</Badge>
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
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { onClose && onClose(); logout(); }}
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
    <div className="flex h-full w-64 flex-col border-r bg-background relative">
      <div className={`flex h-16 items-center gap-2 border-b px-6 ${onClose ? 'pr-4' : ''}`}>
        <div className="flex-1 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">CT</div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{agent?.businessName || APP_NAME}</span>
            {user?.role && (
              <Badge 
                variant={getRankingBadge(user.role).variant} 
                className="text-xs w-fit mt-1 px-2 py-0.5 h-5"
              >
                <span className="mr-1">{getRankingBadge(user.role).icon}</span>
                {getRankingBadge(user.role).label}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{user?.role === 'agent' ? 'Agent Portal' : user?.role === 'dealer' ? 'Dealer Portal' : user?.role === 'super_dealer' ? 'Reseller Portal' : 'Reseller Portal'}</span>
          </div>
        </div>
      </div>

      {agent && (
        <div className="border-b p-4">
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground mb-1">Profit Balance</p>
            <p className="text-2xl font-bold tabular-nums" data-testid="text-agent-profit-balance">{formatCurrency(agent.profitBalance)}</p>
            <p className="text-xs text-muted-foreground mt-2">Wallet Balance: {formatCurrency(agent.walletBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Profit: {formatCurrency(agent.totalProfit)}</p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {sidebarNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/agent/dashboard" && location.startsWith(item.href));
            const isSupport = item.href === "/agent/support";
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-normal relative",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                  data-testid={`link-agent-${item.title.toLowerCase().replace(/ /g, "-")}`}
                  onClick={() => onClose && onClose()}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {isSupport && unreadCount > 0 && user?.role === 'admin' && (
                    <Badge variant="destructive" className="ml-auto">{unreadCount}</Badge>
                  )}
                </Button>
              </Link>
            );
          })}

          {agent && (
            <a href={`/store/${agent.storefrontSlug}`} target="_blank" rel="noopener noreferrer" className="mt-2">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="link-view-storefront" onClick={() => onClose && onClose()}>
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
          onClick={() => { onClose && onClose(); logout(); }}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  );
}

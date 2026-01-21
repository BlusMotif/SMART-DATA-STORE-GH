import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  BarChart3,
  Wallet,
  Settings,
  MessageCircle,
  LogOut,
  ExternalLink,
  Smartphone,
  CreditCard,
  Code,
  DollarSign,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/constants";
import type { Agent, User } from "@shared/schema";
import { useTheme } from "@/components/theme-provider";

interface AgentProfileResponse {
  profile: Agent & {
    user: User;
    profitBalance: number;
    walletBalance: number;
    totalWithdrawals: number;
    role: string;
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
  { title: "Pricing", href: "/agent/pricing", icon: DollarSign },
  { title: "Transactions", href: "/agent/transactions", icon: BarChart3 },
  { title: "MTN Bundles", href: "/agent/bundles/mtn", icon: Smartphone },
  { title: "AT iShare Bundles", href: "/agent/bundles/at_ishare", icon: Smartphone },
  { title: "AT BIG TIME Bundles", href: "/agent/bundles/at_bigtime", icon: Smartphone },
  { title: "TELECEL Bundles", href: "/agent/bundles/telecel", icon: Smartphone },
  { title: "Top Up Wallet", href: "/agent/wallet", icon: CreditCard },
  { title: "API & Integrations", href: "/dashboard/api-integrations", icon: Code },
  { title: "Withdrawals", href: "/agent/withdrawals", icon: Wallet },
  { title: "Settings", href: "/agent/settings", icon: Settings },
  { title: "Support Chat", href: "/agent/support", icon: MessageCircle },
];

export function AgentSidebarV2({ onClose }: { onClose?: () => void } = {}) {
  const [location] = useLocation();
  const { logout, isLoggingOut, user } = useAuth();
  const { theme } = useTheme();
  const [showApiModal, setShowApiModal] = useState(false);

  // Get user rank
 const { data: rankData } = useQuery<{ rank: number }>({
    queryKey: ["user-rank"],
    queryFn: () => apiRequest("GET", "/api/user/rank"),
    enabled: !!user,
  });

  const { data: profileData, error } = useQuery<AgentProfileResponse>({
    queryKey: ["/api/profile"],
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/support/admin/unread-count"],
    enabled: user?.role === 'admin',
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/support/admin/unread-count") as Response;
        const data = await res.json();
        return data.count || 0;
      } catch (error) {
        return 0;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds instead of 5
  });

  const agent = profileData?.profile;

  if (error) {
    return (
      <div className={`flex h-full w-64 flex-col border-r text-sidebar-foreground relative ${
        onClose ? 'bg-white' : 'bg-sidebar'
      }`}>
        <div className={`flex h-16 items-center justify-center border-b px-6 ${onClose ? 'pr-4' : ''}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
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
                    size="sm"
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 px-2 py-1.5 text-xs font-normal relative",
                      isActive && "bg-yellow-500 text-white font-medium shadow-sm"
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
            size="sm"
            variant="ghost"
            className="w-full justify-start gap-2 px-2 py-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
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
    <div className={`flex h-full w-64 flex-col border-r text-sidebar-foreground relative ${
      onClose ? 'bg-white' : 'bg-sidebar'
    }`}>
      <div className={`flex h-16 items-center justify-center border-b px-6 ${onClose ? 'pr-4' : ''}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
      </div>

      {agent && (
        <div className="border-b p-4">
          <div className="rounded-lg bg-primary/10 p-4">
            <p className="text-xs text-muted-foreground mb-1">Profit Balance</p>
            <p className="text-2xl font-bold tabular-nums" data-testid="text-agent-profit-balance">{formatCurrency(agent.profitBalance)}</p>
            <p className="text-xs text-muted-foreground mt-2">Wallet Balance: {formatCurrency(agent.walletBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Withdrawals: {formatCurrency(agent.totalWithdrawals)}</p>
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'Agent'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {rankData && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                  <Trophy className="h-3 w-3" />
                  <span>
                    {rankData.rank && rankData.rank > 0 ? `Rank #${rankData.rank}` : 'Unranked'}
                  </span>
                </div>
              </div>
            )}
          </div>
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
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-normal relative",
                    isActive && "bg-yellow-500 text-white font-medium shadow-sm"
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
            <a href={`/store/agent/${agent.storefrontSlug}`} target="_blank" rel="noopener noreferrer" className="mt-2">
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
        
        {/* Developer Credit */}
        <div className="mt-3 pt-3 border-t border-border/50">
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

      <ApiIntegrationsModal open={showApiModal} onOpenChange={setShowApiModal} />
    </div>
  );
}

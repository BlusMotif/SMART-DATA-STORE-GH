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
  X,
  Smartphone,
  CreditCard,
  Code,
  Trophy,
  DollarSign,
  Users,
  Crown,
  Gem
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApiIntegrationsModal } from "@/components/api-integrations-modal";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { APP_NAME, formatCurrency } from "@/lib/constants";
import type { Agent, User } from "@shared/schema";
import siteLogo from "@assets/logo_1765774201026.png";

interface DealerProfileResponse {
  profile: Agent & {
    user: User;
    profitBalance: number;
    walletBalance: number;
    totalWithdrawals: number;
    role: string;
  };
  stats: any;
}

interface DealerSidebarProps {
  onClose?: () => void;
}

export function DealerSidebar({ onClose }: DealerSidebarProps) {
  const [location] = useLocation();
  const [showApiModal, setShowApiModal] = useState(false);
  const { logout, user } = useAuth();

  const { data: profileData } = useQuery<DealerProfileResponse>({
    queryKey: ["/api/profile"],
    refetchInterval: 60000,
  });

  const dealer = profileData?.profile;

  const navigation = [
    {
      name: "Dashboard",
      href: "/dealer/dashboard",
      icon: LayoutDashboard,
      current: location === "/dealer/dashboard",
    },
    {
      name: "Data Bundles",
      href: "/dealer/bundles",
      icon: Smartphone,
      current: location.startsWith("/dealer/bundles"),
    },
    {
      name: "Custom Pricing",
      href: "/dealer/pricing",
      icon: DollarSign,
      current: location === "/dealer/pricing",
    },
    {
      name: "Storefront",
      href: dealer ? `/store/dealer/${dealer.storefrontSlug}` : "/dealer/dashboard",
      icon: Store,
      current: false,
      external: true,
    },
    {
      name: "Transactions",
      href: "/dealer/transactions",
      icon: BarChart3,
      current: location === "/dealer/transactions",
    },
    {
      name: "Wallet",
      href: "/dealer/wallet",
      icon: Wallet,
      current: location === "/dealer/wallet",
    },
    {
      name: "Withdrawals",
      href: "/dealer/withdrawals",
      icon: CreditCard,
      current: location === "/dealer/withdrawals",
    },
    {
      name: "Network",
      href: "/dealer/network",
      icon: Users,
      current: location === "/dealer/network",
    },
  ];

  const tools = [
    {
      name: "API Keys",
      href: "#",
      icon: Code,
      onClick: () => setShowApiModal(true),
    },
    {
      name: "Settings",
      href: "/dealer/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      <div className="flex h-full w-64 flex-col bg-background border-r">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/dealer/dashboard" className="flex items-center gap-2">
            <img src={siteLogo} alt={APP_NAME} className="h-8 w-8" />
            <span className="font-bold text-lg">{APP_NAME}</span>
          </Link>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Gem className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {dealer?.user?.name || user?.name || "Dealer"}
              </p>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  <Crown className="h-3 w-3 mr-1" />
                  Dealer
                </Badge>
              </div>
            </div>
          </div>

          {/* Balance Display */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Profit Balance</span>
              <span className="font-medium text-green-600">
                {formatCurrency(dealer?.profitBalance || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Wallet</span>
              <span className="font-medium">
                {formatCurrency(dealer?.walletBalance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={item.current ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    item.current && "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100"
                  )}
                  onClick={item.onClick}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                  {item.external && <ExternalLink className="h-3 w-3 ml-auto" />}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Tools Section */}
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Tools
            </h3>
            <nav className="space-y-1">
              {tools.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-10"
                    onClick={item.onClick}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => {
              logout();
              onClose?.();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <ApiIntegrationsModal open={showApiModal} onOpenChange={setShowApiModal} />
    </>
  );
}
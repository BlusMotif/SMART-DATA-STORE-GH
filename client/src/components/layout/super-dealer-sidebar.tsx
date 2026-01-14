import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Users,
  Settings,
  BarChart3,
  ShoppingCart,
  Wallet,
  ExternalLink,
  Code,
  Target,
  TrendingUp,
  Crown,
  Star,
  Zap,
  X
} from "lucide-react";

interface SuperDealerSidebarProps {
  onClose?: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/super-dealer/dashboard",
    icon: LayoutDashboard,
    description: "Overview & metrics"
  },
  {
    name: "Data Bundles",
    href: "/super-dealer/bundles",
    icon: Package,
    description: "Manage network bundles",
    children: [
      { name: "MTN Bundles", href: "/super-dealer/bundles/mtn" },
      { name: "Telecel Bundles", href: "/super-dealer/bundles/telecel" },
      { name: "AirtelTigo Bundles", href: "/super-dealer/bundles/airteltigo" },
      { name: "Vodafone Bundles", href: "/super-dealer/bundles/vodafone" }
    ]
  },
  {
    name: "Custom Pricing",
    href: "/super-dealer/pricing",
    icon: DollarSign,
    description: "Set dealer prices"
  },
  {
    name: "Network Management",
    href: "/super-dealer/network",
    icon: Users,
    description: "Manage dealers & agents",
    children: [
      { name: "My Dealers", href: "/super-dealer/network/dealers" },
      { name: "My Agents", href: "/super-dealer/network/agents" },
      { name: "Network Performance", href: "/super-dealer/network/performance" }
    ]
  },
  {
    name: "Sales & Transactions",
    href: "/super-dealer/transactions",
    icon: ShoppingCart,
    description: "Network sales history"
  },
  {
    name: "Withdrawals",
    href: "/super-dealer/withdrawals",
    icon: Wallet,
    description: "Profit withdrawals"
  },
  {
    name: "Analytics",
    href: "/super-dealer/analytics",
    icon: BarChart3,
    description: "Network insights"
  },
  {
    name: "API & Integrations",
    href: "/super-dealer/api-integrations",
    icon: Code,
    description: "Bulk operations"
  },
  {
    name: "Settings",
    href: "/super-dealer/settings",
    icon: Settings,
    description: "Profile & preferences"
  }
];

export function SuperDealerSidebar({ onClose }: SuperDealerSidebarProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-yellow-950/20 border-r border-orange-200 dark:border-orange-800">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-orange-200 dark:border-orange-800 bg-orange-100/50 dark:bg-orange-950/30">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-orange-900 dark:text-orange-100">Super Dealer</h2>
            <p className="text-xs text-orange-700 dark:text-orange-300">Network Leader</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.children && item.children.some(child => location === child.href));
            const Icon = item.icon;

            return (
              <div key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-auto py-3 px-3",
                      isActive && "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100 border-orange-200 dark:border-orange-800"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                    {item.children && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                        {item.children.length}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* Sub-navigation */}
                {item.children && isActive && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href}>
                        <Button
                          variant={location === child.href ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start text-xs h-8",
                            location === child.href && "bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100"
                          )}
                          onClick={onClose}
                        >
                          {child.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <Separator className="my-4 bg-orange-200 dark:bg-orange-800" />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wide px-3">
            Quick Actions
          </h3>
          <div className="space-y-1">
            <a
              href="/store/super-dealer"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-9 text-xs bg-orange-50 hover:bg-orange-100 text-orange-800 dark:bg-orange-950 dark:hover:bg-orange-900 dark:text-orange-200"
              >
                <ExternalLink className="h-3 w-3" />
                View Storefront
              </Button>
            </a>
            <Link href="/super-dealer/pricing">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-9 text-xs bg-red-50 hover:bg-red-100 text-red-800 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-200"
                onClick={onClose}
              >
                <Target className="h-3 w-3" />
                Set Pricing
              </Button>
            </Link>
            <Link href="/super-dealer/network">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-9 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:hover:bg-yellow-900 dark:text-yellow-200"
                onClick={onClose}
              >
                <TrendingUp className="h-3 w-3" />
                Network Stats
              </Button>
            </Link>
          </div>
        </div>

        <Separator className="my-4 bg-orange-200 dark:bg-orange-800" />

        {/* Status Badge */}
        <div className="px-3">
          <Badge className="w-full justify-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <Star className="h-3 w-3" />
            Super Dealer Status
          </Badge>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-orange-200 dark:border-orange-800 bg-orange-100/50 dark:bg-orange-950/30">
        <div className="text-center">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            Leading the network with excellence
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Zap className="h-3 w-3 text-orange-600" />
            <span className="text-xs font-medium text-orange-800 dark:text-orange-200">Network Champion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
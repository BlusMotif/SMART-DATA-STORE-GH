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
  Shield,
  Globe,
  X
} from "lucide-react";

interface MasterSidebarProps {
  onClose?: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/master/dashboard",
    icon: LayoutDashboard,
    description: "Empire overview & metrics"
  },
  {
    name: "Data Bundles",
    href: "/master/bundles",
    icon: Package,
    description: "Manage empire bundles",
    children: [
      { name: "MTN Bundles", href: "/master/bundles/mtn" },
      { name: "Telecel Bundles", href: "/master/bundles/telecel" },
      { name: "AirtelTigo Bundles", href: "/master/bundles/airteltigo" },
      { name: "Vodafone Bundles", href: "/master/bundles/vodafone" }
    ]
  },
  {
    name: "Custom Pricing",
    href: "/master/pricing",
    icon: DollarSign,
    description: "Set empire prices"
  },
  {
    name: "Empire Management",
    href: "/master/empire",
    icon: Globe,
    description: "Manage super dealers & dealers",
    children: [
      { name: "Super Dealers", href: "/master/empire/super-dealers" },
      { name: "Dealers", href: "/master/empire/dealers" },
      { name: "Agents", href: "/master/empire/agents" },
      { name: "Empire Performance", href: "/master/empire/performance" }
    ]
  },
  {
    name: "Sales & Transactions",
    href: "/master/transactions",
    icon: ShoppingCart,
    description: "Empire sales history"
  },
  {
    name: "Withdrawals",
    href: "/master/withdrawals",
    icon: Wallet,
    description: "Profit withdrawals"
  },
  {
    name: "Analytics",
    href: "/master/analytics",
    icon: BarChart3,
    description: "Empire insights"
  },
  {
    name: "API & Integrations",
    href: "/master/api-integrations",
    icon: Code,
    description: "Bulk operations"
  },
  {
    name: "Settings",
    href: "/master/settings",
    icon: Settings,
    description: "Profile & preferences"
  }
];

export function MasterSidebar({ onClose }: MasterSidebarProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-blue-950/20 border-r border-purple-200 dark:border-purple-800">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-purple-200 dark:border-purple-800 bg-purple-100/50 dark:bg-purple-950/30">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-purple-900 dark:text-purple-100">Master</h2>
            <p className="text-xs text-purple-700 dark:text-purple-300">Empire Leader</p>
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
                      isActive && "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                    {item.children && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
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
                            location === child.href && "bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-100"
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

        <Separator className="my-4 bg-purple-200 dark:bg-purple-800" />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-purple-800 dark:text-purple-200 uppercase tracking-wide px-3">
            Quick Actions
          </h3>
          <div className="space-y-1">
            <a
              href="/store/master"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-9 text-xs bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950 dark:hover:bg-purple-900 dark:text-purple-200"
              >
                <ExternalLink className="h-3 w-3" />
                View Storefront
              </Button>
            </a>
            <Link href="/master/pricing">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-9 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-200"
                onClick={onClose}
              >
                <Target className="h-3 w-3" />
                Set Pricing
              </Button>
            </Link>
            <Link href="/master/empire">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-9 text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-200"
                onClick={onClose}
              >
                <TrendingUp className="h-3 w-3" />
                Empire Stats
              </Button>
            </Link>
          </div>
        </div>

        <Separator className="my-4 bg-purple-200 dark:bg-purple-800" />

        {/* Status Badge */}
        <div className="px-3">
          <Badge className="w-full justify-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
            <Shield className="h-3 w-3" />
            Master Status
          </Badge>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-purple-200 dark:border-purple-800 bg-purple-100/50 dark:bg-purple-950/30">
        <div className="text-center">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            Ruling the empire with wisdom and power
          </p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Globe className="h-3 w-3 text-purple-600" />
            <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Empire Sovereign</span>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Smartphone,
  FileCheck,
  Users,
  UserCircle,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  X,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { APP_NAME } from "@/lib/constants";
import siteLogo from "@assets/logo_1765774201026.png";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Data Bundles",
    href: "/admin/data-bundles",
    icon: Smartphone,
  },
  {
    title: "Result Checkers",
    href: "/admin/result-checkers",
    icon: FileCheck,
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: UserCircle,
  },
  {
    title: "Agents",
    href: "/admin/agents",
    icon: Users,
  },
  {
    title: "Withdrawals",
    href: "/admin/withdrawals",
    icon: Wallet,
  },
  {
    title: "Chat Support",
    href: "/admin/chat-support",
    icon: MessageCircle,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar({ onClose }: { onClose?: () => void } = {}) {
  const [location] = useLocation();
  const { logout, isLoggingOut } = useAuth();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background relative">
      {onClose && (
        <div className="absolute top-4 right-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className={`flex h-16 items-center gap-2 border-b px-6 ${onClose ? 'pr-16' : ''}`}>
        <img
          src={siteLogo}
          alt="Logo"
          className="h-8 w-8 rounded-lg object-contain"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{APP_NAME}</span>
          <span className="text-xs text-muted-foreground">Admin Panel</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {sidebarNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={onClose}
                  data-testid={`link-admin-${item.title.toLowerCase().replace(" ", "-")}`}
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
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  );
}

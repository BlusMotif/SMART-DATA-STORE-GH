import { Link, useLocation } from "wouter";
import { Menu, LogOut, LayoutDashboard, Store, Home, Package, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/constants";
import { useTheme } from "@/components/theme-provider";
import logoLight from "@assets/logo_1765774201026.png";
import logoDark from "@assets/darkmode-icon.jpg";
import { getAgentId } from "@/lib/store-context";
import { useState } from "react";

export function Header() {
  const { user, isAuthenticated, logout, isLoggingOut, isLoading } = useAuth();
  const { theme } = useTheme();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const agentStore = typeof window !== "undefined" ? getAgentId() : null;

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "agent") return "/agent/dashboard";
    if (user.role === "dealer") return "/dealer/dashboard";
    if (user.role === "super_dealer") return "/super-dealer/dashboard";
    if (user.role === "master") return "/master/dashboard";
    if (user.role === "user") return "/user/dashboard";
    return "/";
  };

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/data-bundles", label: "Data Bundles", icon: Package },
    { href: "/products/result-checkers", label: "Result Checkers", icon: FileCheck },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full border-b shadow-sm ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Logo positioned absolutely in left corner */}
      <Link
        href={agentStore ? `/store/${agentStore}` : "/"}
        className="absolute top-4 left-0 z-10 flex items-center hover:opacity-80 transition-opacity pl-4"
      >
        <img
          src={theme === "dark" ? logoDark : logoLight}
          alt={APP_NAME}
          className="h-6 md:h-10 w-auto"
        />
      </Link>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Spacer for logo */}
          <div className="w-32"></div>

          {/* Desktop Navigation */}
          {!agentStore && (
            <nav className="hidden md:flex items-center gap-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md ${
                      isActive
                        ? "bg-yellow-500 text-white"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Mobile menu */}
            {!location.startsWith("/products") && location !== "/" && location !== "/data-bundles" && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className={`w-80 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
                  style={{ backgroundColor: theme === 'dark' ? '#000000' : '#ffffff' }}
                >
                  <div className="flex flex-col gap-6 mt-6">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">{APP_NAME}</span>
                    </div>

                    <nav className="flex flex-col gap-2">
                      {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 text-base font-medium transition-colors hover:text-primary px-4 py-3 rounded-lg ${
                              isActive
                                ? "bg-yellow-500 text-white"
                                : "text-muted-foreground hover:text-primary"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {/* User menu */}
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground hidden sm:inline">Loading...</span>
              </div>
            ) : isAuthenticated && user && user.email ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full hover:bg-accent transition-colors"
                    aria-label="User menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white">
                  <div className="flex items-center gap-3 p-3 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{user.name || "User"}</span>
                        <span className="text-xs text-muted-foreground">({user.email})</span>
                      </div>
                      <span className="text-xs text-primary capitalize">{user.role}</span>
                    </div>
                  </div>

                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  {user.role === "agent" && (
                    <DropdownMenuItem asChild>
                      <Link href="/agent/storefront" className="flex items-center gap-2 cursor-pointer">
                        <Store className="w-4 h-4" />
                        My Store
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    {isLoggingOut ? "Signing out..." : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-0.5 md:gap-1">
                <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 text-xs md:h-7 md:px-2">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="h-6 px-1.5 text-xs md:h-7 md:px-2">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

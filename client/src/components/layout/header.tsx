import { Link, useLocation } from "wouter";
import { Menu, User, LogOut, LayoutDashboard, Store, ShoppingCart } from "lucide-react";
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
import { APP_NAME } from "@/lib/constants";
import logoImg from "@assets/logo_1765774201026.png";
import { TestModeBanner } from "./test-mode-banner";

export function Header() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

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
    if (user.role === "agent") return "/agent";
    return "/";
  };

  return (
    <>
      <TestModeBanner />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4 px-4 mx-auto max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src={logoImg} 
              alt={APP_NAME} 
              className="h-14 w-auto"
              data-testid="img-logo"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === "/" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="link-home"
            >
              Products
            </Link>
            <Link
              href="/data-bundles"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === "/data-bundles" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="link-data-bundles"
            >
              Data Bundles
            </Link>
            <Link
              href="/result-checkers"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === "/result-checkers" ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid="link-result-checkers"
            >
              Result Checkers
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none" data-testid="text-user-name">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "agent" && (
                    <DropdownMenuItem asChild>
                      <Link href="/agent/storefront" className="cursor-pointer">
                        <Store className="mr-2 h-4 w-4" />
                        My Storefront
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="button-login">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" data-testid="button-register">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

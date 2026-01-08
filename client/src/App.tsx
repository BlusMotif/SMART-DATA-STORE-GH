import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/error-boundary";
import { ConnectionStatus } from "@/components/connection-status";
import { BreakModeGuard } from "@/components/BreakModeGuard";
import { AnnouncementPopup } from "@/components/announcement-popup";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import CheckoutPage from "@/pages/checkout";
import CheckoutSuccessPage from "@/pages/checkout-success";
import WalletTopupSuccessPage from "@/pages/wallet-topup-success";
import AgentRegisterPage from "@/pages/agent/register";
import AgentActivationCompletePage from "@/pages/agent/activation-complete";
import AgentUpgradePage from "@/pages/agent/upgrade";
import AgentDashboard from "@/pages/agent/dashboard";
import AgentTransactions from "@/pages/agent/transactions";
import AgentWithdrawals from "@/pages/agent/withdrawals";
import AgentStorefront from "@/pages/agent/storefront";
import AgentSettings from "@/pages/agent/settings";
import AgentSupportPage from "@/pages/agent/support";
import AgentBundlesPage from "@/pages/agent/bundles";
import AgentWalletPage from "@/pages/agent/wallet";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDataBundles from "@/pages/admin/data-bundles";
import AdminResultCheckers from "@/pages/admin/result-checkers";
import AdminTransactions from "@/pages/admin/transactions";
import AdminUsers from "@/pages/admin/users";
import AdminAgents from "@/pages/admin/agents";
import AdminWithdrawals from "@/pages/admin/withdrawals";
import AdminChatSupport from "@/pages/admin/chat-support";
import AdminSettings from "@/pages/admin/settings";
import AdminRankings from "@/pages/admin/rankings";
import AdminBreakSettings from "@/pages/admin/break-settings";
import AdminApiConfiguration from "@/pages/admin/api-configuration";
import AdminAnnouncements from "@/pages/admin/announcements";
import AgentPublicStorefront from "@/pages/agent/public-storefront";
import AgentNetworkPurchasePage from "@/pages/agent/network-purchase";
import NetworkProductsPage from "@/pages/products/network";
import ResultCheckersPage from "@/pages/products/result-checkers";
import DataBundlesPage from "@/pages/data-bundles";
import UserDashboard from "@/pages/user/dashboard";
import WalletDashboard from "@/pages/user/wallet";
import UserBundlesPage from "@/pages/user/bundles";
import UserHistoryPage from "@/pages/user/history";
import UserSupportPage from "@/pages/user/support";

// Component to restrict agent store users to storefront only
function StorefrontGuard({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  
  useEffect(() => {
    const agentStore = localStorage.getItem("agentStore");
    
    // Allowed paths for storefront users: store, products, checkout, success pages, auth pages
    const allowedPaths = [
      "/store/",
      "/products/",
      "/checkout",
      "/wallet/topup/success",
      "/login",
      "/register"
    ];
    
    const isAllowedPath = allowedPaths.some(path => location.startsWith(path));
    
    // If user came from an agent store and tries to access restricted app routes
    if (agentStore && !isAllowedPath && location !== "/") {
      // Redirect them back to the store
      navigate(`/store/${agentStore}`);
    }
  }, [location, navigate]);
  
  return <>{children}</>;
}

function Router() {
  return (
    <StorefrontGuard>
      <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/data-bundles" component={DataBundlesPage} />
      <Route path="/products/result-checkers" component={ResultCheckersPage} />
      <Route path="/products/:network" component={NetworkProductsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/checkout/:productType/:productId/:year?" component={CheckoutPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/wallet/topup/success" component={WalletTopupSuccessPage} />
      <Route path="/agent/register" component={AgentRegisterPage} />
      <Route path="/agent/upgrade" component={AgentUpgradePage} />
      <Route path="/agent/activation-complete" component={AgentActivationCompletePage} />
      <ProtectedRoute path="/user/dashboard" component={UserDashboard} />
      <ProtectedRoute path="/user/wallet" component={WalletDashboard} />
      <ProtectedRoute path="/user/bundles/:network" component={UserBundlesPage} />
      <ProtectedRoute path="/user/history" component={UserHistoryPage} />
      <ProtectedRoute path="/user/support" component={UserSupportPage} />
      <ProtectedRoute path="/agent/dashboard" component={AgentDashboard} requiredRole="agent" />
      <ProtectedRoute path="/agent/transactions" component={AgentTransactions} requiredRole="agent" />
      <ProtectedRoute path="/agent/withdrawals" component={AgentWithdrawals} requiredRole="agent" />
      <ProtectedRoute path="/agent/storefront" component={AgentStorefront} requiredRole="agent" />
      <ProtectedRoute path="/agent/settings" component={AgentSettings} requiredRole="agent" />
      <ProtectedRoute path="/agent/support" component={AgentSupportPage} requiredRole="agent" />
      <ProtectedRoute path="/agent/bundles/:network" component={AgentBundlesPage} requiredRole="agent" />
      <ProtectedRoute path="/agent/wallet" component={AgentWalletPage} requiredRole="agent" />
      <ProtectedRoute path="/admin" component={AdminDashboard} requiredRole="admin" />
      <ProtectedRoute path="/admin/rankings" component={AdminRankings} requiredRole="admin" />
      <ProtectedRoute path="/admin/data-bundles" component={AdminDataBundles} requiredRole="admin" />
      <ProtectedRoute path="/admin/result-checkers" component={AdminResultCheckers} requiredRole="admin" />
      <ProtectedRoute path="/admin/transactions" component={AdminTransactions} requiredRole="admin" />
      <ProtectedRoute path="/admin/users" component={AdminUsers} requiredRole="admin" />
      <ProtectedRoute path="/admin/agents" component={AdminAgents} requiredRole="admin" />
      <ProtectedRoute path="/admin/withdrawals" component={AdminWithdrawals} requiredRole="admin" />
      <ProtectedRoute path="/admin/chat-support" component={AdminChatSupport} requiredRole="admin" />
      <ProtectedRoute path="/admin/announcements" component={AdminAnnouncements} requiredRole="admin" />
      <ProtectedRoute path="/admin/break-settings" component={AdminBreakSettings} requiredRole="admin" />
      <ProtectedRoute path="/admin/api-configuration" component={AdminApiConfiguration} requiredRole="admin" />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} requiredRole="admin" />
      <Route path="/store/:slug" component={AgentPublicStorefront} />
      <Route path="/store/:slug/:network" component={AgentNetworkPurchasePage} />
      <Route component={NotFound} />
    </Switch>
    </StorefrontGuard>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <ConnectionStatus />
            <PWAInstallPrompt />
            <BreakModeGuard>
              <Router />
            </BreakModeGuard>
            <AnnouncementPopup />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

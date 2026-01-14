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
import DealerDashboard from "@/pages/dealer/dashboard";
import SuperDealerDashboard from "@/pages/super-dealer/dashboard";
import MasterDashboard from "@/pages/master/dashboard";
import AgentTransactions from "@/pages/agent/transactions";

import AgentStorefront from "@/pages/agent/storefront";
import AgentSettings from "@/pages/agent/settings";
import AgentSupportPage from "@/pages/agent/support";
import AgentBundlesPage from "@/pages/agent/bundles";
import AgentWalletPage from "@/pages/agent/wallet";
import AgentPricingPage from "@/pages/agent/pricing";
import DealerPricingPage from "@/pages/dealer/pricing";
import SuperDealerPricingPage from "@/pages/super-dealer/pricing";
import MasterPricingPage from "@/pages/master/pricing";
import ApiIntegrationsPage from "@/pages/api-integrations";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDataBundles from "@/pages/admin/data-bundles";
import AdminRoleBasePrices from "@/pages/admin/role-base-prices";
import AdminResultCheckers from "@/pages/admin/result-checkers";
import AdminTransactions from "@/pages/admin/transactions";
import AdminUsers from "@/pages/admin/users";
import AdminAgents from "@/pages/admin/agents";

import AdminChatSupport from "@/pages/admin/chat-support";
import AdminSettings from "@/pages/admin/settings";
import AdminRankings from "@/pages/admin/rankings";
import AdminBreakSettings from "@/pages/admin/break-settings";
import AdminApiConfiguration from "@/pages/admin/api-configuration";
import AdminAnnouncements from "@/pages/admin/announcements";
import PublicRankings from "@/pages/public-rankings";
import AgentPublicStorefront from "@/pages/agent/public-storefront";
import { getAgentId } from "@/lib/store-context";
import AgentNetworkPurchasePage from "@/pages/agent/network-purchase";
import NetworkProductsPage from "@/pages/products/network";
import ResultCheckersPage from "@/pages/products/result-checkers";
import DataBundlesPage from "@/pages/data-bundles";
import UserDashboard from "@/pages/user/dashboard";
import WalletDashboard from "@/pages/user/wallet";
import UserBundlesPage from "@/pages/user/bundles";
import UserHistoryPage from "@/pages/user/history";
import UserSupportPage from "@/pages/user/support";
import UserVouchersPage from "@/pages/user/vouchers";
import UserSettingsPage from "@/pages/user/settings";

// Storefront
import StorefrontPage from "@/pages/storefront";

// Component to restrict agent store users to storefront only
function StorefrontGuard({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  
  useEffect(() => {
    const agentStore = getAgentId();

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

    // If user is in agent storefront context
    if (agentStore) {
      // If on root, immediately redirect to the agent store (fail-safe)
      if (location === "/") {
        navigate(`/store/agent/${agentStore}`);
        return;
      }

      // If trying to access non-allowed app routes, redirect back to the agent store
      if (!isAllowedPath && !location.startsWith(`/store/agent/${agentStore}`)) {
        navigate(`/store/agent/${agentStore}`);
      }
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
      <Route path="/rankings" component={PublicRankings} />
      <Route path="/checkout/:productType/:productId/:year?" component={CheckoutPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/wallet/topup/success" component={WalletTopupSuccessPage} />
      <Route path="/agent/register" component={AgentRegisterPage} />
      <Route path="/agent/upgrade" component={AgentUpgradePage} />
      <Route path="/agent/activation-complete" component={AgentActivationCompletePage} />
      <ProtectedRoute path="/user/dashboard" component={UserDashboard} />
      <ProtectedRoute path="/user/wallet" component={WalletDashboard} />
      <ProtectedRoute path="/user/bundles/:network" component={UserBundlesPage} />
      <ProtectedRoute path="/user/settings" component={UserSettingsPage} />
      <ProtectedRoute path="/user/vouchers" component={UserVouchersPage} />
      <ProtectedRoute path="/user/history" component={UserHistoryPage} />
      <ProtectedRoute path="/user/support" component={UserSupportPage} />
      <ProtectedRoute path="/dealer/dashboard" component={DealerDashboard} requiredRole="dealer" />
      <ProtectedRoute path="/super-dealer/dashboard" component={SuperDealerDashboard} requiredRole="super_dealer" />
      <ProtectedRoute path="/master/dashboard" component={MasterDashboard} requiredRole="master" />
      <ProtectedRoute path="/agent/dashboard" component={AgentDashboard} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/agent/transactions" component={AgentTransactions} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/agent/withdrawals" component={AgentWithdrawals} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/agent/storefront" component={AgentStorefront} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/agent/settings" component={AgentSettings} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/agent/support" component={AgentSupportPage} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/agent/bundles/:network" component={AgentBundlesPage} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/agent/wallet" component={AgentWalletPage} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/agent/pricing" component={AgentPricingPage} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/dashboard/api-integrations" component={ApiIntegrationsPage} requiredRoles={["agent", "dealer", "super_dealer", "master"]} />
      <ProtectedRoute path="/dealer/pricing" component={DealerPricingPage} requiredRole="dealer" />
      <ProtectedRoute path="/super-dealer/pricing" component={SuperDealerPricingPage} requiredRole="super_dealer" />
      <ProtectedRoute path="/master/pricing" component={MasterPricingPage} requiredRole="master" />
      <ProtectedRoute path="/admin" component={AdminDashboard} requiredRole="admin" />
      <ProtectedRoute path="/admin/rankings" component={AdminRankings} requiredRole="admin" />
      <ProtectedRoute path="/admin/data-bundles" component={AdminDataBundles} requiredRole="admin" />
      <ProtectedRoute path="/admin/role-base-prices" component={AdminRoleBasePrices} requiredRole="admin" />
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
      <Route path="/store/:role/:slug" component={StorefrontPage} />
      <Route path="/store/:role/:slug/:network" component={AgentNetworkPurchasePage} />
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

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import CheckoutPage from "@/pages/checkout";
import CheckoutSuccessPage from "@/pages/checkout-success";
import AgentRegisterPage from "@/pages/agent/register";
import AgentDashboard from "@/pages/agent/dashboard";
import AgentTransactions from "@/pages/agent/transactions";
import AgentWithdrawals from "@/pages/agent/withdrawals";
import AgentStorefront from "@/pages/agent/storefront";
import AgentSettings from "@/pages/agent/settings";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDataBundles from "@/pages/admin/data-bundles";
import AdminResultCheckers from "@/pages/admin/result-checkers";
import AdminTransactions from "@/pages/admin/transactions";
import AdminAgents from "@/pages/admin/agents";
import AdminWithdrawals from "@/pages/admin/withdrawals";
import AdminSettings from "@/pages/admin/settings";
import StorefrontPage from "@/pages/storefront";
import NetworkProductsPage from "@/pages/products/network";
import ResultCheckersPage from "@/pages/products/result-checkers";
import DataBundlesPage from "@/pages/data-bundles";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/data-bundles" component={DataBundlesPage} />
      <Route path="/products/result-checkers" component={ResultCheckersPage} />
      <Route path="/products/:network" component={NetworkProductsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/checkout/:productType/:productId/:year?" component={CheckoutPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/agent/register" component={AgentRegisterPage} />
      <Route path="/agent" component={AgentDashboard} />
      <Route path="/agent/transactions" component={AgentTransactions} />
      <Route path="/agent/withdrawals" component={AgentWithdrawals} />
      <Route path="/agent/storefront" component={AgentStorefront} />
      <Route path="/agent/settings" component={AgentSettings} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/data-bundles" component={AdminDataBundles} />
      <Route path="/admin/result-checkers" component={AdminResultCheckers} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      <Route path="/admin/agents" component={AdminAgents} />
      <Route path="/admin/withdrawals" component={AdminWithdrawals} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/store/:slug" component={StorefrontPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="clectech-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
          <PWAInstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

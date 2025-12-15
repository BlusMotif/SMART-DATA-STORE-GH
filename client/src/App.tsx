import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";

import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import CheckoutPage from "@/pages/checkout";
import CheckoutSuccessPage from "@/pages/checkout-success";
import AgentRegisterPage from "@/pages/agent/register";
import AgentDashboard from "@/pages/agent/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminDataBundles from "@/pages/admin/data-bundles";
import AdminResultCheckers from "@/pages/admin/result-checkers";
import AdminTransactions from "@/pages/admin/transactions";
import AdminAgents from "@/pages/admin/agents";
import AdminWithdrawals from "@/pages/admin/withdrawals";
import AdminSettings from "@/pages/admin/settings";
import StorefrontPage from "@/pages/storefront";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/checkout/:productType/:productId/:year?" component={CheckoutPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/agent/register" component={AgentRegisterPage} />
      <Route path="/agent" component={AgentDashboard} />
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
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

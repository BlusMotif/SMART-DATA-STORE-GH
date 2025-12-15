import { cn } from "@/lib/utils";
import { Package, FileX, Users, Wallet, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function NoDataBundles({ action }: { action?: React.ReactNode }) {
  return (
    <EmptyState
      icon={Package}
      title="No Data Bundles"
      description="There are no data bundles available at the moment. Check back later or contact support."
      action={action}
    />
  );
}

export function NoResultCheckers({ action }: { action?: React.ReactNode }) {
  return (
    <EmptyState
      icon={FileX}
      title="No Result Checkers"
      description="Result checkers are currently out of stock. Please check back later."
      action={action}
    />
  );
}

export function NoTransactions({ action }: { action?: React.ReactNode }) {
  return (
    <EmptyState
      icon={BarChart3}
      title="No Transactions"
      description="You haven't made any transactions yet. Start by purchasing a data bundle or result checker."
      action={action}
    />
  );
}

export function NoAgents({ action }: { action?: React.ReactNode }) {
  return (
    <EmptyState
      icon={Users}
      title="No Agents"
      description="There are no registered agents yet."
      action={action}
    />
  );
}

export function NoWithdrawals({ action }: { action?: React.ReactNode }) {
  return (
    <EmptyState
      icon={Wallet}
      title="No Withdrawals"
      description="You haven't made any withdrawal requests yet."
      action={action}
    />
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  statusConfig?: Record<string, { label: string; color: string }>;
  className?: string;
}

const defaultStatusConfig: Record<string, { label: string; color: string; icon?: typeof CheckCircle }> = {
  pending: { label: "Pending", color: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle },
  delivered: { label: "Delivered", color: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  failed: { label: "Failed", color: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  refunded: { label: "Refunded", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", icon: RefreshCw },
  approved: { label: "Approved", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  sent: { label: "Sent", color: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle },
  retrying: { label: "Retrying", color: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400", icon: RefreshCw },
};

export function StatusBadge({ status, statusConfig, className }: StatusBadgeProps) {
  const config = statusConfig?.[status] || defaultStatusConfig[status] || {
    label: status,
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  const Icon = (defaultStatusConfig[status] as any)?.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-0 font-medium",
        config.color,
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

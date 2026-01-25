import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, RefreshCw, Layers } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  statusConfig?: Record<string, { label: string; color: string }>;
  className?: string;
}

const defaultStatusConfig: Record<string, { label: string; color: string; icon?: typeof CheckCircle }> = {
  pending: { label: "Pending", color: "bg-amber-500 text-white", icon: Clock },
  processing: { label: "Processing", color: "bg-blue-500 text-white", icon: Layers },
  confirmed: { label: "Confirmed", color: "bg-blue-600 text-white", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-green-500 text-white", icon: CheckCircle },
  delivered: { label: "Delivered", color: "bg-green-500 text-white", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500 text-white", icon: XCircle },
  failed: { label: "Failed", color: "bg-red-500 text-white", icon: XCircle },
  refunded: { label: "Refunded", color: "bg-blue-500 text-white", icon: RefreshCw },
  approved: { label: "Approved", color: "bg-blue-500 text-white", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500 text-white", icon: XCircle },
  sent: { label: "Sent", color: "bg-green-500 text-white", icon: CheckCircle },
  retrying: { label: "Retrying", color: "bg-yellow-500 text-white", icon: RefreshCw },
};

export function StatusBadge({ status, statusConfig, className }: StatusBadgeProps) {
  const config = statusConfig?.[status] || defaultStatusConfig[status] || {
    label: status,
    color: "bg-gray-100 text-gray-700 dark:bg-white dark:text-gray-300",
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

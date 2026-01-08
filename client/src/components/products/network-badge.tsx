import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NetworkBadgeProps {
  network: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const networkStyles: Record<string, { bg: string; text: string; border: string }> = {
  mtn: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-800 dark:text-yellow-300",
    border: "border-yellow-300 dark:border-yellow-700",
  },
  telecel: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-300 dark:border-red-700",
  },
  at_bigtime: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-300 dark:border-red-700",
  },
  at_ishare: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-300 dark:border-red-700",
  },
};

const networkLabels: Record<string, string> = {
  mtn: "MTN",
  telecel: "TELECEL",
  at_bigtime: "AT Bigtime",
  at_ishare: "AT ishare",
};

export function NetworkBadge({ network, size = "sm", className }: NetworkBadgeProps) {
  const styles = networkStyles[network.toLowerCase()] || {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold uppercase tracking-wide",
        styles.bg,
        styles.text,
        styles.border,
        sizeClasses[size],
        className
      )}
    >
      {networkLabels[network.toLowerCase()] || network.toUpperCase()}
    </Badge>
  );
}

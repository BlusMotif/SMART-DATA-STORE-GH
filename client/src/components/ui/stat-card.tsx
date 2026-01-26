import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: string;
  trendLabel?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("bg-green-500 border border-yellow-500 text-white", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">
          {title}
        </CardTitle>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Icon className="h-4 w-4 text-white" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold tabular-nums">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className="text-xs font-medium text-white">
                {trend}
              </span>
            )}
            {trendLabel && (
              <span className="text-xs text-white">
                {trendLabel}
              </span>
            )}
            {description && !trend && !trendLabel && (
              <p className="text-xs text-white">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

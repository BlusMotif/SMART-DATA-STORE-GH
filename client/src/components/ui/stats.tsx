import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string;
  icon?: LucideIcon;
  description?: string;
}

interface StatsProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  variant?: "default" | "minimal" | "cards";
}

const Stats = React.forwardRef<HTMLElement, StatsProps>(
  ({
    className,
    title,
    description,
    stats,
    columns = 4,
    variant = "default",
    ...props
  }, ref) => {
    const gridCols = {
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-2 lg:grid-cols-4",
    };

    if (variant === "cards") {
      return (
        <section
          ref={ref}
          className={cn("py-16 bg-muted/30", className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {(title || description) && (
              <div className="text-center mb-12">
                {title && (
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">{title}</h2>
                )}
                {description && (
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {description}
                  </p>
                )}
              </div>
            )}

            <div className={cn("grid gap-6", gridCols[columns])}>
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-6 text-center shadow-sm border border-cyan-200 dark:border-cyan-800 hover:shadow-md transition-shadow"
                  >
                    {Icon && (
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="text-3xl font-bold text-primary mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.label}
                    </div>
                    {stat.description && (
                      <div className="text-xs text-muted-foreground">
                        {stat.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (variant === "minimal") {
      return (
        <section
          ref={ref}
          className={cn("py-12", className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className={cn("grid gap-8", gridCols[columns])}>
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    {Icon && (
                      <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    )}
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    // Default variant
    return (
      <section
        ref={ref}
        className={cn("py-16 bg-muted/20", className)}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {(title || description) && (
            <div className="text-center mb-12">
              {title && (
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">{title}</h2>
              )}
              {description && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {description}
                </p>
              )}
            </div>
          )}

          <div className={cn("grid gap-8", gridCols[columns])}>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  {Icon && (
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="text-3xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                  {stat.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }
);
Stats.displayName = "Stats";

export { Stats };
export type { StatItem };
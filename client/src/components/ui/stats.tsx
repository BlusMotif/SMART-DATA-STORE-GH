import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string;
  icon?: LucideIcon;
  description?: string;
}

// Component for animated countdown numbers
function CountdownValue({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Extract numeric part and suffix (e.g., "50K+" -> 50, "K+")
  const numericMatch = value.match(/(\d+)/);
  const numeric = numericMatch ? parseInt(numericMatch[1]) : 0;
  const suffix = value.replace(/^\d+/, "");

  useEffect(() => {
    const ref = React.createRef<HTMLDivElement>();
    
    // Intersection observer to trigger animation when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    const tempDiv = document.querySelector(`[data-stat-value="${value}"]`);
    if (tempDiv) observer.observe(tempDiv);

    return () => {
      if (tempDiv) observer.unobserve(tempDiv);
    };
  }, [value, isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const duration = 2000; // 2 seconds animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuad = progress => 1 - Math.pow(1 - progress, 2);
      const easedProgress = easeOutQuad(progress);
      
      const currentValue = Math.floor(numeric * easedProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(numeric);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, numeric]);

  return (
    <div data-stat-value={value}>
      {displayValue}{suffix}
    </div>
  );
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
          className={cn("py-8 bg-muted/30", className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {(title || description) && (
              <div className="text-center mb-8">
                {title && (
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">{title}</h2>
                )}
                {description && (
                  <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                    {description}
                  </p>
                )}
              </div>
            )}

            <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-black rounded-lg p-4 text-center shadow-sm border hover:shadow-md transition-shadow"
                  >
                    {Icon && (
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="text-2xl font-bold text-primary mb-1">
                      <CountdownValue value={stat.value} />
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {stat.label}
                    </div>
                    {stat.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
                      <CountdownValue value={stat.value} />
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
                    <CountdownValue value={stat.value} />
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
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { LucideIcon } from "lucide-react";

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  color?: string;
  image?: string;
}

interface FeaturesProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  description?: string;
  features: FeatureItem[];
  columns?: 2 | 3 | 4;
  variant?: "default" | "minimal" | "cards" | "bento";
  background?: "default" | "muted" | "gradient";
}

const Features = React.forwardRef<HTMLElement, FeaturesProps>(
  ({
    className,
    title,
    subtitle,
    description,
    features,
    columns = 3,
    variant = "default",
    background = "default",
    ...props
  }, ref) => {
    const backgroundClasses = {
      default: "",
      muted: "bg-muted/20",
      gradient: "bg-gradient-to-br from-primary/5 via-background to-secondary/5",
    };

    const gridCols = {
      2: "grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    };

    if (variant === "bento") {
      return (
        <section
          ref={ref}
          className={cn("py-20", backgroundClasses[background], className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {(title || subtitle || description) && (
              <div className="text-center mb-16">
                {subtitle && (
                  <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wide">
                    {subtitle}
                  </div>
                )}
                {title && (
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">{title}</h2>
                )}
                {description && (
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {description}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isLarge = index === 0 || index === 3; // Make first and fourth items larger

                return (
                  <div
                    key={feature.id}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl bg-white dark:bg-black border hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                      isLarge ? "md:col-span-2 md:row-span-1" : "md:col-span-1"
                    )}
                  >
                    <div className="p-8">
                      <div className="flex items-start gap-4">
                        {Icon && (
                          <div className={cn(
                            "flex-shrink-0 rounded-xl p-3",
                            feature.color || "bg-primary/10 text-primary"
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                            {feature.title}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
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
          className={cn("py-16", backgroundClasses[background], className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {(title || subtitle || description) && (
              <div className="text-center mb-12">
                {subtitle && (
                  <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wide">
                    {subtitle}
                  </div>
                )}
                {title && (
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">{title}</h2>
                )}
                {description && (
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {description}
                  </p>
                )}
              </div>
            )}

            <div className={cn("grid gap-8", gridCols[columns])}>
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.id} className="text-center">
                    {Icon && (
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }

    if (variant === "cards") {
      return (
        <section
          ref={ref}
          className={cn("py-20", backgroundClasses[background], className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {(title || subtitle || description) && (
              <div className="text-center mb-16">
                {subtitle && (
                  <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wide">
                    {subtitle}
                  </div>
                )}
                {title && (
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">{title}</h2>
                )}
                {description && (
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {description}
                  </p>
                )}
              </div>
            )}

            <div className={cn("grid gap-8", gridCols[columns])}>
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.id} className="text-center hover:shadow-lg transition-shadow border-0 dark:border-white bg-white dark:bg-white backdrop-blur-sm">
                    <CardContent className="p-8">
                      {Icon && (
                        <div className={cn(
                          "w-16 h-16 mx-auto mb-6 rounded-2xl p-4 flex items-center justify-center",
                          feature.color || "bg-gradient-to-br from-primary/10 to-primary/5 text-primary"
                        )}>
                          <Icon className="w-8 h-8" />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
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
        className={cn("py-20", backgroundClasses[background], className)}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {(title || subtitle || description) && (
            <div className="text-center mb-16">
              {subtitle && (
                <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wide">
                  {subtitle}
                </div>
              )}
              {title && (
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">{title}</h2>
              )}
              {description && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {description}
                </p>
              )}
            </div>
          )}

          <div className={cn("grid gap-8", gridCols[columns])}>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.id} className="flex gap-6">
                  {Icon && (
                    <div className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                      feature.color || "bg-primary/10 text-primary"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }
);
Features.displayName = "Features";

export { Features };
export type { FeatureItem };
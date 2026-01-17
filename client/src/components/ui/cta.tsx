import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";

interface CTAProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  description?: string;
  primaryButton?: {
    text: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  secondaryButton?: {
    text: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  variant?: "default" | "minimal" | "centered" | "split" | "gradient";
  background?: "default" | "muted" | "gradient" | "primary";
  size?: "sm" | "md" | "lg";
}

const CTA = React.forwardRef<HTMLElement, CTAProps>(
  ({
    className,
    title,
    subtitle,
    description,
    primaryButton,
    secondaryButton,
    variant = "default",
    background = "default",
    size = "md",
    ...props
  }, ref) => {
    const backgroundClasses = {
      default: "",
      muted: "bg-muted/20",
      gradient: "bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10",
      primary: "bg-primary text-primary-foreground",
    };

    const sizeClasses = {
      sm: "py-12",
      md: "py-16",
      lg: "py-24",
    };

    const titleSizeClasses = {
      sm: "text-2xl sm:text-3xl",
      md: "text-3xl sm:text-4xl",
      lg: "text-4xl sm:text-5xl",
    };

    if (variant === "minimal") {
      return (
        <section
          ref={ref}
          className={cn("text-center", sizeClasses[size], backgroundClasses[background], className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {subtitle && (
              <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wide">
                {subtitle}
              </div>
            )}
            <h2 className={cn("font-bold mb-4", titleSizeClasses[size])}>{title}</h2>
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                {description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {primaryButton && (
                <Button
                  asChild={!!primaryButton.href}
                  variant={primaryButton.variant || "default"}
                  size="lg"
                  onClick={primaryButton.onClick}
                  className="min-w-[160px]"
                >
                  {primaryButton.href ? (
                    <a href={primaryButton.href} className="flex items-center gap-2">
                      {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                      {primaryButton.text}
                    </a>
                  ) : (
                    <>
                      {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                      {primaryButton.text}
                    </>
                  )}
                </Button>
              )}
              {secondaryButton && (
                <Button
                  asChild={!!secondaryButton.href}
                  variant={secondaryButton.variant || "outline"}
                  size="lg"
                  onClick={secondaryButton.onClick}
                  className="min-w-[160px]"
                >
                  {secondaryButton.href ? (
                    <a href={secondaryButton.href} className="flex items-center gap-2">
                      {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                      {secondaryButton.text}
                    </a>
                  ) : (
                    <>
                      {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                      {secondaryButton.text}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </section>
      );
    }

    if (variant === "centered") {
      return (
        <section
          ref={ref}
          className={cn("text-center", sizeClasses[size], backgroundClasses[background], className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 border">
              {subtitle && (
                <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wide">
                  {subtitle}
                </div>
              )}
              <h2 className={cn("font-bold mb-4", titleSizeClasses[size])}>{title}</h2>
              {description && (
                <p className="text-lg text-muted-foreground mb-8">
                  {description}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {primaryButton && (
                  <Button
                    asChild={!!primaryButton.href}
                    variant={primaryButton.variant || "default"}
                    size="lg"
                    onClick={primaryButton.onClick}
                    className="min-w-[160px]"
                  >
                    {primaryButton.href ? (
                      <a href={primaryButton.href} className="flex items-center gap-2">
                        {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                        {primaryButton.text}
                      </a>
                    ) : (
                      <>
                        {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                        {primaryButton.text}
                      </>
                    )}
                  </Button>
                )}
                {secondaryButton && (
                  <Button
                    asChild={!!secondaryButton.href}
                    variant={secondaryButton.variant || "outline"}
                    size="lg"
                    onClick={secondaryButton.onClick}
                    className="min-w-[160px]"
                  >
                    {secondaryButton.href ? (
                      <a href={secondaryButton.href} className="flex items-center gap-2">
                        {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                        {secondaryButton.text}
                      </a>
                    ) : (
                      <>
                        {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                        {secondaryButton.text}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (variant === "split") {
      return (
        <section
          ref={ref}
          className={cn(sizeClasses[size], backgroundClasses[background], className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                {subtitle && (
                  <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wide">
                    {subtitle}
                  </div>
                )}
                <h2 className={cn("font-bold mb-4", titleSizeClasses[size])}>{title}</h2>
                {description && (
                  <p className="text-lg text-muted-foreground mb-8">
                    {description}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  {primaryButton && (
                    <Button
                      asChild={!!primaryButton.href}
                      variant={primaryButton.variant || "default"}
                      size="lg"
                      onClick={primaryButton.onClick}
                      className="min-w-[160px]"
                    >
                      {primaryButton.href ? (
                        <a href={primaryButton.href} className="flex items-center gap-2">
                          {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                          {primaryButton.text}
                        </a>
                      ) : (
                        <>
                          {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                          {primaryButton.text}
                        </>
                      )}
                    </Button>
                  )}
                  {secondaryButton && (
                    <Button
                      asChild={!!secondaryButton.href}
                      variant={secondaryButton.variant || "outline"}
                      size="lg"
                      onClick={secondaryButton.onClick}
                      className="min-w-[160px]"
                    >
                      {secondaryButton.href ? (
                        <a href={secondaryButton.href} className="flex items-center gap-2">
                          {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                          {secondaryButton.text}
                        </a>
                      ) : (
                        <>
                          {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                          {secondaryButton.text}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <div className="lg:text-right">
                {/* Placeholder for image or additional content */}
                <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      {primaryButton?.icon && <primaryButton.icon className="w-8 h-8 text-primary" />}
                    </div>
                    <p className="text-muted-foreground">Visual content goes here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (variant === "gradient") {
      return (
        <section
          ref={ref}
          className={cn("relative overflow-hidden", sizeClasses[size], className)}
          {...props}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-secondary"></div>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            {subtitle && (
              <div className="text-sm font-medium text-white/80 mb-2 uppercase tracking-wide">
                {subtitle}
              </div>
            )}
            <h2 className={cn("font-bold mb-4", titleSizeClasses[size])}>{title}</h2>
            {description && (
              <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
                {description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {primaryButton && (
                <Button
                  asChild={!!primaryButton.href}
                  variant="secondary"
                  size="lg"
                  onClick={primaryButton.onClick}
                  className="min-w-[160px] bg-white text-primary hover:bg-white/90"
                >
                  {primaryButton.href ? (
                    <a href={primaryButton.href} className="flex items-center gap-2">
                      {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                      {primaryButton.text}
                    </a>
                  ) : (
                    <>
                      {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                      {primaryButton.text}
                    </>
                  )}
                </Button>
              )}
              {secondaryButton && (
                <Button
                  asChild={!!secondaryButton.href}
                  variant="outline"
                  size="lg"
                  onClick={secondaryButton.onClick}
                  className="min-w-[160px] border-white/30 text-white hover:bg-white/10"
                >
                  {secondaryButton.href ? (
                    <a href={secondaryButton.href} className="flex items-center gap-2">
                      {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                      {secondaryButton.text}
                    </a>
                  ) : (
                    <>
                      {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                      {secondaryButton.text}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </section>
      );
    }

    // Default variant
    return (
      <section
        ref={ref}
        className={cn("text-center", sizeClasses[size], backgroundClasses[background], className)}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {subtitle && (
            <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wide">
              {subtitle}
            </div>
          )}
          <h2 className={cn("font-bold mb-4", titleSizeClasses[size])}>{title}</h2>
          {description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {description}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {primaryButton && (
              <Button
                asChild={!!primaryButton.href}
                variant={primaryButton.variant || "default"}
                size="lg"
                onClick={primaryButton.onClick}
                className="min-w-[160px]"
              >
                {primaryButton.href ? (
                  <a href={primaryButton.href} className="flex items-center gap-2">
                    {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                    {primaryButton.text}
                  </a>
                ) : (
                  <>
                    {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                    {primaryButton.text}
                  </>
                )}
              </Button>
            )}
            {secondaryButton && (
              <Button
                asChild={!!secondaryButton.href}
                variant={secondaryButton.variant || "outline"}
                size="lg"
                onClick={secondaryButton.onClick}
                className="min-w-[160px]"
              >
                {secondaryButton.href ? (
                  <a href={secondaryButton.href} className="flex items-center gap-2">
                    {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                    {secondaryButton.text}
                  </a>
                ) : (
                  <>
                    {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                    {secondaryButton.text}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }
);
CTA.displayName = "CTA";

export { CTA };
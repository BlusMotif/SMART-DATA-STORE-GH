import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Badge } from "./badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroProps extends React.HTMLAttributes<HTMLElement> {
  title: React.ReactNode;
  subtitle?: string;
  description?: string;
  badge?: string;
  primaryButton?: {
    text: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
    size?: "sm" | "md" | "lg";
  };
  secondaryButton?: {
    text: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    size?: "sm" | "md" | "lg";
  };
  images?: string[];
  showNavigation?: boolean;
  background?: "default" | "gradient" | "image";
  overlay?: boolean;
  height?: "sm" | "md" | "lg" | "xl" | "full";
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg";
}

const Hero = React.forwardRef<HTMLElement, HeroProps>(
  ({
    className,
    title,
    subtitle,
    description,
    badge,
    primaryButton,
    secondaryButton,
    images = [],
    showNavigation = false,
    background = "gradient",
    overlay = true,
    height = "lg",
    align = "center",
    size = "lg",
    children,
    ...props
  }, ref) => {
    const [currentImage, setCurrentImage] = React.useState(0);

    // Auto-rotate images
    React.useEffect(() => {
      if (images.length > 1) {
        const timer = setInterval(() => {
          setCurrentImage((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(timer);
      }
    }, [images.length]);

    const heightClasses = {
      sm: "h-[50vh]",
      md: "h-[60vh]",
      lg: "h-[70vh]",
      xl: "h-[80vh]",
      full: "h-screen",
    };

    const sizeClasses = {
      sm: "text-3xl sm:text-4xl",
      md: "text-4xl sm:text-5xl lg:text-6xl",
      lg: "text-4xl sm:text-5xl lg:text-7xl",
    };

    const nextImage = () => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
    };

    const backgroundClasses = {
      default: "",
      gradient: "bg-gradient-to-br from-primary/5 via-background to-secondary/5",
      image: "",
    };

    return (
      <section
        ref={ref}
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          heightClasses[height],
          backgroundClasses[background],
          className
        )}
        {...props}
      >
        {/* Background Images */}
        {images.length > 0 && (
          <>
            {images.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImage ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={img}
                  alt={`Hero image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {overlay && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                )}
              </div>
            ))}

            {/* Navigation Arrows */}
            {showNavigation && images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentImage
                          ? "bg-white scale-125"
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              {badge && (
                <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
                  {badge}
                </Badge>
              )}

              {subtitle && (
                <div className="text-sm font-medium text-primary mb-2 uppercase tracking-wide">
                  {subtitle}
                </div>
              )}

              <h1 className={cn("font-bold mb-6 tracking-tight", sizeClasses[size])}>
                <span className="text-white">{title}</span>
              </h1>

              {description && (
                <p className="text-base sm:text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                  {description}
                </p>
              )}

              {(primaryButton || secondaryButton) && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  {primaryButton && (
                    <Button
                      size={primaryButton.size || "lg"}
                      className={cn("px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow", primaryButton.className)}
                      asChild={!!primaryButton.href}
                      onClick={primaryButton.onClick}
                    >
                      {primaryButton.href ? (
                        <a href={primaryButton.href} className="flex items-center gap-2">
                          {primaryButton.text}
                          {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                        </a>
                      ) : (
                        <>
                          {primaryButton.text}
                          {primaryButton.icon && <primaryButton.icon className="w-5 h-5" />}
                        </>
                      )}
                    </Button>
                  )}

                  {secondaryButton && (
                    <Button
                      size={secondaryButton.size || "lg"}
                      variant="outline"
                      className="px-8 py-4 text-lg font-semibold bg-white/10 border-white/20 text-white hover:bg-white/20"
                      asChild={!!secondaryButton.href}
                      onClick={secondaryButton.onClick}
                    >
                      {secondaryButton.href ? (
                        <a href={secondaryButton.href} className="flex items-center gap-2">
                          {secondaryButton.text}
                          {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                        </a>
                      ) : (
                        <>
                          {secondaryButton.text}
                          {secondaryButton.icon && <secondaryButton.icon className="w-5 h-5" />}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {children}
            </div>
          </div>
        </div>
      </section>
    );
  }
);
Hero.displayName = "Hero";

export { Hero };
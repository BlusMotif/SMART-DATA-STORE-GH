import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Star } from "lucide-react";

interface TestimonialItem {
  id: string;
  name: string;
  role?: string;
  company?: string;
  content: string;
  rating?: number;
  avatar?: string;
  initials?: string;
}

interface TestimonialsProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  description?: string;
  testimonials: TestimonialItem[];
  columns?: 1 | 2 | 3;
  variant?: "default" | "minimal" | "cards" | "carousel";
  showRating?: boolean;
  background?: "default" | "muted" | "gradient";
}

const Testimonials = React.forwardRef<HTMLElement, TestimonialsProps>(
  ({
    className,
    title,
    subtitle,
    description,
    testimonials,
    columns = 3,
    variant = "default",
    showRating = false,
    background = "default",
    ...props
  }, ref) => {
    const backgroundClasses = {
      default: "",
      muted: "bg-muted/20",
      gradient: "bg-gradient-to-br from-primary/5 via-background to-secondary/5",
    };

    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    };

    const renderStars = (rating: number) => {
      return Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "w-4 h-4",
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          )}
        />
      ));
    };

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

            <div className="space-y-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="text-center">
                  <blockquote className="text-lg italic text-muted-foreground mb-4">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center justify-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>
                        {testimonial.initials || testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      {(testimonial.role || testimonial.company) && (
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                          {testimonial.role && testimonial.company && ", "}
                          {testimonial.company}
                        </div>
                      )}
                    </div>
                  </div>
                  {showRating && testimonial.rating && (
                    <div className="flex justify-center mt-2">
                      {renderStars(testimonial.rating)}
                    </div>
                  )}
                </div>
              ))}
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
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id} className="hover:shadow-lg transition-shadow border-0 bg-white dark:bg-black/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    {showRating && testimonial.rating && (
                      <div className="flex mb-4">
                        {renderStars(testimonial.rating)}
                      </div>
                    )}
                    <blockquote className="text-lg italic text-muted-foreground mb-6">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>
                          {testimonial.initials || testimonial.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        {(testimonial.role || testimonial.company) && (
                          <div className="text-sm text-muted-foreground">
                            {testimonial.role}
                            {testimonial.role && testimonial.company && ", "}
                            {testimonial.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white/30 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-8 border">
                {showRating && testimonial.rating && (
                  <div className="flex mb-4">
                    {renderStars(testimonial.rating)}
                  </div>
                )}
                <blockquote className="text-lg italic text-muted-foreground mb-6">
                  "{testimonial.content}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.initials || testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    {(testimonial.role || testimonial.company) && (
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                        {testimonial.role && testimonial.company && ", "}
                        {testimonial.company}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
);
Testimonials.displayName = "Testimonials";

export { Testimonials };
export type { TestimonialItem };
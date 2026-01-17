import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Separator } from "./separator";
import { LucideIcon } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  icon: LucideIcon;
  href: string;
  label: string;
}

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  brand?: {
    name: string;
    logo?: string;
    description?: string;
  };
  sections?: FooterSection[];
  socialLinks?: SocialLink[];
  newsletter?: {
    title: string;
    description: string;
    placeholder: string;
    buttonText: string;
    onSubscribe?: (email: string) => void;
  };
  bottomText?: string;
  variant?: "default" | "minimal" | "centered";
  background?: "default" | "muted" | "dark";
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({
    className,
    brand,
    sections = [],
    socialLinks = [],
    newsletter,
    bottomText,
    variant = "default",
    background = "default",
    ...props
  }, ref) => {
    const backgroundClasses = {
      default: "bg-background border-t",
      muted: "bg-muted/20 border-t",
      dark: "bg-slate-900 text-white border-t border-slate-800",
    };

    const [email, setEmail] = React.useState("");

    const handleSubscribe = (e: React.FormEvent) => {
      e.preventDefault();
      if (newsletter?.onSubscribe && email) {
        newsletter.onSubscribe(email);
        setEmail("");
      }
    };

    if (variant === "minimal") {
      return (
        <footer
          ref={ref}
          className={cn("py-8", backgroundClasses[background], className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                {brand?.logo && (
                  <img src={brand.logo} alt={brand.name} className="w-8 h-8" />
                )}
                {brand?.name && (
                  <span className="font-semibold">{brand.name}</span>
                )}
              </div>

              {socialLinks.length > 0 && (
                <div className="flex items-center gap-4">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <Button
                        key={social.label}
                        variant="ghost"
                        size="sm"
                        asChild
                        className="w-9 h-9 p-0"
                      >
                        <a
                          href={social.href}
                          aria-label={social.label}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon className="w-4 h-4" />
                        </a>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            {bottomText && (
              <>
                <Separator className="my-6" />
                <div className="text-center text-sm text-muted-foreground">
                  {bottomText}
                </div>
              </>
            )}
          </div>
        </footer>
      );
    }

    if (variant === "centered") {
      return (
        <footer
          ref={ref}
          className={cn("py-12", backgroundClasses[background], className)}
          {...props}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {brand && (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {brand.logo && (
                    <img src={brand.logo} alt={brand.name} className="w-10 h-10" />
                  )}
                  {brand.name && (
                    <span className="text-xl font-bold">{brand.name}</span>
                  )}
                </div>
                {brand.description && (
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {brand.description}
                  </p>
                )}
              </div>
            )}

            {sections.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                {sections.map((section) => (
                  <div key={section.title}>
                    <h3 className="font-semibold mb-4">{section.title}</h3>
                    <ul className="space-y-2">
                      {section.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            {...(link.external && {
                              target: "_blank",
                              rel: "noopener noreferrer"
                            })}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {socialLinks.length > 0 && (
              <div className="flex items-center justify-center gap-4 mb-8">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Button
                      key={social.label}
                      variant="ghost"
                      size="sm"
                      asChild
                      className="w-10 h-10 p-0"
                    >
                      <a
                        href={social.href}
                        aria-label={social.label}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    </Button>
                  );
                })}
              </div>
            )}

            {bottomText && (
              <div className="text-sm text-muted-foreground">
                {bottomText}
              </div>
            )}
          </div>
        </footer>
      );
    }

    // Default variant
    return (
      <footer
        ref={ref}
        className={cn("py-12", backgroundClasses[background], className)}
        {...props}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            {brand && (
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  {brand.logo && (
                    <img src={brand.logo} alt={brand.name} className="w-8 h-8" />
                  )}
                  {brand.name && (
                    <span className="text-lg font-bold">{brand.name}</span>
                  )}
                </div>
                {brand.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {brand.description}
                  </p>
                )}
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-2">
                    {socialLinks.map((social) => {
                      const Icon = social.icon;
                      return (
                        <Button
                          key={social.label}
                          variant="ghost"
                          size="sm"
                          asChild
                          className="w-9 h-9 p-0"
                        >
                          <a
                            href={social.href}
                            aria-label={social.label}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Icon className="w-4 h-4" />
                          </a>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Link Sections */}
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        {...(link.external && {
                          target: "_blank",
                          rel: "noopener noreferrer"
                        })}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter Section */}
            {newsletter && (
              <div className="md:col-span-2 lg:col-span-1">
                <h3 className="font-semibold mb-4">{newsletter.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {newsletter.description}
                </p>
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <input
                    type="email"
                    placeholder={newsletter.placeholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                  <Button type="submit" size="sm" className="w-full">
                    {newsletter.buttonText}
                  </Button>
                </form>
              </div>
            )}
          </div>

          <Separator className="my-8" />

          {bottomText && (
            <div className="text-center text-sm text-muted-foreground">
              {bottomText}
            </div>
          )}
        </div>
      </footer>
    );
  }
);
Footer.displayName = "Footer";

export { Footer };
export type { FooterLink, FooterSection, SocialLink };
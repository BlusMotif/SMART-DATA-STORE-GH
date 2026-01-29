import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("Theme toggle clicked. Current theme:", theme, "New theme:", newTheme);
    setTheme(newTheme);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      data-testid="button-theme-toggle"
      className={cn("h-8 w-8", className)}
    >
      {theme === "light" ? (
        <Sun className="h-4 w-4 transition-all" />
      ) : (
        <Moon className="h-4 w-4 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

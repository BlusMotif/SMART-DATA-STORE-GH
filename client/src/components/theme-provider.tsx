import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "app-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const storedTheme = localStorage.getItem(storageKey) as Theme;
        // Convert legacy "system" theme to "light"
        if (storedTheme === "system") {
          localStorage.setItem(storageKey, "light");
          return "light";
        }
        return storedTheme || defaultTheme;
      }
      return defaultTheme;
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return defaultTheme;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    console.log("Applied theme:", theme, "Classes on root:", root.classList.toString());
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        console.log("Setting theme to:", theme);
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(storageKey, theme);
          console.log("Saved theme to localStorage:", theme);
        }
        setTheme(theme);
      } catch (error) {
        console.error("Error setting theme:", error);
        setTheme(theme);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

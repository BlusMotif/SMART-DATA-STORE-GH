/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../shared/**/*.{ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/lib/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem", /* 9px */
        md: ".375rem", /* 6px */
        sm: ".1875rem", /* 3px */
      },
      colors: {
        // Flat / base colors (regular buttons)
        background: "#FFFFFF",
        foreground: "#0F0F0F",
        border: "#E5E5E5",
        input: "#F2F2F2",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F0F0F",
          border: "#E5E5E5",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F0F0F",
          border: "#E5E5E5",
        },
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
          border: "#2563EB",
        },
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F0F0F",
          border: "#CBD5E1",
        },
        muted: {
          DEFAULT: "#F8FAFC",
          foreground: "#64748B",
          border: "#E2E8F0",
        },
        accent: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F0F0F",
          border: "#CBD5E1",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
          border: "#DC2626",
        },
        sidebar: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F0F0F",
          primary: "#3B82F6",
          "primary-foreground": "#FFFFFF",
          accent: "#F8FAFC",
          "accent-foreground": "#0F0F0F",
          border: "#E5E5E5",
          ring: "#3B82F6",
        },
        ring: "#3B82F6",
        chart: {
          "1": "#3B82F6",
          "2": "#10B981",
          "3": "#F59E0B",
          "4": "#EF4444",
          "5": "#8B5CF6",
        },
        dark: {
          background: "#000000",
          foreground: "#F8F8F8",
          border: "#333333",
          input: "#1A1A1A",
          card: {
            DEFAULT: "#111111",
            foreground: "#F8F8F8",
            border: "#333333",
          },
          popover: {
            DEFAULT: "#111111",
            foreground: "#F8F8F8",
            border: "#333333",
          },
          primary: {
            DEFAULT: "#60A5FA",
            foreground: "#000000",
            border: "#3B82F6",
          },
          secondary: {
            DEFAULT: "#1A1A1A",
            foreground: "#F8F8F8",
            border: "#333333",
          },
          muted: {
            DEFAULT: "#0A0A0A",
            foreground: "#A1A1AA",
            border: "#333333",
          },
          accent: {
            DEFAULT: "#1A1A1A",
            foreground: "#F8F8F8",
            border: "#333333",
          },
          destructive: {
            DEFAULT: "#EF4444",
            foreground: "#FFFFFF",
            border: "#DC2626",
          },
          sidebar: {
            DEFAULT: "#000000",
            foreground: "#F8F8F8",
            primary: "#60A5FA",
            "primary-foreground": "#000000",
            accent: "#0A0A0A",
            "accent-foreground": "#F8F8F8",
            border: "#333333",
            ring: "#60A5FA",
          },
          ring: "#60A5FA",
          chart: {
            "1": "#60A5FA",
            "2": "#34D399",
            "3": "#FBBF24",
            "4": "#F87171",
            "5": "#A78BFA",
          },
        },
      },
      fontFamily: {
        sans: ["'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"],
        serif: ["'Inter', serif"],
        mono: ["'JetBrains Mono', 'Fira Code', monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
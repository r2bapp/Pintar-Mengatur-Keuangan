import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Remap brand tokens to green palette so existing classnames keep working
      colors: {
        // "navy" becomes deep green family (brand primary)
        navy: {
          50: "#e6f0e6",
          100: "#cfe3cf",
          200: "#a6c7a6",
          300: "#7cab7c",
          400: "#4f8f50",
          500: "#2d6f2f",
          600: "#1f5e21",
          700: "#154a17",
          800: "#0f3a11",
          900: "#0a2d0c",
          950: "#004d00", // requested deep green anchor
        },
        // "sage" becomes mid green family (secondary)
        sage: {
          50: "#eaf5ef",
          100: "#d4ebdf",
          200: "#a7d7c0",
          300: "#7ac4a2",
          400: "#4ebf8f",
          500: "#2f9d72",
          600: "#23855f",
          700: "#1b6a4d",
          800: "#15533c",
          900: "#0f3d2c",
        },
        // "gold" becomes light green/teal accent
        gold: {
          50: "#edf8f6",
          100: "#d7f0ea",
          200: "#bfe6dd",
          300: "#a7dccf",
          400: "#8fd2c2",
          500: "#77c7b4",
          600: "#66b3a1", // requested
          700: "#4c9785",
          800: "#37756a",
          900: "#295a52",
        },
        // keep rose for error/destructive
        rose: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Chart colors (hooked to CSS variables in globals.css)
        "chart-1": "hsl(var(--chart-1))",
        "chart-2": "hsl(var(--chart-2))",
        "chart-3": "hsl(var(--chart-3))",
        "chart-4": "hsl(var(--chart-4))",
        "chart-5": "hsl(var(--chart-5))",
        "chart-6": "hsl(var(--chart-6))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

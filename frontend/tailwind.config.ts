import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem" },
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Luxury palette
        cream: {
          DEFAULT: "hsl(var(--cream))",
          50: "#FFFDF8",
          100: "#FBF7EE",
          200: "#F5EEDC",
          300: "#EFE3C5",
          400: "#E5D2A7",
        },
        roseGold: {
          DEFAULT: "hsl(var(--rose-gold))",
          50: "#FBEEEA",
          100: "#F5DDD3",
          200: "#EBB7A5",
          300: "#D89077",
          400: "#C77D63",
          500: "#B76E54",
          600: "#9A5944",
        },
        softPink: {
          DEFAULT: "hsl(var(--soft-pink))",
          50: "#FFF5F5",
          100: "#FFE8E8",
          200: "#FFCCD0",
          300: "#FBA6AE",
          400: "#F18B96",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          50: "#FBF4DC",
          100: "#F4E3A3",
          200: "#E9CC70",
          300: "#D9B14B",
          400: "#C19531",
          500: "#A07A1F",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          50: "#F4F2EE",
          900: "#0F0F0E",
          950: "#070707",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
      letterSpacing: {
        widest: "0.22em",
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(178,134,99,0.18)",
        luxe: "0 12px 40px -16px rgba(15,15,14,0.25)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out both",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;

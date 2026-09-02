import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Soft-modern design system.
 *
 * Warm neutral paper, one confident coral accent, generous radii and diffuse
 * shadows. Semantic tokens (background/foreground/card/…) are HSL variables set
 * in globals.css so light and dark are one definition, not two palettes.
 *
 * Raw palette scales are exposed too, but UI should reach for the semantic
 * tokens — that is what keeps 51 pages consistent.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        surface: { DEFAULT: "hsl(var(--surface))", foreground: "hsl(var(--surface-foreground))" },

        /* Raw scales — prefer the semantic tokens above. */
        clay: {
          50: "#FDFCFB", 100: "#F7F4F1", 200: "#EDE7E1", 300: "#DDD4CB",
          400: "#BCAEA1", 500: "#93826F", 600: "#6E5F50",
          700: "#4E4236", 800: "#332B23", 900: "#1C1712", 950: "#110E0B",
        },
        coral: {
          50: "#FEF3F2", 100: "#FDE5E3", 200: "#FBCFCB", 300: "#F7ADA7",
          400: "#F08A82", 500: "#E8615D", 600: "#D2453F",
          700: "#B03430", 800: "#912E2C", 900: "#792B2A",
        },

        /**
         * Legacy colour names from the previous palette, remapped onto the new
         * one so `text-roseGold`, `bg-cream-50` and `text-ink` keep working in
         * the pages not yet migrated — and pick up the new look automatically.
         */
        roseGold: {
          DEFAULT: "hsl(var(--accent))",
          50: "#FEF3F2", 100: "#FDE5E3", 200: "#FBCFCB", 300: "#F7ADA7",
          400: "#F08A82", 500: "#E8615D", 600: "#D2453F", 700: "#B03430",
        },
        cream: {
          DEFAULT: "hsl(var(--surface))",
          50: "#FDFCFB", 100: "#F7F4F1", 200: "#EDE7E1", 300: "#DDD4CB", 400: "#BCAEA1",
        },
        ink: {
          DEFAULT: "hsl(var(--foreground))",
          50: "#F7F4F1", 900: "#1C1712", 950: "#110E0B",
        },
        gold: {
          DEFAULT: "hsl(var(--warning))",
          50: "#FEF6E7", 100: "#FCE9C2", 200: "#F7D389", 300: "#EDB84E",
          400: "#DCA02B", 500: "#B57E1B",
        },
        softPink: {
          DEFAULT: "#FDE5E3",
          50: "#FEF3F2", 100: "#FDE5E3", 200: "#FBCFCB", 300: "#F7ADA7", 400: "#F08A82",
        },

        sage: {
          50: "#F3F7F3", 100: "#E3EDE3", 200: "#C7DAC8", 300: "#9DBE9F",
          400: "#6F9C73", 500: "#4F7E54", 600: "#3C6441",
        },
      },

      borderRadius: {
        "4xl": "2rem",
        "3xl": "1.5rem",
        "2xl": "1.125rem",
        xl: "0.875rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 3px)",
        sm: "calc(var(--radius) - 5px)",
      },

      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },

      fontSize: {
        // Display sizes carry their own tight leading and tracking.
        "display-xl": ["clamp(2.75rem, 6vw, 4.5rem)", { lineHeight: "1.02", letterSpacing: "-0.035em" }],
        "display-lg": ["clamp(2.25rem, 4.5vw, 3.25rem)", { lineHeight: "1.06", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.25rem)", { lineHeight: "1.12", letterSpacing: "-0.025em" }],
        "display-sm": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
      },

      boxShadow: {
        // Diffuse and warm — the soft-modern signature.
        xs: "0 1px 2px 0 rgb(28 23 18 / 0.04)",
        soft: "0 2px 8px -2px rgb(28 23 18 / 0.06), 0 4px 20px -4px rgb(28 23 18 / 0.05)",
        lift: "0 4px 12px -4px rgb(28 23 18 / 0.08), 0 12px 32px -8px rgb(28 23 18 / 0.10)",
        float: "0 8px 24px -8px rgb(28 23 18 / 0.12), 0 24px 56px -16px rgb(28 23 18 / 0.14)",
        accent: "0 8px 24px -8px rgb(232 97 93 / 0.35)",
        inner: "inset 0 1px 2px 0 rgb(28 23 18 / 0.05)",
      },

      spacing: { 18: "4.5rem", 22: "5.5rem" },

      transitionTimingFunction: {
        // Decelerating ease used for every hover and reveal in the system.
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },

      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.97)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.8s infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;

import type { Config } from "tailwindcss";

/**
 * Veloxa's palette is deliberately nothing like Xperience Delivery's cream and
 * rose gold — deep navy, signal blue and a velocity cyan read as infrastructure,
 * not boutique.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060B18",
          900: "#0B1220",
          800: "#131C30",
          700: "#1D2942",
          600: "#2B3A5C",
        },
        signal: {
          50: "#EEF4FF",
          100: "#D9E6FF",
          300: "#8FB4FF",
          500: "#2563EB",
          600: "#1D4FD7",
          700: "#1740B0",
        },
        velocity: {
          400: "#22D3EE",
          500: "#06B6D4",
        },
        mist: {
          50: "#F7F9FC",
          100: "#EEF2F8",
          200: "#DCE3ED",
          400: "#94A3B8",
          600: "#526180",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["'Space Grotesk'", "'Inter'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        lift: "0 20px 50px -20px rgba(6, 11, 24, 0.35)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.25), 0 20px 60px -25px rgba(37, 99, 235, 0.6)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        dash: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(1.35)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.5s ease-out both",
        dash: "dash 3s ease-out forwards",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

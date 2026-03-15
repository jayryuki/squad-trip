/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["DM Sans", ...fontFamily.sans],
        display: ["Sora", ...fontFamily.sans],
        mono:  ["JetBrains Mono", ...fontFamily.mono],
      },
      colors: {
        brand: {
          DEFAULT: "hsl(var(--color-brand))",
          dim:     "hsl(var(--color-brand-dim))",
        },
        accent: "hsl(var(--color-accent))",
        coral:  "hsl(var(--color-coral))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised:  "hsl(var(--surface-raised))",
          overlay: "hsl(var(--surface-overlay))",
        },
        border: {
          DEFAULT: "hsl(var(--border))",
          strong:  "hsl(var(--border-strong))",
        },
      },
      borderRadius: {
        sm:   "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      animation: {
        "slide-up":   "slideUp 0.3s ease-out",
        "fade-in":    "fadeIn 0.2s ease-out",
        "scale-in":   "scaleIn 0.2s ease-out",
        "spin-slow":  "spin 3s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        slideUp:    { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn:     { from: { opacity: "0" }, to: { opacity: "1" } },
        scaleIn:    { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        pulseGlow:  { "0%,100%": { boxShadow: "0 0 16px hsl(var(--color-brand)/0.2)" }, "50%": { boxShadow: "0 0 32px hsl(var(--color-brand)/0.5)" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

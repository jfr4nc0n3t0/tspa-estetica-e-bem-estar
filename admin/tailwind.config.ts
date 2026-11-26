import type { Config } from "tailwindcss";

const color = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: color("background"),
        foreground: color("foreground"),
        card: color("card"),
        border: color("border"),
        input: color("input"),
        muted: { DEFAULT: color("muted"), foreground: color("muted-foreground") },
        primary: { DEFAULT: color("primary"), foreground: color("primary-foreground") },
        accent: { DEFAULT: color("accent"), foreground: color("accent-foreground") },
        danger: { DEFAULT: color("danger"), foreground: color("danger-foreground") },
        // Paleta TSpa (Identidade Visual 2026)
        sage: color("sage"),
        graphite: color("graphite"),
        taupe: color("taupe"),
        marfim: color("marfim"),
        sand: color("sand"),
        nude: color("nude"),
        forest: color("forest"),
        terracotta: color("terracotta"),
        ochre: color("ochre"),
        dusk: color("dusk"),
        "chart-in": color("chart-in"),
        "chart-out": color("chart-out"),
      },
      fontFamily: {
        sans: ["Satoshi", "Inter", "system-ui", "sans-serif"],
        serif: ["Golden", "'Cormorant Garamond'", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;

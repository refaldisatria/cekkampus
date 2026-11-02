import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00236f", "primary-container": "#1e3a8a", "on-primary": "#ffffff",
        secondary: "#0051d5", "secondary-fixed": "#dbe1ff", "on-secondary-fixed": "#00174b",
        tertiary: "#00311f", "tertiary-container": "#004a31", "on-tertiary": "#ffffff",
        "tertiary-fixed": "#6ffbbe", "tertiary-fixed-dim": "#4edea3", "on-tertiary-container": "#27c38a",
        error: "#ba1a1a", "error-container": "#ffdad6", "on-error-container": "#93000a",
        surface: "#f8f9ff", "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff", "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff", "on-surface": "#0b1c30",
        "on-surface-variant": "#444651", outline: "#757682", "outline-variant": "#c5c5d3",
      },
      fontFamily: {
        headline: ["var(--font-jakarta)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

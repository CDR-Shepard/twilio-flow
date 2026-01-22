import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f5ff",
          100: "#dce7ff",
          200: "#b9cffc",
          300: "#8aa9f7",
          400: "#6286f0",
          500: "#3c63e6",
          600: "#2d4bc2",
          700: "#243b99",
          800: "#1f327a",
          900: "#1d2e63"
        },
        accent: {
          50: "#ecfdf3",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b"
        }
      }
    }
  },
  plugins: []
};

export default config;

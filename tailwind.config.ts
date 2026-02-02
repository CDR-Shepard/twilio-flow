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
          50: "#fff9ed",
          100: "#ffefcf",
          200: "#fbdc99",
          300: "#f8c763",
          400: "#f4bf4f",
          500: "#e0a51d",
          600: "#c28711",
          700: "#9c690c",
          800: "#7a520a",
          900: "#5f4008"
        }
      }
    }
  },
  plugins: []
};

export default config;

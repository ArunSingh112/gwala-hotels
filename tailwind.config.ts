import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm, grounded palette: marigold and saffron accents, cream
        // backgrounds, deep maroon text (see design spec, Visual direction).
        marigold: {
          50: "#fff9eb",
          100: "#ffefc6",
          200: "#ffdd88",
          300: "#ffc54a",
          400: "#ffab1f",
          500: "#f98807",
          600: "#dd6202",
          700: "#b74206",
          800: "#94320c",
          900: "#7a2a0d",
        },
        maroon: {
          50: "#fdf3f3",
          100: "#fbe5e5",
          200: "#f8d0d0",
          300: "#f2afaf",
          400: "#e88080",
          500: "#da5656",
          600: "#c53939",
          700: "#a52c2c",
          800: "#892828",
          900: "#5c1a1a",
          950: "#3d0f0f",
        },
        cream: {
          50: "#fdfbf7",
          100: "#faf5ec",
          200: "#f4e9d8",
          300: "#ecd9bc",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ivory: "#F8F2E9",
          cream: "#35140D",
          warm: "#28100B",
          sand: "#482016",
          mocha: "#7A2A13",
          "mocha-dark": "#2E100A",
          "mocha-light": "#A14424",
          "mocha-muted": "#D2BDB2",
          gold: "#C49A50",
          "gold-light": "#E6C98F",
          "gold-dark": "#D9B66F",
          "gold-soft": "#422014",
          rose: "#963819",
          "rose-light": "#542518",
        },
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(15, 5, 2, 0.32)",
        card: "0 8px 30px rgba(15, 5, 2, 0.42)",
        gold: "0 4px 24px rgba(196, 154, 80, 0.24)",
        glass: "0 8px 32px 0 rgba(15, 5, 2, 0.36)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;

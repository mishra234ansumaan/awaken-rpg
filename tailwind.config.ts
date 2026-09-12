import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: { 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706" },
        parchment: "#fef3c7",
        dungeon: { 900: "#0a0612", 800: "#130d22", 700: "#1c1333", 600: "#261a44" },
        hp: { red: "#ef4444", green: "#22c55e", blue: "#3b82f6", purple: "#a855f7" },
      },
      fontFamily: {
        fantasy: ['"Cinzel"', "serif"],
        body: ['"Inter"', "sans-serif"],
      },
      animation: {
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
        "coin-spin": "coinSpin 0.6s ease-out",
        "xp-fill": "xpFill 1s ease-out",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(251,191,36,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(251,191,36,0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        coinSpin: {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
          "50%": { transform: "scale(1.3) rotate(180deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(360deg)", opacity: "1" },
        },
        xpFill: {
          "0%": { width: "0%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
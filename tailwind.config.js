/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app.js"],
  theme: {
    extend: {
      colors: {
        paper: "#f8fafc",
        surface: "#ffffff",
        canvas: "#f1f5f9",
        ink: "#0f172a",
        muted: "#64748b",
        soft: "#94a3b8",
        line: "#e2e8f0",
        accent: "#f97316",
        aqua: "#14b8a6",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 10px 24px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.03)",
        soft: "0 6px 16px rgba(15, 23, 42, 0.05), 0 1px 4px rgba(15, 23, 42, 0.03)",
        glow: "0 10px 24px rgba(249, 115, 22, 0.1)",
      },
    },
  },
  plugins: [],
};

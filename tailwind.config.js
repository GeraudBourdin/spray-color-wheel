/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app.js"],
  theme: {
    extend: {
      colors: {
        paper: "#fffaf5",
        surface: "#ffffff",
        canvas: "#f8f4ef",
        ink: "#0f172a",
        muted: "#64748b",
        soft: "#94a3b8",
        line: "#e2e8f0",
        accent: "#f97316",
        aqua: "#14b8a6",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 24px 60px rgba(15, 23, 42, 0.12)",
        soft: "0 12px 30px rgba(15, 23, 42, 0.09)",
        glow: "0 18px 48px rgba(249, 115, 22, 0.18)",
      },
    },
  },
  plugins: [],
};

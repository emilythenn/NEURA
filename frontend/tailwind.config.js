/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        "bimb-red": "#d31145",
        "bimb-darkred": "#a10b31",
        "bimb-peach": "#fff5f7",
        "bimb-gold": "#f9bf15",
      },
    },
  },
  plugins: [],
}

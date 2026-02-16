/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: 'rgb(var(--theme-primary) / <alpha-value>)',
          secondary: 'rgb(var(--theme-secondary) / <alpha-value>)',
          accent: 'rgb(var(--theme-accent) / <alpha-value>)',
          background: 'rgb(var(--theme-background) / <alpha-value>)',
          text: 'rgb(var(--theme-text) / <alpha-value>)',
          cardBg: 'rgb(var(--theme-card-bg) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}
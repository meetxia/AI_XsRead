/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rose-primary': '#d95468',
        'rose-secondary': '#ed7654',
        'rose-accent': '#FFBAAC',
        'elegant-primary': '#759148',
        'vintage-primary': '#FA8F79',
        'vintage-secondary': '#6BA16D',
      },
      fontFamily: {
        'serif': ['Noto Serif SC', 'serif'],
      },
      lineHeight: {
        'reading': '2.2',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        dark: {
          bg: '#111827',
          card: '#1F2937',
          border: '#374151'
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class'
}


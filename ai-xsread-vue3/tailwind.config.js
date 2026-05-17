/** @type {import('tailwindcss').Config} */
// MOMO小说 V1.0 重构版
// A 主题（奶油杂志风）：覆盖首页、详情、书架、发现、搜索、个人中心、登录、注册、历史
// D 主题（极简内容流）：覆盖阅读页（在 ReadingPage 内通过 [data-bg] 自定义）
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── A 主题：奶油杂志风（主） ───
        cream: {
          50:  '#FDFAF6',
          100: '#FAF6F1',
          200: '#F2EAE0',
          300: '#E5D6C4',
        },
        clay: {
          400: '#C7A07E',
          500: '#A87A56',
          600: '#8B5E3C',
          700: '#5C3B25',
        },
        ink: {
          900: '#2A2520',
          700: '#5A4F47',
          500: '#8C7F76',
          300: '#B5A89F',
        },
        moss: {
          500: '#6B7B5A',
          600: '#4F5C42',
        },
        cinnabar: {
          500: '#B8473C',
        },
        night: {
          900: '#1A1714',
          800: '#241F1B',
          700: '#2F2925',
          600: '#3D3530',
        },

        // ─── D 主题：阅读页极简（独立 namespace 避免冲突） ───
        stone: {
          50:  '#FAFAF9',
          100: '#F4F4F2',
          200: '#E8E7E4',
          300: '#CAC9C5',
          500: '#7A7975',
          700: '#3F3E3B',
          900: '#1A1917',
        },
        accent: {
          500: '#FF5C39',
          600: '#E54A2A',
        },
      },
      fontFamily: {
        serif:   ['"Noto Serif SC"', '"Source Han Serif"', 'Georgia', 'serif'],
        sans:    ['"Inter"', '"PingFang SC"', '"HarmonyOS Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        reading: ['"Noto Serif SC"', '"Source Han Serif"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'cream':    '0 1px 2px rgba(168, 122, 86, 0.04), 0 8px 24px rgba(168, 122, 86, 0.06)',
        'cream-lg': '0 4px 12px rgba(168, 122, 86, 0.08), 0 16px 40px rgba(168, 122, 86, 0.10)',
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-in-up': 'fade-in-up .35s cubic-bezier(.2,.8,.2,1)',
      },
    },
  },
  plugins: [],
}

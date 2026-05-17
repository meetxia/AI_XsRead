// 文字之境 · A 主题（奶油杂志风）Tailwind 配置
// 用于：首页、书架、详情、搜索、发现、个人中心、登录、注册、浏览记录
window.tailwind = window.tailwind || {};
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"PingFang SC"', '"HarmonyOS Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'cream':    '0 1px 2px rgba(168, 122, 86, 0.04), 0 8px 24px rgba(168, 122, 86, 0.06)',
        'cream-lg': '0 4px 12px rgba(168, 122, 86, 0.08), 0 16px 40px rgba(168, 122, 86, 0.10)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: { shimmer: 'shimmer 1.6s infinite' },
    }
  }
};

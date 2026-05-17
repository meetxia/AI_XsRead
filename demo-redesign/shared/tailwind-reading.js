// 文字之境 · D 主题（极简内容流）Tailwind 配置
// 用于：阅读页（核心沉浸场景）
window.tailwind = window.tailwind || {};
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 极简
        stone: {
          50:  '#FAFAF9',
          100: '#F4F4F2',
          200: '#E8E7E4',
          300: '#CAC9C5',
          500: '#7A7975',
          700: '#3F3E3B',
          900: '#1A1917',
        },
        night: {
          900: '#0A0A0A',
          800: '#141414',
          700: '#1F1F1F',
          600: '#2A2A2A',
          500: '#3A3A3A',
        },
        accent: {
          500: '#FF5C39',
          600: '#E54A2A',
        },
        // 阅读模式护眼色
        sepia: {
          50: '#F4ECD8',
          100: '#EBDDC0',
          900: '#3E2C1B',
        },
        eye: {
          50: '#CCE0CC',
          900: '#1F2F22',
        }
      },
      fontFamily: {
        serif:   ['"Source Serif 4"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans:    ['"Inter"', '"PingFang SC"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        reading: ['"Noto Serif SC"', '"Source Han Serif"', 'Georgia', 'serif'],
      },
      letterSpacing: { tightest: '-0.04em' },
    }
  }
};

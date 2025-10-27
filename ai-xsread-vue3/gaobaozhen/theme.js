// 文字之境 - 主题系统
// 三套配色方案，每套都有明暗两种模式

const themeConfig = {
    // 主题1：玫瑰温情（默认）
    rose: {
        light: {
            name: '玫瑰温情',
            primary: '#d95468',
            secondary: '#ed7654',
            accent: '#FFBAAC',
            bg: 'linear-gradient(to bottom right, #fef7f3, #fdf4f5, #fce7f3)',
            bgCard: '#ffffff',
            textPrimary: '#1a202c',
            textSecondary: '#4a5568',
            textMuted: '#718096',
            border: '#e2e8f0',
            shadow: 'rgba(0, 0, 0, 0.1)',
        },
        dark: {
            name: '玫瑰温情·夜',
            primary: '#d95468',
            secondary: '#ed7654',
            accent: '#FFBAAC',
            bg: 'linear-gradient(to bottom right, #1a1a2e, #16213e, #0f172a)',
            bgCard: '#1e293b',
            textPrimary: '#f1f5f9',
            textSecondary: '#cbd5e1',
            textMuted: '#94a3b8',
            border: '#334155',
            shadow: 'rgba(0, 0, 0, 0.4)',
        }
    },
    
    // 主题2：雅致高级（图1配色）
    elegant: {
        light: {
            name: '雅致高级',
            primary: '#759148',
            secondary: '#FFBAAC',
            accent: '#E9EDF0',
            bg: 'linear-gradient(to bottom right, #f5f7f3, #fef7f3, #E9EDF0)',
            bgCard: '#ffffff',
            textPrimary: '#1a202c',
            textSecondary: '#4a5568',
            textMuted: '#718096',
            border: '#e2e8f0',
            shadow: 'rgba(0, 0, 0, 0.1)',
        },
        dark: {
            name: '雅致高级·夜',
            primary: '#8ba856',
            secondary: '#FFBAAC',
            accent: '#4a5568',
            bg: 'linear-gradient(to bottom right, #0f1419, #1a1f2e, #1e2530)',
            bgCard: '#1e293b',
            textPrimary: '#f1f5f9',
            textSecondary: '#cbd5e1',
            textMuted: '#94a3b8',
            border: '#334155',
            shadow: 'rgba(0, 0, 0, 0.4)',
        }
    },
    
    // 主题3：文物古韵（图2配色）
    vintage: {
        light: {
            name: '文物古韵',
            primary: '#FA8F79',
            secondary: '#6BA16D',
            accent: '#A2BB6A',
            tertiary: '#DBCF9B',
            highlight: '#CC99D3',
            bg: 'linear-gradient(to bottom right, #fef9f3, #fef5f0, #f8f5ed)',
            bgCard: '#ffffff',
            textPrimary: '#1a202c',
            textSecondary: '#4a5568',
            textMuted: '#718096',
            border: '#e2e8f0',
            shadow: 'rgba(0, 0, 0, 0.1)',
        },
        dark: {
            name: '文物古韵·夜',
            primary: '#FA8F79',
            secondary: '#6BA16D',
            accent: '#A2BB6A',
            tertiary: '#8b7355',
            highlight: '#CC99D3',
            bg: 'linear-gradient(to bottom right, #1a1410, #1e1b16, #2a2419)',
            bgCard: '#2d2416',
            textPrimary: '#f1f5f9',
            textSecondary: '#cbd5e1',
            textMuted: '#94a3b8',
            border: '#3d3428',
            shadow: 'rgba(0, 0, 0, 0.5)',
        }
    }
};

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'rose';
        this.currentMode = localStorage.getItem('mode') || 'light';
        
        // 验证主题和模式是否有效
        if (!themeConfig[this.currentTheme]) {
            console.warn('无效的主题:', this.currentTheme, '使用默认主题');
            this.currentTheme = 'rose';
        }
        if (!themeConfig[this.currentTheme][this.currentMode]) {
            console.warn('无效的模式:', this.currentMode, '使用默认模式');
            this.currentMode = 'light';
        }
        
        this.init();
    }
    
    init() {
        this.applyTheme();
        this.setupListeners();
    }
    
    applyTheme() {
        // 安全检查
        if (!themeConfig[this.currentTheme] || !themeConfig[this.currentTheme][this.currentMode]) {
            console.error('主题配置错误，使用默认配置');
            this.currentTheme = 'rose';
            this.currentMode = 'light';
        }
        
        const theme = themeConfig[this.currentTheme][this.currentMode];
        const root = document.documentElement;
        
        // 设置 CSS 变量
        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-secondary', theme.secondary);
        root.style.setProperty('--color-accent', theme.accent);
        root.style.setProperty('--color-bg-card', theme.bgCard);
        root.style.setProperty('--color-text-primary', theme.textPrimary);
        root.style.setProperty('--color-text-secondary', theme.textSecondary);
        root.style.setProperty('--color-text-muted', theme.textMuted);
        root.style.setProperty('--color-border', theme.border);
        root.style.setProperty('--color-shadow', theme.shadow);
        
        if (theme.tertiary) {
            root.style.setProperty('--color-tertiary', theme.tertiary);
        }
        if (theme.highlight) {
            root.style.setProperty('--color-highlight', theme.highlight);
        }
        
        // 设置背景渐变
        document.body.style.background = theme.bg;
        
        // 添加主题和模式类
        document.body.className = `theme-${this.currentTheme} mode-${this.currentMode}`;
        
        // 更新主题名称显示
        setTimeout(() => {
            this.updateThemeDisplay();
        }, 100);
        
        // 保存到 localStorage
        localStorage.setItem('theme', this.currentTheme);
        localStorage.setItem('mode', this.currentMode);
        
        // 触发自定义事件通知其他组件
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.currentTheme, mode: this.currentMode } 
        }));
    }
    
    setTheme(themeName) {
        if (themeConfig[themeName]) {
            this.currentTheme = themeName;
            this.applyTheme();
        }
    }
    
    toggleMode() {
        this.currentMode = this.currentMode === 'light' ? 'dark' : 'light';
        this.applyTheme();
    }
    
    setMode(mode) {
        if (mode === 'light' || mode === 'dark') {
            this.currentMode = mode;
            this.applyTheme();
        }
    }
    
    updateThemeDisplay() {
        const theme = themeConfig[this.currentTheme][this.currentMode];
        
        // 更新所有主题名称显示元素
        const themeNameEls = document.querySelectorAll('[id^="current-theme-name"]');
        themeNameEls.forEach(el => {
            if (el) {
                el.textContent = theme.name;
            }
        });
        
        // 更新主题选择器的选中状态
        document.querySelectorAll('[data-theme]').forEach(el => {
            if (el.dataset.theme === this.currentTheme) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
        
        // 更新所有暗色模式按钮图标
        const updateIcon = (btn) => {
            if (!btn) return;
            const icon = btn.querySelector('svg');
            if (icon) {
                if (this.currentMode === 'dark') {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>';
                } else {
                    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
                }
            }
        };
        
        updateIcon(document.getElementById('dark-mode-toggle'));
        updateIcon(document.getElementById('dark-mode-toggle-mobile'));
    }
    
    setupListeners() {
        // 使用 MutationObserver 监听 DOM 变化，确保动态添加的元素也能绑定事件
        const bindEvents = () => {
            // 主题切换按钮
            document.querySelectorAll('[data-theme]').forEach(button => {
                // 检查是否已绑定，避免重复绑定
                if (!button.dataset.bound) {
                    button.dataset.bound = 'true';
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('主题切换:', button.dataset.theme);
                        this.setTheme(button.dataset.theme);
                        
                        // 关闭下拉菜单
                        const menus = document.querySelectorAll('[id^="theme-dropdown-menu"]');
                        menus.forEach(menu => menu.classList.add('hidden'));
                    });
                }
            });
            
            // 暗色模式切换 - 桌面端
            const darkModeBtn = document.getElementById('dark-mode-toggle');
            if (darkModeBtn && !darkModeBtn.dataset.bound) {
                darkModeBtn.dataset.bound = 'true';
                darkModeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('切换暗色模式');
                    this.toggleMode();
                });
            }
            
            // 暗色模式切换 - 移动端
            const darkModeBtnMobile = document.getElementById('dark-mode-toggle-mobile');
            if (darkModeBtnMobile && !darkModeBtnMobile.dataset.bound) {
                darkModeBtnMobile.dataset.bound = 'true';
                darkModeBtnMobile.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('移动端切换暗色模式');
                    this.toggleMode();
                });
            }
        };
        
        // 立即绑定一次
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bindEvents);
        } else {
            bindEvents();
        }
        
        // 延迟绑定，确保所有动态元素都已加载
        setTimeout(bindEvents, 100);
        setTimeout(bindEvents, 500);
    }
    
    getCurrentTheme() {
        return {
            theme: this.currentTheme,
            mode: this.currentMode,
            config: themeConfig[this.currentTheme][this.currentMode]
        };
    }
}

// 全局主题管理器实例
window.themeManager = null;

// 初始化主题管理器
function initThemeManager() {
    if (!window.themeManager) {
        try {
            window.themeManager = new ThemeManager();
            console.log('✓ 主题管理器已初始化');
            console.log('当前主题:', window.themeManager.currentTheme, '模式:', window.themeManager.currentMode);
        } catch (error) {
            console.error('主题管理器初始化失败:', error);
        }
    }
    return window.themeManager;
}

// 确保在 DOM 完全加载后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM 加载完成，初始化主题管理器');
        initThemeManager();
    });
} else {
    // DOM 已经加载完成
    console.log('DOM 已加载，立即初始化主题管理器');
    initThemeManager();
}

// 页面完全加载后再次确保初始化
window.addEventListener('load', () => {
    console.log('页面完全加载');
    if (!window.themeManager) {
        initThemeManager();
    } else {
        // 重新绑定事件监听器，确保所有按钮都有响应
        window.themeManager.setupListeners();
    }
});

// 导出供全局使用
window.initThemeManager = initThemeManager;



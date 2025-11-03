# 小红书高级感交互式HTML5单文件 - 系统化提示词

## 项目概述
创建一个**HTML5单文件**的高级感交互网页，专为追求品质和格调的小红书女性用户设计。整体风格优雅、简约、有质感，摒弃花哨元素，追求低调奢华的视觉体验。

---

## 目标用户画像

### 核心用户群体
- **年龄**：25-40岁成熟女性
- **平台**：小红书高端用户群体
- **特征**：
  - 追求品质生活
  - 审美成熟、眼光挑剔
  - 注重细节和质感
  - 偏好极简主义
  - 喜欢低调奢华
  - 受过良好教育

### 审美关键词
```
高级感 | 质感 | 优雅 | 极简 | 克制
低调奢华 | 氛围感 | 精致 | 格调 | 品味
老钱风 | Quiet Luxury | Less is More
留白 | 呼吸感 | 温润 | 雅致 | 内敛
```

---

## 2024-2025高级感设计趋势

### 核心审美特征

#### 1. 老钱风（Quiet Luxury / Old Money Aesthetic）
**特点**：
- 低调、内敛、不张扬
- 经典永恒、不追逐潮流
- 质感至上、材质考究
- 细节精致、工艺讲究

**应用**：
- 配色：中性色、大地色系
- 字体：衬线体、优雅细线体
- 布局：对称、工整、有序
- 装饰：极简、克制、留白

#### 2. 莫兰迪色系（Morandi Colors）
**配色原则**：
- 低饱和度、高灰度
- 温柔、优雅、和谐
- 色彩柔和、不刺眼
- 营造舒适氛围

**经典配色**：
```css
灰粉调：#C9B5A0, #D4C4B0, #B09A8B
灰蓝调：#8A9DAB, #B4C4CC, #9DADBC
灰绿调：#A8B5A3, #C4D3C9, #8B9B8E
米白调：#F5F1E8, #EDE7DD, #E8E3D8
灰褐调：#A89B92, #B8ADA3, #8B7E75
```

#### 3. 性冷淡风（Minimalism）
**设计原则**：
- 去繁就简、化繁为简
- 大面积留白
- 无装饰主义
- 功能至上

#### 4. 美拉德风（Maillard Aesthetic）
**特点**：
- 焦糖色、棕色系
- 温暖、治愈、复古
- 秋冬氛围感
- 高级质感

**配色**：
```css
焦糖色系：#C89B7B, #B8875F, #A67C52
奶咖色：#D4A574, #C9A88A, #BFA890
栗色：#8B6F47, #7A5E3F, #6B4E37
驼色：#C5A880, #B89968, #A68B5B
```

#### 5. 法式优雅（French Elegance）
**特点**：
- 随性但精致
- 不刻意但有品味
- 复古与现代融合
- effortless chic

---

## 技术要求

### 核心约束
- **单一HTML文件**：所有代码在一个.html文件中
- **可使用CDN**：鼓励使用高质量外部库
- **双击运行**：需联网，浏览器直接打开
- **响应式设计**：完美适配桌面端和移动端
- **性能优先**：加载快速、交互流畅

---

## 推荐CDN资源库（高级感专用）

### 核心推荐

#### 1. GSAP（专业级动画引擎）
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
```
**用途**：专业级流畅动画、视差滚动效果
**特点**：性能卓越、动画细腻、工业级标准

#### 2. Three.js（3D场景）
```html
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
```
**用途**：高级3D效果、粒子系统
**特点**：专业3D渲染、质感强

#### 3. Lenis（平滑滚动）
```html
<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.29/dist/lenis.min.js"></script>
```
**用途**：丝滑的滚动体验
**特点**：高端网站必备、体验极佳

#### 4. Splitting.js（文字动画）
```html
<script src="https://cdn.jsdelivr.net/npm/splitting@1.0.6/dist/splitting.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/splitting@1.0.6/dist/splitting.css" rel="stylesheet">
```
**用途**：优雅的文字逐字动画
**特点**：细腻、精致

#### 5. Swiper（轮播图）
```html
<link href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
```
**用途**：高级轮播展示
**特点**：流畅、可定制性强

---

## 配色方案（六大高级感色系）

### 方案1：莫兰迪经典（最推荐）
```css
:root {
    /* 主色调 */
    --primary: #9DADBC;        /* 灰蓝 */
    --secondary: #B09A8B;      /* 灰粉棕 */
    --accent: #8A9DAB;         /* 深灰蓝 */
    --background: #F5F1E8;     /* 米白 */
    --text-primary: #3D4043;   /* 深灰 */
    --text-secondary: #6B6B6B; /* 中灰 */
    
    /* 渐变背景 */
    background: linear-gradient(135deg, #F5F1E8 0%, #EDE7DD 50%, #E8E3D8 100%);
}
```

### 方案2：老钱风（经典永恒）
```css
:root {
    /* 中性色系 */
    --primary: #8B7E75;        /* 灰褐 */
    --secondary: #A89B92;      /* 浅灰褐 */
    --accent: #6B5F57;         /* 深灰褐 */
    --background: #FAF8F5;     /* 象牙白 */
    --gold-accent: #B8A88A;    /* 雅金 */
    --text-primary: #2C2C2C;   /* 炭黑 */
    --text-secondary: #757575; /* 石墨灰 */
}
```

### 方案3：美拉德暖调（温润治愈）
```css
:root {
    /* 焦糖色系 */
    --primary: #C89B7B;        /* 焦糖 */
    --secondary: #D4A574;      /* 奶咖 */
    --accent: #8B6F47;         /* 栗色 */
    --background: #F5EBE0;     /* 米白 */
    --warm-white: #FFF9F0;     /* 暖白 */
    --text-primary: #3E2F2A;   /* 深棕 */
    --text-secondary: #6B5A4F; /* 中棕 */
}
```

### 方案4：性冷淡灰（极简高冷）
```css
:root {
    /* 灰色系 */
    --primary: #9E9E9E;        /* 中灰 */
    --secondary: #BDBDBD;      /* 浅灰 */
    --accent: #616161;         /* 深灰 */
    --background: #FAFAFA;     /* 极浅灰 */
    --pure-white: #FFFFFF;     /* 纯白 */
    --text-primary: #212121;   /* 几乎黑 */
    --text-secondary: #757575; /* 灰色文字 */
}
```

### 方案5：法式复古（优雅浪漫）
```css
:root {
    /* 复古色系 */
    --primary: #A8927D;        /* 驼色 */
    --secondary: #C9B5A0;      /* 米黄 */
    --accent: #8B7865;         /* 深驼 */
    --background: #F8F6F0;     /* 羊皮纸白 */
    --vintage-gold: #D4C4A8;   /* 复古金 */
    --text-primary: #3A3230;   /* 深棕灰 */
    --text-secondary: #6D625B; /* 中棕灰 */
}
```

### 方案6：黑白高级（永恒经典）
```css
:root {
    /* 黑白灰 */
    --primary: #FFFFFF;        /* 纯白 */
    --secondary: #F5F5F5;      /* 浅灰白 */
    --accent: #E0E0E0;         /* 灰 */
    --background: #FFFFFF;     /* 白 */
    --black: #1A1A1A;          /* 高级黑 */
    --text-primary: #1A1A1A;   /* 高级黑 */
    --text-secondary: #666666; /* 深灰 */
}
```

---

## 字体系统（高级感排版）

### 中文字体推荐
```css
/* 衬线体（优雅、正式、高级） */
font-family: 'Noto Serif SC', 'Source Han Serif SC', 'STSong', 'SimSun', serif;

/* 无衬线体（现代、简约、清爽） */
font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei UI', sans-serif;

/* 细黑体（极简、轻盈、精致） */
font-family: 'PingFang SC Light', 'Hiragino Sans GB W3', 'STHeiti Light', sans-serif;
```

### 英文字体推荐
```css
/* 优雅衬线体 */
font-family: 'Playfair Display', 'Cormorant Garamond', 'Crimson Text', serif;

/* 现代无衬线 */
font-family: 'Inter', 'Helvetica Neue', 'Futura', sans-serif;

/* 几何无衬线（简约、现代） */
font-family: 'Montserrat', 'Poppins', 'Raleway', sans-serif;

/* CDN引入（Google Fonts镜像） */
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
```

### 字体排版原则
```css
/* 标题字体 */
h1 {
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 400; /* 不要过粗 */
    letter-spacing: 0.02em; /* 微调字间距 */
    line-height: 1.2;
}

/* 正文字体 */
body {
    font-size: clamp(0.95rem, 1.5vw, 1.1rem);
    font-weight: 300; /* 细体 */
    letter-spacing: 0.01em;
    line-height: 1.8; /* 舒适行距 */
}

/* 小字 */
small {
    font-size: 0.85rem;
    opacity: 0.7;
}
```

---

## 视觉设计原则

### 1. 留白原则（Less is More）
```css
/* 大量留白 */
.section {
    padding: 8vw 10vw;
    margin: 5vw 0;
}

/* 元素间距 */
.element-spacing {
    margin-bottom: 3rem;
}

/* 内容最大宽度（提升阅读体验） */
.content {
    max-width: 720px;
    margin: 0 auto;
}
```

### 2. 层次系统
```css
/* 微妙的阴影（不是扁平的，但很克制） */
.card {
    box-shadow: 
        0 2px 8px rgba(0,0,0,0.04),
        0 1px 2px rgba(0,0,0,0.02);
}

/* 悬停提升 */
.card:hover {
    box-shadow: 
        0 8px 24px rgba(0,0,0,0.08),
        0 2px 6px rgba(0,0,0,0.04);
    transform: translateY(-2px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 3. 圆角系统
```css
/* 微妙圆角（不要太圆） */
:root {
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
}
```

### 4. 透明度与毛玻璃
```css
/* 毛玻璃效果 */
.glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 渐进透明 */
.fade-overlay {
    background: linear-gradient(
        to bottom,
        rgba(255,255,255,0) 0%,
        rgba(255,255,255,0.9) 100%
    );
}
```

---

## 交互设计方案（8个高级感方向）

### 方案1：视差滚动艺术画廊
**描述**：优雅的视差滚动展示，类似高端品牌官网
**技术栈**：GSAP + ScrollTrigger
**特点**：
- 平滑的滚动体验
- 元素渐进入场
- 视差深度效果
- 文字逐字淡入

### 方案2：极简主义作品集
**描述**：大量留白，聚焦内容本身
**技术栈**：纯CSS3 + 微动画
**特点**：
- 超大标题
- 黑白配色或莫兰迪色
- 极少元素
- 精致的悬停效果

### 方案3：3D卡片翻转展示
**描述**：精致的3D卡片交互
**技术栈**：Three.js 或 CSS 3D Transform
**特点**：
- 卡片翻转效果
- 3D透视
- 光影渲染
- 物理材质模拟

### 方案4：文字艺术交互
**描述**：以文字为主的艺术表达
**技术栈**：Splitting.js + GSAP
**特点**：
- 文字逐字动画
- 标题分离效果
- 打字机效果
- 文字粒子化

### 方案5：流体背景生成器
**描述**：平静流动的抽象背景
**技术栈**：Canvas + Simplex Noise
**特点**：
- 缓慢流动的渐变
- 抽象艺术风格
- 极简配色
- 静谧氛围

### 方案6：时间线叙事
**描述**：优雅的时间线展示
**技术栈**：GSAP + ScrollTrigger
**特点**：
- 垂直时间轴
- 内容逐步展开
- 里程碑标记
- 渐进式披露

### 方案7：光标跟随效果
**描述**：精致的鼠标交互
**技术栈**：原生JS + GSAP
**特点**：
- 自定义光标
- 光标粒子尾随
- 悬停元素放大光圈
- 平滑跟随

### 方案8：沉浸式全屏体验
**描述**：全屏滚动，每屏一个主题
**技术栈**：fullPage.js 替代品或自制
**特点**：
- 全屏section
- 滚动切换
- 页面指示器
- 键盘导航

---

## 高级感文案风格

### 文案原则
- **简洁有力**：少即是多，每个字都有价值
- **留白呼吸**：不要说满，给读者想象空间
- **诗意隐喻**：用意象而非直白
- **克制优雅**：不用感叹号，少用形容词

### 示例文案

#### 标题类
```
时光的质感
静谧之美
Less is More
The Art of Simplicity
温润如玉
岁月的沉淀
内敛的力量
优雅从不喧哗
```

#### 描述类
```
"美，存在于极简的线条与留白的空间之间。"
"真正的奢华，是对细节的极致追求。"
"时间会沉淀一切，包括品味。"
"优雅，是一种刻在骨子里的从容。"
"少一些，才能看见更多。"
"质感来自于细节的堆叠与克制的表达。"
```

#### 互动提示类
```
"轻触，探索更多"
"向下滚动"
"慢慢来"
"静静欣赏"
"沉浸其中"
"用心感受"
```

---

## 动画设计原则

### 缓动函数（Easing）
```css
/* 高级感的缓动曲线 */
--ease-elegant: cubic-bezier(0.4, 0, 0.2, 1);      /* Material Design */
--ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94); /* 丝滑 */
--ease-gentle: cubic-bezier(0.33, 1, 0.68, 1);     /* 温柔 */
--ease-slow: cubic-bezier(0.25, 0.1, 0.25, 1);     /* 缓慢优雅 */
```

### 动画时长
```css
/* 不要太快，优雅需要时间 */
--duration-instant: 150ms;   /* 即时反馈 */
--duration-quick: 300ms;     /* 快速 */
--duration-normal: 600ms;    /* 标准 */
--duration-slow: 1000ms;     /* 缓慢 */
--duration-elegant: 1400ms;  /* 优雅 */
```

### GSAP动画示例
```javascript
// 优雅的淡入上移
gsap.from('.element', {
    y: 60,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
        trigger: '.element',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
    }
});

// 标题字符逐个显示
gsap.from('.title span', {
    opacity: 0,
    y: 20,
    duration: 0.8,
    ease: 'power2.out',
    stagger: 0.05
});
```

---

## 响应式设计

### 断点系统
```css
/* 移动端优先 */
:root {
    --breakpoint-sm: 640px;   /* 手机横屏 */
    --breakpoint-md: 768px;   /* 平板竖屏 */
    --breakpoint-lg: 1024px;  /* 平板横屏/小笔记本 */
    --breakpoint-xl: 1280px;  /* 桌面 */
    --breakpoint-2xl: 1536px; /* 大屏 */
}

/* 移动端 */
@media (max-width: 768px) {
    body {
        padding: 5vw;
        font-size: 1rem;
    }
    
    h1 {
        font-size: 2rem;
    }
}

/* 桌面端 */
@media (min-width: 1024px) {
    body {
        padding: 0;
    }
    
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 5vw;
    }
}
```

---

## 代码结构模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="高级感交互体验">
    <title>Elegant Experience</title>
    
    <!-- CDN资源 -->
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    
    <style>
        /* ========== CSS Reset ========== */
        *, *::before, *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* ========== 设计系统 ========== */
        :root {
            /* 莫兰迪色系 */
            --primary: #9DADBC;
            --secondary: #B09A8B;
            --background: #F5F1E8;
            --text-primary: #3D4043;
            --text-secondary: #6B6B6B;
            
            /* 字体 */
            --font-serif: 'Playfair Display', 'Noto Serif SC', serif;
            --font-sans: 'Inter', 'PingFang SC', sans-serif;
            
            /* 圆角 */
            --radius-sm: 4px;
            --radius-md: 8px;
            --radius-lg: 12px;
            
            /* 阴影 */
            --shadow-sm: 0 2px 8px rgba(0,0,0,0.04);
            --shadow-md: 0 8px 24px rgba(0,0,0,0.08);
            
            /* 缓动 */
            --ease: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* ========== 全局样式 ========== */
        html {
            scroll-behavior: smooth;
        }
        
        body {
            font-family: var(--font-sans);
            font-size: clamp(0.95rem, 1.5vw, 1.1rem);
            font-weight: 300;
            line-height: 1.8;
            color: var(--text-primary);
            background: var(--background);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        /* ========== 排版 ========== */
        h1, h2, h3 {
            font-family: var(--font-serif);
            font-weight: 400;
            line-height: 1.2;
            letter-spacing: 0.02em;
            margin-bottom: 1.5rem;
        }
        
        h1 {
            font-size: clamp(2.5rem, 6vw, 4.5rem);
        }
        
        h2 {
            font-size: clamp(1.8rem, 4vw, 3rem);
        }
        
        p {
            margin-bottom: 1.2rem;
            color: var(--text-secondary);
        }
        
        /* ========== 布局 ========== */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 clamp(1.5rem, 5vw, 5rem);
        }
        
        .section {
            min-height: 100vh;
            display: flex;
            align-items: center;
            padding: 8vh 0;
        }
        
        /* ========== 组件样式 ========== */
        .card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border-radius: var(--radius-lg);
            padding: 3rem;
            box-shadow: var(--shadow-sm);
            transition: all 0.6s var(--ease);
        }
        
        .card:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-4px);
        }
        
        .btn {
            display: inline-block;
            padding: 1rem 2.5rem;
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
            text-decoration: none;
            border-radius: var(--radius-sm);
            font-weight: 400;
            letter-spacing: 0.05em;
            transition: all 0.4s var(--ease);
            cursor: pointer;
        }
        
        .btn:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(157, 173, 188, 0.3);
        }
        
        /* ========== 自定义光标（桌面端） ========== */
        @media (min-width: 1024px) {
            * {
                cursor: none;
            }
            
            .cursor {
                position: fixed;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--primary);
                pointer-events: none;
                z-index: 9999;
                mix-blend-mode: difference;
            }
            
            .cursor-follower {
                position: fixed;
                width: 32px;
                height: 32px;
                border: 1px solid var(--primary);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
                opacity: 0.5;
            }
        }
        
        /* ========== 响应式 ========== */
        @media (max-width: 768px) {
            .section {
                padding: 5vh 0;
            }
            
            .card {
                padding: 2rem;
            }
        }
    </style>
</head>
<body>
    <!-- 自定义光标 -->
    <div class="cursor"></div>
    <div class="cursor-follower"></div>
    
    <!-- 主要内容 -->
    <main>
        <section class="section">
            <div class="container">
                <h1>时光的质感</h1>
                <p>美，存在于极简的线条与留白的空间之间。</p>
                <a href="#" class="btn">探索更多</a>
            </div>
        </section>
        
        <section class="section">
            <div class="container">
                <div class="card">
                    <h2>Less is More</h2>
                    <p>真正的奢华，是对细节的极致追求。</p>
                </div>
            </div>
        </section>
    </main>

    <script>
        // ========== 配置区域 ==========
        const CONFIG = {
            theme: 'morandi',           // 主题：morandi/minimal/maillard
            enableCustomCursor: true,    // 自定义光标
            enableSmoothScroll: true,    // 平滑滚动
            animationSpeed: 1.2,         // 动画速度
            
            colors: {
                morandi: {
                    primary: '#9DADBC',
                    secondary: '#B09A8B',
                    background: '#F5F1E8'
                },
                minimal: {
                    primary: '#9E9E9E',
                    secondary: '#BDBDBD',
                    background: '#FAFAFA'
                },
                maillard: {
                    primary: '#C89B7B',
                    secondary: '#D4A574',
                    background: '#F5EBE0'
                }
            }
        };
        
        // ========== GSAP初始化 ==========
        gsap.registerPlugin(ScrollTrigger);
        
        // ========== 入场动画 ==========
        function initAnimations() {
            // 标题淡入上移
            gsap.from('h1', {
                y: 60,
                opacity: 0,
                duration: CONFIG.animationSpeed,
                ease: 'power3.out'
            });
            
            // 段落延迟淡入
            gsap.from('p', {
                y: 40,
                opacity: 0,
                duration: CONFIG.animationSpeed,
                delay: 0.3,
                ease: 'power3.out'
            });
            
            // 按钮延迟淡入
            gsap.from('.btn', {
                y: 30,
                opacity: 0,
                duration: CONFIG.animationSpeed,
                delay: 0.6,
                ease: 'power3.out'
            });
            
            // 卡片滚动动画
            gsap.utils.toArray('.card').forEach(card => {
                gsap.from(card, {
                    y: 100,
                    opacity: 0,
                    duration: 1.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                });
            });
        }
        
        // ========== 自定义光标 ==========
        function initCustomCursor() {
            if (!CONFIG.enableCustomCursor || window.innerWidth < 1024) return;
            
            const cursor = document.querySelector('.cursor');
            const follower = document.querySelector('.cursor-follower');
            
            let mouseX = 0, mouseY = 0;
            let followerX = 0, followerY = 0;
            
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
                
                gsap.to(cursor, {
                    x: mouseX - 4,
                    y: mouseY - 4,
                    duration: 0
                });
            });
            
            // 跟随光标延迟跟随
            gsap.ticker.add(() => {
                followerX += (mouseX - followerX) * 0.1;
                followerY += (mouseY - followerY) * 0.1;
                
                gsap.set(follower, {
                    x: followerX - 16,
                    y: followerY - 16
                });
            });
            
            // 悬停可交互元素时放大
            document.querySelectorAll('a, button, .card').forEach(el => {
                el.addEventListener('mouseenter', () => {
                    gsap.to(follower, {
                        scale: 2,
                        duration: 0.4,
                        ease: 'power2.out'
                    });
                });
                
                el.addEventListener('mouseleave', () => {
                    gsap.to(follower, {
                        scale: 1,
                        duration: 0.4,
                        ease: 'power2.out'
                    });
                });
            });
        }
        
        // ========== 平滑滚动 ==========
        function initSmoothScroll() {
            if (!CONFIG.enableSmoothScroll) return;
            
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        gsap.to(window, {
                            scrollTo: target,
                            duration: 1.5,
                            ease: 'power3.inOut'
                        });
                    }
                });
            });
        }
        
        // ========== 页面加载完成后初始化 ==========
        window.addEventListener('DOMContentLoaded', () => {
            console.log('%c Elegant Experience ', 
                        'background: #9DADBC; color: white; padding: 5px 10px; font-family: serif;');
            
            initAnimations();
            initCustomCursor();
            initSmoothScroll();
        });
    </script>
</body>
</html>
```

---

## 功能需求清单

### 必须实现（核心）
- [ ] 莫兰迪色系或老钱风配色
- [ ] 优雅的字体排版
- [ ] 大量留白设计
- [ ] 流畅的动画（GSAP）
- [ ] 响应式布局
- [ ] 无emoji、无花哨元素

### 推荐实现
- [ ] 自定义光标（桌面端）
- [ ] 视差滚动效果
- [ ] 毛玻璃效果
- [ ] 平滑滚动
- [ ] 文字逐字动画
- [ ] 微妙的悬停效果

### 高级功能（可选）
- [ ] 3D效果（Three.js）
- [ ] 主题切换（多种配色方案）
- [ ] 暗黑模式
- [ ] 加载动画
- [ ] 页面过渡效果
- [ ] 音效（极简、克制）

---

## 成功标准

### 视觉评分
- **高级感**：95/100（配色、留白、质感）
- **克制度**：90/100（无多余元素）
- **精致度**：95/100（细节、排版、间距）
- **和谐度**：90/100（色彩、比例、节奏）

### 体验评分
- **流畅度**：95/100（60fps动画）
- **优雅度**：90/100（动画缓动、时长）
- **沉浸感**：85/100（专注内容）
- **适配性**：90/100（响应式完美）

### 情感目标
**用户打开后的反应**：
- "太有品味了"
- "这才是高级感"
- "看着就很舒服"
- "细节太到位了"
- "想保存下来慢慢欣赏"

---

## 核心提示词总结

**终极指令**：

请创建一个**HTML5单文件**的高级感交互网页，专为**追求品质的小红书成熟女性用户**设计，满足以下要求：

### 1. 技术要求
- 所有代码在一个.html文件中
- **必须使用专业CDN库**（推荐：GSAP + ScrollTrigger）
- 完美响应式设计
- 性能优异（60fps）

### 2. 视觉要求（高级感核心）
- **配色**：莫兰迪色系/老钱风/美拉德色系（三选一）
- **风格**：极简、优雅、克制、有呼吸感
- **排版**：大量留白、精致间距、优雅字体
- **元素**：微妙圆角、柔和阴影、毛玻璃效果
- **禁止**：emoji、花哨装饰、过度动画

### 3. 动画要求
- **缓动**：优雅的缓动曲线（cubic-bezier）
- **时长**：不要太快（600ms-1400ms）
- **效果**：淡入、上移、视差滚动
- **原则**：Less is More，克制有度

### 4. 交互要求
- **响应**：微妙但明确的反馈
- **光标**：自定义光标（桌面端可选）
- **滚动**：平滑、有节奏
- **悬停**：轻微提升、阴影变化

### 5. 内容要求
- **文案**：简洁、诗意、有留白
- **风格**：克制、不说满、有想象空间
- **语气**：优雅、温润、内敛
- **禁止**：感叹号、夸张形容词、网络用语

### 6. 方案选择（8选1或组合）
- 视差滚动艺术画廊
- 极简主义作品集
- 3D卡片翻转展示
- 文字艺术交互
- 流体背景生成器
- 时间线叙事
- 光标跟随效果
- 沉浸式全屏体验

### 7. 推荐CDN组合
```html
<!-- 专业级组合 -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=Inter:wght@300;400&display=swap" rel="stylesheet">
```

### 8. 成功标准
- 高级感：95/100
- 克制度：90/100
- 精致度：95/100
- 优雅度：90/100

---

## 特别强调

### 高级感核心要素
1. **配色克制**：低饱和度、中性色为主
2. **大量留白**：不要填满屏幕
3. **字体精致**：衬线体+细线体组合
4. **动画优雅**：慢、稳、柔
5. **细节到位**：间距、阴影、圆角都要讲究
6. **内容为王**：技术服务于内容

### 必须避免
- ❌ 任何emoji和颜文字
- ❌ 鲜艳刺眼的颜色
- ❌ 过度的装饰元素
- ❌ 快速的动画
- ❌ 密集的内容排版
- ❌ 花哨的特效
- ❌ 网络流行语和梗
- ❌ 可爱风、少女风元素

### 关键审美词
```
高级 | 优雅 | 极简 | 质感 | 克制
内敛 | 温润 | 精致 | 留白 | 呼吸感
老钱风 | 莫兰迪 | 性冷淡 | 法式 | 复古
```

---

**记住：高级感来自于克制、细节和对美的深刻理解。Less is More不是口号，而是设计哲学。**

**目标：让用户感受到一种静谧的奢华，一种不张扬的精致，一种刻在骨子里的优雅。**

---

**文档版本**：v1.0（高级感/老钱风专版）
**创建日期**：2025-11-02
**适用人群**：25-40岁成熟女性，追求品质生活
**核心理念**：Quiet Luxury | Old Money Aesthetic | Less is More

优雅永不过时。


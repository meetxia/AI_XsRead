# 浪漫HTML5单文件脚本 - 系统化提示词

## 📋 项目概述
创建一个**完全独立的HTML5单文件**（包含HTML、CSS、JavaScript），运行后呈现强烈视觉冲击力和浪漫氛围的网页动画效果。用户只需双击HTML文件在浏览器中打开即可观看。

---

## 🎯 核心目标

1. **单文件独立性**：所有代码（HTML/CSS/JS）集成在一个.html文件中
2. **零依赖运行**：无需外部库、框架、网络连接，双击即可运行
3. **视觉震撼力**：具有强烈的视觉冲击和浪漫氛围
4. **跨浏览器兼容**：支持主流浏览器（Chrome、Edge、Firefox、Safari）

---

## 🛠️ 技术约束

### 必须遵守的规则
- ✅ **单一HTML文件**：所有内容在一个.html文件中
- ✅ **可使用CDN**：允许引用外部CDN库（jsdelivr、cdnjs等）
- ✅ **双击运行**：需联网环境，双击HTML文件在浏览器中打开即可运行
- ✅ **无需服务器**：不需要Node.js、Python等服务器环境
- ✅ **无需构建**：不需要webpack、vite等打包工具

### 技术选择策略

#### 🎯 方案A：纯原生（推荐新手/追求极简）
- **优点**：完全离线、零依赖、加载快
- **适用**：简单动画、粒子效果、基础交互
- **技术栈**：
  - HTML5 Canvas - 绘制复杂动画和粒子效果
  - CSS3 动画 - @keyframes、transition、transform
  - SVG - 矢量图形绘制
  - 原生JavaScript（ES6+）- requestAnimationFrame
  - Web Audio API - （可选）音效生成
  - Emoji表情 - 作为视觉元素

#### 🚀 方案B：CDN增强（推荐进阶/追求效果）
- **优点**：功能强大、效果震撼、开发快速
- **适用**：3D效果、复杂动画、高级交互
- **可选CDN库**：见下方详细列表

---

## 📦 推荐CDN资源库

### 一、主流前端框架

#### Vue.js
```html
<!-- Vue 3 -->
<script src="https://cdn.jsdelivr.net/npm/vue@3.4.21/dist/vue.global.min.js"></script>
```
**适用场景**：响应式数据绑定、组件化开发

#### React
```html
<!-- React + ReactDOM -->
<script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
```
**适用场景**：复杂状态管理、组件化

#### jQuery（经典轻量）
```html
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
```
**适用场景**：简单DOM操作、快速开发

---

### 二、UI框架（快速美化界面）

#### Bootstrap 5
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
```
**适用场景**：快速布局、响应式设计

#### Tailwind CSS
```html
<script src="https://cdn.tailwindcss.com"></script>
```
**适用场景**：原子化CSS、灵活样式定制

#### Bulma（轻量CSS框架）
```html
<link href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" rel="stylesheet">
```
**适用场景**：简洁现代的界面

#### Materialize（Material Design）
```html
<link href="https://cdn.jsdelivr.net/npm/materialize-css@1.0.0/dist/css/materialize.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/materialize-css@1.0.0/dist/js/materialize.min.js"></script>
```
**适用场景**：Material风格界面

---

### 三、3D/可视化趣味工具 ⭐⭐⭐

#### Three.js（3D引擎）🔥 强烈推荐用于浪漫场景
```html
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
```
**适用场景**：
- 3D爱心旋转
- 3D粒子宇宙
- 星空场景
- 浪漫3D场景

**示例效果**：旋转的3D心形、粒子星云、银河系背景

#### Babylon.js（3D游戏引擎）
```html
<script src="https://cdn.jsdelivr.net/npm/babylonjs@6.44.0/babylon.min.js"></script>
```
**适用场景**：高级3D场景、光影效果

#### p5.js（创意编程/可视化）🔥 推荐
```html
<script src="https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js"></script>
```
**适用场景**：
- 生成艺术
- 创意动画
- 粒子系统
- 数学艺术

**示例效果**：流动的爱心、艺术化粒子、分形图案

#### PixiJS（2D动画引擎）
```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@7.4.0/dist/pixi.min.js"></script>
```
**适用场景**：高性能2D动画、精灵动画

#### Chart.xkcd（手绘风格图表）
```html
<script src="https://cdn.jsdelivr.net/npm/chart.xkcd@1.1.13/dist/chart.xkcd.min.js"></script>
```
**适用场景**：可爱手绘风格的数据展示

---

### 四、交互/动画趣味库 ⭐⭐⭐

#### anime.js（动画引擎）🔥 强烈推荐
```html
<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>
```
**适用场景**：
- 流畅的补间动画
- 文字动画
- SVG路径动画
- 复杂动画编排

**示例效果**：文字逐字飞入、爱心跳动、路径描绘

#### Particles.js（粒子背景）🔥 强烈推荐
```html
<script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"></script>
```
**适用场景**：
- 粒子背景
- 星空效果
- 雪花飘落
- 浪漫氛围

**示例效果**：漂浮的爱心粒子、连线粒子网络

#### Confetti.js（撒花特效）🔥 强烈推荐
```html
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
```
**适用场景**：
- 庆祝特效
- 点击爆炸效果
- 浪漫撒花

**示例效果**：爱心撒花、彩带飘落

#### Lottie（AE动画导出）
```html
<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js"></script>
```
**适用场景**：播放After Effects导出的高质量动画

#### Hover.css（悬停特效）
```html
<link href="https://cdn.jsdelivr.net/npm/hover.css@2.3.1/css/hover-min.css" rel="stylesheet">
```
**适用场景**：鼠标悬停动画效果

---

### 五、可爱/创意工具 💖

#### Emoji Mart（Emoji选择器）
```html
<link href="https://cdn.jsdelivr.net/npm/emoji-mart@5.5.2/dist/emoji-mart.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/emoji-mart@5.5.2/dist/emoji-mart.js"></script>
```
**适用场景**：互动式Emoji选择

#### Cute Charts（卡通图表）
```html
<script src="https://cdn.jsdelivr.net/npm/cute-charts@0.3.1/dist/cute-charts.min.js"></script>
```
**适用场景**：可爱风格的数据展示

#### Bubble Cursor（气泡鼠标指针）
```html
<script src="https://cdn.jsdelivr.net/npm/bubble-cursor@1.0.2/dist/bubble-cursor.min.js"></script>
```
**适用场景**：趣味鼠标跟随效果

---

### 六、其他实用工具

#### Lodash（工具函数库）
```html
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
```
**适用场景**：数据处理、函数工具

#### Day.js（轻量日期库）
```html
<script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
```
**适用场景**：日期计算、纪念日倒计时

#### Font Awesome（图标库）
```html
<link href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css" rel="stylesheet">
```
**适用场景**：丰富的图标资源

---

### 视觉色彩方案
```css
#仅示例
#99636a,rgb(153, 46, 46), #FFB6C1, #FFC0CB

#8fd3e4,rgb(75, 110, 223), #DDA0DD, #E6E6FA

/* 渐变方案 */
linear-gradient(135deg, #667eea 0%, #764ba2 100%)  /* 紫色 */
linear-gradient(135deg, #f093fb 0%, #f5576c 100%)  /* 粉色 */
linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)  /* 蓝色 */
linear-gradient(135deg, #fa709a 0%, #fee140 100%)  /* 暖色 */
```


### 动画效果清单
- **淡入淡出** (fadeIn/fadeOut)
- **缩放** (scale/zoom)
- **旋转** (rotate/spin)
- **平移** (translate/slide)
- **弹跳** (bounce)
- **脉动** (pulse/heartbeat)
- **波纹** (ripple)
- **闪烁** (blink/twinkle)
- **飘动** (float)
- **扩散** (spread)

---

## 📐 功能需求规格

### 核心功能（必须实现）
1. ✅ **自动播放动画**：打开页面立即开始动画
2. ✅ **流畅帧率**：保持30-60 FPS
3. ✅ **响应式设计**：适配不同屏幕尺寸
4. ✅ **优雅降级**：低性能设备自动减少粒子数

### 推荐功能
1. 🎯 **全屏模式提示**：引导用户按F11全屏
2. 🎯 **交互特效**：点击屏幕产生特殊效果
3. 🎯 **循环播放**：动画无限循环或多阶段展示
4. 🎯 **个性化配置**：顶部配置区域可修改文字/颜色

### 高级功能
1. 🚀 **音效生成**：使用Web Audio API生成简单音效
2. 🚀 **截图保存**：允许保存当前画面
3. 🚀 **分享功能**：生成分享链接或代码
4. 🚀 **多场景切换**：多个场景依次或循环展示
5. 🚀 **时间触发**：特定时间触发特殊效果

---

## 💻 代码结构要求

### 文件结构模板
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>标题</title>
    <style>
        /* ========== CSS样式区域 ========== */
        /* 全局样式 */
        /* 动画定义 */
        /* 响应式样式 */
    </style>
</head>
<body>
    <!-- ========== HTML结构区域 ========== -->
    <!-- Canvas画布 -->
    <!-- 内容容器 -->
    <!-- 装饰元素 -->

    <script>
        // ========== JavaScript配置区域 ==========
        const CONFIG = {
            // 用户可修改的配置项
        };

        // ========== JavaScript核心代码 ==========
        // 工具函数
        // 动画逻辑
        // 事件监听
        // 初始化
    </script>
</body>
</html>
```

### 代码质量要求
1. **清晰注释**：
   - 配置区域有详细说明
   - 关键算法有注释
   - 可调参数有说明

2. **模块化**：
   - 配置与代码分离
   - 功能函数独立
   - 易于理解和修改

3. **性能优化**：
   - 使用requestAnimationFrame
   - 避免内存泄漏
   - 对象池复用（如粒子）
   - 离屏Canvas预渲染

4. **容错处理**：
   - try-catch捕获异常
   - 降级方案
   - 控制台友好提示

---

## 🎭 用户体验设计

### 加载体验
- ⚡ **即时显示**：无加载等待，立即呈现
- 🎨 **平滑启动**：动画从简单到复杂渐进
- 📱 **适配提示**：建议横屏/全屏观看

### 观看体验
- 👁️ **视觉舒适**：色彩和谐，亮度适中
- ⏱️ **节奏控制**：动画有节奏感，不单调
- 🎪 **情感高潮**：有明确的高潮时刻
- 📖 **可读性**：文字清晰易读

### 交互体验
- 🖱️ **点击反馈**：点击产生特效
- ⌨️ **键盘控制**：空格键/方向键触发彩蛋
- 📱 **触摸友好**：移动端支持触摸交互
- 🔊 **音效提示**：（可选）交互音效

### 兼容性
- 🌐 **浏览器兼容**：Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- 📱 **设备兼容**：桌面、平板、手机
- 🎮 **性能分级**：高性能/低性能设备自适应

---

## 🎨 设计原则

1. **极简主义**：界面简洁，重点突出
2. **情感至上**：技术服务于情感表达
3. **可配置性**：关键内容易于修改
4. **性能平衡**：美观与性能的平衡
5. **渐进增强**：基础效果+高级特效

---

## ✨ 创意加分项

### 视觉创新
- 🌟 独特的粒子系统算法
- 🎨 创新的色彩变换方式
- 🎬 电影级的镜头运动感
- 🎆 意想不到的特效组合

### 交互创新
- 🖱️ 有趣的鼠标跟随效果
- ⌨️ 隐藏的键盘彩蛋
- 📱 重力感应（移动端）
- 🎤 麦克风交互（可选）

### 技术创新
- 🧮 数学艺术（分形、曲线）
- 🎵 算法音乐生成
- 🤖 动态内容生成
- 🎲 随机性与确定性结合

### 情感创新
- 💭 个性化的情感表达
- 📅 时间相关的动态内容
- 🎁 隐藏的惊喜内容
- 📖 故事性的叙事结构

---


## 📋 配置化设计规范


### 配置说明要求
- 每个配置项都有清晰的中文注释
- 提供多个预设选项
- 说明修改的影响范围
- 给出推荐值和可调范围

---

## 🎯 性能优化要求

### 必须实现的优化
1. **帧率控制**：使用requestAnimationFrame
2. **节流防抖**：限制事件触发频率
3. **对象复用**：粒子对象池
4. **条件渲染**：屏幕外元素不渲染

### 推荐的优化
1. **分级渲染**：根据性能调整粒子数
2. **离屏Canvas**：预渲染静态内容
3. **CSS硬件加速**：使用transform3d
4. **内存管理**：及时清理不用的元素

### 性能监控
```javascript
// 在控制台显示FPS
let lastTime = performance.now();
let frames = 0;

function showFPS() {
    frames++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
        console.log(`FPS: ${frames}`);
        frames = 0;
        lastTime = currentTime;
    }
}
```

---

## 📤 交付清单

### 核心文件
- ✅ **xxxxx.html** - 单一HTML文件
- ✅ **完整的内嵌CSS** - 所有样式在<style>中
- ✅ **完整的内嵌JS** - 所有脚本在<script>中

### 必需内容
1. **配置区域**：
   - 清晰标注的CONFIG对象
   - 中文注释说明每个配置项
   - 预设的多个配色方案


### 文档要求（可选单独README）
如果需要单独说明文档：
1. **效果预览**：文字描述最终效果
2. **浏览器要求**：兼容性说明
3. **定制指南**：详细的修改教程
4. **故障排除**：常见问题解答

---

## 🔍 质量检查清单

### 功能检查
- [ ] 双击HTML文件可正常打开
- [ ] 动画自动开始播放
- [ ] 文字内容正确显示
- [ ] 配置项可以正常修改
- [ ] 交互功能正常响应
- [ ] 全屏模式正常工作

### 性能检查
- [ ] 帧率稳定在30+ FPS
- [ ] 无明显卡顿或延迟
- [ ] 内存占用合理（<100MB）
- [ ] CPU占用合理（<30%）
- [ ] 长时间运行无内存泄漏

### 兼容性检查
- [ ] Chrome浏览器测试通过
- [ ] Edge浏览器测试通过
- [ ] Firefox浏览器测试通过
- [ ] Safari浏览器测试通过（Mac/iOS）
- [ ] 移动端浏览器测试通过

### 视觉检查
- [ ] 色彩和谐舒适
- [ ] 文字清晰可读
- [ ] 动画流畅自然
- [ ] 布局响应式适配
- [ ] 无明显视觉Bug

### 代码检查
- [ ] 无控制台错误或警告
- [ ] 代码格式整洁
- [ ] 注释清晰完整
- [ ] 无硬编码的个人信息
- [ ] 配置区域易于找到和修改

---

## 💡 核心提示词总结

**终极指令**：

请创建一个**HTML5单文件**浪漫动画页面，满足以下要求：

1. **技术要求**：
   - 所有代码（HTML/CSS/JS）在一个.html文件中
   - **可以使用CDN外部库**（推荐：Three.js、anime.js、Particles.js、Confetti.js等）
   - 双击文件即可在浏览器中运行（需联网加载CDN）
   - 或者纯原生实现（完全离线可用）

2. **视觉要求**：
   - 具有强烈的视觉冲击力和浪漫氛围
   - 至少包含一种主要动画效果（3D场景/粒子/Canvas/CSS3D等）
   - 色彩和谐，适合浪漫主题
   - 推荐使用CDN库提升视觉效果

3. **功能要求**：
   - 顶部有清晰的CONFIG配置区域，可修改文字、日期、颜色
   - 流畅的动画（30+ FPS）
   - 响应式设计，适配不同屏幕
   - 支持交互（点击、键盘等）

4. **代码要求**：
   - 清晰的中文注释
   - 模块化的代码结构
   - 性能优化（requestAnimationFrame、对象池等）
   - 控制台友好提示
   - CDN引用使用jsdelivr（稳定可靠）

5. **体验要求**：
   - 打开即播放，快速加载
   - 有明确的情感高潮时刻
   - 易于个性化定制
   - 兼容主流浏览器

**推荐技术组合**：
- 🔥 **极致推荐**：Three.js + anime.js + Confetti.js（3D场景+动画+特效）
- ⭐ **高性价比**：Particles.js + anime.js（粒子+动画）
- 💝 **简单快速**：纯原生Canvas + CSS3 + Confetti.js

**优先级**：视觉效果 > 易用性 > 代码质量 > 扩展性

**成功标准**：女朋友打开文件后，第一反应是"哇！好美/好浪漫！"

---

---

## 🎁 最终交付格式

```
xxxxx.html  （单一文件，所有代码都在里面）
├── HTML结构
├── CSS样式（内嵌）
├── JavaScript代码（内嵌）
│   ├── CONFIG配置区域（用户可修改）
│   ├── 工具函数
│   ├── 动画逻辑
│   └── 事件处理
└── 使用说明（HTML注释）
```


---

## ⚠️ CDN使用注意事项

### 优点
- ✅ **开发快速**：无需从零编写复杂功能
- ✅ **效果震撼**：专业库提供高质量视觉效果
- ✅ **性能优化**：成熟库已做好优化
- ✅ **易于维护**：代码更简洁清晰
- ✅ **无需打包**：直接引用即可使用

### 注意事项
- 🌐 **需要联网**：打开HTML时需要网络连接加载CDN
- 📶 **首次加载**：首次访问会从CDN下载，后续浏览器会缓存
- 🔒 **版本锁定**：使用具体版本号（如`@3.2.2`）而非`@latest`，避免未来更新导致不兼容
- 🌍 **CDN选择**：推荐使用jsdelivr，国内外都较稳定

### 最佳实践
```html
<!-- ✅ 推荐：使用具体版本号 -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>

<!-- ❌ 不推荐：使用latest，可能导致未来不兼容 -->
<script src="https://cdn.jsdelivr.net/npm/three@latest/build/three.min.js"></script>
```

### 离线备选方案
如果需要完全离线可用，可以：
1. 下载CDN文件到本地，修改引用路径
2. 或者使用纯原生实现（不使用外部库）

---

## 📦 CDN资源速查表

### 核心推荐（浪漫场景必备）
| 库名 | 用途 | CDN链接 | 推荐指数 |
|------|------|---------|----------|
| Three.js | 3D场景 | `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js` | ⭐⭐⭐⭐⭐ |
| anime.js | 流畅动画 | `https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js` | ⭐⭐⭐⭐⭐ |
| Confetti.js | 撒花特效 | `https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js` | ⭐⭐⭐⭐⭐ |
| Particles.js | 粒子背景 | `https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js` | ⭐⭐⭐⭐ |
| p5.js | 创意编程 | `https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.min.js` | ⭐⭐⭐⭐ |
| Day.js | 日期计算 | `https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js` | ⭐⭐⭐ |

### 快速复制（完整组合）
```html
<!-- 终极浪漫组合 -->
<script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
```

---

**🎯 记住：这是一个用代码写给心爱之人的情书，技术是手段，情感是目的！**

**💡 建议：优先使用CDN库快速实现震撼效果，把更多精力放在创意和情感表达上！**


# MOMO小说 · 前端重构方案 V1.0

> 文档日期：2026-05-17  
> 状态：✅ Demo 已完成 · 等待用户确认细节后移植到 Vue 3 工程

## 决策

经过初版 4 方向对比，确认采用：

- **A · 奶油杂志风**（陶土棕 + 奶白 + 墨绿）→ 9 个非阅读页
- **D · 极简内容流**（米白 + 暖橙强调）→ 阅读页（核心沉浸场景）

## 入口

直接打开 `index.html` 是 V1.0 主导航页：

```
demo-redesign/
├── index.html          ← ⭐ V1.0 主页（推荐入口）
├── proposals.html      ← 初版 4 方向对比（归档）
├── shared/             ← 共享配置/样式/脚本
│   ├── tailwind-cream.js     # A 主题 Tailwind config
│   ├── tailwind-reading.js   # D 主题 Tailwind config
│   ├── common.css            # 共享样式
│   ├── theme-toggle.js       # 浅深模式切换
│   └── partials.js           # 顶/底栏、SVG 图标库、占位封面
├── pages/              ← ⭐ 10 个完整页面
│   ├── home.html       # 首页（A）
│   ├── detail.html     # 小说详情（A）
│   ├── reading.html    # 阅读页（D）⭐
│   ├── bookshelf.html  # 我的书架（A）
│   ├── discover.html   # 发现（A）
│   ├── search.html     # 搜索（A）
│   ├── profile.html    # 个人中心（A）
│   ├── history.html    # 浏览记录（A）
│   ├── login.html      # 登录（A）
│   └── register.html   # 注册（A）
└── theme-{a,b,c,d}/    ← 初版 demo（保留备查）
```

## 页面清单

| # | 页面 | 主题 | 关键交互 |
|---|---|---|---|
| 1 | 首页 | A | 继续阅读卡 + 主编荐读 + 分类 chip + 推荐网格 + 排行榜 |
| 2 | 详情 | A | 头图渐隐 + 数据条 + 章节列表（续读高亮）+ 评分占比 + 浮动 CTA |
| 3 | 阅读 ⭐ | D | 点击切换工具栏 + 进度滑块 + 设置面板（字号/行距/4 种背景/字体） |
| 4 | 书架 | A | Tab + 网格/列表切换 + 进度可视化 + 已读完角标 |
| 5 | 发现 | A | Tab + 横向专题轮播 + 为你精选 + 换一批 |
| 6 | 搜索 | A | 历史 + 热搜榜 + 分类 chip + 猜你想看 |
| 7 | 个人中心 | A | 用户卡 + 周阅读柱状图 + 设置列表 |
| 8 | 浏览记录 | A | 按时间分组（今天/昨天/本周）+ 进度 |
| 9 | 登录 | A | 极简表单 + 密码可见切换 + 三方登录 |
| 10 | 注册 | A | 验证码 + 密码强度 + 阅读偏好选择 |

## 已实现的设计原则

### 移动端优先
- 全部以 375px 为设计基准
- 所有触控目标 ≥ 44pt
- 安全区适配（`pt-safe` / `pb-safe`）
- `prefers-reduced-motion` 已支持

### 主题系统
- **仅深浅两种模式**（取消 5 个主题）
- localStorage 跨页同步：`xs-theme: light | dark`
- 自动跟随系统偏好（首次访问）
- 任何按钮加 `data-theme-toggle` 即可切换

### 视觉资产
- **SVG 占位封面**：通过 `XS.cover({variant, title, sub})` 生成
- 6 种 variant 色板覆盖不同分类
- **SVG 图标库**：通过 `XS.icon('name', cls)` 调用
- 26+ 常用图标（home / shelf / star / heart 等）

### 共享组件
```js
XS.appHeader()                    // 顶部导航
XS.bottomNav('home')              // 底部导航（active 高亮）
XS.cover({variant, title, sub})   // 占位封面
XS.icon('search', 'w-5 h-5')      // SVG 图标
XS.ratingStars(9.2)               // 评分
```

## 测试建议

1. 用浏览器开发者工具切到 **iPhone 14 Pro** 或 **Pixel 7** 视图
2. 测试浅深模式切换（点击右上角太阳/月亮图标）
3. 走完整路径：首页 → 详情 → 阅读 → 设置面板（在阅读页尝试 4 种背景色）
4. 测试书架的 Tab 切换 / 网格/列表 视图切换

## 下一步

定稿后将进行：

1. **逐页过细节**：用户提出修改点，调整后定稿
2. **移植到 Vue 3 工程**（`ai-xsread-vue3/`）
   - 拆成 Vue SFC：AppHeader、BottomNav、BookCard、CoverPlaceholder、SettingsPanel 等
   - 沿用现有 Pinia stores 和 Vue Router
3. **引入 Reka UI** 处理复杂组件（Drawer / Dialog / Tabs / Toast）
4. **接入真实 AI 生图 API** 替换 SVG 占位封面
   - 候选：Stable Diffusion / Flux / 智谱 / 通义万相
   - 按分类生成不同 prompt 模板
   - 失败兜底 SVG，CDN 缓存

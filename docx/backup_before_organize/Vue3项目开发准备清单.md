# Vue3 小说阅读项目开发准备清单

> 文字之境 - Vue3版本开发准备文档  
> 项目经理: AI Assistant  
> 创建日期: 2025-10-27

---

## 📋 项目概述

### 项目名称
文字之境 - 女性向小说阅读网站 (Vue3版本)

### 项目目标
将现有的HTML/CSS/JS高保真页面重构为Vue3单页应用(SPA),实现前后端分离架构,最终部署在阿里云Linux服务器(宝塔面板)

### 技术栈选型
- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI组件库**: 待定(可选: Element Plus / Naive UI / Ant Design Vue)
- **CSS方案**: Tailwind CSS + CSS Variables
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **HTTP客户端**: Axios
- **部署环境**: 阿里云Linux + 宝塔面板

---

## 📦 一、开发环境准备

### 1.1 本地开发工具

#### 必装软件
```
✅ Node.js (推荐 v18.x 或 v20.x LTS版本)
   下载地址: https://nodejs.org/
   验证命令: node --version

✅ npm/pnpm/yarn (包管理器,推荐pnpm)
   安装pnpm: npm install -g pnpm
   验证命令: pnpm --version

✅ Git (版本控制)
   下载地址: https://git-scm.com/
   验证命令: git --version

✅ Visual Studio Code (代码编辑器)
   下载地址: https://code.visualstudio.com/
```

#### VS Code 推荐插件
```
✅ Volar (Vue 3开发必备)
✅ TypeScript Vue Plugin (Volar)
✅ ESLint (代码规范)
✅ Prettier (代码格式化)
✅ Tailwind CSS IntelliSense (Tailwind提示)
✅ Vue VSCode Snippets (代码片段)
✅ Auto Rename Tag (自动重命名标签)
✅ Path Intellisense (路径提示)
✅ GitLens (Git增强)
```

### 1.2 服务器环境准备

#### 阿里云服务器配置
```
✅ 服务器操作系统: Linux (CentOS 7+ / Ubuntu 20.04+)
✅ 宝塔面板: 已安装 ✓
✅ Node.js环境管理器 (推荐通过宝塔安装 PM2)
✅ Nginx (宝塔自带,用于反向代理和静态文件服务)
✅ SSL证书 (推荐配置HTTPS)
```

#### 宝塔面板需要安装的软件
```
1. Nginx 1.20+
2. PM2管理器 (用于管理Node.js应用)
3. MySQL 5.7+ / 8.0 (如果需要数据库)
4. Redis (如果需要缓存)
5. SSL证书管理器
```

---

## 📂 二、项目结构规划

### 2.1 推荐的Vue3项目结构

```
AI_XsRead_Vue3/
├── public/                      # 静态资源目录
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── assets/                  # 资源文件
│   │   ├── images/             # 图片
│   │   ├── fonts/              # 字体文件
│   │   └── styles/             # 全局样式
│   │       ├── index.css       # 主样式文件
│   │       ├── tailwind.css    # Tailwind基础样式
│   │       └── themes/         # 主题样式
│   │           ├── rose.css
│   │           ├── elegant.css
│   │           └── vintage.css
│   ├── components/              # 公共组件
│   │   ├── common/             # 通用组件
│   │   │   ├── AppHeader.vue   # 顶部导航
│   │   │   ├── AppFooter.vue   # 页脚
│   │   │   ├── BottomNav.vue   # 移动端底部导航
│   │   │   ├── ThemeSelector.vue # 主题选择器
│   │   │   └── LoadingSpinner.vue # 加载动画
│   │   ├── novel/              # 小说相关组件
│   │   │   ├── NovelCard.vue   # 小说卡片
│   │   │   ├── BookCover.vue   # 书籍封面
│   │   │   └── ChapterList.vue # 章节列表
│   │   └── reading/            # 阅读相关组件
│   │       ├── ReadingArea.vue # 阅读区域
│   │       ├── ReadingControl.vue # 阅读控制栏
│   │       └── ProgressBar.vue # 进度条
│   ├── views/                   # 页面组件
│   │   ├── HomePage.vue        # 首页(发现)
│   │   ├── RecommendPage.vue   # 推荐页
│   │   ├── BookshelfPage.vue   # 书架页
│   │   └── ReadingPage.vue     # 阅读页
│   ├── router/                  # 路由配置
│   │   └── index.js
│   ├── stores/                  # Pinia状态管理
│   │   ├── theme.js            # 主题状态
│   │   ├── user.js             # 用户状态
│   │   ├── novel.js            # 小说状态
│   │   └── reading.js          # 阅读状态
│   ├── api/                     # API接口
│   │   ├── request.js          # Axios封装
│   │   ├── novel.js            # 小说相关接口
│   │   ├── user.js             # 用户相关接口
│   │   └── chapter.js          # 章节相关接口
│   ├── utils/                   # 工具函数
│   │   ├── theme.js            # 主题管理工具
│   │   ├── storage.js          # 本地存储工具
│   │   ├── format.js           # 格式化工具
│   │   └── constants.js        # 常量定义
│   ├── composables/             # 组合式函数(Hooks)
│   │   ├── useTheme.js         # 主题Hook
│   │   ├── useReading.js       # 阅读Hook
│   │   └── useBookshelf.js     # 书架Hook
│   ├── App.vue                  # 根组件
│   └── main.js                  # 入口文件
├── .env.development             # 开发环境配置
├── .env.production              # 生产环境配置
├── .eslintrc.cjs                # ESLint配置
├── .prettierrc                  # Prettier配置
├── .gitignore                   # Git忽略文件
├── index.html                   # HTML模板
├── package.json                 # 项目依赖
├── vite.config.js               # Vite配置
├── tailwind.config.js           # Tailwind配置
└── README.md                    # 项目说明
```

---

## 📝 三、技术文档准备

### 3.1 需求文档

#### ✅ 功能需求文档 (已分析)
基于现有高保真页面,需要实现的功能:

**核心功能模块**
```
1. 首页(发现)模块
   - 瀑布流布局展示
   - 小说卡片交互
   - 分类标签
   - 加载更多

2. 推荐页模块
   - 本周必读
   - 热门榜单
   - 作者心声
   - 分类精选

3. 书架模块
   - 正在读
   - 已读完
   - 收藏夹
   - 阅读统计

4. 阅读模块
   - 章节阅读
   - 阅读进度保存
   - 章节导航
   - 书签功能
   - 阅读设置

5. 主题系统
   - 三套主题切换
   - 明暗模式
   - 本地持久化

6. 用户系统(新增)
   - 用户登录/注册
   - 个人信息管理
   - 阅读历史
   - 收藏管理
```

### 3.2 UI/UX设计文档

#### ✅ 设计规范
```markdown
# 设计规范文档

## 主题色彩系统
### 玫瑰温情
- 主色: #d95468
- 辅助色: #ed7654
- 点缀色: #FFBAAC

### 雅致高级
- 主色: #759148
- 辅助色: #FFBAAC
- 点缀色: #E9EDF0

### 文物古韵
- 主色: #FA8F79
- 辅助色: #6BA16D
- 点缀色: #A2BB6A

## 字体规范
- 主字体: 'Noto Serif SC', serif
- 标题字号: 1.5rem - 3rem
- 正文字号: 1rem - 1.125rem
- 阅读字号: 1.125rem (行高2.2)

## 间距规范
- 页面边距: 1rem - 2rem
- 卡片间距: 1rem
- 组件内边距: 0.5rem - 1.5rem

## 断点规范
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
```

### 3.3 API接口文档

#### ✅ 需要准备的接口文档模板

```markdown
# API接口文档

## 基础配置
- 基础URL: https://api.yourdomain.com
- 请求格式: JSON
- 响应格式: JSON
- 认证方式: JWT Token

## 接口列表

### 1. 小说相关接口

#### 1.1 获取小说列表
**接口地址**: GET /api/novels
**请求参数**:
- page: 页码(int)
- pageSize: 每页数量(int)
- category: 分类(string, 可选)

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "时光里的温柔相遇",
        "author": "温柔笔触",
        "category": "都市言情",
        "wordCount": 128000,
        "likes": 2300,
        "description": "那年春天...",
        "cover": "url",
        "updateTime": "2025-10-24"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 1.2 获取小说详情
**接口地址**: GET /api/novels/:id

#### 1.3 获取章节列表
**接口地址**: GET /api/novels/:id/chapters

#### 1.4 获取章节内容
**接口地址**: GET /api/chapters/:id

### 2. 用户相关接口

#### 2.1 用户登录
**接口地址**: POST /api/auth/login

#### 2.2 用户注册
**接口地址**: POST /api/auth/register

#### 2.3 获取用户信息
**接口地址**: GET /api/user/profile

### 3. 书架相关接口

#### 3.1 获取书架列表
**接口地址**: GET /api/bookshelf

#### 3.2 添加到书架
**接口地址**: POST /api/bookshelf

#### 3.3 移除书架
**接口地址**: DELETE /api/bookshelf/:id

### 4. 阅读相关接口

#### 4.1 保存阅读进度
**接口地址**: POST /api/reading/progress

#### 4.2 获取阅读进度
**接口地址**: GET /api/reading/progress/:novelId
```

---

## 🔧 四、开发配置文件准备

### 4.1 package.json 依赖清单

```json
{
  "name": "ai-xsread-vue3",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix --ignore-path .gitignore",
    "format": "prettier --write src/"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.7",
    "axios": "^1.6.0",
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.1.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-plugin-vue": "^9.20.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0"
  }
}
```

### 4.2 Vite 配置文件

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3008,
    host: '0.0.0.0',
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // 后端API地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'utils': ['axios', 'lodash-es']
        }
      }
    }
  }
})
```

### 4.3 Tailwind 配置文件

```javascript
// tailwind.config.js
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
```

### 4.4 环境配置文件

```bash
# .env.development
VITE_APP_TITLE=文字之境-开发环境
VITE_APP_BASE_API=http://localhost:8000/api
VITE_APP_PORT=3008

# .env.production
VITE_APP_TITLE=文字之境
VITE_APP_BASE_API=https://api.yourdomain.com/api
```

---

## 📚 五、参考文档清单

### 5.1 必读官方文档

```
✅ Vue 3 官方文档: https://cn.vuejs.org/
✅ Vue Router 官方文档: https://router.vuejs.org/zh/
✅ Pinia 官方文档: https://pinia.vuejs.org/zh/
✅ Vite 官方文档: https://cn.vitejs.dev/
✅ Tailwind CSS 文档: https://tailwindcss.com/docs
✅ Axios 文档: https://axios-http.com/zh/
```

### 5.2 辅助学习资源

```
📖 Vue 3 Composition API 最佳实践
📖 前端工程化最佳实践
📖 Nginx配置指南
📖 宝塔面板使用手册
📖 阿里云ECS部署指南
```

---

## 🚀 六、部署准备清单

### 6.1 服务器配置清单

#### 基础环境
```bash
✅ 服务器IP地址: __________
✅ SSH登录密码: __________
✅ 宝塔面板地址: http://服务器IP:8888
✅ 宝塔面板账号: __________
✅ 宝塔面板密码: __________
```

#### 域名配置
```
✅ 域名: __________
✅ DNS解析: 已配置到服务器IP
✅ SSL证书: 待申请(可通过宝塔面板免费申请)
```

### 6.2 宝塔面板部署步骤

#### 前端部署(Vue3打包后的静态文件)
```bash
1. 本地构建
   pnpm run build
   # 生成 dist 目录

2. 上传到服务器
   - 在宝塔面板创建网站
   - 设置网站目录为 /www/wwwroot/xsread
   - 上传 dist 目录内容到网站目录

3. 配置Nginx
   - 配置SPA路由支持(history模式)
   - 配置gzip压缩
   - 配置缓存策略
   - 配置HTTPS

4. 测试访问
   - http://你的域名
   - https://你的域名 (如果配置了SSL)
```

#### Nginx配置示例
```nginx
# Nginx配置文件
server {
    listen 80;
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /www/wwwroot/xsread;
    index index.html;
    
    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理(如果需要)
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 6.3 后端API部署(如果有)

```bash
1. 上传后端代码到服务器
   /www/server/nodejs/api

2. 安装依赖
   cd /www/server/nodejs/api
   npm install --production

3. 使用PM2管理进程
   pm2 start app.js --name "xsread-api"
   pm2 save
   pm2 startup

4. 配置开机自启
   pm2 startup systemd
```

---

## 📋 七、开发流程清单

### 7.1 项目初始化阶段

```bash
✅ 第1步: 创建Vue3项目
pnpm create vite ai-xsread-vue3 --template vue
cd ai-xsread-vue3

✅ 第2步: 安装必要依赖
pnpm install
pnpm add vue-router pinia axios
pnpm add -D tailwindcss postcss autoprefixer

✅ 第3步: 初始化Tailwind
npx tailwindcss init -p

✅ 第4步: 配置项目结构
创建上述的目录结构

✅ 第5步: 配置路由和状态管理
创建router和stores目录

✅ 第6步: 迁移主题系统
将现有的theme.js改造为Vue3 Composable

✅ 第7步: Git初始化
git init
git add .
git commit -m "初始化项目"
```

### 7.2 开发阶段

```markdown
## Week 1: 基础框架搭建
- [ ] 项目初始化
- [ ] 路由配置
- [ ] 状态管理配置
- [ ] 公共组件开发(Header, Footer, BottomNav)
- [ ] 主题系统迁移

## Week 2: 核心页面开发
- [ ] 首页(发现)页面开发
- [ ] 推荐页面开发
- [ ] 书架页面开发
- [ ] 阅读页面开发

## Week 3: 功能完善
- [ ] API接口对接
- [ ] 用户系统集成
- [ ] 阅读进度保存
- [ ] 书架功能完善

## Week 4: 优化和测试
- [ ] 性能优化
- [ ] 移动端适配测试
- [ ] 兼容性测试
- [ ] Bug修复

## Week 5: 部署上线
- [ ] 打包构建
- [ ] 服务器部署
- [ ] 域名配置
- [ ] SSL证书配置
- [ ] 上线测试
```

---

## 🔍 八、注意事项和最佳实践

### 8.1 Windows开发环境注意事项

```bash
# 1. 路径分隔符
Windows使用反斜杠\,但在代码中统一使用正斜杠/

# 2. 命令分隔符
Windows PowerShell使用分号;分隔命令
例如: pnpm install ; pnpm run dev

# 3. 端口占用
检查端口: netstat -ano | findstr :3008
关闭进程: taskkill /PID 进程号 /F

# 4. 环境变量
Windows设置环境变量需要使用 SET 或在系统设置中配置
```

### 8.2 Vue3最佳实践

```javascript
// 1. 使用Composition API
// ✅ 推荐
<script setup>
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)

onMounted(() => {
  console.log('组件已挂载')
})
</script>

// 2. 组件命名规范
// ✅ 文件名使用 PascalCase: AppHeader.vue
// ✅ 组件注册使用 PascalCase: <AppHeader />

// 3. Props定义
// ✅ 推荐使用defineProps
const props = defineProps({
  title: {
    type: String,
    required: true
  }
})

// 4. Emits定义
// ✅ 推荐使用defineEmits
const emit = defineEmits(['update', 'delete'])
```

### 8.3 性能优化建议

```javascript
// 1. 组件懒加载
const HomePage = () => import('@/views/HomePage.vue')

// 2. 图片懒加载
// 使用vue3-lazy或自定义指令

// 3. 虚拟滚动
// 对于长列表使用 vue-virtual-scroller

// 4. 路由懒加载
{
  path: '/reading/:id',
  component: () => import('@/views/ReadingPage.vue')
}

// 5. 使用keep-alive缓存组件
<keep-alive>
  <router-view />
</keep-alive>
```

### 8.4 安全注意事项

```javascript
// 1. XSS防护
// Vue会自动转义内容,但使用v-html时要小心

// 2. CSRF防护
// Axios配置CSRF token

// 3. 敏感信息
// 不要将API密钥等敏感信息提交到Git
// 使用.env文件并添加到.gitignore

// 4. 请求加密
// 生产环境使用HTTPS
// 敏感数据传输时加密
```

---

## 📞 九、技术支持和资源

### 9.1 遇到问题时的解决途径

```
1. Vue官方文档: https://cn.vuejs.org/
2. Stack Overflow: 搜索相关问题
3. GitHub Issues: 查看框架的issue
4. Vue中文社区: https://www.vue3js.cn/
5. 掘金/思否: 技术博客和问答
```

### 9.2 推荐的学习资源

```
📺 视频教程:
- 黑马程序员 Vue3教程
- 尚硅谷 Vue3实战教程

📖 书籍:
- 《Vue.js设计与实现》
- 《深入浅出Vue.js》

🎯 实战项目:
- Vue3后台管理系统
- Vue3电商项目
```

---

## ✅ 十、开发启动检查清单

### 开发前自检(逐项打勾)

```
环境准备:
□ Node.js 已安装 (v18+)
□ pnpm/npm 已安装
□ Git 已安装
□ VS Code 已安装
□ VS Code插件已安装(Volar等)

知识储备:
□ 了解Vue3 Composition API
□ 了解Vue Router 4
□ 了解Pinia状态管理
□ 了解Tailwind CSS
□ 了解ES6+语法

文档准备:
□ 高保真页面已熟悉
□ 功能需求已明确
□ API接口文档已准备
□ 设计规范已了解

服务器准备:
□ 阿里云服务器已准备
□ 宝塔面板已安装
□ 域名已准备(可选)
□ SSH可以正常登录

代码管理:
□ Git仓库已创建
□ .gitignore 已配置
□ README.md 已编写
```

---

## 🎯 十一、项目里程碑

### 里程碑1: 项目搭建 (1周)
- 完成项目初始化
- 完成基础配置
- 完成公共组件开发
- 完成主题系统迁移

### 里程碑2: 核心功能开发 (2周)
- 完成4个核心页面开发
- 完成API对接
- 完成基础功能测试

### 里程碑3: 功能完善 (1周)
- 完成用户系统
- 完成数据持久化
- 完成交互优化

### 里程碑4: 测试优化 (1周)
- 完成功能测试
- 完成性能优化
- 完成兼容性测试

### 里程碑5: 部署上线 (3天)
- 完成打包构建
- 完成服务器部署
- 完成域名配置
- 完成上线验证

---

## 📊 附录: 技术选型对比

### UI组件库选择

| 组件库 | 优点 | 缺点 | 推荐度 |
|--------|------|------|--------|
| Element Plus | 组件丰富,文档完善 | 体积较大,定制化难 | ⭐⭐⭐⭐ |
| Naive UI | 轻量,TS支持好 | 社区相对小 | ⭐⭐⭐⭐⭐ |
| Ant Design Vue | 企业级,成熟稳定 | 体积大 | ⭐⭐⭐⭐ |
| 纯Tailwind | 完全自定义,轻量 | 开发工作量大 | ⭐⭐⭐⭐⭐ |

**本项目推荐**: 纯Tailwind CSS (因为高保真页面已经使用Tailwind,直接迁移最合适)

### 状态管理选择

| 方案 | 适用场景 | 本项目推荐 |
|------|---------|-----------|
| Pinia | 中大型项目,推荐 | ✅ 推荐 |
| Vuex 4 | 旧项目迁移 | ❌ |
| provide/inject | 小型项目 | ❌ |

---

## 📝 总结

这份文档包含了从零开始开发Vue3小说阅读项目所需的所有准备内容:

1. ✅ **开发环境**: 工具安装、插件配置
2. ✅ **项目结构**: 完整的目录规划
3. ✅ **技术文档**: 需求、设计、API文档模板
4. ✅ **配置文件**: 所有必要的配置文件模板
5. ✅ **参考资源**: 官方文档和学习资料
6. ✅ **部署方案**: 完整的宝塔面板部署步骤
7. ✅ **开发流程**: 详细的开发计划
8. ✅ **最佳实践**: 开发规范和注意事项

---

**接下来你可以**:

1. 按照"开发启动检查清单"逐项准备环境
2. 参考"项目初始化阶段"开始创建项目
3. 按照"开发流程清单"逐步推进开发
4. 最后按照"部署准备清单"部署到阿里云

**预计开发周期**: 4-6周 (根据团队规模和经验调整)

---

*文档版本: v1.0*  
*最后更新: 2025-10-27*  
*作者: AI Project Manager*


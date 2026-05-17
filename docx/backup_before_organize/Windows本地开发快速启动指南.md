# Windows本地开发快速启动指南

> Momo小说 - 从零开始的完整开发流程  
> 适用于: Windows系统本地开发  
> 创建日期: 2025-10-27

---

## 🎯 本指南目标

帮助你在Windows系统上快速搭建开发环境，包括:
1. ✅ 创建MySQL数据库
2. ✅ 初始化数据表和测试数据
3. ✅ 创建Vue3项目
4. ✅ 配置开发环境
5. ✅ 启动项目开始开发

---

## 📋 前置检查

### 确认已安装的环境

```powershell
# 1. 检查 Node.js (需要 v18+ 或 v20+)
node --version
# 输出示例: v20.10.0

# 2. 检查 npm
npm --version
# 输出示例: 10.2.3

# 3. 检查 MySQL (通过 phpMyAdmin 访问)
# 打开浏览器访问: http://127.0.0.1/phpmyadmin/
# 用户名: toefl_user
# 密码: mojz168168-
```

### 如果还没安装 pnpm (推荐)

```powershell
npm install -g pnpm
pnpm --version
```

---

## 🗄️ 第一步: 创建数据库

### 方法1: 使用 phpMyAdmin (推荐,可视化操作)

1. **打开 phpMyAdmin**
   ```
   浏览器访问: http://127.0.0.1/phpmyadmin/
   ```

2. **登录**
   - 用户名: `toefl_user`
   - 密码: `mojz168168-`

3. **创建数据库**
   - 点击顶部菜单 "数据库"
   - 在 "创建数据库" 输入框输入: `ai_xsread`
   - 排序规则选择: `utf8mb4_unicode_ci`
   - 点击 "创建" 按钮

4. **导入数据表**
   - 左侧点击刚创建的 `ai_xsread` 数据库
   - 点击顶部 "导入" 标签
   - 点击 "选择文件" 按钮
   - 选择文件: `H:\momo-ruanjiansheji\AI_XsRead\docx\database_init.sql`
   - 滚动到底部，点击 "执行" 按钮
   - 等待执行完成，看到成功提示

5. **导入测试数据**
   - 同样在 "导入" 页面
   - 选择文件: `H:\momo-ruanjiansheji\AI_XsRead\docx\test_data.sql`
   - 点击 "执行" 按钮
   - 等待执行完成

6. **验证**
   - 左侧点击 `ai_xsread` 数据库
   - 应该能看到 12 张表
   - 点击 `novels` 表，应该能看到 10 条测试数据

### 方法2: 使用 MySQL 命令行

```powershell
# 1. 打开 PowerShell 或 CMD

# 2. 登录 MySQL
mysql -u toefl_user -p
# 输入密码: mojz168168-

# 3. 执行初始化脚本
source H:/momo-ruanjiansheji/AI_XsRead/docx/database_init.sql

# 4. 执行测试数据脚本
source H:/momo-ruanjiansheji/AI_XsRead/docx/test_data.sql

# 5. 验证
USE ai_xsread;
SHOW TABLES;
SELECT COUNT(*) FROM novels;

# 6. 退出
EXIT;
```

---

## 🚀 第二步: 创建 Vue3 项目

### 1. 打开 PowerShell

```powershell
# 导航到项目根目录
cd H:\momo-ruanjiansheji\AI_XsRead
```

### 2. 创建 Vue3 项目

```powershell
# 使用 Vite 创建 Vue3 项目
pnpm create vite ai-xsread-vue3 --template vue

# 如果提示需要安装 create-vite，输入 y 确认
```

### 3. 进入项目目录

```powershell
cd ai-xsread-vue3

```

### 4. 安装核心依赖

```powershell
# 安装基础依赖
pnpm install

# 安装路由和状态管理
pnpm add vue-router@4 pinia

# 安装 HTTP 客户端
pnpm add axios

# 安装工具库
pnpm add lodash-es

# 安装 Tailwind CSS
pnpm add -D tailwindcss@3 postcss autoprefixer

# 初始化 Tailwind
npx tailwindcss init -p
```

### 5. 安装开发工具依赖

```powershell
# 安装 ESLint 和 Prettier
pnpm add -D eslint@8 eslint-plugin-vue@9 prettier@3
```

---

## ⚙️ 第三步: 配置项目

### 1. 配置 Tailwind CSS

**编辑 `tailwind.config.js`:**

```javascript
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

### 2. 创建 Tailwind 样式文件

**创建 `src/assets/styles/index.css`:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 导入 Google 字体 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700&display=swap');

/* 全局样式 */
body {
  font-family: 'Noto Serif SC', serif;
  margin: 0;
  padding: 0;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #e2e8f0;
}

::-webkit-scrollbar-thumb {
  background: #d95468;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  opacity: 0.8;
}
```

### 3. 配置 Vite

**编辑 `vite.config.js`:**

```javascript
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
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
})
```

### 4. 创建环境配置文件

**创建 `.env.development`:**

```bash
# 开发环境配置
VITE_APP_TITLE=Momo小说-开发环境
VITE_APP_BASE_API=http://localhost:8000/api
VITE_APP_PORT=3008
```

**创建 `.env.production`:**

```bash
# 生产环境配置
VITE_APP_TITLE=Momo小说
VITE_APP_BASE_API=https://api.yourdomain.com/api
```

### 5. 更新 package.json 脚本

**编辑 `package.json`，添加/修改 scripts:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix",
    "format": "prettier --write src/"
  }
}
```

---

## 📁 第四步: 创建项目目录结构

在项目根目录执行以下命令:

```powershell
# 创建目录结构
New-Item -ItemType Directory -Force -Path src/assets/styles
New-Item -ItemType Directory -Force -Path src/assets/images
New-Item -ItemType Directory -Force -Path src/components/common
New-Item -ItemType Directory -Force -Path src/components/novel
New-Item -ItemType Directory -Force -Path src/components/reading
New-Item -ItemType Directory -Force -Path src/views
New-Item -ItemType Directory -Force -Path src/router
New-Item -ItemType Directory -Force -Path src/stores
New-Item -ItemType Directory -Force -Path src/api
New-Item -ItemType Directory -Force -Path src/utils
New-Item -ItemType Directory -Force -Path src/composables
```

---

## 🔧 第五步: 创建基础配置文件

### 1. 创建路由配置

**创建 `src/router/index.js`:**

```javascript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue')
    },
    {
      path: '/recommend',
      name: 'recommend',
      component: () => import('@/views/RecommendPage.vue')
    },
    {
      path: '/bookshelf',
      name: 'bookshelf',
      component: () => import('@/views/BookshelfPage.vue')
    },
    {
      path: '/reading/:id',
      name: 'reading',
      component: () => import('@/views/ReadingPage.vue')
    }
  ]
})

export default router
```

### 2. 创建 Pinia Store

**创建 `src/stores/theme.js`:**

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref(localStorage.getItem('theme') || 'rose')
  const currentMode = ref(localStorage.getItem('mode') || 'light')

  function setTheme(theme) {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
  }

  function toggleMode() {
    currentMode.value = currentMode.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('mode', currentMode.value)
  }

  return {
    currentTheme,
    currentMode,
    setTheme,
    toggleMode
  }
})
```

### 3. 创建 Axios 封装

**创建 `src/api/request.js`:**

```javascript
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      console.error('API Error:', res.message)
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res
  },
  error => {
    console.error('Network Error:', error)
    return Promise.reject(error)
  }
)

export default request
```

### 4. 更新 main.js

**编辑 `src/main.js`:**

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
```

### 5. 创建简单的首页

**创建 `src/views/HomePage.vue`:**

```vue
<template>
  <div class="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-8">
    <div class="max-w-4xl mx-auto">
      <header class="text-center mb-12">
        <h1 class="text-5xl font-bold text-rose-primary mb-4">
          Momo小说
        </h1>
        <p class="text-xl text-gray-600">
          故事入境，杂念自消
        </p>
      </header>

      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">
          🎉 开发环境搭建成功！
        </h2>
        
        <div class="space-y-4 text-gray-600">
          <p>✅ Vue 3 + Vite 运行正常</p>
          <p>✅ Vue Router 配置完成</p>
          <p>✅ Pinia 状态管理就绪</p>
          <p>✅ Tailwind CSS 样式可用</p>
          <p>✅ Axios 请求封装完成</p>
        </div>

        <div class="mt-8 p-4 bg-rose-50 rounded-lg">
          <p class="text-sm text-rose-700">
            <strong>下一步:</strong> 开始开发核心组件和页面
          </p>
        </div>
      </div>

      <div class="mt-8 grid grid-cols-3 gap-4">
        <router-link 
          to="/" 
          class="bg-rose-primary text-white py-4 px-6 rounded-xl text-center hover:opacity-90 transition"
        >
          发现
        </router-link>
        <router-link 
          to="/recommend" 
          class="bg-rose-secondary text-white py-4 px-6 rounded-xl text-center hover:opacity-90 transition"
        >
          推荐
        </router-link>
        <router-link 
          to="/bookshelf" 
          class="bg-purple-500 text-white py-4 px-6 rounded-xl text-center hover:opacity-90 transition"
        >
          书架
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// 可以在这里添加逻辑
</script>
```

### 6. 更新 App.vue

**编辑 `src/App.vue`:**

```vue
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// 全局逻辑
</script>

<style>
/* 全局样式 */
</style>
```

---

## 🎨 第六步: 启动后端服务器

### 1. 安装后端依赖

```powershell
# 进入后端目录
cd H:\momo-ruanjiansheji\AI_XsRead\backend

# 安装依赖
npm install
```

### 2. 配置环境变量

后端的 `.env` 文件已预配置，默认配置如下：
```env
PORT=8000
DB_HOST=127.0.0.1
DB_USER=toefl_user
DB_PASSWORD=mojz168168-
DB_DATABASE=ai_xsread
```

如果需要修改，请编辑 `backend/.env` 文件。

### 3. 启动后端服务

```powershell
# 开发模式（支持热重载）
npm run dev

# 或者生产模式
npm start
```

你应该会看到类似输出：
```
🔍 正在测试数据库连接...
✅ 数据库连接成功

========================================
🚀 Momo小说后端服务启动成功！
========================================
📍 服务地址: http://localhost:8000
🌍 环境模式: development
📊 API文档: http://localhost:8000/api/health
========================================

✅ 可用的API端点:
  - POST   /api/auth/register       用户注册
  - POST   /api/auth/login          用户登录
  - GET    /api/novels              获取小说列表
  - GET    /api/novels/:id          获取小说详情
  ...
```

### 4. 测试后端API

在浏览器中访问: `http://localhost:8000/api/health`

应该看到：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "healthy",
    "timestamp": 1698765432000,
    "uptime": 5.123
  }
}
```

---

## 🎨 第七步: 启动前端服务器

### 1. 打开新的终端

保持后端服务运行，打开**新的 PowerShell 窗口**。

### 2. 启动前端项目

```powershell
# 进入前端目录
cd H:\momo-ruanjiansheji\AI_XsRead\ai-xsread-vue3

# 启动开发服务器
pnpm run dev
```

你应该会看到类似输出:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3008/
  ➜  Network: http://192.168.x.x:3008/
  ➜  press h + enter to show help
```

浏览器会自动打开 `http://localhost:3008/`，你应该能看到欢迎页面！

### 3. 一键启动脚本（可选）

如果需要同时启动前后端，可以使用以下命令：

```powershell
# 后端和前端同时启动（使用分号分隔）
cd H:\momo-ruanjiansheji\AI_XsRead

# 方式1: 先启动后端（后台运行），再启动前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Sleep -Seconds 3
cd ai-xsread-vue3; pnpm run dev

# 方式2: 使用串行命令（推荐手动分别启动）
# 终端1: cd backend ; npm run dev
# 终端2: cd ai-xsread-vue3 ; pnpm run dev
```

---

## ✅ 验证检查清单

### 数据库验证
```powershell
# 打开 phpMyAdmin
# http://127.0.0.1/phpmyadmin/

# 检查项:
□ 数据库 ai_xsread 存在
□ 共有 12 张表
□ novels 表有 10 条数据
□ chapters 表有 5 条数据
□ users 表有测试用户
```

### 后端服务验证
```powershell
# 1. 服务能正常启动
□ npm run dev 无错误
□ 看到 "🚀 Momo小说后端服务启动成功！" 提示

# 2. 数据库连接正常
□ 看到 "✅ 数据库连接成功" 提示

# 3. API接口可访问
□ http://localhost:8000 返回服务信息
□ http://localhost:8000/api/health 返回健康状态

# 4. 测试API接口（可选）
□ POST /api/auth/register 可以注册用户
□ POST /api/auth/login 可以登录
□ GET /api/novels 可以获取小说列表
```

### 前端项目验证
```powershell
# 1. 项目能正常启动
□ pnpm run dev 无错误

# 2. 浏览器访问正常
□ http://localhost:3008 能打开
□ 看到欢迎页面

# 3. 路由工作正常
□ 点击导航能切换页面

# 4. 开发工具正常
□ Vue DevTools 能检测到 Vue 应用
□ 热更新 (HMR) 工作正常

# 5. 前后端联调正常
□ 前端可以调用后端API
□ Network 面板能看到请求成功
```

---

## 🐛 常见问题解决

### 问题1: pnpm 命令不存在
```powershell
# 解决方案: 安装 pnpm
npm install -g pnpm
```

### 问题2: MySQL 连接失败
```
# 检查:
1. XAMPP/WAMP 中的 MySQL 服务是否启动
2. 用户名密码是否正确
3. 端口是否被占用 (默认3306)
```

### 问题3: 端口 3008 被占用
```powershell
# 编辑 vite.config.js，修改端口
server: {
  port: 3001,  // 改成其他端口
  // ...
}
```

### 问题4: Tailwind 样式不生效
```
# 检查:
1. tailwind.config.js 的 content 配置是否正确
2. main.js 是否导入了 index.css
3. 尝试重启开发服务器
```

### 问题5: 路径别名 @ 不工作
```javascript
// 确保 vite.config.js 配置了:
import path from 'path'

resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### 问题6: 后端数据库连接失败
```
错误信息: ❌ 数据库连接失败

解决方案:
1. 确认 MySQL 服务已启动
2. 检查 backend/.env 中的数据库配置
3. 确认数据库 ai_xsread 已创建
4. 测试数据库连接: 
   打开 http://127.0.0.1/phpmyadmin/
   用户名: toefl_user
   密码: mojz168168-
```

### 问题7: 后端端口 8000 被占用
```powershell
# 错误信息: Error: listen EADDRINUSE: address already in use :::8000

# 解决方案1: 修改端口
# 编辑 backend/.env，修改 PORT
PORT=8001

# 解决方案2: 关闭占用端口的程序
# 查找占用端口的进程
netstat -ano | findstr :8000

# 结束进程 (PID是上一步查到的进程ID)
taskkill /PID <进程ID> /F
```

### 问题8: 后端模块未找到
```
错误信息: Error: Cannot find module 'express'

解决方案:
1. 确保在 backend 目录下执行 npm install
2. 删除 node_modules 文件夹后重新安装
   cd backend
   rmdir /s node_modules
   npm install
```

### 问题9: JWT 令牌验证失败
```
错误信息: 无效的令牌

解决方案:
1. 检查请求头格式: Authorization: Bearer <token>
2. 确认令牌未过期（2小时有效期）
3. 使用 /api/auth/refresh 刷新令牌
4. 重新登录获取新令牌
```

### 问题10: 前端请求后端 CORS 错误
```
错误信息: Access to XMLHttpRequest has been blocked by CORS policy

解决方案:
1. 确认后端服务已启动
2. 检查前端 vite.config.js 中的代理配置
3. 检查后端 .env 中的 CORS_ORIGIN 配置
4. 重启前后端服务
```

---

## 📊 开发进度跟踪

### 第一周任务
- [x] 搭建开发环境
- [x] 创建数据库
- [x] 初始化 Vue3 项目
- [ ] 开发公共组件 (Header, Footer, BottomNav)
- [ ] 迁移主题系统

### 第二周任务
- [ ] 开发首页(发现)
- [ ] 开发推荐页
- [ ] 开发书架页
- [ ] 开发阅读页

---

## 🎯 下一步计划

1. **开发公共组件**
   - AppHeader.vue (顶部导航)
   - AppFooter.vue (页脚)
   - BottomNav.vue (移动端底部导航)
   - ThemeSelector.vue (主题选择器)

2. **实现主题系统**
   - 从高保真页面迁移 theme.js
   - 转换为 Vue3 Composable
   - 实现主题切换功能

3. **开发核心页面**
   - HomePage.vue (首页瀑布流)
   - RecommendPage.vue (推荐页)
   - BookshelfPage.vue (书架页)
   - ReadingPage.vue (阅读页)

---

## 📞 获取帮助

如果遇到问题:
1. 查看本文档的"常见问题解决"部分
2. 查看 Vue3项目开发准备清单.md
3. 查看 API接口设计文档.md
4. 查看 数据库设计文档.md

---

## 🎉 恭喜！

如果你完成了所有步骤，现在你已经拥有:
- ✅ 完整的 MySQL 数据库
- ✅ 可运行的 Vue3 开发环境
- ✅ 完整的项目结构
- ✅ 基础配置文件
- ✅ 测试数据

**现在可以开始愉快地开发了！** 🚀

---

*文档版本: v1.0*  
*最后更新: 2025-10-27*  
*适用于: Windows 本地开发*


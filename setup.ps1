# ============================================
# 文字之境 - Windows自动化安装脚本
# 版本: v1.0
# 创建日期: 2025-10-27
# 适用于: Windows PowerShell
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   文字之境 - 自动化安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置错误处理
$ErrorActionPreference = "Stop"

# ============================================
# 1. 检查前置条件
# ============================================
Write-Host "步骤 1/6: 检查前置条件..." -ForegroundColor Yellow

# 检查 Node.js
Write-Host "  检查 Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    Write-Host " ✓ 已安装 ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host " ✗ 未安装" -ForegroundColor Red
    Write-Host "  请先安装 Node.js: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 检查 pnpm
Write-Host "  检查 pnpm..." -NoNewline
try {
    $pnpmVersion = pnpm --version 2>$null
    Write-Host " ✓ 已安装 ($pnpmVersion)" -ForegroundColor Green
} catch {
    Write-Host " ! 未安装，正在安装..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host " ✓ pnpm 安装完成" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 2. 创建 Vue3 项目
# ============================================
Write-Host "步骤 2/6: 创建 Vue3 项目..." -ForegroundColor Yellow

$projectName = "ai-xsread-vue3"
$projectPath = Join-Path $PSScriptRoot $projectName

if (Test-Path $projectPath) {
    Write-Host "  项目目录已存在，是否删除重建? (y/n): " -ForegroundColor Yellow -NoNewline
    $confirm = Read-Host
    if ($confirm -eq 'y') {
        Remove-Item -Recurse -Force $projectPath
        Write-Host "  ✓ 已删除旧项目" -ForegroundColor Green
    } else {
        Write-Host "  ! 跳过项目创建" -ForegroundColor Yellow
        Set-Location $projectPath
    }
}

if (-not (Test-Path $projectPath)) {
    Write-Host "  创建 Vite + Vue3 项目..." -ForegroundColor Cyan
    pnpm create vite $projectName --template vue
    Set-Location $projectPath
    Write-Host "  ✓ 项目创建成功" -ForegroundColor Green
}

Write-Host ""

# ============================================
# 3. 安装依赖
# ============================================
Write-Host "步骤 3/6: 安装项目依赖..." -ForegroundColor Yellow

Write-Host "  安装基础依赖..." -ForegroundColor Cyan
pnpm install

Write-Host "  安装核心库..." -ForegroundColor Cyan
pnpm add vue-router@4 pinia axios lodash-es

Write-Host "  安装 Tailwind CSS..." -ForegroundColor Cyan
pnpm add -D tailwindcss@3 postcss autoprefixer

Write-Host "  安装开发工具..." -ForegroundColor Cyan
pnpm add -D eslint@8 eslint-plugin-vue@9 prettier@3

Write-Host "  ✓ 依赖安装完成" -ForegroundColor Green
Write-Host ""

# ============================================
# 4. 初始化 Tailwind
# ============================================
Write-Host "步骤 4/6: 初始化 Tailwind CSS..." -ForegroundColor Yellow
npx tailwindcss init -p
Write-Host "  ✓ Tailwind 配置文件已创建" -ForegroundColor Green
Write-Host ""

# ============================================
# 5. 创建目录结构
# ============================================
Write-Host "步骤 5/6: 创建项目目录结构..." -ForegroundColor Yellow

$directories = @(
    "src/assets/styles",
    "src/assets/images",
    "src/components/common",
    "src/components/novel",
    "src/components/reading",
    "src/views",
    "src/router",
    "src/stores",
    "src/api",
    "src/utils",
    "src/composables"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path $PSScriptRoot $projectName $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
        Write-Host "  ✓ 创建: $dir" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================
# 6. 创建配置文件
# ============================================
Write-Host "步骤 6/6: 创建配置文件..." -ForegroundColor Yellow

# 创建 Tailwind 配置
$tailwindConfig = @"
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
"@
$tailwindConfig | Out-File -FilePath "tailwind.config.js" -Encoding UTF8
Write-Host "  ✓ tailwind.config.js" -ForegroundColor Green

# 创建样式文件
$cssContent = @"
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Noto Serif SC', serif;
  margin: 0;
  padding: 0;
}

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
"@
$cssContent | Out-File -FilePath "src/assets/styles/index.css" -Encoding UTF8
Write-Host "  ✓ src/assets/styles/index.css" -ForegroundColor Green

# 创建环境配置文件
$envDev = @"
# 开发环境配置
VITE_APP_TITLE=文字之境-开发环境
VITE_APP_BASE_API=http://localhost:8000/api
VITE_APP_PORT=3008
"@
$envDev | Out-File -FilePath ".env.development" -Encoding UTF8
Write-Host "  ✓ .env.development" -ForegroundColor Green

$envProd = @"
# 生产环境配置
VITE_APP_TITLE=文字之境
VITE_APP_BASE_API=https://api.yourdomain.com/api
"@
$envProd | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Host "  ✓ .env.production" -ForegroundColor Green

# 创建 Vite 配置
$viteConfig = @"
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
"@
$viteConfig | Out-File -FilePath "vite.config.js" -Encoding UTF8 -Force
Write-Host "  ✓ vite.config.js" -ForegroundColor Green

# 创建路由文件
$routerContent = @"
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
"@
$routerContent | Out-File -FilePath "src/router/index.js" -Encoding UTF8
Write-Host "  ✓ src/router/index.js" -ForegroundColor Green

# 创建 Store
$storeContent = @"
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
"@
$storeContent | Out-File -FilePath "src/stores/theme.js" -Encoding UTF8
Write-Host "  ✓ src/stores/theme.js" -ForegroundColor Green

# 创建 API 封装
$apiContent = @"
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = ``Bearer `${token}``
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

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
"@
$apiContent | Out-File -FilePath "src/api/request.js" -Encoding UTF8
Write-Host "  ✓ src/api/request.js" -ForegroundColor Green

# 创建 HomePage
$homePageContent = @"
<template>
  <div class="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-8">
    <div class="max-w-4xl mx-auto">
      <header class="text-center mb-12">
        <h1 class="text-5xl font-bold text-rose-primary mb-4">
          文字之境
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
// 首页逻辑
</script>
"@
$homePageContent | Out-File -FilePath "src/views/HomePage.vue" -Encoding UTF8
Write-Host "  ✓ src/views/HomePage.vue" -ForegroundColor Green

# 更新 main.js
$mainContent = @"
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
"@
$mainContent | Out-File -FilePath "src/main.js" -Encoding UTF8 -Force
Write-Host "  ✓ src/main.js" -ForegroundColor Green

# 更新 App.vue
$appContent = @"
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
"@
$appContent | Out-File -FilePath "src/App.vue" -Encoding UTF8 -Force
Write-Host "  ✓ src/App.vue" -ForegroundColor Green

Write-Host ""

# ============================================
# 完成
# ============================================
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✓ 项目初始化完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "下一步操作:" -ForegroundColor Cyan
Write-Host "  1. 创建数据库 (参考 docx/Windows本地开发快速启动指南.md)" -ForegroundColor Yellow
Write-Host "  2. 启动开发服务器:" -ForegroundColor Yellow
Write-Host "     cd $projectName" -ForegroundColor White
Write-Host "     pnpm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  3. 浏览器访问: http://localhost:3008" -ForegroundColor Yellow
Write-Host ""

Write-Host "参考文档:" -ForegroundColor Cyan
Write-Host "  - docx/Windows本地开发快速启动指南.md" -ForegroundColor White
Write-Host "  - docx/Vue3项目开发准备清单.md" -ForegroundColor White
Write-Host "  - docx/数据库设计文档.md" -ForegroundColor White
Write-Host ""

Write-Host "祝开发愉快！🚀" -ForegroundColor Green
Write-Host ""


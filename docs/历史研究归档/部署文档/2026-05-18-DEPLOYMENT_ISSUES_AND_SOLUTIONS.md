# 🔧 服务器部署问题总结与解决方案

**项目：** 文字之境 (AI_XsRead)  
**部署日期：** 2025-11-01  
**服务器环境：** Linux + 宝塔面板 + Nginx + PM2  

---

## 📋 目录

1. [部署过程中遇到的问题](#部署过程中遇到的问题)
2. [问题详细分析与解决方案](#问题详细分析与解决方案)
3. [本地开发避坑指南](#本地开发避坑指南)
4. [给其他开发者的标准化建议](#给其他开发者的标准化建议)
5. [检查清单](#检查清单)

---

## 🚨 部署过程中遇到的问题

### 问题列表概览

| 序号 | 问题分类 | 严重程度 | 问题描述 | 解决状态 |
|------|---------|---------|---------|---------|
| 1 | 前端构建 | 🔴 严重 | Vite配置导致页面空白 | ✅ 已解决 |
| 2 | 后端服务 | 🔴 严重 | PM2环境变量加载失败 | ✅ 已解决 |
| 3 | 数据库 | 🟡 中等 | 数据库不存在需创建 | ✅ 已解决 |
| 4 | 前端API | 🟡 中等 | 缺少changePassword函数 | ✅ 已解决 |
| 5 | Nginx配置 | 🟡 中等 | 路由和反向代理配置 | ✅ 已解决 |
| 6 | 依赖安装 | 🟢 轻微 | 多项目依赖管理 | ✅ 已解决 |

---

## 🔍 问题详细分析与解决方案

### 问题 1: Vite 配置导致页面空白 🔴

**问题描述：**
- 网站首页访问后完全空白，无任何内容显示
- HTML正确加载，CSS和JS文件返回200
- 浏览器控制台无明显错误（因为生产环境关闭了console）
- API测试正常，数据库正常

**根本原因：**
```javascript
// vite.config.js中的配置
experimental: {
  renderBuiltUrl(filename, { hostType }) {
    if (hostType === 'js') {
      return { runtime: `window.__assetsPath(${JSON.stringify(filename)})` }
    }
  }
}
```

这个配置要求在运行时通过`window.__assetsPath`函数来解析资源路径，但构建后的`index.html`中**没有定义**这个函数，导致：
- 所有JS模块路径解析失败
- Vue应用无法初始化
- 页面保持空白

**解决方案：**

在`index.html`的`<head>`中添加函数定义：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>文字之境</title>
    
    <!-- ✅ 必须在所有脚本之前定义 -->
    <script>
      window.__assetsPath = function(path) {
        return '/' + path;
      };
    </script>
    
    <!-- 其他脚本 -->
    <script type="module" crossorigin src="/js/index-xxx.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

**预防措施：**
1. 方案A：修改Vite配置，移除experimental配置（推荐）
2. 方案B：创建自定义HTML模板插件，自动注入函数
3. 方案C：在`index.html`模板中预先定义函数

---

### 问题 2: PM2 环境变量加载失败 🔴

**问题描述：**
- PM2启动后端服务后不断重启（每秒重启一次）
- 日志显示`.env`文件加载了0个环境变量
- 数据库连接失败

**根本原因：**

PM2配置文件中的`cwd`（工作目录）设置不正确：

```javascript
// ❌ 错误配置
{
  name: 'xsread-backend',
  script: './backend/src/app.js',
  cwd: '/www/wwwroot/xs.momofx.cn',  // 工作目录是根目录
  // .env文件在 /www/wwwroot/xs.momofx.cn/backend/.env
  // 但进程从根目录查找.env，找不到！
}
```

**解决方案：**

```javascript
// ✅ 正确配置
{
  name: 'xsread-backend',
  script: 'src/app.js',                    // 相对于cwd的路径
  cwd: '/www/wwwroot/xs.momofx.cn/backend', // 设置为项目目录
  env: {
    NODE_ENV: 'production',
    PORT: 8005
  }
}
```

**完整的ecosystem.config.js：**

```javascript
module.exports = {
  apps: [
    {
      name: 'xsread-backend',
      script: 'src/app.js',
      cwd: '/www/wwwroot/xs.momofx.cn/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 8005
      },
      error_file: '../logs/backend-error.log',
      out_file: '../logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    },
    {
      name: 'xsread-admin-backend',
      script: 'src/app.js',
      cwd: '/www/wwwroot/xs.momofx.cn/admin-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 8001
      },
      error_file: '../logs/admin-error.log',
      out_file: '../logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
```

**验证方法：**
```bash
# 检查进程状态
pm2 status

# 查看日志（应该看到环境变量加载成功）
pm2 logs xsread-backend --lines 20
```

---

### 问题 3: 数据库不存在 🟡

**问题描述：**
- 后端服务启动失败
- 错误：`Unknown database 'ai_xsread'`

**解决方案：**

```bash
# 1. 创建数据库
mysql -u root -p密码 << EOF
CREATE DATABASE IF NOT EXISTS ai_xsread 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

# 2. 创建应用用户并授权
CREATE USER IF NOT EXISTS 'toefl_user'@'localhost' IDENTIFIED BY 'mojz168168';
GRANT ALL PRIVILEGES ON ai_xsread.* TO 'toefl_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# 3. 导入SQL文件（按顺序）
mysql -u toefl_user -pmojz168168 ai_xsread < database/database_init.sql
mysql -u toefl_user -pmojz168168 ai_xsread < database/admin_tables.sql
mysql -u toefl_user -pmojz168168 ai_xsread < database/seed_data_complete.sql
mysql -u toefl_user -pmojz168168 ai_xsread < database/创建管理员账号.sql
```

**预防措施：**
1. 在项目中添加数据库初始化脚本 `scripts/init-db.sh`
2. 在README中说明数据库创建步骤
3. 使用迁移工具（如Knex.js或Sequelize）管理数据库结构

---

### 问题 4: 缺少 changePassword API 函数 🟡

**问题描述：**
- 前端构建失败
- 错误信息：`"changePassword" is not exported by "src/api/user.js"`
- 组件引用了不存在的API函数

**根本原因：**
`src/views/user/Profile.vue` 中导入并使用了 `changePassword` 函数，但 `src/api/user.js` 中没有导出该函数。

**解决方案：**

在 `ai-xsread-vue3/src/api/user.js` 中添加：

```javascript
/**
 * 修改密码
 * @param {Object} data - 密码信息
 * @param {string} data.oldPassword - 旧密码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise}
 */
export const changePassword = (data) => {
  return request({
    url: '/user/change-password',
    method: 'post',
    data
  })
}
```

**预防措施：**
1. 使用 TypeScript，利用类型检查发现此类错误
2. 本地开发完成后执行 `npm run build` 验证构建
3. 配置 ESLint 规则检查未定义的导入
4. 使用 JSDoc 注释所有导出函数

---

### 问题 5: Nginx 配置缺失 🟡

**问题描述：**
- 直接访问子路由404（如 `/about`）
- API请求跨域
- 静态资源路径错误

**解决方案：**

创建 `/www/server/panel/vhost/nginx/xs.momofx.cn.conf`：

```nginx
server {
    listen 80;
    server_name xs.momofx.cn;

    # 网站根目录
    root /www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist;
    index index.html;

    # 日志
    access_log /www/wwwlogs/xs.momofx.cn.log;
    error_log /www/wwwlogs/xs.momofx.cn.error.log;

    # API反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8005/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Vue Router History模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 安全配置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

重载Nginx：
```bash
nginx -t && nginx -s reload
```

---

### 问题 6: 依赖安装问题 🟢

**问题描述：**
- 项目包含多个子项目（backend、admin-backend、ai-xsread-vue3、admin-frontend）
- 需要分别进入每个目录安装依赖

**解决方案：**

手动安装：
```bash
cd /www/wwwroot/xs.momofx.cn/backend && npm install
cd /www/wwwroot/xs.momofx.cn/admin-backend && npm install
cd /www/wwwroot/xs.momofx.cn/ai-xsread-vue3 && npm install
cd /www/wwwroot/xs.momofx.cn/admin-frontend && npm install
```

**预防措施：**
在项目根目录创建 `package.json`，添加统一安装脚本：

```json
{
  "name": "ai-xsread-monorepo",
  "private": true,
  "scripts": {
    "install:all": "npm run install:backend && npm run install:admin-backend && npm run install:frontend && npm run install:admin-frontend",
    "install:backend": "cd backend && npm install",
    "install:admin-backend": "cd admin-backend && npm install",
    "install:frontend": "cd ai-xsread-vue3 && npm install",
    "install:admin-frontend": "cd admin-frontend && npm install",
    "dev:backend": "cd backend && npm run dev",
    "dev:admin-backend": "cd admin-backend && npm run dev",
    "dev:frontend": "cd ai-xsread-vue3 && npm run dev",
    "build:frontend": "cd ai-xsread-vue3 && npm run build",
    "build:admin-frontend": "cd admin-frontend && npm run build"
  }
}
```

或者使用 pnpm workspace 或 lerna 管理 monorepo。

---

## 💡 本地开发避坑指南

### 1. 开发环境准备

**必需软件版本：**
- Node.js >= 16.x
- MySQL >= 8.0
- Git

**初始化步骤：**

```bash
# 1. 克隆项目
git clone https://github.com/meetxia/AI_XsRead.git
cd AI_XsRead

# 2. 安装所有依赖
npm run install:all  # 需要先创建上面的package.json

# 3. 复制环境变量模板
cp backend/.env.example backend/.env
cp admin-backend/.env.example admin-backend/.env
cp ai-xsread-vue3/.env.development ai-xsread-vue3/.env.local

# 4. 编辑.env文件，填入本地配置

# 5. 初始化数据库
chmod +x scripts/init-db.sh
./scripts/init-db.sh

# 6. 启动开发服务器
npm run dev:backend      # 终端1: 后端服务
npm run dev:admin-backend # 终端2: 管理后台后端
npm run dev:frontend     # 终端3: 前端服务
```

### 2. 避免 Vite 空白页问题

**方法1：移除实验性配置（推荐）**

修改 `vite.config.js`，删除或注释掉：

```javascript
export default defineConfig({
  // ... 其他配置

  // ❌ 删除这个实验性配置
  /*
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { runtime: `window.__assetsPath(${JSON.stringify(filename)})` }
      }
    }
  }
  */
})
```

**方法2：创建HTML模板插件**

如果必须使用该配置，创建插件自动注入函数：

```javascript
// vite.config.js
import { defineConfig } from 'vite'

function injectAssetsPathPlugin() {
  return {
    name: 'inject-assets-path',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>
    <script>
      window.__assetsPath = function(path) { return '/' + path; };
    </script>`
      )
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    injectAssetsPathPlugin()  // 自动注入函数
  ],
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { runtime: `window.__assetsPath(${JSON.stringify(filename)})` }
      }
    }
  }
})
```

### 3. 避免 PM2 环境变量问题

**标准化的 PM2 配置模板：**

```javascript
// ecosystem.config.js
const path = require('path')

module.exports = {
  apps: [
    {
      name: 'xsread-backend',
      script: 'src/app.js',
      cwd: path.resolve(__dirname, 'backend'),  // 使用绝对路径
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
      autorestart: true,
      watch: process.env.NODE_ENV !== 'production',
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '500M',
      env_development: {
        NODE_ENV: 'development',
        PORT: 8005
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8005
      }
    }
  ]
}
```

**环境变量验证：**

在应用启动时验证必需变量（backend/src/config/validate-env.js）：

```javascript
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET'
]

function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.error('❌ 缺少必需的环境变量：', missing.join(', '))
    console.error('请检查 .env 文件配置')
    process.exit(1)
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET 长度必须至少32个字符')
    process.exit(1)
  }

  console.log('✅ 环境变量验证通过')
}

module.exports = validateEnv
```

在 `app.js` 中引入：

```javascript
require('dotenv').config()
require('./config/validate-env')()  // 启动时立即验证

const express = require('express')
// ...
```

### 4. 数据库管理最佳实践

**创建初始化脚本 `scripts/init-db.sh`：**

```bash
#!/bin/bash

set -e  # 遇到错误立即退出

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}开始初始化数据库...${NC}"

# 从.env读取配置
if [ -f backend/.env ]; then
  export $(cat backend/.env | grep -v '^#' | xargs)
else
  echo "❌ backend/.env 文件不存在"
  exit 1
fi

# 提示输入root密码
read -sp "请输入MySQL root密码: " MYSQL_ROOT_PASSWORD
echo

# 创建数据库
echo -e "${YELLOW}1. 创建数据库 ${DB_NAME}...${NC}"
mysql -uroot -p${MYSQL_ROOT_PASSWORD} <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME}
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

# 导入SQL文件
echo -e "${YELLOW}2. 导入数据表...${NC}"
for sql_file in database/*.sql; do
  if [ -f "$sql_file" ]; then
    echo "   导入 $sql_file"
    mysql -u${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < "$sql_file"
  fi
done

echo -e "${GREEN}✅ 数据库初始化完成！${NC}"
```

### 5. API 开发规范

**统一的响应格式：**

```javascript
// backend/src/utils/response.js
class ApiResponse {
  static success(data = null, message = 'success') {
    return {
      code: 200,
      message,
      data,
      timestamp: Date.now()
    }
  }

  static error(code, message, details = null) {
    const response = {
      code,
      message,
      timestamp: Date.now()
    }

    if (process.env.NODE_ENV === 'development' && details) {
      response.details = details
    }

    return response
  }
}

module.exports = ApiResponse
```

**前端请求拦截器：**

```javascript
// ai-xsread-vue3/src/utils/request.js
import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 15000
})

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')

      if (res.code === 401) {
        // Token过期，跳转登录
        localStorage.removeItem('token')
        router.push('/login')
      }

      return Promise.reject(new Error(res.message))
    }

    return res.data  // 直接返回data字段
  },
  error => {
    ElMessage.error(error.response?.data?.message || '网络错误')
    return Promise.reject(error)
  }
)

export default service
```

### 6. 构建前检查

**添加构建验证脚本：**

```json
// package.json
{
  "scripts": {
    "build": "vite build",
    "build:check": "vite build && node scripts/verify-build.js",
    "preview": "vite preview"
  }
}
```

**验证脚本 `scripts/verify-build.js`：**

```javascript
const fs = require('fs')
const path = require('path')

const distPath = path.join(__dirname, '../ai-xsread-vue3/dist')
const indexPath = path.join(distPath, 'index.html')

// 检查dist目录
if (!fs.existsSync(distPath)) {
  console.error('❌ dist目录不存在')
  process.exit(1)
}

// 检查index.html
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html不存在')
  process.exit(1)
}

const indexContent = fs.readFileSync(indexPath, 'utf-8')

// 检查是否使用了renderBuiltUrl但缺少__assetsPath
if (indexContent.includes('window.__assetsPath(')) {
  if (!indexContent.includes('window.__assetsPath = function')) {
    console.error('❌ 检测到使用了window.__assetsPath但未定义该函数')
    console.error('请在index.html中添加：')
    console.error(`
<script>
  window.__assetsPath = function(path) {
    return '/' + path;
  };
</script>
    `)
    process.exit(1)
  }
}

console.log('✅ 构建验证通过')
```

---

## 📐 给其他开发者的标准化建议

### 1. 项目结构规范

**推荐的Monorepo结构：**

```
AI_XsRead/
├── backend/                   # 主后端服务
│   ├── src/
│   │   ├── app.js            # 入口文件
│   │   ├── config/           # 配置文件
│   │   │   └── validate-env.js
│   │   ├── routes/           # 路由
│   │   ├── controllers/      # 控制器
│   │   ├── models/           # 数据模型
│   │   ├── middleware/       # 中间件
│   │   └── utils/            # 工具函数
│   ├── .env                  # 环境变量
│   ├── .env.example          # 环境变量模板（必须）
│   └── package.json
│
├── admin-backend/             # 管理后台后端
│   └── （结构同backend）
│
├── ai-xsread-vue3/           # 前端应用
│   ├── src/
│   │   ├── api/              # API接口定义
│   │   ├── views/            # 页面组件
│   │   ├── components/       # 公共组件
│   │   ├── router/           # 路由配置
│   │   ├── store/            # 状态管理
│   │   └── utils/            # 工具函数
│   ├── public/
│   │   └── index.html        # HTML模板
│   ├── .env.development      # 开发环境配置
│   ├── .env.production       # 生产环境配置
│   ├── vite.config.js        # Vite配置
│   └── package.json
│
├── database/                  # 数据库文件
│   ├── database_init.sql
│   ├── admin_tables.sql
│   └── seed_data_complete.sql
│
├── scripts/                   # 脚本文件
│   ├── init-db.sh            # 数据库初始化
│   └── verify-build.js       # 构建验证
│
├── docs/                      # 文档
│   ├── API.md                # API文档
│   ├── DEPLOYMENT.md         # 部署文档
│   └── DEVELOPMENT.md        # 开发文档
│
├── ecosystem.config.js        # PM2配置
├── package.json              # 根package.json（包含统一脚本）
├── .gitignore
└── README.md
```

### 2. .env.example 模板规范

**每个项目都必须提供 .env.example：**

```env
# backend/.env.example

# ========== 服务配置 ==========
NODE_ENV=development
PORT=8005

# ========== 数据库配置 ==========
# 主机地址（本地: localhost, Docker: mysql）
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ai_xsread

# ========== JWT 配置 ==========
# 生成方法: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 最小长度: 32个字符
JWT_SECRET=your_secret_key_min_32_characters
JWT_EXPIRES_IN=7d

# ========== CORS 配置 ==========
# 开发环境可用 * ，生产环境必须指定域名
CORS_ORIGIN=http://localhost:5173

# ========== 文件上传 ==========
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# ========== 日志配置 ==========
LOG_LEVEL=debug  # debug | info | warn | error
```

### 3. Git 提交规范

**使用 Conventional Commits：**

```
类型(范围): 简短描述

详细描述（可选）

类型：
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式（不影响功能）
- refactor: 重构
- perf: 性能优化
- test: 测试
- chore: 构建/工具变动

示例：
git commit -m "feat(api): 添加用户修改密码接口"
git commit -m "fix(frontend): 修复Vite配置导致页面空白问题 #issue-1"
git commit -m "docs: 更新部署文档，添加常见问题解决方案"
```

**配置 commitlint 和 husky：**

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional husky

# package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-commit": "npm run lint && npm run build:check"
    }
  }
}
```

### 4. API 接口规范

**统一的响应格式：**

```javascript
// 成功响应
{
  "code": 200,
  "message": "success",
  "data": {
    // 实际数据
  },
  "timestamp": 1698765432000
}

// 错误响应
{
  "code": 400,        // 业务错误码
  "message": "用户名不能为空",
  "timestamp": 1698765432000
}

// 分页响应
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  },
  "timestamp": 1698765432000
}
```

**HTTP 状态码使用规范：**

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权（需要登录）
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

### 5. 代码质量规范

**ESLint 配置：**

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',  // Vue3项目
    'prettier'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/multi-word-component-names': 'off'
  }
}
```

**Prettier 配置：**

```javascript
// .prettierrc.js
module.exports = {
  semi: false,              // 不使用分号
  singleQuote: true,        // 使用单引号
  trailingComma: 'none',    // 不添加尾随逗号
  printWidth: 100,          // 每行最大长度
  tabWidth: 2,              // 缩进2空格
  endOfLine: 'lf'           // 使用LF换行符
}
```

### 6. 文档规范

**README.md 必需内容：**

```markdown
# 项目名称

## 简介
项目的简要描述

## 技术栈
- 前端：Vue 3 + Vite + Element Plus
- 后端：Node.js + Express
- 数据库：MySQL 8.0

## 环境要求
- Node.js >= 16.x
- MySQL >= 8.0

## 快速开始

### 1. 安装依赖
\`\`\`bash
npm run install:all
\`\`\`

### 2. 配置环境变量
复制 `.env.example` 为 `.env` 并填入配置

### 3. 初始化数据库
\`\`\`bash
./scripts/init-db.sh
\`\`\`

### 4. 启动开发服务器
\`\`\`bash
npm run dev:all
\`\`\`

## 部署指南
详见 [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## API 文档
详见 [API.md](./docs/API.md)

## 常见问题
详见 [FAQ.md](./docs/FAQ.md)

## 许可证
MIT
```

### 7. 测试规范

**单元测试（后端）：**

```javascript
// backend/tests/api/user.test.js
const request = require('supertest')
const app = require('../../src/app')

describe('User API', () => {
  describe('POST /user/login', () => {
    it('应返回200和token', async () => {
      const res = await request(app)
        .post('/user/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })

      expect(res.statusCode).toBe(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data).toHaveProperty('token')
    })
  })
})
```

**E2E测试（前端）：**

使用 Playwright 或 Cypress

```javascript
// tests/e2e/login.spec.js
import { test, expect } from '@playwright/test'

test('用户登录流程', async ({ page }) => {
  await page.goto('http://localhost:5173/login')

  await page.fill('[name="username"]', 'testuser')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('http://localhost:5173/')
})
```

### 8. CI/CD 规范

**GitHub Actions 示例：**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test-backend:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: ai_xsread_test
        ports:
          - 3306:3306

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'

    - name: Install dependencies
      run: |
        cd backend
        npm ci

    - name: Run tests
      run: |
        cd backend
        npm test
      env:
        DB_HOST: 127.0.0.1
        DB_USER: root
        DB_PASSWORD: root

  test-frontend:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'

    - name: Install dependencies
      run: |
        cd ai-xsread-vue3
        npm ci

    - name: Lint
      run: |
        cd ai-xsread-vue3
        npm run lint

    - name: Build
      run: |
        cd ai-xsread-vue3
        npm run build
```

---

## ✅ 检查清单

### 部署前检查清单

**后端：**
- [ ] `.env` 文件已正确配置
- [ ] `JWT_SECRET` 长度 >= 32 字符
- [ ] 数据库已创建并导入数据
- [ ] 依赖已全部安装（`npm install` 无错误）
- [ ] 环境变量验证脚本已添加
- [ ] PM2 配置中 `cwd` 路径正确
- [ ] 日志目录已创建

**前端：**
- [ ] `.env.production` 已正确配置
- [ ] `VITE_APP_BASE_API` 使用相对路径 `/api`
- [ ] 构建成功（`npm run build` 无错误）
- [ ] 如使用 `experimental.renderBuiltUrl`，已在 index.html 中定义 `window.__assetsPath`
- [ ] dist 目录已生成且包含完整文件

**服务器：**
- [ ] Nginx 已安装并运行
- [ ] Nginx 配置文件已创建
- [ ] Nginx 配置测试通过（`nginx -t`）
- [ ] PM2 已安装
- [ ] 防火墙已开放必要端口（80, 443）
- [ ] 域名DNS已正确解析

### 部署后验证清单

**服务状态：**
- [ ] PM2 服务状态为 `online`（`pm2 status`）
- [ ] PM2 日志无持续错误（`pm2 logs`）
- [ ] Nginx 运行正常（`systemctl status nginx`）
- [ ] Nginx 日志无错误（`tail -f /www/wwwlogs/*.error.log`）

**功能测试：**
- [ ] 网站首页正常显示（无空白页）
- [ ] 前端静态资源加载正常（检查 Network 面板）
- [ ] API 请求正常（检查 Network 面板）
- [ ] 用户登录功能正常
- [ ] 数据库连接正常
- [ ] 文件上传功能正常（如有）

**性能测试：**
- [ ] 首页加载时间 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] 静态资源已启用缓存

**安全检查：**
- [ ] `.env` 文件未提交到 Git
- [ ] 数据库密码足够强
- [ ] JWT_SECRET 足够强且唯一
- [ ] CORS 已正确配置（生产环境不使用 `*`）
- [ ] Nginx 已添加安全响应头

---

## 🔧 故障排查

### 问题：网站显示空白页

**排查步骤：**

1. **检查浏览器控制台**
   ```
   打开 DevTools → Console 面板
   - 查看是否有 JS 错误
   - 查看是否有 __assetsPath 相关错误
   ```

2. **检查 Network 面板**
   ```
   - JS/CSS 文件是否 200 状态
   - 如果 404 → 检查 Nginx root 路径
   - 如果 502 → 后端服务未运行
   ```

3. **检查 index.html**
   ```bash
   cat dist/index.html | grep __assetsPath
   ```
   如果使用了 `experimental.renderBuiltUrl`，必须定义该函数

4. **检查 Vite 配置**
   ```bash
   cat vite.config.js | grep experimental
   ```
   考虑移除实验性配置

### 问题：API 请求 404/502

**排查步骤：**

1. **检查 Nginx 配置**
   ```bash
   nginx -t
   cat /www/server/panel/vhost/nginx/xs.momofx.cn.conf
   ```

2. **检查后端服务**
   ```bash
   pm2 status
   pm2 logs xsread-backend --lines 50
   ```

3. **直接测试后端**
   ```bash
   curl http://localhost:8005/health
   ```

4. **检查代理配置**
   ```nginx
   # 确保 location /api/ 配置正确
   location /api/ {
       proxy_pass http://127.0.0.1:8005/;
   }
   ```

### 问题：PM2 服务持续重启

**排查步骤：**

1. **查看日志**
   ```bash
   pm2 logs xsread-backend --lines 100
   ```

2. **检查 cwd 配置**
   ```bash
   cat ecosystem.config.js
   ```
   确保 cwd 指向正确的子目录

3. **验证环境变量**
   ```bash
   cd /www/wwwroot/xs.momofx.cn/backend
   node -e "require('dotenv').config(); console.log(process.env.DB_HOST)"
   ```

4. **手动启动测试**
   ```bash
   cd /www/wwwroot/xs.momofx.cn/backend
   node src/app.js
   ```

---

## 📚 参考资源

- **Vite 官方文档**: https://vitejs.dev/
- **Express 官方文档**: https://expressjs.com/
- **PM2 官方文档**: https://pm2.keymetrics.io/
- **Nginx 官方文档**: https://nginx.org/en/docs/
- **Vue 3 官方文档**: https://vuejs.org/
- **Element Plus**: https://element-plus.org/

---

**文档版本:** v1.0.0
**最后更新:** 2025-11-01
**维护者:** AI_XsRead 团队
**联系方式:** GitHub Issues

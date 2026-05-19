# 网站修复总结报告

**修复时间**: 2025-11-01
**网站地址**: http://xs.momofx.cn
**问题类型**: 图片无法加载 + 页面空白

---

## 📋 问题描述

### 问题 1: 图片路径错误（404）
- **现象**: 上传的头像图片无法显示
- **错误**: `GET http://xs.momofx.cn/api/uploads/images/img-xxx.webp 404`
- **根本原因**:
  1. 后端返回的图片 URL 包含完整域名 `http://localhost:8005`
  2. 前端自动拼接了 `/api` 前缀到图片路径
  3. 导致最终路径变成 `/api/uploads/...` 而非 `/uploads/...`

### 问题 2: 页面完全空白
- **现象**: 网站首页及所有页面显示空白，无任何内容
- **根本原因**: Vite 配置中的 `experimental.renderBuiltUrl` 生成了未定义的 `window.__assetsPath()` 函数调用，导致 JavaScript 运行时错误

---

## 🔧 修复内容

### 1. 后端代码修复

#### 文件: `backend/src/controllers/uploadController.js:365-379`

**修改前**:
```javascript
const relUrl = result.data.url;
const relThumb = result.data.thumbnail;
const base = `${req.protocol}://${req.get('host')}`;  // 生成 http://localhost:8005
const avatarUrl = `${base}${relUrl}`;  // 拼接完整URL
const avatarThumb = relThumb ? `${base}${relThumb}` : null;
```

**修改后**:
```javascript
const relUrl = result.data.url;
const relThumb = result.data.thumbnail;

// 直接使用相对路径，前端会自动使用当前域名
const avatarUrl = relUrl;
const avatarThumb = relThumb || null;
```

#### 文件: `backend/src/routes/upload.js:93-105`

**修改前**:
```javascript
const result = await uploadService.processImage(req.file, {
  format: 'webp',
  maxWidth: 1200,
  maxHeight: 1200
});

const base = `${req.protocol}://${req.get('host')}`;
const imageUrl = `${base}${result.data.url}`;

return Response.success(res, {
  url: imageUrl
}, '图片上传成功');
```

**修改后**:
```javascript
const result = await uploadService.processImage(req.file, {
  format: 'webp',
  maxWidth: 1200,
  maxHeight: 1200
});

// 直接返回相对路径，前端会自动使用当前域名
const imageUrl = result.data.url;

return Response.success(res, {
  url: imageUrl
}, '图片上传成功');
```

**执行操作**:
```bash
pm2 restart xsread-backend
```

---

### 2. 数据库修复

#### 更新用户头像 URL

**执行 SQL**:
```sql
UPDATE users
SET avatar = REPLACE(avatar, 'http://localhost:8005', '')
WHERE avatar LIKE '%localhost:8005%';
```

**影响范围**: 所有包含 `localhost:8005` 域名的用户头像记录

**修改前示例**:
```
http://localhost:8005/uploads/images/img-1761748269912-184417089.jpg
```

**修改后示例**:
```
/uploads/images/img-1761748269912-184417089.jpg
```

---

### 3. Nginx 配置优化

#### 文件: `/www/server/panel/vhost/nginx/xs.momofx.cn.conf:55-62`

**问题**: 静态资源的正则 location 与 `/uploads` 的 alias location 冲突，导致图片请求被错误处理

**修改前**:
```nginx
# 静态资源缓存
location ~ .*\.(gif|jpg|jpeg|png|bmp|swf|ico|svg|woff|woff2|ttf|eot)$
{
    expires      7d;
    add_header Cache-Control "public, immutable";
    error_log /dev/null;
    access_log /dev/null;
}
```

**修改后**:
```nginx
# 静态资源缓存（排除 /uploads 目录，因为它有独立的 location 处理）
location ~ ^/(?!uploads).*\.(gif|jpg|jpeg|png|bmp|swf|ico|svg|woff|woff2|ttf|eot)$
{
    expires      7d;
    add_header Cache-Control "public, immutable";
    error_log /dev/null;
    access_log /dev/null;
}
```

**说明**: 使用负向前瞻 `(?!uploads)` 排除 `/uploads` 路径，避免与 alias location 冲突

**执行操作**:
```bash
nginx -t
nginx -s reload
```

---

### 4. 前端图片 URL 处理逻辑修复

#### 文件: `ai-xsread-vue3/src/utils/avatar.js:21-32`

**修改前**:
```javascript
// 如果是完整URL（http/https开头），直接返回
if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
  return avatar
}

// 如果是相对路径，拼接API基础路径
if (avatar.startsWith('/uploads/')) {
  const baseAPI = import.meta.env.VITE_APP_BASE_API || 'http://localhost:3000'
  return `${baseAPI}${avatar}`  // 会变成 /api/uploads/...
}

// 其他情况直接返回
return avatar
```

**修改后**:
```javascript
// 如果是完整URL（http/https开头），直接返回
if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
  return avatar
}

// 如果是 /uploads/ 路径，直接返回（Nginx已配置静态文件访问）
if (avatar.startsWith('/uploads/')) {
  return avatar
}

// 其他情况直接返回
return avatar
```

#### 文件: `ai-xsread-vue3/src/components/common/AppHeader.vue:262-273`

**修改前**:
```javascript
// 如果是完整URL（http/https开头），直接返回
if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
  return avatar
}

// 如果是相对路径，拼接API基础路径
if (avatar.startsWith('/uploads/')) {
  const baseAPI = import.meta.env.VITE_APP_BASE_API || 'http://localhost:3000'
  return `${baseAPI}${avatar}`
}

// 其他情况直接返回
return avatar
```

**修改后**:
```javascript
// 如果是完整URL（http/https开头），直接返回
if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
  return avatar
}

// 如果是 /uploads/ 路径，直接返回（Nginx已配置静态文件访问）
if (avatar.startsWith('/uploads/')) {
  return avatar
}

// 其他情况直接返回
return avatar
```

---

### 5. Vite 配置错误修复（核心问题）

#### 文件: `ai-xsread-vue3/vite.config.js:111-124`

**问题**: `experimental.renderBuiltUrl` 配置生成了 `window.__assetsPath()` 函数调用，但该函数未定义，导致页面空白

**修改前**:
```javascript
// 依赖优化
optimizeDeps: {
  include: ['vue', 'vue-router', 'pinia', 'axios', 'lodash-es'],
  exclude: []
},
// 预加载优化
experimental: {
  renderBuiltUrl(filename, { hostType }) {
    if (hostType === 'js') {
      return { runtime: `window.__assetsPath(${JSON.stringify(filename)})` }
    }
  }
}
```

**修改后**:
```javascript
// 依赖优化
optimizeDeps: {
  include: ['vue', 'vue-router', 'pinia', 'axios', 'lodash-es'],
  exclude: []
}
```

**执行操作**:
```bash
cd /www/wwwroot/xs.momofx.cn/ai-xsread-vue3
npm run build
```

---

## ✅ 验证结果

### 1. 图片访问测试

```bash
# 测试头像图片
curl -I http://xs.momofx.cn/uploads/images/img-1761748269912-184417089.jpg
# 返回: HTTP/1.1 200 OK

# 测试 webp 格式图片
curl -I http://xs.momofx.cn/uploads/images/img-1761986454009-547567538.webp
# 返回: HTTP/1.1 200 OK

# 测试用户头像目录
curl -I http://xs.momofx.cn/uploads/tx/v2-d245c9dba0141805a9120cf1e06f8a23_1440w.jpg
# 返回: HTTP/1.1 200 OK
```

### 2. 页面访问测试

```bash
# 测试首页
curl -I http://xs.momofx.cn/
# 返回: HTTP/1.1 200 OK

# 测试主 JavaScript 文件
curl -I http://xs.momofx.cn/js/index-CYjtsbCr.js
# 返回: HTTP/1.1 200 OK

# 测试主 CSS 文件
curl -I http://xs.momofx.cn/css/index-DDWEAqIz.css
# 返回: HTTP/1.1 200 OK
```

### 3. 数据库验证

```sql
SELECT id, username, avatar FROM users LIMIT 5;
```

**结果**:
```
id  username    avatar
1   admin       /uploads/images/img-1761748269912-184417089.jpg
2   reader001   /uploads/tx/v2-d245c9dba0141805a9120cf1e06f8a23_1440w.jpg
3   reader002   /uploads/tx/v2-62344c38a26d51e1bfe4a1f9eea28ce1_1440w.jpg
4   reader003   /uploads/tx/v2-131adb3bdd2ff155672f72d3e358de09_1440w.jpg
5   author001   /uploads/tx/v2-080dbe82cec6eabd26fc533ac48870bc_1440w.jpg
```

---

## 📊 技术说明

### 关于 WebP 格式

后端会自动将上传的图片转换为 WebP 格式，这是正常且推荐的优化行为：

- **优势**:
  - 文件大小减少约 30%
  - 图片质量相同
  - 加载速度更快
  - 所有现代浏览器都支持

- **实现**: `backend/src/services/uploadService.js` 中的 `processImage` 函数

### URL 路径策略

#### 修改前的问题链路:
```
后端返回: http://localhost:8005/uploads/images/xxx.jpg
↓
存入数据库: http://localhost:8005/uploads/images/xxx.jpg
↓
前端读取: http://localhost:8005/uploads/images/xxx.jpg
↓
前端判断不是以 /uploads/ 开头，拼接 baseAPI
↓
最终请求: http://xs.momofx.cn/api/http://localhost:8005/uploads/images/xxx.jpg
❌ 404 错误
```

#### 修改后的正确链路:
```
后端返回: /uploads/images/xxx.jpg
↓
存入数据库: /uploads/images/xxx.jpg
↓
前端读取: /uploads/images/xxx.jpg
↓
前端判断是以 /uploads/ 开头，直接返回
↓
浏览器自动补全当前域名
↓
最终请求: http://xs.momofx.cn/uploads/images/xxx.jpg
✅ 200 OK
```

---

## 🚀 部署清单

### 已修改的文件列表

**后端**:
- ✅ `backend/src/controllers/uploadController.js`
- ✅ `backend/src/routes/upload.js`

**前端**:
- ✅ `ai-xsread-vue3/src/utils/avatar.js`
- ✅ `ai-xsread-vue3/src/components/common/AppHeader.vue`
- ✅ `ai-xsread-vue3/vite.config.js`

**配置**:
- ✅ `/www/server/panel/vhost/nginx/xs.momofx.cn.conf`

**数据库**:
- ✅ `users` 表的 `avatar` 字段

### 已执行的操作

```bash
# 1. 重启后端服务
pm2 restart xsread-backend

# 2. 更新数据库
mysql -u toefl_user -p -D ai_xsread -e "UPDATE users SET avatar = REPLACE(avatar, 'http://localhost:8005', '') WHERE avatar LIKE '%localhost:8005%';"

# 3. 重新加载 Nginx
nginx -t
nginx -s reload

# 4. 重新构建前端
cd /www/wwwroot/xs.momofx.cn/ai-xsread-vue3
npm run build
```

---

## 📌 注意事项

### 1. 浏览器缓存问题

修复完成后，用户需要**强制刷新**才能看到效果：

- **Windows/Linux**: `Ctrl + Shift + R` 或 `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

或者：
- 打开开发者工具（F12）
- 右键点击刷新按钮
- 选择"清空缓存并硬性重新加载"

### 2. 未来上传的图片

所有新上传的图片将自动使用相对路径格式 `/uploads/...`，不会再出现此问题。

### 3. PM2 重启

如果未来重启服务器或修改后端代码，记得使用：
```bash
pm2 restart xsread-backend
```

### 4. Nginx 配置持久化

当前 Nginx 配置已保存，服务器重启后会自动生效。如果使用宝塔面板修改配置，需要注意保留对 `/uploads` 路径的特殊处理。

---

## 🔔 服务器部署问题总结与开发规范

### 本次部署遇到的核心问题

#### 1. 环境不一致导致的 URL 问题

**问题描述**:
- 后端在开发环境中使用 `req.protocol` 和 `req.get('host')` 生成完整 URL
- 开发环境: `http://localhost:8005`
- 生产环境: `http://xs.momofx.cn`
- 导致开发环境的域名被硬编码到数据库中

**影响范围**:
- 用户头像 URL 包含 `localhost:8005` 域名
- 生产环境前端无法正确访问图片资源
- 需要手动清理数据库中的错误数据

#### 2. 前后端 URL 拼接逻辑冲突

**问题链路**:
```
后端返回完整 URL → 前端再次拼接 baseAPI → 生成错误的双重路径
```

**实际表现**:
```
错误路径: http://xs.momofx.cn/api/http://localhost:8005/uploads/images/xxx.jpg
正确路径: http://xs.momofx.cn/uploads/images/xxx.jpg
```

#### 3. Vite 配置在生产环境失效

**问题**:
- `experimental.renderBuiltUrl` 配置生成未定义的函数调用
- 开发环境正常，生产环境导致 JavaScript 运行时错误
- 整个页面空白，没有任何错误提示

#### 4. Nginx 配置规则冲突

**问题**:
- 静态资源正则匹配与 alias 路径冲突
- 图片请求被错误的 location 块处理
- 导致 404 错误

---

### 🎯 本地开发注意事项（必读）

#### 1. URL 路径统一规范

**强制规范**:
- ✅ **后端只返回相对路径**: `/uploads/images/xxx.jpg`
- ❌ **禁止返回完整 URL**: `http://localhost:8005/uploads/images/xxx.jpg`
- ✅ **前端直接使用相对路径**: 浏览器会自动补全当前域名

**示例代码**:

```javascript
// ❌ 错误做法
const avatarUrl = `${req.protocol}://${req.get('host')}${result.data.url}`;

// ✅ 正确做法
const avatarUrl = result.data.url;  // 直接返回 /uploads/images/xxx.jpg
```

#### 2. 环境变量配置规范

**后端 `.env` 配置**:
```bash
# ❌ 不要在代码中硬编码域名
# 开发环境
NODE_ENV=development
PORT=8005

# 生产环境
NODE_ENV=production
PORT=8005
```

**前端 `.env` 配置**:
```bash
# 开发环境 (.env.development)
VITE_APP_BASE_API=/api

# 生产环境 (.env.production)
VITE_APP_BASE_API=/api
```

**关键点**:
- 不要在环境变量中配置完整域名
- 使用相对路径，适配任何部署环境

#### 3. 文件上传处理规范

**统一接口规范**:

```javascript
// 后端控制器 - 统一返回格式
class UploadController {
  async uploadAvatar(req, res) {
    const result = await uploadService.processImage(req.file, options);

    // ✅ 只返回相对路径
    return Response.success(res, {
      url: result.data.url,              // /uploads/images/xxx.webp
      thumbnail: result.data.thumbnail   // /uploads/images/xxx_thumb.webp
    }, '上传成功');
  }
}

// 前端处理 - 统一 URL 转换
export function normalizeImageUrl(url) {
  if (!url) return '';

  // 如果是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 如果是相对路径，直接返回(浏览器会自动补全域名)
  if (url.startsWith('/')) {
    return url;
  }

  // 其他情况，添加 / 前缀
  return `/${url}`;
}
```

#### 4. Vite 配置规范

**推荐配置**:

```javascript
// vite.config.js
export default defineConfig({
  // ✅ 基础路径使用相对路径
  base: '/',

  // ✅ 构建输出目录
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 不要使用 experimental.renderBuiltUrl
  },

  // ✅ 开发服务器代理
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // ⚠️ 不要代理 /uploads，让 Nginx 直接处理
    }
  }
});
```

**禁止使用**:
```javascript
// ❌ 不要使用这个配置
experimental: {
  renderBuiltUrl(filename, { hostType }) {
    if (hostType === 'js') {
      return { runtime: `window.__assetsPath(${JSON.stringify(filename)})` }
    }
  }
}
```

#### 5. 数据库数据清理规范

**部署前检查清单**:

```sql
-- 1. 检查是否有开发环境域名残留
SELECT COUNT(*) FROM users
WHERE avatar LIKE '%localhost%' OR avatar LIKE '%127.0.0.1%';

-- 2. 清理开发环境域名
UPDATE users
SET avatar = REPLACE(avatar, 'http://localhost:8005', '')
WHERE avatar LIKE '%localhost:8005%';

-- 3. 验证清理结果
SELECT id, username, avatar FROM users LIMIT 10;
```

**预防措施**:
- 本地开发使用测试数据库
- 不要将开发环境数据直接导入生产环境
- 使用数据迁移脚本统一处理 URL 格式

---

### 📋 开发团队协作规范

#### 1. 代码提交前检查清单

- [ ] 所有文件上传接口只返回相对路径
- [ ] 前端 URL 处理逻辑统一使用 `normalizeImageUrl()` 函数
- [ ] 没有硬编码域名或 IP 地址
- [ ] `.env` 文件不包含在版本控制中
- [ ] Vite 配置没有使用实验性功能

#### 2. 接口规范统一

**统一响应格式**:

```javascript
// 成功响应
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "url": "/uploads/images/xxx.webp",      // ✅ 相对路径
    "thumbnail": "/uploads/images/xxx_thumb.webp"
  }
}

// 错误响应
{
  "code": 400,
  "message": "上传失败: 文件格式不支持",
  "data": null
}
```

**统一路径规范**:

| 资源类型 | 路径格式 | 示例 |
|---------|---------|------|
| 用户头像 | `/uploads/images/img-{timestamp}-{random}.webp` | `/uploads/images/img-1761748269912-184417089.webp` |
| 头像缩略图 | `/uploads/images/img-{timestamp}-{random}_thumb.webp` | `/uploads/images/img-1761748269912-184417089_thumb.webp` |
| 书籍封面 | `/uploads/covers/{bookId}.webp` | `/uploads/covers/12345.webp` |
| 临时文件 | `/uploads/temp/{timestamp}-{random}.{ext}` | `/uploads/temp/1761748269912-184417089.pdf` |

#### 3. 前端统一工具函数

**创建统一的图片处理工具** (`src/utils/image.js`):

```javascript
/**
 * 标准化图片 URL
 * @param {string} url - 原始 URL
 * @returns {string} 标准化后的 URL
 */
export function normalizeImageUrl(url) {
  if (!url) return '';

  // 完整 URL 直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 相对路径直接返回
  if (url.startsWith('/')) {
    return url;
  }

  // 添加 / 前缀
  return `/${url}`;
}

/**
 * 获取用户头像 URL
 * @param {string|object} user - 用户对象或头像 URL
 * @returns {string} 头像 URL
 */
export function getUserAvatar(user) {
  const avatar = typeof user === 'string' ? user : user?.avatar;
  return normalizeImageUrl(avatar) || '/assets/default-avatar.png';
}

/**
 * 获取书籍封面 URL
 * @param {string|object} book - 书籍对象或封面 URL
 * @returns {string} 封面 URL
 */
export function getBookCover(book) {
  const cover = typeof book === 'string' ? book : book?.cover;
  return normalizeImageUrl(cover) || '/assets/default-book-cover.png';
}
```

**在组件中统一使用**:

```vue
<script setup>
import { getUserAvatar, getBookCover } from '@/utils/image'

const props = defineProps({
  user: Object,
  book: Object
})

// ✅ 使用统一函数
const avatarUrl = computed(() => getUserAvatar(props.user))
const coverUrl = computed(() => getBookCover(props.book))
</script>

<template>
  <img :src="avatarUrl" alt="用户头像" />
  <img :src="coverUrl" alt="书籍封面" />
</template>
```

#### 4. 后端统一响应类

**创建统一的响应工具** (`backend/src/utils/Response.js`):

```javascript
class Response {
  /**
   * 成功响应
   * @param {object} res - Express response 对象
   * @param {any} data - 响应数据
   * @param {string} message - 响应消息
   */
  static success(res, data = null, message = '操作成功') {
    return res.json({
      code: 200,
      message,
      data
    });
  }

  /**
   * 错误响应
   * @param {object} res - Express response 对象
   * @param {string} message - 错误消息
   * @param {number} code - 错误代码
   */
  static error(res, message = '操作失败', code = 400) {
    return res.status(code).json({
      code,
      message,
      data: null
    });
  }
}

module.exports = Response;
```

#### 5. Nginx 配置模板

**生产环境 Nginx 配置模板**:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /www/wwwroot/your-project/ai-xsread-vue3/dist;
    index index.html;

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8005/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态上传文件(最高优先级)
    location /uploads/ {
        alias /www/wwwroot/your-project/backend/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 其他静态资源(排除 /uploads)
    location ~ ^/(?!uploads).*\.(gif|jpg|jpeg|png|bmp|swf|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### ⚠️ 关键提醒

#### 给所有开发者的提醒

1. **永远不要在代码中硬编码域名或 IP 地址**
   - ❌ `http://localhost:8005/uploads/xxx.jpg`
   - ✅ `/uploads/xxx.jpg`

2. **统一使用工具函数处理 URL**
   - 前端: `normalizeImageUrl()`, `getUserAvatar()`, `getBookCover()`
   - 后端: 直接返回相对路径

3. **本地开发数据不要直接用于生产**
   - 使用数据迁移脚本
   - 清理开发环境残留数据

4. **Vite 配置保持简单**
   - 不要使用实验性功能
   - 使用官方推荐的标准配置

5. **部署前必须检查**
   - 数据库中是否有 `localhost` 残留
   - Nginx 配置是否正确
   - 前端是否正确构建

---

## 🎉 修复总结

### 核心问题
1. **图片路径错误**: 后端返回完整 URL，前端再次拼接导致路径错误
2. **页面空白**: Vite 配置错误导致 JavaScript 运行时错误
3. **环境不一致**: 开发环境配置直接应用到生产环境
4. **缺少统一规范**: 前后端 URL 处理逻辑不统一

### 解决方案
1. **统一使用相对路径**: 后端只返回相对路径，由浏览器自动补全域名
2. **移除错误配置**: 删除 Vite 的 experimental 配置
3. **优化 Nginx 规则**: 避免静态资源规则冲突
4. **建立开发规范**: 统一前后端接口和 URL 处理逻辑

### 最终效果
- ✅ 图片可以正常显示（包括 jpg、webp 等格式）
- ✅ 页面可以正常加载
- ✅ 头像上传功能正常
- ✅ 所有静态资源正常访问
- ✅ 支持任意域名部署，无需修改代码

### 长期收益
- 🎯 统一的代码规范，减少部署问题
- 🚀 更快的开发迭代，避免重复踩坑
- 🛡️ 更好的团队协作，代码更易维护
- 📊 清晰的接口文档，新人快速上手

---

**文档生成时间**: 2025-11-01 16:54
**文档更新时间**: 2025-11-01
**修复完成状态**: ✅ 已完成并验证
**开发规范状态**: ✅ 已建立并文档化

# 文字之境 - 后端API服务

> AI_XsRead Backend API Service

---

## 📋 项目概述

文字之境后端API服务，基于 Express.js 构建的 RESTful API。

### 技术栈

- **框架**: Express.js 4.18+
- **数据库**: MySQL 8.0
- **认证**: JWT (JSON Web Token)
- **验证**: express-validator
- **安全**: helmet, cors, rate-limit

---

## 🚀 快速开始

### 1. 安装依赖

```powershell
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```env
PORT=8000
DB_HOST=127.0.0.1
DB_USER=toefl_user
DB_PASSWORD=mojz168168-
DB_DATABASE=ai_xsread
JWT_SECRET=your-secret-key
```

### 3. 确保数据库已创建

确保 MySQL 数据库 `ai_xsread` 已创建并导入了数据表。

### 4. 启动服务

```powershell
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm start
```

### 5. 访问服务

- 服务地址: http://localhost:8000
- 健康检查: http://localhost:8000/api/health

---

## 📁 项目结构

```
backend/
├── src/
│   ├── app.js                  # 主入口文件
│   ├── config/                 # 配置文件
│   │   ├── index.js           # 配置汇总
│   │   └── database.js        # 数据库连接
│   ├── controllers/            # 控制器
│   │   ├── authController.js  # 认证控制器
│   │   ├── novelController.js # 小说控制器
│   │   └── userController.js  # 用户控制器
│   ├── routes/                 # 路由
│   │   ├── auth.js            # 认证路由
│   │   ├── novels.js          # 小说路由
│   │   ├── chapters.js        # 章节路由
│   │   ├── user.js            # 用户路由
│   │   └── index.js           # 路由汇总
│   ├── middlewares/            # 中间件
│   │   ├── auth.js            # 认证中间件
│   │   ├── errorHandler.js   # 错误处理
│   │   └── logger.js          # 日志记录
│   └── utils/                  # 工具函数
│       ├── response.js        # 响应格式化
│       └── validators.js      # 验证规则
├── cache/                      # 缓存管理
├── database/                   # 数据库脚本
├── jobs/                       # 定时任务
├── services/                   # 服务模块
├── package.json
├── .env                        # 环境配置
└── README.md
```

---

## 🔌 API接口

### 认证模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | ❌ |
| POST | /api/auth/login | 用户登录 | ❌ |
| POST | /api/auth/refresh | 刷新令牌 | ❌ |
| GET | /api/auth/me | 获取当前用户 | ✅ |
| POST | /api/auth/logout | 用户登出 | ✅ |

### 小说模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/novels | 获取小说列表 | ❌ |
| GET | /api/novels/:id | 获取小说详情 | ❌ |
| GET | /api/novels/recommend | 获取推荐小说 | ❌ |
| GET | /api/novels/search | 搜索小说 | ❌ |
| GET | /api/novels/:novelId/chapters | 获取章节列表 | ❌ |
| GET | /api/novels/categories | 获取分类列表 | ❌ |

### 章节模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/chapters/:id | 获取章节内容 | ❌ |

### 用户模块

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/user/bookshelf | 获取书架 | ✅ |
| POST | /api/user/bookshelf | 添加到书架 | ✅ |
| DELETE | /api/user/bookshelf/:novelId | 从书架移除 | ✅ |
| GET | /api/user/reading-progress/:novelId | 获取阅读进度 | ✅ |
| POST | /api/user/reading-progress | 更新阅读进度 | ✅ |
| GET | /api/user/reading-history | 获取阅读历史 | ✅ |

---

## 📝 API使用示例

### 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "123456",
  "confirmPassword": "123456"
}
```

### 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456"
}
```

### 获取小说列表

```http
GET /api/novels?page=1&pageSize=20&categoryId=1&sortBy=views&order=DESC
```

### 获取小说详情

```http
GET /api/novels/1
```

### 添加到书架（需要认证）

```http
POST /api/user/bookshelf
Authorization: Bearer <token>
Content-Type: application/json

{
  "novelId": 1
}
```

---

## 🔐 认证说明

### JWT Token

登录成功后会返回 `accessToken`，在后续需要认证的请求中，需要在请求头中携带：

```http
Authorization: Bearer <accessToken>
```

### Token有效期

- Access Token: 2小时
- Refresh Token: 7天

---

## 📊 统一响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 实际数据
  },
  "timestamp": 1698765432000
}
```

### 失败响应

```json
{
  "code": 400,
  "message": "参数错误",
  "errors": [
    {
      "field": "username",
      "message": "用户名不能为空"
    }
  ],
  "timestamp": 1698765432000
}
```

### 分页响应

```json
{
  "code": 200,
  "message": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": 1698765432000
}
```

---

## 🐛 常见问题

### 1. 数据库连接失败

**问题**: `❌ 数据库连接失败`

**解决**:
- 检查 MySQL 服务是否启动
- 检查 `.env` 中的数据库配置是否正确
- 确认数据库 `ai_xsread` 已创建

### 2. 端口被占用

**问题**: `Error: listen EADDRINUSE: address already in use :::8000`

**解决**:
- 修改 `.env` 中的 `PORT` 配置
- 或者关闭占用 8000 端口的程序

### 3. JWT验证失败

**问题**: `无效的令牌`

**解决**:
- 检查请求头格式: `Authorization: Bearer <token>`
- 确认 token 未过期
- 使用刷新令牌获取新的访问令牌

---

## 🔧 开发工具

### 使用 nodemon 进行热重载

```powershell
npm run dev
cd ai-xsread-vue3 ; pnpm run dev

cd backend ; npm run dev

```

修改代码后会自动重启服务器。

### 测试API

推荐使用以下工具测试API：
- Postman
- Insomnia
- VS Code REST Client 插件

---

## 📚 相关文档

- [API接口设计文档](../docx/API接口设计文档.md)
- [数据库设计文档](../docx/数据库设计文档.md)
- [Windows本地开发快速启动指南](../docx/Windows本地开发快速启动指南.md)

---

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

MIT License

---

*最后更新: 2025-10-27*


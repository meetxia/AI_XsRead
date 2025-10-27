# 文字之境后台管理API服务

> 基于Node.js + Express + MySQL的后台管理API服务

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并修改配置:

```bash
# 修改数据库配置等
```

### 3. 导入数据库表

```bash
mysql -u toefl_user -p ai_xsread < ../docx/admin_tables.sql
```

### 4. 初始化管理员账号

```bash
node scripts/init-admin.js
```

### 5. 启动服务

**开发模式**（热重载）:
```bash
npm run dev
```

**生产模式**:
```bash
npm start
```

---

## 📋 API接口列表

### 认证接口
- `POST /api/admin/login` - 管理员登录
- `POST /api/admin/logout` - 退出登录
- `GET /api/admin/profile` - 获取当前管理员信息
- `POST /api/admin/refresh-token` - 刷新Token

### 数据看板
- `GET /api/admin/dashboard/overview` - 概览统计
- `GET /api/admin/dashboard/trends` - 趋势数据
- `GET /api/admin/dashboard/realtime` - 实时动态
- `GET /api/admin/dashboard/ranking` - 排行榜

### 小说管理
- `GET /api/admin/novels` - 获取小说列表
- `GET /api/admin/novels/:id` - 获取小说详情
- `POST /api/admin/novels` - 创建小说
- `PUT /api/admin/novels/:id` - 更新小说
- `DELETE /api/admin/novels/:id` - 删除小说
- `GET /api/admin/novels/:id/statistics` - 小说统计

### 章节管理
- `GET /api/admin/chapters` - 获取章节列表
- `GET /api/admin/chapters/:id` - 获取章节详情
- `POST /api/admin/chapters` - 创建章节
- `PUT /api/admin/chapters/:id` - 更新章节
- `DELETE /api/admin/chapters/:id` - 删除章节

### 用户管理
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/users/:id` - 获取用户详情
- `PUT /api/admin/users/:id/status` - 更新用户状态
- `GET /api/admin/users/:id/statistics` - 用户统计

### 评论管理
- `GET /api/admin/comments` - 获取评论列表
- `PUT /api/admin/comments/:id/approve` - 审核通过
- `PUT /api/admin/comments/:id/reject` - 拒绝/屏蔽
- `DELETE /api/admin/comments/:id` - 删除评论

### 文件上传
- `POST /api/admin/upload/image` - 上传图片

---

## 🔐 认证说明

所有需要认证的接口，需要在请求头中携带Token:

```
Authorization: Bearer <your-token>
```

---

## 📁 项目结构

```
admin-backend/
├── src/
│   ├── config/           # 配置文件
│   │   ├── database.js  # 数据库配置
│   │   └── index.js     # 主配置
│   ├── controllers/      # 控制器
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── novelController.js
│   │   ├── chapterController.js
│   │   ├── userController.js
│   │   └── commentController.js
│   ├── routes/          # 路由
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── novels.js
│   │   ├── chapters.js
│   │   ├── users.js
│   │   ├── comments.js
│   │   ├── upload.js
│   │   └── index.js
│   ├── middlewares/     # 中间件
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── logger.js
│   ├── services/        # 服务
│   │   └── uploadService.js
│   ├── utils/           # 工具函数
│   │   ├── response.js
│   │   ├── jwt.js
│   │   └── bcrypt.js
│   └── app.js           # 主应用
├── scripts/             # 脚本
│   └── init-admin.js   # 初始化管理员
├── uploads/            # 上传文件
├── logs/               # 日志文件
├── .env                # 环境变量
├── .gitignore
├── package.json
└── README.md
```

---

## 🛡️ 安全特性

- ✅ JWT Token认证
- ✅ bcrypt密码加密
- ✅ Helmet安全头
- ✅ CORS跨域配置
- ✅ 请求速率限制
- ✅ 操作日志记录
- ✅ SQL注入防护
- ✅ XSS防护

---

## 🔧 环境变量说明

```env
# 服务器配置
PORT=8001                    # 服务端口
NODE_ENV=development         # 环境: development/production

# 数据库配置
DB_HOST=127.0.0.1           # 数据库主机
DB_PORT=3306                # 数据库端口
DB_USER=toefl_user          # 数据库用户名
DB_PASSWORD=your-password   # 数据库密码
DB_NAME=ai_xsread           # 数据库名

# JWT配置
JWT_SECRET=your-secret-key  # JWT密钥（生产环境必须修改）
JWT_EXPIRES_IN=2h           # Token过期时间
JWT_REFRESH_EXPIRES_IN=7d   # 刷新Token过期时间

# 文件上传
UPLOAD_DIR=./uploads        # 上传目录
MAX_FILE_SIZE=2097152       # 最大文件大小(字节)

# CORS配置
CORS_ORIGIN=http://localhost:3010  # 允许的前端域名
```

---

## 📝 开发指南

### 添加新接口

1. 在 `controllers/` 创建控制器
2. 在 `routes/` 创建路由文件
3. 在 `routes/index.js` 注册路由

### 数据库查询

使用连接池进行查询:

```javascript
const db = require('../config/database');

const [results] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
```

### 响应格式

使用统一响应工具:

```javascript
const Response = require('../utils/response');

// 成功
return Response.success(res, data, 'message');

// 失败
return Response.error(res, 'message', 400);

// 分页
return Response.page(res, list, total, page, pageSize);
```

---

## 🐛 常见问题

**Q: 数据库连接失败?**  
A: 检查 `.env` 中的数据库配置是否正确

**Q: Token验证失败?**  
A: 确保前端请求头携带了正确的Authorization

**Q: 文件上传失败?**  
A: 检查uploads目录是否有写入权限

**Q: 端口被占用?**  
A: 修改 `.env` 中的PORT配置

---

## 📞 技术支持

- 文档: `/docx/后台管理系统需求文档.md`
- 问题反馈: 查看项目文档

---

**开发者**: 全栈开发团队  
**版本**: 1.0.0  
**更新时间**: 2025-10-27


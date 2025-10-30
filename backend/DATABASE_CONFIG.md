# 数据库配置说明

## 📋 配置架构

本项目提供两种数据库连接方式,适用于不同的使用场景:

### 1. 基础连接池 (`src/config/database.js`)

**适用场景**: 大多数常规业务场景

**特点**:
- ✅ 简单易用
- ✅ 统一配置管理
- ✅ 自动连接测试
- ✅ 适合单库应用

**使用方法**:
```javascript
const { pool } = require('./src/config/database');

// 执行查询
const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
```

**配置来源**: `src/config/index.js` (从环境变量读取)

---

### 2. 高级连接池管理器 (`database/pool.js`)

**适用场景**: 需要高级功能的生产环境

**特点**:
- ✅ 读写分离 (主从复制)
- ✅ 连接池监控
- ✅ 连接泄漏检测
- ✅ 故障转移
- ✅ 负载均衡
- ✅ 详细统计信息

**使用方法**:
```javascript
const { dbManager } = require('./database/pool');

// 读操作 (自动路由到从库)
const users = await dbManager.query('SELECT * FROM users');

// 写操作 (自动路由到主库)
await dbManager.execute('INSERT INTO users SET ?', [userData]);

// 事务
await dbManager.transaction(async (connection) => {
  await connection.query('UPDATE users SET balance = balance - 100 WHERE id = ?', [fromId]);
  await connection.query('UPDATE users SET balance = balance + 100 WHERE id = ?', [toId]);
});
```

**配置来源**: 环境变量 (`.env`)

---

## 🔧 环境变量配置

### 必需配置

```bash
# 数据库基础配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_secure_password  # ⚠️ 必须配置,不能为空
DB_DATABASE=ai_xsread
```

### 可选配置 - 连接池优化

```bash
# 连接池大小
DB_CONNECTION_LIMIT=20

# 超时设置
DB_ACQUIRE_TIMEOUT=30000
DB_TIMEOUT=60000
DB_CONNECT_TIMEOUT=10000
```

### 可选配置 - 读写分离

```bash
# 启用读写分离
DB_SLAVE_ENABLED=true

# 从库配置
DB_SLAVE_HOST=slave.example.com
DB_SLAVE_PORT=3306
DB_SLAVE_USER=readonly_user
DB_SLAVE_PASSWORD=readonly_password
DB_SLAVE_CONNECTION_LIMIT=100
```

### 可选配置 - 监控

```bash
# 启用监控
DB_MONITOR_ENABLED=true
DB_MONITOR_INTERVAL=60000

# 告警阈值
DB_WARNING_THRESHOLD=0.8
DB_CRITICAL_THRESHOLD=0.9
```

---

## 🚀 快速开始

### 1. 复制环境变量模板

```bash
cp .env.example .env
```

### 2. 编辑 `.env` 文件

```bash
# 修改数据库配置
DB_HOST=127.0.0.1
DB_USER=your_user
DB_PASSWORD=your_password  # ⚠️ 必须修改
DB_DATABASE=ai_xsread

# 修改JWT密钥 (至少32个字符)
JWT_SECRET=your_jwt_secret_at_least_32_characters_long
JWT_REFRESH_SECRET=your_refresh_secret_at_least_32_characters_long
```

### 3. 生成强随机密钥

```bash
# 生成JWT密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 启动应用

```bash
npm start
```

---

## ⚠️ 安全注意事项

### 1. 密码安全

- ❌ **禁止**: 在代码中硬编码密码
- ❌ **禁止**: 将 `.env` 文件提交到版本控制
- ✅ **必须**: 使用环境变量配置所有敏感信息
- ✅ **必须**: 生产环境使用强密码

### 2. JWT密钥安全

- ❌ **禁止**: 使用默认密钥或简单字符串
- ✅ **必须**: 密钥长度至少32个字符
- ✅ **必须**: 使用加密安全的随机生成器
- ✅ **建议**: 定期更换密钥

### 3. 配置验证

应用启动时会自动验证以下配置:

- ✅ 数据库连接信息 (HOST, USER, PASSWORD, DATABASE)
- ✅ JWT密钥存在性和长度 (≥32字符)

如果验证失败,应用将拒绝启动并显示错误信息。

---

## 📊 配置对比

| 功能 | 基础连接池 | 高级管理器 |
|------|-----------|-----------|
| 基础查询 | ✅ | ✅ |
| 连接池 | ✅ | ✅ |
| 读写分离 | ❌ | ✅ |
| 监控统计 | ❌ | ✅ |
| 故障转移 | ❌ | ✅ |
| 负载均衡 | ❌ | ✅ |
| 连接泄漏检测 | ❌ | ✅ |

---

## 🔍 故障排查

### 问题1: 应用启动失败,提示缺少环境变量

**原因**: 未配置 `.env` 文件或缺少必需的环境变量

**解决方法**:
```bash
# 1. 复制模板
cp .env.example .env

# 2. 编辑 .env 文件,填写所有必需的配置
# 3. 重新启动应用
```

### 问题2: 数据库连接失败

**原因**: 数据库配置错误或数据库服务未启动

**解决方法**:
```bash
# 1. 检查数据库服务是否运行
mysql -h 127.0.0.1 -u your_user -p

# 2. 验证 .env 中的配置是否正确
# 3. 检查防火墙设置
```

### 问题3: JWT验证失败

**原因**: JWT密钥长度不足或未配置

**解决方法**:
```bash
# 生成新的强随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 将生成的密钥添加到 .env
JWT_SECRET=生成的密钥
JWT_REFRESH_SECRET=生成的密钥
```

---

## 📚 相关文件

- `backend/.env.example` - 环境变量配置模板
- `backend/src/config/index.js` - 统一配置入口 (包含验证逻辑)
- `backend/src/config/database.js` - 基础数据库连接池
- `backend/database/pool.js` - 高级数据库管理器
- `admin-backend/.env.example` - 管理后台环境变量模板
- `admin-backend/src/config/database.js` - 管理后台数据库配置

---

## 🎯 最佳实践

1. **开发环境**: 使用基础连接池 (`src/config/database.js`)
2. **生产环境**: 使用高级管理器 (`database/pool.js`) + 启用监控
3. **测试环境**: 使用独立的数据库和配置
4. **密钥管理**: 使用密钥管理服务 (如 AWS Secrets Manager, Azure Key Vault)
5. **定期审计**: 检查配置文件,确保没有硬编码的敏感信息

---

## 📞 技术支持

如有问题,请查看:
- 项目文档: `README.md`
- BUG报告: `docx/BUG检查与优化报告.md`
- 提交Issue: GitHub Issues


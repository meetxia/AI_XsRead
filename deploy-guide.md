# 文字之境部署指南

## 📋 部署状态

✅ 项目代码已部署
✅ 依赖已安装
✅ 环境变量已配置
✅ 前端已构建
✅ Nginx配置已创建
✅ PM2配置已创建

## 🔧 需要手动完成的步骤

### 1. 数据库配置（重要！）

**方式一：通过宝塔面板phpMyAdmin**

1. 登录宝塔面板
2. 点击 "数据库" -> "phpMyAdmin"
3. 创建数据库 `ai_xsread`（字符集：utf8mb4_unicode_ci）
4. 导入以下SQL文件（按顺序）：
   - `/www/wwwroot/xs.momofx.cn/docx/06-数据库脚本/database_init.sql`
   - `/www/wwwroot/xs.momofx.cn/docx/06-数据库脚本/admin_tables.sql`
   - `/www/wwwroot/xs.momofx.cn/docx/06-数据库脚本/seed_data_complete.sql`（测试数据）
   - `/www/wwwroot/xs.momofx.cn/docx/06-数据库脚本/创建管理员账号.sql`

**方式二：命令行（需要root权限）**

```bash
# 使用root账号登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS ai_xsread DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 授权给toefl_user
GRANT ALL PRIVILEGES ON ai_xsread.* TO 'toefl_user'@'localhost';
FLUSH PRIVILEGES;

# 导入数据
USE ai_xsread;
SOURCE /www/wwwroot/xs.momofx.cn/docx/06-数据库脚本/database_init.sql;
SOURCE /www/wwwroot/xs.momofx.cn/docx/06-数据库脚本/admin_tables.sql;
SOURCE /www/wwwroot/xs.momofx.cn/docx/06-数据库脚本/seed_data_complete.sql;
SOURCE /www/wwwroot/xs.momofx.cn/docx/06-数据库脚本/创建管理员账号.sql;
```

### 2. 配置Nginx（在宝塔面板）

1. 登录宝塔面板
2. 点击 "网站" -> 找到 `xs.momofx.cn`
3. 点击 "设置" -> "配置文件"
4. 将 `/www/wwwroot/xs.momofx.cn/nginx.conf` 的内容复制粘贴到配置文件中
5. 保存并重载Nginx

**关键配置说明：**
- 网站根目录：`/www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist`
- API代理：`/api` -> `http://127.0.0.1:8005`
- 上传文件：`/uploads` -> `/www/wwwroot/xs.momofx.cn/backend/uploads`

### 3. 启动后端服务

**方式一：使用PM2（推荐）**

```bash
cd /www/wwwroot/xs.momofx.cn

# 安装PM2（如果未安装）
npm install -g pm2

# 启动所有服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 设置开机自启
pm2 startup
pm2 save
```

**方式二：通过宝塔面板Node项目管理**

1. 登录宝塔面板
2. 点击 "软件商店" -> 安装 "PM2管理器"
3. 添加项目：
   - 项目名称：xsread-backend
   - 项目路径：/www/wwwroot/xs.momofx.cn/backend
   - 启动文件：src/app.js
   - 端口：8005
4. 再添加一个项目：
   - 项目名称：xsread-admin-backend
   - 项目路径：/www/wwwroot/xs.momofx.cn/admin-backend
   - 启动文件：src/server.js
   - 端口：8001

### 4. 验证部署

**检查后端服务：**
```bash
# 检查主API服务
curl http://localhost:8005/api/health

# 检查管理后台API
curl http://localhost:8001/api/health
```

**检查前端访问：**
- 浏览器访问：http://xs.momofx.cn
- 应该能看到"文字之境"首页

**检查API代理：**
- 浏览器访问：http://xs.momofx.cn/api/health
- 应该返回健康检查信息

### 5. 配置HTTPS（可选但推荐）

1. 登录宝塔面板
2. 点击 "网站" -> `xs.momofx.cn` -> "SSL"
3. 选择 "Let's Encrypt" 申请免费证书
4. 勾选 "强制HTTPS"

## 📊 服务端口说明

| 服务 | 端口 | 说明 |
|-----|------|------|
| 前端静态文件 | 80/443 | Nginx提供 |
| 后端API | 8005 | 主API服务 |
| 管理后台API | 8001 | 后台管理服务 |

## 🔐 默认账号信息

**管理员账号（需要先导入创建管理员账号.sql）：**
- 用户名：admin
- 密码：admin123

**测试用户账号（导入seed_data_complete.sql后）：**
- 查看SQL文件中的测试数据

## 📝 常用命令

```bash
# PM2管理
pm2 list              # 查看所有进程
pm2 restart all       # 重启所有服务
pm2 stop all          # 停止所有服务
pm2 logs              # 查看日志
pm2 monit             # 监控面板

# 查看日志
tail -f /www/wwwroot/xs.momofx.cn/logs/backend-error.log
tail -f /www/wwwroot/xs.momofx.cn/logs/admin-error.log

# Nginx
nginx -t              # 测试配置
nginx -s reload       # 重载配置
```

## 🐛 常见问题

### 1. 无法访问网站
- 检查Nginx是否运行：`systemctl status nginx`
- 检查防火墙是否开放80/443端口
- 检查域名DNS解析是否正确

### 2. API请求失败
- 检查后端服务是否运行：`pm2 status`
- 检查端口是否被占用：`netstat -tlnp | grep 8005`
- 查看后端日志：`pm2 logs xsread-backend`

### 3. 数据库连接失败
- 检查MySQL是否运行：`systemctl status mysqld`
- 检查.env文件中的数据库配置
- 检查数据库用户权限

### 4. 404错误
- 检查Nginx配置中的根目录路径
- 确认前端已构建：`ls /www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist/`

## 📚 相关文档

- 项目文档：`/www/wwwroot/xs.momofx.cn/docx/README.md`
- 快速启动：`/www/wwwroot/xs.momofx.cn/docx/02-快速启动指南/`
- API文档：`/www/wwwroot/xs.momofx.cn/docx/01-核心文档/API接口设计文档.md`

## 🎉 部署完成后

访问 http://xs.momofx.cn 即可使用！

如需帮助，请查看项目文档或联系技术支持。

# 🎉 文字之境 - 最后的部署步骤

## ✅ 已完成的工作

1. ✅ 项目代码已部署到 `/www/wwwroot/xs.momofx.cn/`
2. ✅ 所有依赖已安装 (backend, admin-backend, admin-frontend, ai-xsread-vue3)
3. ✅ 环境变量已配置 (.env文件)
4. ✅ 数据库 `ai_xsread` 已创建并导入数据
5. ✅ 前端项目已构建 (`ai-xsread-vue3/dist/`)
6. ✅ 后端服务已启动并正常运行
   - 主API: http://localhost:8005 ✅
   - 管理后台API: http://localhost:8001 ✅
7. ✅ PM2进程管理已配置

## 🔧 最后一步：配置Nginx（在宝塔面板）

### 步骤1: 登录宝塔面板

访问你的宝塔面板管理地址

### 步骤2: 配置网站

1. 点击左侧 "网站"
2. 找到 `xs.momofx.cn` 网站
3. 点击 "设置"

### 步骤3: 修改网站目录

1. 点击 "网站目录" 标签
2. 将 "网站目录" 修改为：
   ```
   /www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist
   ```
3. 点击 "保存"

### 步骤4: 配置Nginx

1. 点击 "配置文件" 标签
2. 找到 `server { }` 块
3. 将整个配置替换为以下内容：

```nginx
server {
    listen 80;
    server_name xs.momofx.cn;
    
    # 网站根目录 - 指向Vue构建后的dist目录
    root /www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist;
    index index.html;
    
    # 日志文件
    access_log /www/wwwlogs/xs.momofx.cn_access.log;
    error_log /www/wwwlogs/xs.momofx.cn_error.log;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
    
    # API反向代理 - 转发到后端服务
    location /api {
        proxy_pass http://127.0.0.1:8005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 上传文件访问
    location /uploads {
        alias /www/wwwroot/xs.momofx.cn/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # Vue Router History模式配置
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
```

4. 点击 "保存"
5. Nginx会自动重载配置

### 步骤5: 验证部署

1. 打开浏览器访问：http://xs.momofx.cn
2. 应该能看到 "文字之境" 首页
3. 尝试注册/登录功能

## 📊 服务信息

### 端口分配
- 前端静态文件: 80 (Nginx)
- 主API服务: 8005
- 管理后台API: 8001

### 默认账号
**管理员账号：**
- 用户名: `admin`
- 密码: `admin123`
- 邮箱: `admin@xsread.com`

**测试用户账号：**
- 用户名: `testuser`
- 密码: `password123`
- 邮箱: `test@xsread.com`

## 🔍 检查服务状态

```bash
# 查看PM2进程
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 停止服务
pm2 stop all
```

## 🐛 常见问题

### 问题1: 网站打不开
- 检查防火墙是否开放80端口
- 检查域名DNS是否解析到服务器IP
- 检查Nginx是否运行：`systemctl status nginx`

### 问题2: API请求失败 (404/502)
- 检查后端服务是否运行：`pm2 status`
- 检查Nginx配置中的反向代理设置
- 查看后端日志：`pm2 logs xsread-backend`

### 问题3: 页面刷新404
- 确认Nginx配置中有 `try_files $uri $uri/ /index.html;`
- 重载Nginx配置

### 问题4: 无法登录
- 检查数据库连接
- 查看后端日志：`pm2 logs`
- 确认.env文件配置正确

## 🔐 配置HTTPS（可选）

1. 在宝塔面板中点击网站 -> SSL
2. 选择 "Let's Encrypt" 申请免费证书
3. 填写邮箱并申请
4. 勾选 "强制HTTPS"

## 📁 重要文件位置

- 前端构建文件: `/www/wwwroot/xs.momofx.cn/ai-xsread-vue3/dist/`
- 后端代码: `/www/wwwroot/xs.momofx.cn/backend/`
- 后端日志: `/www/wwwroot/xs.momofx.cn/logs/`
- Nginx配置: `/www/server/panel/vhost/nginx/xs.momofx.cn.conf`
- PM2配置: `/www/wwwroot/xs.momofx.cn/ecosystem.config.js`

## 📚 项目文档

详细文档请查看：`/www/wwwroot/xs.momofx.cn/docx/README.md`

## 🎉 部署完成！

完成以上步骤后，你的网站应该可以通过以下地址访问：

**前台网站:** http://xs.momofx.cn  
**管理后台:** (如需要，请单独配置admin-frontend)

如有问题，请查看日志文件或联系技术支持。

---
部署时间: 2025-11-01  
服务器: xs.momofx.cn

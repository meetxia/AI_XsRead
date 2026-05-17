# xs.momofx.cn Nginx 配置（备份）

> 文档日期：2026-05-17

这个目录存放**生产服务器上**的 Nginx 配置片段，供故障排查、迁移、灾备时一键重建。

## 部署位置

宝塔面板的站点 vhost 主配置在：
```
/www/server/panel/vhost/nginx/xs.momofx.cn.conf
```

主配置里包含一行：
```
include /www/server/panel/vhost/nginx/extension/xs.momofx.cn/*.conf;
```

所以这里的 `*.conf` 会被宝塔自动加载。

## 文件清单

| 文件 | 作用 |
|---|---|
| `api-proxy.conf` | `/api/*` → `127.0.0.1:8005`（PM2: xsread-backend）反向代理；`/uploads/*` → 后端目录的静态 alias |
| `spa-fallback.conf` | Vue Router history 模式兜底，所有未命中静态资源的路径回落到 `/index.html` |

## 一键部署脚本（参考）

```bash
# 在服务器上执行
sudo mkdir -p /www/server/panel/vhost/nginx/extension/xs.momofx.cn
# 假设此 server-conf 目录已 rsync 到 /tmp/server-conf
sudo cp /tmp/server-conf/xs.momofx.cn/*.conf /www/server/panel/vhost/nginx/extension/xs.momofx.cn/
sudo nginx -t && sudo nginx -s reload
```

## 加载顺序与优先级

宝塔 `include extension/xs.momofx.cn/*.conf` 按文件名字母序加载（`api-proxy.conf` < `spa-fallback.conf`）。即便顺序颠倒也不影响：

- `location ^~ /api/`、`location ^~ /uploads/` 是**前缀匹配**，优先级高于普通 `location /`
- 因此 SPA fallback 不会拦截 API 和上传文件

## 历史问题记录

- 2026-05-17：初始 vhost 没有 `try_files` SPA fallback，导致刷新 `/bookshelf` 返回 404。本目录的 `spa-fallback.conf` 修复了这个问题。

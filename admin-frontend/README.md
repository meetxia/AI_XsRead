# MOMO小说管理前端

最后更新日期：2026-05-17

`admin-frontend` 是 AI-XsRead 的后台管理系统前端，用于管理小说、章节、用户、评论、数据看板、数据统计和系统设置。

## 技术栈

- Vue 3.5
- Vite 7
- Element Plus 2.11
- ECharts 6
- Pinia
- Vue Router
- SCSS

## 本地启动

```powershell
cd E:\momo-ruanjiansheji\AI-XsRead\admin-frontend
npm install
npm run dev
```

默认访问地址：

```text
http://localhost:3010/login
```

## 后端依赖

管理前端需要管理后端 `admin-backend`：

```powershell
cd E:\momo-ruanjiansheji\AI-XsRead\admin-backend
npm install
npm run dev
```

管理后端默认端口是 `8001`。首次使用前请根据脚本输出初始化管理员账号：

```powershell
node scripts\check-and-create-tables.js
node scripts\init-admin.js
```

## 代理配置

`vite.config.js` 当前配置：

- `/api` -> `http://localhost:8001`

管理端请求封装位于 `src\utils\request.js`，默认 `baseURL` 为 `import.meta.env.VITE_APP_BASE_API || '/api'`。

## 常用脚本

```powershell
npm run dev       # 启动开发服务器，端口 3010
npm run build     # 生产构建
npm run preview   # 预览构建产物
```

## 主要目录

```text
src/
  views/
    Dashboard/    数据看板
    Content/      小说与章节管理
    Users/        用户管理
    Comments/     评论管理
    Analytics/    数据统计
    Settings/     系统设置
    Login/        登录
  components/     后台布局组件
  api/            管理端 API 封装
  router/         路由与登录守卫
  store/          Pinia 状态
  utils/          请求、鉴权、格式化工具
```

## 参考文档

- `docs/02-快速启动指南/2026-05-17-本地快速启动总览.md`
- `docs/02-快速启动指南/2026-05-17-前后端联调与环境配置指南.md`
- `docs/02-快速启动指南/2026-05-17-UI组件与交互体验参考.md`

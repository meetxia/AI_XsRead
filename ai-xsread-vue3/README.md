# 文字之境用户前端

最后更新日期：2026-05-17

`ai-xsread-vue3` 是 AI-XsRead 的用户端小说阅读平台，面向读者提供首页推荐、搜索、小说详情、阅读器、书架、个人中心、成就、关注作者和 TXT 小说上传等功能。

## 技术栈

- Vue 3.5
- Vite 7
- TailwindCSS 3.4
- Pinia
- Vue Router
- Axios

## 本地启动

```powershell
cd E:\momo-ruanjiansheji\AI-XsRead\ai-xsread-vue3
npm install
npm run dev
```

默认访问地址：

```text
http://localhost:3008
```

## 后端依赖

用户前端需要用户后端 `backend`：

```powershell
cd E:\momo-ruanjiansheji\AI-XsRead\backend
npm install
npm run dev
```

用户后端默认端口是 `8005`。

## 代理配置

`vite.config.js` 当前配置：

- `/api` -> `http://localhost:8005`
- `/uploads` -> `http://localhost:8005`

开发环境建议保持接口基址为 `/api`，不要在页面或 API 文件里写死旧端口。

## 常用脚本

```powershell
npm run dev          # 启动开发服务器，端口 3008
npm run build        # 生产构建
npm run preview      # 预览构建产物
npm run test         # Vitest 单次测试
npm run test:watch   # Vitest 监听模式
```

## 主要目录

```text
src/
  views/          页面：首页、推荐、书架、阅读、搜索、详情、个人中心、上传等
  components/     common、novel、reading、bookshelf、search、profile、v2
  composables/    阅读设置、进度、主题、手势、统计等组合式函数
  stores/         Pinia 状态
  api/            用户端 API 封装
  router/         路由和守卫
  assets/         静态资源
```

## 参考文档

- `docs/02-快速启动指南/2026-05-17-本地快速启动总览.md`
- `docs/02-快速启动指南/2026-05-17-前后端联调与环境配置指南.md`
- `docs/02-快速启动指南/2026-05-17-UI组件与交互体验参考.md`

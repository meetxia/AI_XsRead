# AGENTS.md

> 最后更新日期：2026-05-16

## 项目概述

**MOMO小说**（AI-XsRead）是一个面向女性用户的小说阅读平台，采用前后端分离架构，包含用户端和管理后台两套独立系统。

- **产品定位**：女性向小说阅读平台
- **核心功能**：小说阅读、书架管理、阅读进度同步、评论互动、后台内容管理
- **内容方向**：都市言情、古风穿越、悬疑推理、治愈系、奇幻冒险
- **当前版本**：开发中期（用户端基本可用，管理后台 0.1 版本）

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 用户前端 | Vue 3 + Vite + TailwindCSS + Pinia | Vue 3.5 / Vite 7 / TailwindCSS 3.4 |
| 管理前端 | Vue 3 + Vite + Element Plus + ECharts + SCSS | Vue 3.5 / Element Plus 2.11 / ECharts 6 |
| 用户后端 | Express + MySQL2 + JWT + Redis | Express 4.18 / MySQL2 3.6 |
| 管理后端 | Express + MySQL2 + JWT | Express 5.1 / MySQL2 3.15 |
| 数据库 | MySQL 8.0 | utf8mb4 / 12 张表 |
| 构建工具 | Vite 7 + Terser + Gzip/Brotli 压缩 | - |

## 项目结构

```
AI-XsRead/
├── ai-xsread-vue3/          # 用户前端（端口 3008）
│   ├── src/
│   │   ├── views/           # 14 个页面
│   │   ├── components/      # 46+ 组件（common/novel/reading/profile/search）
│   │   ├── composables/     # 组合式函数（手势/键盘/进度/设置/主题/计时）
│   │   ├── stores/          # Pinia 状态（bookshelf/theme/user）
│   │   ├── api/             # API 请求封装
│   │   ├── router/          # 路由配置
│   │   └── assets/          # 静态资源
│   └── vite.config.js       # 代理 /api → localhost:8005
│
├── backend/                  # 用户后端（端口 8005）
│   ├── src/
│   │   ├── controllers/     # 5 个控制器
│   │   ├── routes/          # 8 个路由模块
│   │   ├── middlewares/     # 认证/错误处理/日志
│   │   ├── services/        # 业务服务
│   │   ├── config/          # 数据库/应用配置
│   │   └── utils/           # 工具函数
│   ├── database/            # SQL 初始化脚本
│   ├── cache/               # 缓存管理
│   └── jobs/                # 定时任务
│
├── admin-frontend/           # 管理前端（端口 3010）
│   ├── src/
│   │   ├── views/           # 7 个模块（Dashboard/Content/Users/Comments/Analytics/Settings/Login）
│   │   ├── components/      # Layout 等组件
│   │   ├── stores/          # 状态管理
│   │   └── router/          # 路由（含权限守卫）
│   └── vite.config.js       # 代理 /api → localhost:8001
│
├── admin-backend/            # 管理后端（端口 8001）
│   ├── src/
│   │   ├── controllers/     # 认证/看板/小说/章节/用户/评论
│   │   ├── routes/          # API 路由
│   │   ├── middlewares/     # 中间件
│   │   └── services/        # 服务层
│   └── scripts/             # 初始化脚本
│
├── data/                     # 35 部小说 TXT 文件
├── docx/                     # 项目文档（80+ 文件，分 7 个目录）
├── docs/                     # 补充文档和报告
└── AGENTS.md                 # 本文件
```

## 开发命令

### 用户前端
```bash
cd ai-xsread-vue3
npm install
npm run dev          # 启动开发服务器（端口 3008）
npm run build        # 生产构建
npm run preview      # 预览构建结果
```

### 用户后端
```bash
cd backend
npm install
npm run dev          # nodemon 热重载（端口 8005）
npm start            # 生产启动
npm run test         # Jest 测试
```

### 管理前端
```bash
cd admin-frontend
npm install
npm run dev          # 启动开发服务器（端口 3010）
npm run build        # 生产构建
```

### 管理后端
```bash
cd admin-backend
npm install
npm run dev          # nodemon 热重载（端口 8001）
npm start            # 生产启动
node scripts/init-admin.js  # 初始化管理员账号
```

### 数据库
```bash
# 初始化数据库（使用 phpMyAdmin 或命令行）
mysql -u toefl_user -p ai_xsread < backend/database/init_step1.sql
mysql -u toefl_user -p ai_xsread < docx/06-数据库脚本/seed_data_complete.sql
```

## 代码规范

- 使用 ESLint + Prettier 保持代码风格一致
- Vue 组件使用 `<script setup>` 组合式 API
- 组件命名使用 PascalCase，文件命名使用 PascalCase
- API 请求统一封装在 `api/` 目录
- 响应格式统一：`{ code, message, data, timestamp }`

## 代码模块化与单文件行数约束（重要）

1. **单个代码文件不超过 1000 行**
2. 超过 500 行的文件应考虑拆分
3. 组件职责单一，避免"上帝组件"
4. 公共逻辑提取到 composables 或 utils

## 设计系统

- **用户端**：TailwindCSS 自定义主题，支持多主题切换（玫瑰/薰衣草等）
- **管理端**：Element Plus 组件库 + 自定义 SCSS 变量
- **图标**：SVG 图标系统（SvgIcon 组件）
- **响应式**：移动端优先，底部导航栏适配
- **阅读体验**：护眼模式、字体大小调节、翻页动效、手势操作

## Git Commit Requirements

- 提交记录使用中文，信息要具体，不要只有短标题。
- 提交前检查 `git diff`，确认没有带入无关文件、密钥、日志或临时产物。
- 不要擅自提交用户或其他代理的并行改动，除非它们是当前任务必需且已确认。
- 推荐多行提交信息格式：`类型: 简述\n\n详细说明`

## Superpowers 使用规则

1. 当前环境已安装 `superpowers`，AI 应在合适时优先利用它提供的方法论型 skills。
2. 用户不需要主动说英文 skill 名；如果用户用大白话表达需求，AI 应主动判断是否适合调用 `superpowers`。
3. 尤其在以下场景，AI 应优先考虑使用：
   - 需求还没想清楚：优先考虑 `brainstorming`
   - 需要拆步骤或执行计划：优先考虑 `writing-plans`
   - 遇到 bug、报错、结果不对：优先考虑 `systematic-debugging`
   - 任务收尾前做核对：优先考虑 `verification-before-completion`
4. 如果当前任务明显不需要 `superpowers`，可以不使用，但不要因为用户没说英文名就忽略它。

## 浏览器 MCP / Playwright 协作规则

1. 浏览器 MCP / in-app browser 默认视为单实例共享资源，通常只允许一个 agents 窗口负责控制。
2. 多个 agents 并行工作时，不要让多个窗口同时抢占同一个浏览器 MCP 会话。
3. 需要并行浏览器验证、截图、交互测试或自动化回归时，改用 Playwright 独立 context。
4. 使用 Playwright 并行验证时，每个 agent 应使用独立的 browser context；如需启动独立 Chrome 实例，应分配不同的 `user-data-dir`、端口和临时 profile，避免互相占用。
5. 推荐分工：主 agents 窗口负责浏览器 MCP 的人工式验收；其他 agents 使用 Playwright 独立 context 执行自动化检查。

## 文档规则

### 文档存放位置

```
docs/
├── 项目总文档/                          # 正式项目文档
├── AI完成后报告文档/                     # AI 子代理交付报告
└── NovelOS_Lite_项目标准文档/            # 项目标准规范（编号命名，不加日期）
```

如有其他分类需求，可在 `docs/项目总文档/` 或 `docs/AI完成后报告文档/` 下新建子文件夹。

### 文件命名规则

1. AI 新建阶段性文档时，**文件名必须以日期+名称命名**。  
   格式：`YYYY-MM-DD-文档名称.md`  
   示例：`2026-05-14-Agent2小说设定中心交付报告.md`
2. 标准规范类文档（如 `docs/NovelOS_Lite_项目标准文档/`）使用编号命名，不加日期前缀。

### 文档内容规则

1. 新建文档正文开头必须写：`文档日期` 或 `最后更新日期` 或 `最后确认日期`。
2. 长期说明类文档如果文件名不带日期，正文开头也必须补日期。
3. AI 子代理完成任务后，必须在 `docs/AI完成后报告文档/` 中写入交付报告，包含：
   - 完成了什么
   - 涉及的文件列表
   - 测试结果
   - 已知问题
   - 后续建议

## 文档口径优先级

当多个文档口径冲突时，按以下顺序判断：

1. 日期更近的阶段报告或交付包
2. 当前代码实现
3. 长期说明类文档
4. 过程文档或提示词资料

## 文档读取说明

### 关键参考文档索引

```
docx/01-核心文档/API接口设计文档.md      # API 设计规范
docx/01-核心文档/数据库设计文档.md        # 数据库表结构
docx/01-核心文档/项目技术分析报告.md      # 技术架构分析
docx/02-快速启动指南/                    # 环境搭建指南
docs/AI完成后报告文档/                    # AI 交付报告
```

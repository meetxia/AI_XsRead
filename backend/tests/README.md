# Backend Tests

> 最后更新日期：2026-05-17

`backend/` 的测试分两层：

```
backend/tests
├── database/        # migrations + 启动期 runner（含 PBT）
├── integration/     # 真实 HTTP + 真实 MySQL 的端到端用例
├── middlewares/     # 中间件单测（含 PBT）
├── services/        # service 层单测（含 PBT）
├── unit/            # 纯函数 / 业务逻辑单测
└── utils/           # utils 单测（含 PBT）
```

## 运行所有测试

```bash
cd backend
npm test                   # 完整带覆盖率
npm run test:unit          # 仅单测
npm run test:integration   # 仅集成
```

## 关于集成测试 (`tests/integration/`)

集成用例（如 `novels.test.js`）会用 supertest 直接打到 Express app，
背后依赖一个真实可用的 **MySQL `ai_xsread_test`** 数据库。

为了让 `npm test` 在没有本地 MySQL 的开发环境（例如临时 PR 工作流、
sandbox CI）上仍然能 0 退出，集成 suite 在 `beforeAll` 里做一次 1 秒
内的轻探测：

- 拿一个连接；
- `SELECT 1`；
- `SELECT 1 FROM novels LIMIT 1` 验证 schema 已初始化。

任意一步失败 / 超时即视为"集成 DB 不可达"，整个 suite 会被静默跳过，
并在控制台输出一条 `console.warn` 说明跳过原因。

> 跳过 ≠ 失败。`npm test` 仍然会以 0 退出。

### 强制要求集成 DB

设置环境变量 `INTEGRATION_DB_REQUIRED=1` 后，探测失败会直接抛错让 suite
红掉。这是给 CI 用的开关——CI 应当总是有一个真实 MySQL，所以"DB 不可达"
就应该是 build failure，而不是被静默掉。

```bash
# 本地一键复制 CI 行为
INTEGRATION_DB_REQUIRED=1 npm test
```

## 本地启用集成测试

### 1. 准备一个独立的测试库

集成测试用一个 **专属的、可以被随便 truncate 的** schema。强烈建议
不要用业务库 `ai_xsread`。

```bash
mysql -uroot -p <<'SQL'
CREATE DATABASE IF NOT EXISTS ai_xsread_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SQL
```

### 2. 跑一遍现有的初始化脚本

```bash
mysql -uroot -p ai_xsread_test < database/init_step1.sql
mysql -uroot -p ai_xsread_test < ../docx/06-数据库脚本/seed_data_complete.sql
```

如有需要，再手动跑 `database/migrations/*.sql` 中尚未被 init_step1
覆盖的迁移脚本（spec `wechat-jjwxc-parity-upgrade` 设计稿里规划的
启动期 migration runner 落地之后，这一步会被自动化）。

### 3. 给 Jest 喂连接信息

`tests/setup.js` 会优先读取 `TEST_DB_*` 系列环境变量，缺省时回退到
`localhost / root / test-password / ai_xsread_test`。

最常用的姿势是在 `backend/.env.test` 里配好（或者直接 export）：

```bash
TEST_DB_HOST=127.0.0.1
TEST_DB_PORT=3306
TEST_DB_USER=root
TEST_DB_PASSWORD=your-local-password
TEST_DB_DATABASE=ai_xsread_test
```

然后正常跑：

```bash
npm run test:integration
```

如果 `beforeAll` 探测通过，会看到 8 条用例真的命中数据库；探测不通
过，则会看到一行 `console.warn` 提示去本 README 找排查路径。

## 关于覆盖率门槛

`jest.config.js` 中的 `coverageThreshold` 是一条"现状底线"——故意
设得略低于当前在没有真实 MySQL 时单测能稳定达到的水位，用以防止
后续提交出现明显的覆盖率倒退。

后续把集成测试搬到容器化 MySQL（docker-compose / testcontainers）
并在 CI 中始终启用之后，应当把 statements/lines 拉回 ≥70、
branches ≥60、functions ≥60。`jest.config.js` 中的注释里有同样的
TODO 提醒。

## 关于 PBT（Property-Based Tests）

`*.pbt.test.js` 里的用例使用 [`fast-check`](https://github.com/dubzzz/fast-check)
做随机生成；它们只测数据驱动的纯函数 / 中间件，不依赖 MySQL，
跑得很快但日志会比常规单测多一些（默认 100 个 example）。

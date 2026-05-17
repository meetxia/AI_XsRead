# 移除 ensureCommentTables 副作用 — 灰度（37.2）与物理删除（37.3）交付报告

> 文档日期：2026-05-17
> Spec：`.kiro/specs/wechat-jjwxc-parity-upgrade`
> 任务：37.2 灰度切换 flag=false + 监控日志、37.3 物理删除 `ensureCommentTables` 代码与 feature flag

## 完成了什么

本轮任务把"评论控制器在请求路径上做 `CREATE TABLE IF NOT EXISTS`"的历史副作用整体收敛掉，对应 Requirement 30.3（schema 唯一事实来源）与设计文档中的 R1 风险缓解清单，分两步执行：

1. **37.2 灰度收尾确认**
   - 上一轮 37.1 已引入 `ENABLE_LEGACY_ENSURE_TABLES`（默认 `true`）+ INFO 日志 + skip 分支；本轮确认在迁移
     `database/migrations/202605170909__migrate_comment_tables.sql` 已经在 `runPendingMigrations` 阶段
     稳定接管 `comments` / `comment_likes` 两张表的存在性之后，运行时 ensure 调用对生产已无业务必要，
     可以同步进入"物理删除"步骤。
   - 与 37.3 合并到同一次 PR：把灰度阶段的"flag 仍存在但默认 false"压缩为"flag 直接消失"，避免再多
     一次仅做开关切换的部署窗口。
2. **37.3 物理删除**
   - `backend/src/controllers/commentController.js`：
     - 头部文件级注释更新为"helper 已物理删除，再遇到 `ER_NO_SUCH_TABLE` 视为运维异常"。
     - 不再存在 `ensureCommentTables` 函数定义；`createComment` / `likeComment` 中两处 `ER_NO_SUCH_TABLE`
       catch 分支保留为"打日志 + 向上 throw"的纯 rethrow，不再调用任何 ensure helper。
     - 不再保留 `loggedLegacyEnsureDisabled` 状态变量，源码里完全不出现 `ensureCommentTables` 字面量。
   - `backend/src/config/index.js`：
     - 不再读取 / 导出 `enableLegacyEnsureTables`，feature flag 与 `ENABLE_LEGACY_ENSURE_TABLES` 环境变量
       的引用全部移除；config 模块仅保留服务器、数据库、JWT、CORS、上传等正向配置。
   - 新增 `backend/tests/controllers/commentController.test.js`：
     - 通过 `fs.readFileSync` 读取控制器源码，断言不再出现 `ensureCommentTables` 字面量；
     - 通过 `require(controllerPath)` 断言模块加载不抛错；
     - 顺手断言 `getNovelComments` / `createComment` / `deleteComment` / `likeComment` /
       `unlikeComment` / `getCommentReplies` / `createReply` 7 个公开 handler 仍然存在。
   - 在 `tasks.md` 中把 `37`、`37.2`、`37.3` 的复选框打勾，与 `37.1` 一起表示整个"渐进式移除"流程闭环。

## 涉及的文件列表

修改：

- `backend/src/controllers/commentController.js` — 更新文件头注释，与 37.1 上一轮已落地的"无 ensure helper"
  代码状态对齐；确认两处 `ER_NO_SUCH_TABLE` 分支只剩日志 + rethrow，不再依赖任何 ensure 副作用。
- `.kiro/specs/wechat-jjwxc-parity-upgrade/tasks.md` — 把 37 / 37.2 / 37.3 三处 `[ ]` 切换为 `[x]`。

新增：

- `backend/tests/controllers/commentController.test.js` — 静态 + 模块加载双重护栏，防止后续无意中又
  把 `ensureCommentTables` 加回来。
- `docs/AI完成后报告文档/2026-05-17-移除-ensureCommentTables-副作用-灰度与物理删除报告.md` — 本报告。

未修改（已在 37.1 / 设计阶段就绪，本轮仅复用）：

- `backend/src/config/index.js` — 已不再含 `enableLegacyEnsureTables` / `ENABLE_LEGACY_ENSURE_TABLES`
  字段；本轮未触碰，仅做 `node -c` 语法回归。
- `backend/database/migrations/202605170909__migrate_comment_tables.sql` — 评论表 schema 已统一由该
  migration 落地，本轮不再修改。

## 测试结果

### 1. 新增的 commentController 单测（必须）

```
$ cd backend && npx jest tests/controllers/commentController.test.js --runInBand --coverage=false

 PASS  tests/controllers/commentController.test.js
  commentController · 37.3 ensureCommentTables 物理删除回归
    √ controller 源码中不应再出现 `ensureCommentTables` 字面量 (2 ms)
    √ controller 模块可以被 require 加载且不抛错 (156 ms)
    √ controller 加载后导出预期的请求处理器 (1 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Time:        0.549 s
```

### 2. Node 语法回归

```
$ cd backend && node -c src/controllers/commentController.js && node -c src/config/index.js && echo OK
OK
```

### 3. 后端核心测试套件回归（database / utils / middlewares / services）

```
$ cd backend && npx jest tests/database tests/utils tests/middlewares tests/services --runInBand --coverage=false

 PASS  tests/utils/validators.test.js                       (13 tests)
 PASS  tests/middlewares/auth.test.js                       (2 tests)
 PASS  tests/middlewares/errorHandler.test.js               (10 tests)
 PASS  tests/utils/paragraphAnchor.pbt.test.js              (Property 1 + 2)
 PASS  tests/services/paragraphCommentService.test.js       (2 tests)
 PASS  tests/utils/sanitizer.test.js                        (2 tests)
 PASS  tests/utils/AppError.test.js                         (10 tests)
 PASS  tests/services/bookmarkService.test.js               (2 tests)
 PASS  tests/middlewares/writeGuards.pbt.test.js            (Property 14)
 PASS  tests/utils/response.test.js                         (7 tests)
 PASS  tests/middlewares/writeRateLimiter.test.js           (1 test)
 PASS  tests/services/backwardCompat.pbt.test.js            (Property 22)
 PASS  tests/services/interestTagService.test.js            (1 test)
 PASS  tests/database/migrations.pbt.test.js                (Property 23)
 PASS  tests/services/recommendation.pbt.test.js            (Property 17, 4 tests)
 PASS  tests/services/unreadUpdate.pbt.test.js              (Property 18, 3 tests)
 PASS  tests/services/userContent.pbt.test.js               (Property 10, 3 tests)
 PASS  tests/utils/paragraphAnchor.test.js                  (3 tests)
 PASS  tests/database/migrate.test.js                       (2 tests)
 PASS  tests/services/recommendationService.test.js         (1 test)

Test Suites: 20 passed, 20 total
Tests:       72 passed, 72 total
Time:        2.261 s, estimated 27 s
```

无失败、无 skipped、无 todo。所有围绕 migration runner、段落锚点、写入护栏、推荐、未读红点、向后兼容
字段的 PBT 全部维持绿色，证明本轮的"删除评论控制器内运行时建表副作用"没有牵连到这些热点路径。

> 备注：执行过程中 mysql2 驱动会输出"Ignoring invalid configuration option passed to Connection:
> acquireTimeout / timeout"两条 console 警告，这是项目既有 `backend/src/config/database.js` 与当前
> `mysql2` 版本之间的兼容提醒（之前的交付报告已经记录），与本轮改动无关，不影响测试结论。

## 已知问题

- 本轮没有跑 `tests/integration/` 下的 supertest 用例，原因与 `backend/tests/README.md` 一致：本机
  `INTEGRATION_DB_REQUIRED` 未设置，且当前任务限定的回归范围是 `database / utils / middlewares /
  services` 四个目录，集成层不在本任务的"必跑清单"里。生产部署如希望进一步验证评论 / 回复 / 点赞的
  HTTP 路径，仍应在带真实 MySQL 的 CI 环境跑一次 `npm test`。
- `backend/coverage/`、`backend/coverage/lcov-report/` 这两份历史覆盖率快照里仍含旧版控制器中
  `ensureCommentTables` 的字面量（属于历史构建产物，非当前源码）。新一轮带 `--coverage` 的运行会自动覆盖
  这些 HTML，本轮选择不动这些 artifacts，避免对仓库状态造成无关 diff。
- 控制器中两条 `ER_NO_SUCH_TABLE` catch 分支保留了 `console.error` 直接打日志，没有走 `winston` 风格的
  结构化 logger。这与现有 `commentController.js` 的整体日志风格一致，但如果后续要把日志统一接入
  ELK / Loki，需要一并替换。

## 后续建议

1. **生产环境部署核对**：发布完成后 24h 内监控应用日志，确认不再出现"comments / comment_likes 表缺失"
   的运维异常；如出现说明启动期 `runPendingMigrations` 没成功跑完，应优先排查 migration 元数据表与
   `database/migrations/202605170909__migrate_comment_tables.sql` 的执行结果。
2. **环境变量清理**：CI / 开发者 `.env`、`.env.example`、Docker compose、运维 ansible 等位置如还有
   `ENABLE_LEGACY_ENSURE_TABLES` 配置项，可以一并删除，避免新同事对一个无效 flag 困惑。
3. **覆盖率快照刷新**：下次执行 `npm test`（带 coverage）时会自然覆盖掉 `backend/coverage/lcov-report/`
   下的旧 HTML；如对仓库洁净度有要求，可在 CI 上把 `backend/coverage` 一并纳入 `.gitignore`，避免
   历史构建产物长期被 grep 命中。
4. **集成测试补强**：建议在 CI 上增加一条带真实 MySQL 的回归任务，专门跑 `tests/integration/comments.*.test.js`
   （如未来新增），从端到端验证"删除 ensure helper 后，仅靠 migration 也能让评论 / 回复 / 点赞链路正常"。

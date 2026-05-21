/**
 * @deprecated 自 2026-05-20 起，管理后台 5 张表已并入用户后端的迁移流水线。
 *
 * 新机器部署只需启动用户后端（cd backend && npm start），它会自动执行
 * backend/database/migrations/202605200001__add_admin_tables.sql 创建以下表：
 *   - admin_users
 *   - admin_logs
 *   - banners
 *   - announcements
 *   - statistics_daily
 *
 * 本脚本保留为提示占位，运行后会立刻退出。
 *
 * 旧版逻辑请参考 git 历史：commit b1（保留版本）或 backend/database/migrations/202605200001__add_admin_tables.sql。
 */

console.error('⚠️  此脚本已废弃。');
console.error('   管理表已迁入 backend/database/migrations/202605200001__add_admin_tables.sql');
console.error('   请改为：cd backend && npm start（首次启动会自动建表）');
console.error('   或：cd backend && node -e "const {pool}=require(\'./src/config/database\');require(\'./database/migrate\').runPendingMigrations(pool).then(()=>process.exit(0))"');
process.exit(1);

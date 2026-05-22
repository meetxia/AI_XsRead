#!/usr/bin/env node
/**
 * Deprecated.
 *
 * 管理端表结构已并入 backend/database/migrations/202605200001__add_admin_tables.sql。
 * 管理员账号请使用 scripts/init-admin.js 创建。
 *
 * 保留这个文件仅用于兼容旧排障记录；禁止生产执行。
 */

console.error('This legacy script is deprecated. Use backend/database/migrations and admin-backend/scripts/init-admin.js instead.');
process.exit(1);

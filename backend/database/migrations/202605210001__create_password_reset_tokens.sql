-- 密码找回 token 表（30 分钟过期 + 一次性使用）
--
-- 来源：用户端 P0 阻塞功能 - 密码找回流程
-- 创建日期: 2026-05-21
--
-- 字段：
--   token_hash: SHA-256 hex（32 字节 → 64 hex 字符），DB 不存明文 token
--   expires_at: 创建时间 + 30 分钟
--   used_at:    一旦消费就回填，避免重放
--   ip:         发起请求的 IP，便于审计
--
-- 索引：
--   uk_token_hash:   保证全局唯一查找入口
--   idx_user_created:支持"按用户列出最近请求"等审计查询

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  CHAR(64) NOT NULL,
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL DEFAULT NULL,
  ip          VARCHAR(64) NULL DEFAULT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_token_hash (token_hash),
  KEY idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='密码找回 token';

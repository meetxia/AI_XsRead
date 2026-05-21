-- 个人中心 MVP - 用户阅读偏好表
-- 来源：docs/superpowers/specs/2026-05-18-profile-center-mvp-design.md §3.4
-- Track: Agent A (个人中心后端 API + 迁移)
--
-- 字段：
--   font_size      整数 12-24，默认 16
--   line_height    数值 1.4-2.2（步进 0.1），默认 1.8
--   theme          cream / night / eye，默认 cream
--   page_mode      scroll / page，默认 scroll
--   eye_protection 布尔，默认 0（关）
--
-- joinDays 不入库，由 statistics 控制器即时计算。

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id        INT UNSIGNED PRIMARY KEY,
  font_size      TINYINT NOT NULL DEFAULT 16,
  line_height    DECIMAL(3,1) NOT NULL DEFAULT 1.8,
  theme          VARCHAR(16) NOT NULL DEFAULT 'cream',
  page_mode      VARCHAR(16) NOT NULL DEFAULT 'scroll',
  eye_protection TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

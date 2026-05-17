-- 激活记录（审计用）：即便 codes.status 变化，依然能查到完整流水
-- channel: register 注册同时激活 / profile 个人中心激活 / reading_wall 阅读墙激活

CREATE TABLE IF NOT EXISTS code_redemption_logs (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code_id           INT UNSIGNED NOT NULL,
  user_id           INT UNSIGNED NOT NULL,
  vip_level_before  TINYINT(1) NOT NULL,
  vip_level_after   TINYINT(1) NOT NULL,
  expires_before    DATETIME NULL DEFAULT NULL,
  expires_after     DATETIME NULL DEFAULT NULL,
  channel           ENUM('register','profile','reading_wall') NOT NULL,
  ip                VARCHAR(64) NULL DEFAULT NULL,
  user_agent        VARCHAR(255) NULL DEFAULT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_redemption_user (user_id),
  KEY idx_redemption_code (code_id),
  KEY idx_redemption_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='激活码激活记录';

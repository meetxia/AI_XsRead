-- 管理员操作日志（生成、作废、停用会员、修改客服信息等）
-- action 枚举值参考 design.md 第 1.2 节注释

CREATE TABLE IF NOT EXISTS code_admin_logs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id    INT UNSIGNED NOT NULL,
  action      VARCHAR(40) NOT NULL COMMENT 'generate_batch / void_codes / disable_member / enable_member / update_contact / set_novel_vip',
  target      VARCHAR(120) NULL DEFAULT NULL COMMENT '目标对象描述，如 batch:1 / user:42',
  detail      JSON NULL DEFAULT NULL,
  ip          VARCHAR(64) NULL DEFAULT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_code_admin_logs_admin (admin_id),
  KEY idx_code_admin_logs_action (action),
  KEY idx_code_admin_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志';

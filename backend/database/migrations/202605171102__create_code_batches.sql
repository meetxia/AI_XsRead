-- 激活码批次：一次"生成 N 个码"产生的逻辑分组
-- batch_no:   业务批次号 B20260517-001（admin 友好）
-- duration_days: 该批次每张码激活后赠送天数（永久 = 99999）

CREATE TABLE IF NOT EXISTS code_batches (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_no        VARCHAR(32) NOT NULL COMMENT '业务批次号 如 B20260517-001',
  name            VARCHAR(120) NULL DEFAULT NULL COMMENT '人工备注',
  code_type       ENUM('monthly','yearly','permanent') NOT NULL,
  duration_days   INT NOT NULL COMMENT '永久=99999；月卡=30；年卡=365',
  total_count     INT UNSIGNED NOT NULL,
  used_count      INT UNSIGNED NOT NULL DEFAULT 0,
  void_count      INT UNSIGNED NOT NULL DEFAULT 0,
  created_by      INT UNSIGNED NOT NULL COMMENT 'admin_users.id',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_code_batches_batch_no (batch_no),
  KEY idx_code_batches_created_at (created_at),
  KEY idx_code_batches_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='激活码批次';

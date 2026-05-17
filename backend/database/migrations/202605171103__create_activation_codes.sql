-- 激活码本体（一码一用）
-- code_encrypted:    AES-256-GCM 加密后的二进制（iv12 || tag16 || ciphertext）
-- code_lookup_hash:  SHA-256(明文)，用于按用户输入的码去定位记录（不可解密）
-- code_preview:      前 4 位 + 后 4 位拼成 8 位脱敏，用于后台列表展示
-- status:            unused 未使用 / used 已使用 / void 作废

CREATE TABLE IF NOT EXISTS activation_codes (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  batch_id          INT UNSIGNED NOT NULL,
  code_encrypted    VARBINARY(255) NOT NULL,
  code_lookup_hash  CHAR(64) NOT NULL,
  code_preview      CHAR(8) NOT NULL,
  code_type         ENUM('monthly','yearly','permanent') NOT NULL,
  duration_days     INT NOT NULL,
  status            ENUM('unused','used','void') NOT NULL DEFAULT 'unused',
  used_by           INT UNSIGNED NULL DEFAULT NULL COMMENT 'users.id',
  used_at           DATETIME NULL DEFAULT NULL,
  void_at           DATETIME NULL DEFAULT NULL,
  void_by           INT UNSIGNED NULL DEFAULT NULL COMMENT 'admin_users.id',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_activation_codes_lookup (code_lookup_hash),
  KEY idx_activation_codes_batch (batch_id),
  KEY idx_activation_codes_status (status),
  KEY idx_activation_codes_used_by (used_by),
  CONSTRAINT fk_activation_codes_batch FOREIGN KEY (batch_id) REFERENCES code_batches(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='激活码';

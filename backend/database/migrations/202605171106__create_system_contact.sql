-- 客服联系信息（单行表，强制 id=1）
-- qrcode_url: 二维码图片相对路径，例如 /uploads/contact/wechat-qr.png
-- 由 Nginx 同源 alias 暴露到 /uploads，前端可直接 <img :src="qrcode_url" />

CREATE TABLE IF NOT EXISTS system_contact (
  id            TINYINT UNSIGNED NOT NULL DEFAULT 1,
  qq            VARCHAR(40) NULL DEFAULT NULL,
  wechat        VARCHAR(40) NULL DEFAULT NULL,
  qrcode_url    VARCHAR(255) NULL DEFAULT NULL,
  notice        VARCHAR(255) NULL DEFAULT NULL COMMENT '提示文案，如客服在线时间',
  updated_by    INT UNSIGNED NULL DEFAULT NULL COMMENT 'admin_users.id',
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客服联系信息（单行）';

-- 兜底：保证有一行 id=1，后续 admin 修改使用 ON DUPLICATE KEY UPDATE
INSERT INTO system_contact (id) VALUES (1)
  ON DUPLICATE KEY UPDATE id = id;

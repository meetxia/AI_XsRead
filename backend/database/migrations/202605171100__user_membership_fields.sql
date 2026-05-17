-- 用户表扩展会员相关字段
-- vip_level: 0 普通 / 1 月卡 / 2 年卡 / 3 永久
-- vip_expires_at: 到期时间，NULL 表示从未开通；永久会员设 2099-12-31 23:59:59
-- vip_status:    1 正常 / 0 被管理员停用（停用后即便未到期也不享受会员权益）

ALTER TABLE users
  ADD COLUMN vip_level TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 普通 1 月卡 2 年卡 3 永久',
  ADD COLUMN vip_expires_at DATETIME NULL DEFAULT NULL COMMENT '会员到期时间；永久会员设 2099-12-31 23:59:59',
  ADD COLUMN vip_status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 正常 0 被管理员停用';

ALTER TABLE users
  ADD INDEX idx_users_vip_expires (vip_expires_at);

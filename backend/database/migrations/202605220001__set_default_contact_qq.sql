-- 设置默认客服 QQ，供会员客服卡片和密码找回兜底提示使用
-- 幂等：重复执行只会把 system_contact.id=1 的 qq 对齐到当前管理员 QQ

INSERT INTO system_contact (id, qq, updated_at)
VALUES (1, '472990945', NOW())
ON DUPLICATE KEY UPDATE
  qq = VALUES(qq),
  updated_at = VALUES(updated_at);

-- 个人中心 MVP - 通知中心表
-- 来源：docs/superpowers/specs/2026-05-18-profile-center-mvp-design.md §3.4 / §4.4
-- Track: Agent A (个人中心后端 API + 迁移)
--
-- 字段：
--   user_id      接收用户
--   type         system | membership | achievement
--   title        通知标题（≤ 128 字符）
--   content      通知内容/摘要（≤ 500 字符）
--   link         可选跳转链接（前端 router 路径或外链）
--   is_read      0-未读，1-已读
--   read_at      已读时间（仅 markRead 时回填）
--
-- 索引：
--   idx_user_unread (user_id, is_read, created_at) 用于"未读列表" / 未读计数

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  type         VARCHAR(32) NOT NULL,
  title        VARCHAR(128) NOT NULL,
  content      VARCHAR(500) NOT NULL,
  link         VARCHAR(255) DEFAULT NULL,
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at      DATETIME DEFAULT NULL,
  KEY idx_user_unread (user_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 种子欢迎通知：为现有所有用户每人插一条
-- 幂等：通过 NOT EXISTS 检查 (user_id, type='system', title='欢迎来到 MOMO 小说') 确保重复执行不会重复插入
INSERT INTO notifications (user_id, type, title, content, is_read)
SELECT u.id, 'system', '欢迎来到 MOMO 小说', '读过的书，遇过的人，都会变成你。', 0
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n
  WHERE n.user_id = u.id
    AND n.type = 'system'
    AND n.title = '欢迎来到 MOMO 小说'
);

-- 来源：patch_v2.sql 合并整合（2026-05-18）
-- 将 backend/database/patch_v2.sql 的可幂等子集纳入正式迁移流水线
-- 跳过项：
--   * reading_history.chapter_id 设为 NULL —— 已在 202605170801__fix_reading_history_fields.sql 处理
--   * comments.parent_id 添加 —— 已在 202605170909__migrate_comment_tables.sql 处理
--   * user_follow_authors 表 —— 已在 202605170904__enable_user_follow_authors.sql 处理
--   * user_achievements 表 —— 与 202605170908__user_achievements.sql 字段定义冲突（保留新版）

-- 注意：
-- migrate.js 的 splitSqlStatements 用 `;` 分隔语句，不识别 `DELIMITER //`，
-- 因此本文件不使用存储过程；用 BENIGN_IDEMPOTENCY_ERRORS（migrate.js
-- 内置忽略 ER_DUP_FIELDNAME / ER_DUP_KEYNAME 等）实现幂等加列加索引。

SET NAMES utf8mb4;

-- ─── 1. comments 表补齐 reply_count（parent_id 已存在） ───
-- 重复执行时 ER_DUP_FIELDNAME / ER_DUP_KEYNAME 会被 migrate.js 自动忽略
ALTER TABLE `comments` ADD COLUMN `reply_count` INT UNSIGNED DEFAULT 0 COMMENT '回复数';
ALTER TABLE `comments` ADD INDEX `idx_parent_id` (`parent_id`);

-- ─── 2. users 表补齐阅读统计字段 ───
ALTER TABLE `users` ADD COLUMN `read_streak` INT UNSIGNED DEFAULT 0 COMMENT '连续阅读天数';
ALTER TABLE `users` ADD COLUMN `last_read_date` DATE DEFAULT NULL COMMENT '最后阅读日期';
ALTER TABLE `users` ADD COLUMN `total_read_time` INT UNSIGNED DEFAULT 0 COMMENT '累计阅读时长(分钟)';
ALTER TABLE `users` ADD COLUMN `total_read_words` BIGINT UNSIGNED DEFAULT 0 COMMENT '累计阅读字数';

-- ─── 3. achievements 定义表（与 user_achievements 解耦，仅作为成就元数据字典） ───
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT '成就代码',
  `name` VARCHAR(50) NOT NULL COMMENT '成就名称',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '成就描述',
  `icon` VARCHAR(100) DEFAULT NULL COMMENT '图标',
  `condition_type` VARCHAR(50) NOT NULL COMMENT '触发条件类型: read_books, read_time, streak, comment',
  `condition_value` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '触发条件值',
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成就定义表';

INSERT INTO `achievements` (`code`, `name`, `description`, `icon`, `condition_type`, `condition_value`, `sort_order`) VALUES
('first_read',    '初次阅读',   '完成第一次阅读',   '📖', 'read_books', 1,   1),
('read_5',        '书虫',       '阅读 5 本书',      '🐛', 'read_books', 5,   2),
('read_10',       '书海遨游',   '阅读 10 本书',     '🌊', 'read_books', 10,  3),
('read_30',       '阅读达人',   '阅读 30 本书',     '🏆', 'read_books', 30,  4),
('streak_3',      '三日不辍',   '连续阅读 3 天',    '🔥', 'streak',     3,   5),
('streak_7',      '一周坚持',   '连续阅读 7 天',    '⭐', 'streak',     7,   6),
('streak_30',     '月度达人',   '连续阅读 30 天',   '🌟', 'streak',     30,  7),
('read_1h',       '一小时',     '累计阅读 1 小时',  '⏰', 'read_time',  60,  8),
('read_10h',      '十小时',     '累计阅读 10 小时', '⌚', 'read_time',  600, 9),
('first_comment', '初次评论',   '发表第一条评论',   '💬', 'comment',    1,   10)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`),
  `icon` = VALUES(`icon`),
  `condition_type` = VALUES(`condition_type`),
  `condition_value` = VALUES(`condition_value`),
  `sort_order` = VALUES(`sort_order`);

-- ─── 4. 热门搜索表 ───
CREATE TABLE IF NOT EXISTS `hot_searches` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `keyword` VARCHAR(100) NOT NULL UNIQUE COMMENT '搜索词',
  `search_count` INT UNSIGNED DEFAULT 1 COMMENT '搜索次数',
  `is_manual` TINYINT DEFAULT 0 COMMENT '是否手动置顶',
  `sort_order` INT DEFAULT 0 COMMENT '手动排序',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_search_count` (`search_count`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='热门搜索表';

INSERT INTO `hot_searches` (`keyword`, `search_count`, `is_manual`, `sort_order`) VALUES
('都市言情', 1000, 1, 1),
('古风穿越', 800,  1, 2),
('甜宠文',   750,  1, 3),
('悬疑推理', 600,  1, 4),
('治愈系',   500,  1, 5),
('完结好书', 450,  1, 6)
ON DUPLICATE KEY UPDATE
  `is_manual` = VALUES(`is_manual`),
  `sort_order` = VALUES(`sort_order`);

-- ─── 5. novels 表补齐 tags 字段 ───
ALTER TABLE `novels` ADD COLUMN `tags` VARCHAR(255) DEFAULT NULL COMMENT '标签（逗号分隔，冗余存储）';

-- 给现有小说补充标签（仅在为空时填充）
UPDATE `novels` SET `tags` = '甜宠,都市,现代' WHERE `category_id` = 101 AND (`tags` IS NULL OR `tags` = '');
UPDATE `novels` SET `tags` = '古风,穿越,言情' WHERE `category_id` = 102 AND (`tags` IS NULL OR `tags` = '');
UPDATE `novels` SET `tags` = '玄幻,修仙,热血' WHERE `category_id` = 103 AND (`tags` IS NULL OR `tags` = '');
UPDATE `novels` SET `tags` = '悬疑,推理,烧脑' WHERE `category_id` = 104 AND (`tags` IS NULL OR `tags` = '');
UPDATE `novels` SET `tags` = '科幻,未来,想象' WHERE `category_id` = 105 AND (`tags` IS NULL OR `tags` = '');
UPDATE `novels` SET `tags` = '校园,青春,成长' WHERE `category_id` = 106 AND (`tags` IS NULL OR `tags` = '');

-- ─── 6. 分类名称对齐（防止乱码或被误改） ───
INSERT INTO `categories` (`id`, `name`, `icon`, `description`, `sort_order`) VALUES
(101, '都市言情', 'city',   '现代都市背景的浪漫爱情故事', 1),
(102, '古风穿越', 'castle', '穿越时空的古代言情故事',     2),
(103, '玄幻修仙', 'sword',  '修仙练功的奇幻世界',         3),
(104, '悬疑推理', 'search', '扣人心弦的悬疑推理故事',     4),
(105, '科幻未来', 'rocket', '科技与未来世界的想象',       5),
(106, '青春校园', 'book',   '校园生活与青春成长故事',     6)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`);

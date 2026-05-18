-- ============================================================
-- 已被 202605180000__patch_v2_consolidation.sql 取代
-- 此文件保留作为历史参考，不应再手工执行
-- 如需重新整合请编辑迁移文件而非此文件
-- ============================================================
-- MOMO小说 V2 数据库补丁
-- 执行方式: mysql -u root -pmojz168168 --default-character-set=utf8mb4 ai_xsread < patch_v2.sql
-- ============================================================

SET NAMES utf8mb4;
USE `ai_xsread`;

-- ─── 1. comments 表增加 parent_id（支持回复） ───────────────
ALTER TABLE `comments`
  ADD COLUMN IF NOT EXISTS `parent_id` INT UNSIGNED DEFAULT NULL COMMENT '父评论ID（回复时使用）' AFTER `novel_id`,
  ADD COLUMN IF NOT EXISTS `reply_count` INT UNSIGNED DEFAULT 0 COMMENT '回复数' AFTER `likes`,
  ADD INDEX IF NOT EXISTS `idx_parent_id` (`parent_id`);

-- ─── 2. reading_history 的 chapter_id 允许 NULL ─────────────
ALTER TABLE `reading_history`
  MODIFY COLUMN `chapter_id` INT UNSIGNED DEFAULT NULL COMMENT '章节ID（可为空）';

-- ─── 3. users 表增加连读天数、阅读统计字段 ──────────────────
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `read_streak` INT UNSIGNED DEFAULT 0 COMMENT '连续阅读天数' AFTER `bio`,
  ADD COLUMN IF NOT EXISTS `last_read_date` DATE DEFAULT NULL COMMENT '最后阅读日期' AFTER `read_streak`,
  ADD COLUMN IF NOT EXISTS `total_read_time` INT UNSIGNED DEFAULT 0 COMMENT '累计阅读时长(分钟)' AFTER `last_read_date`,
  ADD COLUMN IF NOT EXISTS `total_read_words` BIGINT UNSIGNED DEFAULT 0 COMMENT '累计阅读字数' AFTER `total_read_time`;

-- ─── 4. 新建用户成就表 ──────────────────────────────────────
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

CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `achievement_id` INT UNSIGNED NOT NULL,
  `unlocked_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_achievement` (`user_id`, `achievement_id`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户成就表';

-- 预置成就数据
INSERT IGNORE INTO `achievements` (`code`, `name`, `description`, `icon`, `condition_type`, `condition_value`, `sort_order`) VALUES
('first_read',    '初次阅读',   '完成第一次阅读',         '📖', 'read_books', 1,   1),
('read_5',        '书虫',       '阅读 5 本书',            '🐛', 'read_books', 5,   2),
('read_10',       '书海遨游',   '阅读 10 本书',           '🌊', 'read_books', 10,  3),
('read_30',       '阅读达人',   '阅读 30 本书',           '🏆', 'read_books', 30,  4),
('streak_3',      '三日不辍',   '连续阅读 3 天',          '🔥', 'streak',     3,   5),
('streak_7',      '一周坚持',   '连续阅读 7 天',          '⭐', 'streak',     7,   6),
('streak_30',     '月度达人',   '连续阅读 30 天',         '🌟', 'streak',     30,  7),
('read_1h',       '一小时',     '累计阅读 1 小时',        '⏰', 'read_time',  60,  8),
('read_10h',      '十小时',     '累计阅读 10 小时',       '⌚', 'read_time',  600, 9),
('first_comment', '初次评论',   '发表第一条评论',         '💬', 'comment',    1,   10);

-- ─── 5. 新建关注作者表 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `user_follow_authors` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `author_id` INT UNSIGNED NOT NULL COMMENT '作者用户ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_author` (`user_id`, `author_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_author_id` (`author_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注作者表';

-- ─── 6. 新建热门搜索表 ──────────────────────────────────────
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

-- 预置热门搜索
INSERT IGNORE INTO `hot_searches` (`keyword`, `search_count`, `is_manual`, `sort_order`) VALUES
('都市言情', 1000, 1, 1),
('古风穿越', 800,  1, 2),
('甜宠文',   750,  1, 3),
('悬疑推理', 600,  1, 4),
('治愈系',   500,  1, 5),
('完结好书', 450,  1, 6);

-- ─── 7. novels 表增加 tags 字段（冗余存储，方便前端展示） ───
ALTER TABLE `novels`
  ADD COLUMN IF NOT EXISTS `tags` VARCHAR(255) DEFAULT NULL COMMENT '标签（逗号分隔，冗余存储）' AFTER `description`;

-- 给现有小说补充标签
UPDATE `novels` SET `tags` = '甜宠,都市,现代' WHERE `category_id` = 101 AND `tags` IS NULL;
UPDATE `novels` SET `tags` = '古风,穿越,言情' WHERE `category_id` = 102 AND `tags` IS NULL;
UPDATE `novels` SET `tags` = '悬疑,推理,烧脑' WHERE `category_id` = 103 AND `tags` IS NULL;
UPDATE `novels` SET `tags` = '治愈,温馨,日常' WHERE `category_id` = 104 AND `tags` IS NULL;
UPDATE `novels` SET `tags` = '奇幻,冒险,修仙' WHERE `category_id` = 105 AND `tags` IS NULL;
UPDATE `novels` SET `tags` = '玄幻,修仙,热血' WHERE `category_id` = 103 AND `tags` IS NULL;

-- ─── 8. 修复 novels.status 含义（0=完结 1=连载）并更新数据 ─
-- 当前数据 status=0 表示完结，status=1 表示连载
-- 前端期望 status_text 字段，在查询时动态生成即可，无需改表

-- ─── 9. 确保分类名称正确（防止再次乱码） ───────────────────
INSERT INTO `categories` (`id`, `name`, `icon`, `description`, `sort_order`) VALUES
(101, '都市言情', 'city',   '现代都市背景的浪漫爱情故事', 1),
(102, '古风穿越', 'castle', '穿越时空的古代言情故事',     2),
(103, '玄幻修仙', 'sword',  '修仙练功的奇幻世界',         3),
(104, '悬疑推理', 'search', '扣人心弦的悬疑推理故事',     4),
(105, '科幻未来', 'rocket', '科技与未来世界的想象',        5),
(106, '青春校园', 'book',   '校园生活与青春成长故事',      6)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `description` = VALUES(`description`);

SELECT '✅ patch_v2.sql 执行完成' AS result;

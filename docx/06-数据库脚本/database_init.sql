-- ============================================
-- 文字之境 - 数据库初始化脚本
-- 版本: v1.0
-- 创建日期: 2025-10-27
-- 数据库: MySQL 5.7+
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `ai_xsread` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `ai_xsread`;

-- ============================================
-- 1. 用户表
-- ============================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(加密)',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别: 0-保密, 1-女, 2-男',
  `birthday` DATE DEFAULT NULL COMMENT '生日',
  `bio` TEXT DEFAULT NULL COMMENT '个人简介',
  `role` VARCHAR(20) DEFAULT 'user' COMMENT '角色: user-普通用户, vip-VIP, author-作者, admin-管理员',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 分类表
-- ============================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '分类名称',
  `icon` VARCHAR(50) DEFAULT NULL COMMENT '分类图标',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '分类描述',
  `novel_count` INT UNSIGNED DEFAULT 0 COMMENT '小说数量',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_status` (`status`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ============================================
-- 3. 小说表
-- ============================================
DROP TABLE IF EXISTS `novels`;
CREATE TABLE `novels` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '小说ID',
  `title` VARCHAR(100) NOT NULL COMMENT '小说标题',
  `author` VARCHAR(50) NOT NULL COMMENT '作者名称',
  `author_id` INT UNSIGNED DEFAULT NULL COMMENT '作者用户ID(如果是平台作者)',
  `category_id` INT UNSIGNED NOT NULL COMMENT '分类ID',
  `cover` VARCHAR(255) DEFAULT NULL COMMENT '封面图URL',
  `description` TEXT COMMENT '小说简介',
  `word_count` INT UNSIGNED DEFAULT 0 COMMENT '总字数',
  `chapter_count` INT UNSIGNED DEFAULT 0 COMMENT '章节数',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-完结, 1-连载中',
  `views` INT UNSIGNED DEFAULT 0 COMMENT '浏览量',
  `likes` INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
  `collections` INT UNSIGNED DEFAULT 0 COMMENT '收藏数',
  `comments` INT UNSIGNED DEFAULT 0 COMMENT '评论数',
  `rating` DECIMAL(3,2) DEFAULT 0.00 COMMENT '评分(0-5)',
  `rating_count` INT UNSIGNED DEFAULT 0 COMMENT '评分人数',
  `is_recommended` TINYINT DEFAULT 0 COMMENT '是否推荐: 0-否, 1-是',
  `is_hot` TINYINT DEFAULT 0 COMMENT '是否热门: 0-否, 1-是',
  `is_vip` TINYINT DEFAULT 0 COMMENT '是否VIP: 0-否, 1-是',
  `last_chapter_title` VARCHAR(100) DEFAULT NULL COMMENT '最新章节标题',
  `last_update_time` DATETIME DEFAULT NULL COMMENT '最后更新时间',
  `published_at` DATETIME DEFAULT NULL COMMENT '发布时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_author_id` (`author_id`),
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_views` (`views`),
  INDEX `idx_likes` (`likes`),
  INDEX `idx_is_recommended` (`is_recommended`),
  INDEX `idx_is_hot` (`is_hot`),
  INDEX `idx_last_update_time` (`last_update_time`),
  FULLTEXT INDEX `idx_fulltext_search` (`title`, `author`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小说表';

-- ============================================
-- 4. 章节表
-- ============================================
DROP TABLE IF EXISTS `chapters`;
CREATE TABLE `chapters` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '章节ID',
  `novel_id` INT UNSIGNED NOT NULL COMMENT '小说ID',
  `chapter_number` INT UNSIGNED NOT NULL COMMENT '章节序号',
  `title` VARCHAR(100) NOT NULL COMMENT '章节标题',
  `content` LONGTEXT NOT NULL COMMENT '章节内容',
  `word_count` INT UNSIGNED DEFAULT 0 COMMENT '字数',
  `is_free` TINYINT DEFAULT 1 COMMENT '是否免费: 0-付费, 1-免费',
  `price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '章节价格',
  `views` INT UNSIGNED DEFAULT 0 COMMENT '浏览量',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-草稿, 1-已发布',
  `publish_time` DATETIME DEFAULT NULL COMMENT '发布时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_novel_chapter` (`novel_id`, `chapter_number`),
  INDEX `idx_novel_id` (`novel_id`),
  INDEX `idx_chapter_number` (`chapter_number`),
  INDEX `idx_publish_time` (`publish_time`),
  CONSTRAINT `fk_chapter_novel` FOREIGN KEY (`novel_id`) REFERENCES `novels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='章节表';

-- ============================================
-- 5. 书架表
-- ============================================
DROP TABLE IF EXISTS `bookshelf`;
CREATE TABLE `bookshelf` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '书架ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `novel_id` INT UNSIGNED NOT NULL COMMENT '小说ID',
  `type` VARCHAR(20) DEFAULT 'reading' COMMENT '类型: reading-正在读, finished-已读完, collected-收藏',
  `current_chapter_id` INT UNSIGNED DEFAULT NULL COMMENT '当前阅读章节ID',
  `progress` TINYINT UNSIGNED DEFAULT 0 COMMENT '阅读进度百分比(0-100)',
  `reading_time` INT UNSIGNED DEFAULT 0 COMMENT '阅读时长(分钟)',
  `last_read_time` DATETIME DEFAULT NULL COMMENT '最后阅读时间',
  `added_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_user_novel` (`user_id`, `novel_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_novel_id` (`novel_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_last_read_time` (`last_read_time`),
  CONSTRAINT `fk_bookshelf_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookshelf_novel` FOREIGN KEY (`novel_id`) REFERENCES `novels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='书架表';

-- ============================================
-- 6. 阅读进度表
-- ============================================
DROP TABLE IF EXISTS `reading_progress`;
CREATE TABLE `reading_progress` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '进度ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `novel_id` INT UNSIGNED NOT NULL COMMENT '小说ID',
  `chapter_id` INT UNSIGNED NOT NULL COMMENT '章节ID',
  `progress` TINYINT UNSIGNED DEFAULT 0 COMMENT '当前章节进度(0-100)',
  `scroll_position` INT DEFAULT 0 COMMENT '滚动位置',
  `reading_time` INT UNSIGNED DEFAULT 0 COMMENT '本次阅读时长(分钟)',
  `last_read_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后阅读时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_user_novel` (`user_id`, `novel_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_novel_id` (`novel_id`),
  INDEX `idx_chapter_id` (`chapter_id`),
  CONSTRAINT `fk_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_progress_novel` FOREIGN KEY (`novel_id`) REFERENCES `novels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_progress_chapter` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='阅读进度表';

-- ============================================
-- 7. 阅读历史表
-- ============================================
DROP TABLE IF EXISTS `reading_history`;
CREATE TABLE `reading_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '历史ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `novel_id` INT UNSIGNED NOT NULL COMMENT '小说ID',
  `chapter_id` INT UNSIGNED NOT NULL COMMENT '章节ID',
  `duration` INT UNSIGNED DEFAULT 0 COMMENT '阅读时长(分钟)',
  `read_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_novel_id` (`novel_id`),
  INDEX `idx_read_time` (`read_time`),
  CONSTRAINT `fk_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_novel` FOREIGN KEY (`novel_id`) REFERENCES `novels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='阅读历史表';

-- ============================================
-- 8. 点赞表
-- ============================================
DROP TABLE IF EXISTS `user_likes`;
CREATE TABLE `user_likes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '点赞ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `novel_id` INT UNSIGNED NOT NULL COMMENT '小说ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  UNIQUE KEY `uk_user_novel` (`user_id`, `novel_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_novel_id` (`novel_id`),
  CONSTRAINT `fk_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_like_novel` FOREIGN KEY (`novel_id`) REFERENCES `novels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞表';

-- ============================================
-- 9. 评论表
-- ============================================
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `novel_id` INT UNSIGNED NOT NULL COMMENT '小说ID',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `rating` TINYINT UNSIGNED DEFAULT 5 COMMENT '评分(1-5)',
  `likes` INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-隐藏, 1-显示',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_novel_id` (`novel_id`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comment_novel` FOREIGN KEY (`novel_id`) REFERENCES `novels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ============================================
-- 10. 标签表
-- ============================================
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '标签ID',
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
  `usage_count` INT UNSIGNED DEFAULT 0 COMMENT '使用次数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- ============================================
-- 11. 小说标签关联表
-- ============================================
DROP TABLE IF EXISTS `novel_tags`;
CREATE TABLE `novel_tags` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
  `novel_id` INT UNSIGNED NOT NULL COMMENT '小说ID',
  `tag_id` INT UNSIGNED NOT NULL COMMENT '标签ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_novel_tag` (`novel_id`, `tag_id`),
  INDEX `idx_novel_id` (`novel_id`),
  INDEX `idx_tag_id` (`tag_id`),
  CONSTRAINT `fk_nt_novel` FOREIGN KEY (`novel_id`) REFERENCES `novels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nt_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='小说标签关联表';

-- ============================================
-- 12. 系统配置表
-- ============================================
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
  `key` VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  `value` TEXT COMMENT '配置值',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '配置说明',
  `type` VARCHAR(20) DEFAULT 'string' COMMENT '配置类型: string, number, boolean, json',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================
-- 初始化基础数据
-- ============================================

-- 插入分类数据
INSERT INTO `categories` (`id`, `name`, `icon`, `description`, `sort_order`) VALUES
(101, '都市言情', '💕', '现代都市爱情故事', 1),
(102, '古风穿越', '🏮', '穿越古代,演绎传奇', 2),
(103, '悬疑推理', '🔍', '烧脑推理,揭开谜团', 3),
(104, '治愈系', '🌸', '温暖治愈,抚慰心灵', 4),
(105, '奇幻冒险', '✨', '奇幻世界,冒险之旅', 5);

-- 插入标签数据
INSERT INTO `tags` (`name`) VALUES
('甜文'), ('虐恋'), ('校园'), ('治愈'), ('励志'),
('穿越'), ('重生'), ('宫斗'), ('江湖'), ('修仙'),
('悬疑'), ('推理'), ('探案'), ('灵异'), ('科幻'),
('温馨'), ('搞笑'), ('热血'), ('青春'), ('成长');

-- 插入系统配置
INSERT INTO `system_config` (`key`, `value`, `description`, `type`) VALUES
('site_name', '文字之境', '网站名称', 'string'),
('site_description', '故事入境,杂念自消', '网站描述', 'string'),
('site_keywords', '小说,阅读,女性向', '网站关键词', 'string'),
('default_theme', 'rose', '默认主题', 'string'),
('enable_registration', 'true', '允许用户注册', 'boolean'),
('enable_comment', 'true', '允许评论', 'boolean'),
('daily_free_chapters', '5', '每日免费章节数', 'number');

-- ============================================
-- 创建初始管理员账号
-- ============================================
-- 密码: admin123 (实际使用时应该用bcrypt加密)
INSERT INTO `users` (`username`, `email`, `password`, `nickname`, `role`, `status`) VALUES
('admin', 'admin@xsread.com', '$2b$10$YourHashedPasswordHere', '管理员', 'admin', 1);

-- ============================================
-- 完成提示
-- ============================================
SELECT '数据库初始化完成!' AS message;
SELECT '请运行 test_data.sql 插入测试数据' AS next_step;


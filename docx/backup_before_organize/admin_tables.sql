-- ============================================
-- 文字之境 - 后台管理系统数据库表
-- 创建日期: 2025-10-27
-- 说明: 后台管理相关的5张新增表
-- ============================================

USE ai_xsread;

-- ============================================
-- 1. admin_users - 管理员表
-- ============================================
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '管理员ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
  `email` VARCHAR(100) NOT NULL COMMENT '邮箱',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `role` VARCHAR(20) DEFAULT 'admin' COMMENT '角色: admin-管理员, super_admin-超级管理员',
  `permissions` JSON DEFAULT NULL COMMENT '权限配置',
  `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 插入默认管理员账号 (密码: admin123，需要bcrypt加密)
-- 注意: 实际使用时需要用bcrypt加密密码
INSERT INTO `admin_users` (`username`, `password`, `email`, `role`)
VALUES ('admin', '$2b$10$YourBcryptHashedPasswordHere', 'admin@example.com', 'super_admin');

-- ============================================
-- 2. admin_logs - 操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  `admin_id` INT UNSIGNED NOT NULL COMMENT '管理员ID',
  `admin_username` VARCHAR(50) NOT NULL COMMENT '管理员用户名',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型: create, update, delete, login, logout等',
  `module` VARCHAR(50) NOT NULL COMMENT '模块: novel, chapter, user, comment等',
  `target_id` INT UNSIGNED DEFAULT NULL COMMENT '操作对象ID',
  `description` TEXT COMMENT '操作描述',
  `ip` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(255) DEFAULT NULL COMMENT '浏览器信息',
  `request_method` VARCHAR(10) DEFAULT NULL COMMENT '请求方法: GET, POST等',
  `request_url` VARCHAR(500) DEFAULT NULL COMMENT '请求URL',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_module` (`module`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_log_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ============================================
-- 3. banners - 轮播图表
-- ============================================
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '轮播图ID',
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `image` VARCHAR(255) NOT NULL COMMENT '图片URL',
  `link` VARCHAR(255) DEFAULT NULL COMMENT '跳转链接',
  `link_type` VARCHAR(20) DEFAULT 'novel' COMMENT '链接类型: novel-小说, external-外部链接',
  `target_id` INT UNSIGNED DEFAULT NULL COMMENT '目标ID(小说ID等)',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-隐藏, 1-显示',
  `start_time` DATETIME DEFAULT NULL COMMENT '开始显示时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束显示时间',
  `views` INT UNSIGNED DEFAULT 0 COMMENT '浏览量',
  `clicks` INT UNSIGNED DEFAULT 0 COMMENT '点击量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_status` (`status`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播图表';

-- ============================================
-- 4. announcements - 公告表
-- ============================================
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
  `title` VARCHAR(100) NOT NULL COMMENT '公告标题',
  `content` TEXT NOT NULL COMMENT '公告内容',
  `type` VARCHAR(20) DEFAULT 'system' COMMENT '类型: system-系统, activity-活动, notice-通知',
  `position` VARCHAR(100) DEFAULT 'home' COMMENT '显示位置: home-首页, reading-阅读页, all-全部',
  `priority` TINYINT DEFAULT 0 COMMENT '优先级: 0-普通, 1-重要, 2-紧急',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0-隐藏, 1-显示',
  `start_time` DATETIME DEFAULT NULL COMMENT '开始显示时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束显示时间',
  `views` INT UNSIGNED DEFAULT 0 COMMENT '浏览量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- ============================================
-- 5. statistics_daily - 每日统计表
-- ============================================
CREATE TABLE IF NOT EXISTS `statistics_daily` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
  `date` DATE NOT NULL UNIQUE COMMENT '统计日期',
  `new_users` INT UNSIGNED DEFAULT 0 COMMENT '新增用户数',
  `active_users` INT UNSIGNED DEFAULT 0 COMMENT '活跃用户数',
  `page_views` INT UNSIGNED DEFAULT 0 COMMENT '页面浏览量(PV)',
  `unique_visitors` INT UNSIGNED DEFAULT 0 COMMENT '独立访客数(UV)',
  `reading_duration` INT UNSIGNED DEFAULT 0 COMMENT '总阅读时长(分钟)',
  `avg_reading_duration` DECIMAL(10,2) DEFAULT 0.00 COMMENT '人均阅读时长(分钟)',
  `new_comments` INT UNSIGNED DEFAULT 0 COMMENT '新增评论数',
  `new_collections` INT UNSIGNED DEFAULT 0 COMMENT '新增收藏数',
  `new_likes` INT UNSIGNED DEFAULT 0 COMMENT '新增点赞数',
  `revenue` DECIMAL(10,2) DEFAULT 0.00 COMMENT '收入(元)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日统计表';

-- ============================================
-- 插入测试数据
-- ============================================

-- 插入轮播图测试数据
INSERT INTO `banners` (`title`, `image`, `link`, `link_type`, `target_id`, `sort_order`, `status`)
VALUES
('长安月下归人未归', 'https://via.placeholder.com/1200x400', '/novel/2', 'novel', 2, 1, 1),
('时光里的温柔相遇', 'https://via.placeholder.com/1200x400', '/novel/1', 'novel', 1, 2, 1);

-- 插入公告测试数据
INSERT INTO `announcements` (`title`, `content`, `type`, `position`, `priority`, `status`)
VALUES
('系统升级通知', '系统将于今晚22:00-23:00进行升级维护，期间可能无法访问，敬请谅解。', 'system', 'all', 1, 1),
('新书上架预告', '《月色与君眠》即将上架，敬请期待！', 'activity', 'home', 0, 1);

-- 插入最近7天的统计数据
INSERT INTO `statistics_daily` (`date`, `new_users`, `active_users`, `page_views`, `unique_visitors`, `reading_duration`, `avg_reading_duration`, `new_comments`, `new_collections`, `new_likes`, `revenue`)
VALUES
('2025-10-21', 120, 2200, 35000, 8500, 132000, 60.00, 45, 230, 456, 1250.50),
('2025-10-22', 132, 2400, 38000, 9200, 144000, 60.00, 52, 245, 489, 1350.00),
('2025-10-23', 101, 2100, 33000, 8100, 126000, 60.00, 41, 210, 423, 1180.00),
('2025-10-24', 134, 2350, 36500, 8900, 141000, 60.00, 48, 235, 467, 1290.50),
('2025-10-25', 90, 2180, 34000, 8300, 130800, 60.00, 43, 220, 445, 1220.00),
('2025-10-26', 230, 2580, 42000, 10200, 154800, 60.00, 58, 280, 534, 1580.00),
('2025-10-27', 127, 2450, 39000, 9500, 147000, 60.00, 51, 256, 498, 1420.50);

-- ============================================
-- 创建视图：管理员操作统计
-- ============================================
CREATE OR REPLACE VIEW `view_admin_statistics` AS
SELECT
    a.id,
    a.username,
    a.email,
    a.role,
    COUNT(DISTINCT l.id) as total_operations,
    COUNT(DISTINCT CASE WHEN l.action = 'login' THEN l.id END) as login_count,
    MAX(l.created_at) as last_operation_time,
    a.last_login_time,
    a.status
FROM admin_users a
LEFT JOIN admin_logs l ON a.id = l.admin_id
GROUP BY a.id, a.username, a.email, a.role, a.last_login_time, a.status;

-- ============================================
-- 创建存储过程：记录管理员操作日志
-- ============================================
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `sp_log_admin_action`(
    IN p_admin_id INT,
    IN p_admin_username VARCHAR(50),
    IN p_action VARCHAR(50),
    IN p_module VARCHAR(50),
    IN p_target_id INT,
    IN p_description TEXT,
    IN p_ip VARCHAR(50),
    IN p_user_agent VARCHAR(255),
    IN p_request_method VARCHAR(10),
    IN p_request_url VARCHAR(500)
)
BEGIN
    INSERT INTO admin_logs (
        admin_id,
        admin_username,
        action,
        module,
        target_id,
        description,
        ip,
        user_agent,
        request_method,
        request_url
    ) VALUES (
        p_admin_id,
        p_admin_username,
        p_action,
        p_module,
        p_target_id,
        p_description,
        p_ip,
        p_user_agent,
        p_request_method,
        p_request_url
    );
END //

DELIMITER ;

-- ============================================
-- 创建触发器：自动更新轮播图点击量
-- ============================================
DELIMITER //

CREATE TRIGGER IF NOT EXISTS `trg_banner_click` AFTER UPDATE ON `banners`
FOR EACH ROW
BEGIN
    IF NEW.clicks > OLD.clicks THEN
        -- 可以在这里记录详细的点击日志
        INSERT INTO admin_logs (admin_id, admin_username, action, module, target_id, description)
        VALUES (0, 'system', 'click', 'banner', NEW.id, CONCAT('轮播图被点击，当前点击量: ', NEW.clicks));
    END IF;
END //

DELIMITER ;

-- ============================================
-- 创建索引优化
-- ============================================

-- 为查询频繁的字段添加索引
ALTER TABLE `admin_logs` ADD INDEX `idx_admin_action` (`admin_id`, `action`);
ALTER TABLE `statistics_daily` ADD INDEX `idx_date_desc` (`date` DESC);

-- ============================================
-- 表结构说明
-- ============================================

-- admin_users: 存储后台管理员账号信息
-- admin_logs: 记录所有管理员操作，用于审计和追踪
-- banners: 管理首页轮播图/推荐位
-- announcements: 管理系统公告通知
-- statistics_daily: 每日运营数据统计，用于数据看板展示

-- ============================================
-- 使用说明
-- ============================================

-- 1. 导入此SQL文件到数据库
--    mysql -u toefl_user -p ai_xsread < admin_tables.sql

-- 2. 修改默认管理员密码
--    使用bcrypt加密后替换默认密码哈希值

-- 3. 定期清理日志数据
--    DELETE FROM admin_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 4. 每日统计数据由定时任务自动生成
--    建议在凌晨3点运行统计脚本

-- ============================================
-- 完成！
-- ============================================

SELECT '后台管理数据表创建完成！' AS message;
SELECT '请修改默认管理员密码后使用。' AS warning;


-- 把 admin-backend/scripts/create-admin-tables.js 的 5 张表迁入正式迁移流水线
-- 来源：scripts/create-admin-tables.js（已废弃，新机器部署不再手工执行）
-- Track: 管理端 Sprint 2 / 阶段 3 / T-3.1

SET NAMES utf8mb4;

-- 1. 管理员账号
CREATE TABLE IF NOT EXISTS admin_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '管理员ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt）',
  email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  avatar VARCHAR(255) DEFAULT NULL,
  real_name VARCHAR(50) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  role VARCHAR(20) DEFAULT 'admin' COMMENT 'super_admin / admin / editor',
  status TINYINT DEFAULT 1 COMMENT '0-禁用 1-启用',
  last_login_time DATETIME DEFAULT NULL,
  last_login_ip VARCHAR(64) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员账号';

-- 2. 管理员操作日志
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED DEFAULT NULL,
  admin_username VARCHAR(50) DEFAULT NULL,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  target_id INT UNSIGNED DEFAULT NULL,
  description TEXT DEFAULT NULL,
  ip VARCHAR(64) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_module_action (module, action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志';

-- 3. 轮播图（前端首页 banner）
CREATE TABLE IF NOT EXISTS banners (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  image VARCHAR(255) NOT NULL,
  link VARCHAR(255) DEFAULT NULL,
  link_type VARCHAR(20) DEFAULT 'novel',
  target_id INT UNSIGNED DEFAULT NULL,
  sort_order INT DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '0-隐藏 1-显示',
  start_time DATETIME DEFAULT NULL,
  end_time DATETIME DEFAULT NULL,
  views INT UNSIGNED DEFAULT 0,
  clicks INT UNSIGNED DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播图';

-- 4. 公告
CREATE TABLE IF NOT EXISTS announcements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'system',
  position VARCHAR(100) DEFAULT 'home',
  priority TINYINT DEFAULT 0,
  status TINYINT DEFAULT 1,
  start_time DATETIME DEFAULT NULL,
  end_time DATETIME DEFAULT NULL,
  views INT UNSIGNED DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_priority (status, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告';

-- 5. 每日统计
CREATE TABLE IF NOT EXISTS statistics_daily (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  new_users INT UNSIGNED DEFAULT 0,
  active_users INT UNSIGNED DEFAULT 0,
  page_views INT UNSIGNED DEFAULT 0,
  unique_visitors INT UNSIGNED DEFAULT 0,
  reading_duration INT UNSIGNED DEFAULT 0 COMMENT '总阅读时长（秒）',
  avg_reading_duration DECIMAL(10,2) DEFAULT 0.00,
  new_comments INT UNSIGNED DEFAULT 0,
  new_collections INT UNSIGNED DEFAULT 0,
  new_likes INT UNSIGNED DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日统计';

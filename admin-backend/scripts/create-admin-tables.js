/**
 * 创建管理后台需要的表结构
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdminTables() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ 数据库连接成功\n');

    // 创建管理员用户表
    console.log('📝 创建 admin_users 表...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '管理员ID',
        username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
        password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
        email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
        avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
        real_name VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
        phone VARCHAR(20) DEFAULT NULL COMMENT '手机号',
        role VARCHAR(20) DEFAULT 'admin' COMMENT '角色: super_admin, admin, editor',
        status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
        last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
        last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_username (username),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员用户表'
    `);
    console.log('✅ admin_users 表创建成功');

    // 创建管理员日志表（如果不存在）
    console.log('📝 创建 admin_logs 表...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
        admin_id INT UNSIGNED DEFAULT NULL COMMENT '管理员ID',
        admin_username VARCHAR(50) DEFAULT NULL COMMENT '管理员用户名',
        action VARCHAR(50) NOT NULL COMMENT '操作类型',
        module VARCHAR(50) NOT NULL COMMENT '模块',
        target_id INT UNSIGNED DEFAULT NULL COMMENT '目标ID',
        description TEXT DEFAULT NULL COMMENT '操作描述',
        ip VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
        user_agent TEXT DEFAULT NULL COMMENT '用户代理',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_admin_id (admin_id),
        INDEX idx_action (action),
        INDEX idx_module (module),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表'
    `);
    console.log('✅ admin_logs 表创建成功');

    // 创建轮播图表
    console.log('📝 创建 banners 表...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '轮播图ID',
        title VARCHAR(100) NOT NULL COMMENT '标题',
        image VARCHAR(255) NOT NULL COMMENT '图片URL',
        link VARCHAR(255) DEFAULT NULL COMMENT '跳转链接',
        link_type VARCHAR(20) DEFAULT 'novel' COMMENT '链接类型: novel, url',
        target_id INT UNSIGNED DEFAULT NULL COMMENT '目标ID（如小说ID）',
        sort_order INT DEFAULT 0 COMMENT '排序顺序',
        status TINYINT DEFAULT 1 COMMENT '状态: 0-隐藏, 1-显示',
        start_time DATETIME DEFAULT NULL COMMENT '开始显示时间',
        end_time DATETIME DEFAULT NULL COMMENT '结束显示时间',
        views INT UNSIGNED DEFAULT 0 COMMENT '浏览量',
        clicks INT UNSIGNED DEFAULT 0 COMMENT '点击量',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_status (status),
        INDEX idx_sort_order (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播图表'
    `);
    console.log('✅ banners 表创建成功');

    // 创建公告表
    console.log('📝 创建 announcements 表...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
        title VARCHAR(100) NOT NULL COMMENT '公告标题',
        content TEXT NOT NULL COMMENT '公告内容',
        type VARCHAR(20) DEFAULT 'system' COMMENT '类型: system, notice, maintenance',
        position VARCHAR(100) DEFAULT 'home' COMMENT '显示位置',
        priority TINYINT DEFAULT 0 COMMENT '优先级（数字越大越靠前）',
        status TINYINT DEFAULT 1 COMMENT '状态: 0-隐藏, 1-显示',
        start_time DATETIME DEFAULT NULL COMMENT '开始显示时间',
        end_time DATETIME DEFAULT NULL COMMENT '结束显示时间',
        views INT UNSIGNED DEFAULT 0 COMMENT '浏览量',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_status (status),
        INDEX idx_type (type),
        INDEX idx_priority (priority)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表'
    `);
    console.log('✅ announcements 表创建成功');

    // 创建每日统计表
    console.log('📝 创建 statistics_daily 表...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS statistics_daily (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
        date DATE NOT NULL UNIQUE COMMENT '统计日期',
        new_users INT UNSIGNED DEFAULT 0 COMMENT '新增用户数',
        active_users INT UNSIGNED DEFAULT 0 COMMENT '活跃用户数',
        page_views INT UNSIGNED DEFAULT 0 COMMENT '页面浏览量',
        unique_visitors INT UNSIGNED DEFAULT 0 COMMENT '独立访客数',
        reading_duration INT UNSIGNED DEFAULT 0 COMMENT '总阅读时长（秒）',
        avg_reading_duration DECIMAL(10,2) DEFAULT 0.00 COMMENT '人均阅读时长（秒）',
        new_comments INT UNSIGNED DEFAULT 0 COMMENT '新增评论数',
        new_collections INT UNSIGNED DEFAULT 0 COMMENT '新增收藏数',
        new_likes INT UNSIGNED DEFAULT 0 COMMENT '新增点赞数',
        revenue DECIMAL(10,2) DEFAULT 0.00 COMMENT '收入',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日统计表'
    `);
    console.log('✅ statistics_daily 表创建成功');

    console.log('\n✨ 所有管理后台表创建完成！');
    console.log('\n下一步：运行以下命令创建管理员账号');
    console.log('  node scripts/init-admin.js');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

createAdminTables();


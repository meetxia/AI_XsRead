/**
 * 检查并创建所有管理后台需要的表
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAllTables() {
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

    // 需要检查的表列表
    const requiredTables = ['banners', 'announcements', 'statistics_daily'];

    for (const tableName of requiredTables) {
      const [tables] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
      
      if (tables.length === 0) {
        console.log(`⚠️  ${tableName} 表不存在，开始创建...`);

        if (tableName === 'banners') {
          await connection.query(`
            CREATE TABLE IF NOT EXISTS banners (
              id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '轮播图ID',
              title VARCHAR(100) NOT NULL COMMENT '标题',
              image VARCHAR(255) NOT NULL COMMENT '图片URL',
              link VARCHAR(255) DEFAULT NULL COMMENT '跳转链接',
              link_type VARCHAR(20) DEFAULT 'novel' COMMENT '链接类型',
              target_id INT UNSIGNED DEFAULT NULL COMMENT '目标ID',
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
        } else if (tableName === 'announcements') {
          await connection.query(`
            CREATE TABLE IF NOT EXISTS announcements (
              id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
              title VARCHAR(100) NOT NULL COMMENT '公告标题',
              content TEXT NOT NULL COMMENT '公告内容',
              type VARCHAR(20) DEFAULT 'system' COMMENT '类型',
              position VARCHAR(100) DEFAULT 'home' COMMENT '显示位置',
              priority TINYINT DEFAULT 0 COMMENT '优先级',
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
        } else if (tableName === 'statistics_daily') {
          await connection.query(`
            CREATE TABLE IF NOT EXISTS statistics_daily (
              id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '统计ID',
              date DATE NOT NULL UNIQUE COMMENT '统计日期',
              new_users INT UNSIGNED DEFAULT 0 COMMENT '新增用户数',
              active_users INT UNSIGNED DEFAULT 0 COMMENT '活跃用户数',
              page_views INT UNSIGNED DEFAULT 0 COMMENT '页面浏览量',
              unique_visitors INT UNSIGNED DEFAULT 0 COMMENT '独立访客数',
              reading_duration INT UNSIGNED DEFAULT 0 COMMENT '总阅读时长',
              avg_reading_duration DECIMAL(10,2) DEFAULT 0.00 COMMENT '人均阅读时长',
              new_comments INT UNSIGNED DEFAULT 0 COMMENT '新增评论数',
              new_collections INT UNSIGNED DEFAULT 0 COMMENT '新增收藏数',
              new_likes INT UNSIGNED DEFAULT 0 COMMENT '新增点赞数',
              revenue DECIMAL(10,2) DEFAULT 0.00 COMMENT '收入',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
              INDEX idx_date (date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='每日统计表'
          `);
        }

        console.log(`✅ ${tableName} 表创建成功`);
      } else {
        console.log(`✅ ${tableName} 表已存在`);
      }
    }

    await connection.end();
    console.log('\n✨ 所有表检查完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

checkAllTables();


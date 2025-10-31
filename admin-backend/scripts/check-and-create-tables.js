/**
 * 检查并创建管理员数据表
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndCreateTables() {
  let connection;

  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ 数据库连接成功');

    // 检查 admin_users 表是否存在
    const [tables] = await connection.query("SHOW TABLES LIKE 'admin_users'");
    
    if (tables.length === 0) {
      console.log('⚠️  admin_users 表不存在，开始创建...');

      // 创建 admin_users 表
      await connection.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '管理员ID',
          username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
          password VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
          email VARCHAR(100) NOT NULL COMMENT '邮箱',
          avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
          role VARCHAR(20) DEFAULT 'admin' COMMENT '角色: admin-管理员, super_admin-超级管理员',
          permissions JSON DEFAULT NULL COMMENT '权限配置',
          last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
          last_login_ip VARCHAR(50) DEFAULT NULL COMMENT '最后登录IP',
          status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          INDEX idx_username (username),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表'
      `);

      console.log('✅ admin_users 表创建成功');

      // 检查是否已存在管理员
      const [existing] = await connection.query(
        'SELECT id FROM admin_users WHERE username = ?',
        ['admin']
      );

      if (existing.length === 0) {
        // 加密密码
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // 插入默认管理员账号
        await connection.query(
          `INSERT INTO admin_users (username, password, email, role)
           VALUES (?, ?, ?, ?)`,
          ['admin', hashedPassword, 'admin@example.com', 'super_admin']
        );

        console.log('✅ 默认管理员账号创建成功！');
        console.log('');
        console.log('======== 登录信息 ========');
        console.log('  用户名: admin');
        console.log('  密码: admin123');
        console.log('  角色: 超级管理员');
        console.log('=========================');
      } else {
        console.log('✅ 管理员账号已存在');
      }

    } else {
      console.log('✅ admin_users 表已存在');

      // 检查是否有管理员账号
      const [users] = await connection.query('SELECT COUNT(*) as count FROM admin_users');
      console.log(`📊 当前管理员数量: ${users[0].count}`);
    }

    // 检查 admin_logs 表
    const [logsTables] = await connection.query("SHOW TABLES LIKE 'admin_logs'");
    
    if (logsTables.length === 0) {
      console.log('⚠️  admin_logs 表不存在，开始创建...');

      await connection.query(`
        CREATE TABLE IF NOT EXISTS admin_logs (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
          admin_id INT UNSIGNED NOT NULL COMMENT '管理员ID',
          admin_username VARCHAR(50) NOT NULL COMMENT '管理员用户名',
          action VARCHAR(50) NOT NULL COMMENT '操作类型',
          module VARCHAR(50) NOT NULL COMMENT '模块',
          target_id INT UNSIGNED DEFAULT NULL COMMENT '操作对象ID',
          description TEXT COMMENT '操作描述',
          ip VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
          user_agent VARCHAR(255) DEFAULT NULL COMMENT '浏览器信息',
          request_method VARCHAR(10) DEFAULT NULL COMMENT '请求方法',
          request_url VARCHAR(500) DEFAULT NULL COMMENT '请求URL',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          INDEX idx_admin_id (admin_id),
          INDEX idx_action (action),
          INDEX idx_module (module),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表'
      `);

      console.log('✅ admin_logs 表创建成功');
    } else {
      console.log('✅ admin_logs 表已存在');
    }

    await connection.end();
    console.log('\n✨ 所有检查完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

checkAndCreateTables();


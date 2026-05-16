/**
 * 创建默认管理员用户
 * 用户名: admin
 * 密码: 123456
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdminUser() {
  let connection;
  
  try {
    console.log('\n🔧 开始创建管理员用户...\n');

    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ai_xsread',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ 数据库连接成功');

    // 检查 admin 用户是否已存在
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE username = ?',
      ['admin']
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  admin 用户已存在，跳过创建');
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash('123456', 10);
    console.log('🔐 密码加密完成');

    // 创建管理员用户
    const [result] = await connection.query(
      `INSERT INTO users (username, email, password, role, status, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      ['admin', 'admin@xsread.com', hashedPassword, 'admin', 1]
    );

    console.log('✅ 管理员用户创建成功！');
    console.log('   用户名: admin');
    console.log('   密码: 123456');
    console.log('   角色: admin');
    console.log('   用户ID:', result.insertId);
    console.log('\n🎉 现在可以使用 admin/123456 登录了！\n');

  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

createAdminUser();

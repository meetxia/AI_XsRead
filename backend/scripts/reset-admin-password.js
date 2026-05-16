/**
 * 重置管理员密码
 * 新密码: 123456
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetAdminPassword() {
  let connection;
  
  try {
    console.log('\n🔧 开始重置管理员密码...\n');

    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ai_xsread',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ 数据库连接成功');

    // 检查 admin 用户是否存在
    const [existingUsers] = await connection.query(
      'SELECT id, username, email FROM users WHERE username = ?',
      ['admin']
    );

    if (existingUsers.length === 0) {
      console.log('❌ admin 用户不存在！');
      console.log('请先运行 create-admin-user.js 创建管理员用户');
      return;
    }

    const user = existingUsers[0];
    console.log('📝 找到用户:', {
      id: user.id,
      username: user.username,
      email: user.email
    });

    // 加密新密码
    const hashedPassword = await bcrypt.hash('123456', 10);
    console.log('🔐 新密码加密完成');

    // 更新密码
    await connection.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE username = ?',
      [hashedPassword, 'admin']
    );

    console.log('✅ 管理员密码重置成功！');
    console.log('   用户名: admin');
    console.log('   新密码: 123456');
    console.log('\n🎉 现在可以使用新密码登录了！\n');

  } catch (error) {
    console.error('❌ 重置密码失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

resetAdminPassword();

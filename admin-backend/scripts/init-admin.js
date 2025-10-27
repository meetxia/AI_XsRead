/**
 * 初始化默认管理员账号
 * 运行: node scripts/init-admin.js
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initAdmin() {
  let connection;

  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'toefl_user',
      password: process.env.DB_PASSWORD || 'mojz168168-',
      database: process.env.DB_NAME || 'ai_xsread'
    });

    console.log('✅ 数据库连接成功');

    // 检查是否已存在管理员
    const [existing] = await connection.query(
      'SELECT id FROM admin_users WHERE username = ?',
      ['admin']
    );

    if (existing.length > 0) {
      console.log('⚠️  管理员账号已存在，跳过创建');
      
      // 询问是否重置密码
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('是否重置admin密码为admin123? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          // 加密新密码
          const hashedPassword = await bcrypt.hash('admin123', 10);
          
          // 更新密码
          await connection.query(
            'UPDATE admin_users SET password = ? WHERE username = ?',
            [hashedPassword, 'admin']
          );

          console.log('✅ 密码已重置为: admin123');
        }

        readline.close();
        await connection.end();
        process.exit(0);
      });

      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 插入管理员账号
    const [result] = await connection.query(
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
    console.log('');
    console.log('⚠️  请立即修改默认密码！');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

initAdmin();


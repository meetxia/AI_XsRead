/**
 * 测试密码验证
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'ai_xsread',
  charset: 'utf8mb4'
};

async function testPassword() {
  let connection;
  
  try {
    console.log('\n🔍 测试密码验证\n');
    
    // 连接数据库
    connection = await mysql.createConnection(DB_CONFIG);
    
    // 查询admin用户
    const [users] = await connection.query(
      'SELECT id, username, password FROM users WHERE username = ?',
      ['admin']
    );
    
    if (users.length === 0) {
      console.log('❌ admin用户不存在');
      return;
    }
    
    const user = users[0];
    console.log('✅ 找到用户:', user.username);
    console.log('   用户ID:', user.id);
    console.log('   密码哈希:', user.password.substring(0, 30) + '...');
    
    // 测试密码
    const testPassword = '123456';
    console.log('\n🔐 测试密码:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ 密码验证成功！');
      console.log('💡 密码 "123456" 是正确的');
    } else {
      console.log('❌ 密码验证失败！');
      console.log('⚠️  数据库中的密码哈希与 "123456" 不匹配');
      
      // 生成新的正确哈希
      console.log('\n🔧 生成新的密码哈希...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('   新哈希:', newHash);
      
      // 询问是否更新
      console.log('\n💡 可以运行以下SQL来修复:');
      console.log(`   UPDATE users SET password = '${newHash}' WHERE username = 'admin';`);
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPassword();

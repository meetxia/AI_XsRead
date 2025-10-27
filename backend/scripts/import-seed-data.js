/**
 * 导入种子数据脚本
 * 自动连接数据库并导入测试数据
 */

require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'toefl_user',
  password: process.env.DB_PASSWORD || 'mojz168168-',
  database: process.env.DB_DATABASE || 'ai_xsread',
  multipleStatements: true
};

async function importSeedData() {
  let connection;
  
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🌱 开始导入种子数据...');
    console.log('='.repeat(60));
    
    // 1. 生成密码哈希
    console.log('\n📝 正在生成密码哈希...');
    const passwordHash = await bcrypt.hash('123456', 10);
    console.log('✅ 密码哈希生成成功');
    console.log('   测试账号密码: 123456');
    
    // 2. 连接数据库
    console.log('\n🔌 正在连接数据库...');
    console.log(`   主机: ${config.host}`);
    console.log(`   数据库: ${config.database}`);
    
    connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功');
    
    // 3. 读取 SQL 文件
    console.log('\n📄 正在读取 SQL 文件...');
    const sqlFilePath = path.join(__dirname, '../../docx/seed_data_complete.sql');
    let sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 替换密码占位符为真实的哈希值
    sql = sql.replace(/\$2b\$10\$YQ7Zv5K5xG0mH5xJ5xK5xO5xL5xM5xN5xO5xP5xQ5xR5xS5xT5xU/g, passwordHash);
    console.log('✅ SQL 文件读取成功');
    
    // 4. 执行 SQL
    console.log('\n⚙️  正在执行 SQL 语句...');
    await connection.query(sql);
    console.log('✅ SQL 执行成功');
    
    // 5. 查询统计信息
    console.log('\n📊 数据统计:');
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`   👤 用户数: ${users[0].count}`);
    
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories');
    console.log(`   📂 分类数: ${categories[0].count}`);
    
    const [novels] = await connection.query('SELECT COUNT(*) as count FROM novels');
    console.log(`   📚 小说数: ${novels[0].count}`);
    
    const [chapters] = await connection.query('SELECT COUNT(*) as count FROM chapters');
    console.log(`   📖 章节数: ${chapters[0].count}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 种子数据导入完成！');
    console.log('='.repeat(60));
    
    console.log('\n📋 测试账号列表:');
    console.log('┌─────────────┬──────────────────────────┬──────────┐');
    console.log('│ 用户名      │ 邮箱                     │ 角色     │');
    console.log('├─────────────┼──────────────────────────┼──────────┤');
    console.log('│ reader001   │ reader001@example.com    │ 普通用户 │');
    console.log('│ reader002   │ reader002@example.com    │ 普通用户 │');
    console.log('│ reader003   │ reader003@example.com    │ 普通用户 │');
    console.log('│ author001   │ author001@example.com    │ 作者     │');
    console.log('│ author002   │ author002@example.com    │ 作者     │');
    console.log('│ author003   │ author003@example.com    │ 作者     │');
    console.log('│ admin       │ admin@example.com        │ 管理员   │');
    console.log('└─────────────┴──────────────────────────┴──────────┘');
    console.log('🔑 所有账号的密码都是: 123456');
    
    console.log('\n🚀 现在可以启动后端服务进行测试了！');
    console.log('   运行命令: npm run dev\n');
    
  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 提示: 请确保 MySQL 服务已启动');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 提示: 请检查数据库用户名和密码是否正确');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 提示: 请先创建数据库 ai_xsread');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行导入
importSeedData();


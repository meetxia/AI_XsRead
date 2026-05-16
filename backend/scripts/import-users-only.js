/**
 * 只导入测试用户数据
 * 不包含小说数据
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// 数据库配置
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'ai_xsread',
  charset: 'utf8mb4'
};

// 测试用户数据
const TEST_USERS = [
  {
    username: 'reader001',
    email: 'reader001@example.com',
    nickname: '温柔读者',
    gender: 1,
    birthday: '1995-05-20',
    bio: '喜欢阅读温柔的故事',
    role: 'user'
  },
  {
    username: 'reader002',
    email: 'reader002@example.com',
    nickname: '书虫小姐',
    gender: 1,
    birthday: '1998-08-15',
    bio: '每天都要看小说',
    role: 'user'
  },
  {
    username: 'reader003',
    email: 'reader003@example.com',
    nickname: '追文少女',
    gender: 1,
    birthday: '1997-03-10',
    bio: '沉迷小说无法自拔',
    role: 'user'
  },
  {
    username: 'author001',
    email: 'author001@example.com',
    nickname: '温柔笔触',
    gender: 1,
    birthday: '1990-06-12',
    bio: '专注都市言情创作',
    role: 'author'
  },
  {
    username: 'author002',
    email: 'author002@example.com',
    nickname: '墨染流年',
    gender: 1,
    birthday: '1988-09-25',
    bio: '古风穿越作者',
    role: 'author'
  },
  {
    username: 'author003',
    email: 'author003@example.com',
    nickname: '悬疑女王',
    gender: 1,
    birthday: '1992-11-08',
    bio: '悬疑推理爱好者',
    role: 'author'
  },
  {
    username: 'admin',
    email: 'admin@example.com',
    nickname: '管理员',
    gender: 2,
    birthday: '1990-01-01',
    bio: '系统管理员',
    role: 'admin'
  }
];

async function main() {
  let connection;
  
  try {
    console.log('\n' + '='.repeat(70));
    console.log('👤 导入测试用户数据');
    console.log('='.repeat(70));
    
    // 1. 生成密码哈希
    console.log('\n📝 生成密码哈希...');
    const passwordHash = await bcrypt.hash('123456', 10);
    console.log('✅ 密码生成完成');
    console.log('   统一密码: 123456\n');
    
    // 2. 连接数据库
    console.log('🔌 连接数据库...');
    console.log(`   主机: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`   数据库: ${DB_CONFIG.database}`);
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ 数据库连接成功\n');
    
    // 3. 导入用户
    console.log('开始导入用户...\n');
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const user of TEST_USERS) {
      try {
        // 检查是否已存在
        const [existing] = await connection.query(
          'SELECT id FROM users WHERE username = ? OR email = ?',
          [user.username, user.email]
        );
        
        if (existing.length > 0) {
          console.log(`⏭️  跳过: ${user.username} (已存在)`);
          skipCount++;
          continue;
        }
        
        // 插入用户
        await connection.query(`
          INSERT INTO users (
            username, email, password, nickname, avatar,
            gender, birthday, bio, role, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          user.username,
          user.email,
          passwordHash,
          user.nickname,
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          user.gender,
          user.birthday,
          user.bio,
          user.role
        ]);
        
        console.log(`✅ 成功: ${user.username} (${user.nickname}) - ${user.role}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ 失败: ${user.username} - ${error.message}`);
      }
    }
    
    // 4. 显示统计
    console.log('\n' + '='.repeat(70));
    console.log('📊 导入统计');
    console.log('='.repeat(70));
    console.log(`总用户数: ${TEST_USERS.length}`);
    console.log(`成功导入: ${successCount} ✅`);
    console.log(`已存在: ${skipCount} ⏭️`);
    console.log('='.repeat(70));
    
    // 5. 显示测试账号列表
    console.log('\n📋 测试账号列表:');
    console.log('┌─────────────┬──────────────────────────┬──────────┐');
    console.log('│ 用户名      │ 邮箱                     │ 角色     │');
    console.log('├─────────────┼──────────────────────────┼──────────┤');
    TEST_USERS.forEach(user => {
      const roleMap = { user: '普通用户', author: '作者', admin: '管理员' };
      console.log(`│ ${user.username.padEnd(11)} │ ${user.email.padEnd(24)} │ ${roleMap[user.role].padEnd(8)} │`);
    });
    console.log('└─────────────┴──────────────────────────┴──────────┘');
    console.log('🔑 所有账号的密码都是: 123456\n');
    
    // 6. 查询数据库统计
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [novels] = await connection.query('SELECT COUNT(*) as count FROM novels');
    
    console.log('📚 数据库现状:');
    console.log(`  用户总数: ${users[0].count}`);
    console.log(`  小说总数: ${novels[0].count}`);
    
    console.log('\n🎉 导入完成！');
    console.log('💡 现在可以使用这些测试账号登录系统了\n');
    
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 提示: 请确保 MySQL 服务已启动');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();

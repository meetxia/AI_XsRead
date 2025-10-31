/**
 * 检查数据库中的数据
 * 用于诊断后台管理系统为什么看不到数据
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseData() {
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
    console.log('================================================');
    console.log('  数据库数据检查报告');
    console.log('================================================\n');

    // 检查用户表
    console.log('📊 用户数据 (users)');
    console.log('---');
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [users] = await connection.query('SELECT id, username, email, role, status, created_at FROM users LIMIT 5');
    
    console.log(`总用户数: ${userCount[0].count}`);
    if (users.length > 0) {
      console.log('前5个用户:');
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}, 角色: ${user.role}, 状态: ${user.status}`);
      });
    } else {
      console.log('⚠️  数据库中没有用户数据！');
    }
    console.log('');

    // 检查小说表
    console.log('📚 小说数据 (novels)');
    console.log('---');
    const [novelCount] = await connection.query('SELECT COUNT(*) as count FROM novels');
    const [novels] = await connection.query('SELECT id, title, author, category_id, status, views, created_at FROM novels LIMIT 5');
    
    console.log(`总小说数: ${novelCount[0].count}`);
    if (novels.length > 0) {
      console.log('前5本小说:');
      novels.forEach(novel => {
        console.log(`  - ID: ${novel.id}, 书名: ${novel.title}, 作者: ${novel.author}, 分类ID: ${novel.category_id}, 浏览量: ${novel.views}`);
      });
    } else {
      console.log('⚠️  数据库中没有小说数据！');
    }
    console.log('');

    // 检查分类表
    console.log('🏷️  分类数据 (categories)');
    console.log('---');
    const [categoryCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
    const [categories] = await connection.query('SELECT id, name FROM categories');
    
    console.log(`总分类数: ${categoryCount[0].count}`);
    if (categories.length > 0) {
      console.log('分类列表:');
      categories.forEach(cat => {
        console.log(`  - ID: ${cat.id}, 名称: ${cat.name}`);
      });
    } else {
      console.log('⚠️  数据库中没有分类数据！');
    }
    console.log('');

    // 检查章节表
    console.log('📖 章节数据 (chapters)');
    console.log('---');
    const [chapterCount] = await connection.query('SELECT COUNT(*) as count FROM chapters');
    const [chapters] = await connection.query(`
      SELECT c.id, c.novel_id, c.title, n.title as novel_title 
      FROM chapters c 
      LEFT JOIN novels n ON c.novel_id = n.id 
      LIMIT 5
    `);
    
    console.log(`总章节数: ${chapterCount[0].count}`);
    if (chapters.length > 0) {
      console.log('前5个章节:');
      chapters.forEach(chapter => {
        console.log(`  - ID: ${chapter.id}, 章节: ${chapter.title}, 所属小说: ${chapter.novel_title || '未知'}`);
      });
    } else {
      console.log('⚠️  数据库中没有章节数据！');
    }
    console.log('');

    // 检查管理员表
    console.log('👤 管理员数据 (admins)');
    console.log('---');
    try {
      const [adminCount] = await connection.query('SELECT COUNT(*) as count FROM admins');
      const [admins] = await connection.query('SELECT id, username, email, role, status FROM admins');
      
      console.log(`总管理员数: ${adminCount[0].count}`);
      if (admins.length > 0) {
        console.log('管理员列表:');
        admins.forEach(admin => {
          console.log(`  - ID: ${admin.id}, 用户名: ${admin.username}, 邮箱: ${admin.email}, 角色: ${admin.role}`);
        });
      } else {
        console.log('⚠️  没有管理员账号！请运行: node scripts/init-admin.js');
      }
    } catch (error) {
      console.log('⚠️  admins 表不存在！需要创建管理员表');
    }
    console.log('');

    // 检查特殊管理表
    console.log('🎯 管理后台特有表');
    console.log('---');
    
    // 检查轮播图表
    try {
      const [bannerCount] = await connection.query('SELECT COUNT(*) as count FROM banners');
      console.log(`✅ banners 表: ${bannerCount[0].count} 条记录`);
    } catch (error) {
      console.log('❌ banners 表不存在');
    }

    // 检查公告表
    try {
      const [announcementCount] = await connection.query('SELECT COUNT(*) as count FROM announcements');
      console.log(`✅ announcements 表: ${announcementCount[0].count} 条记录`);
    } catch (error) {
      console.log('❌ announcements 表不存在');
    }

    // 检查统计表
    try {
      const [statsCount] = await connection.query('SELECT COUNT(*) as count FROM statistics_daily');
      console.log(`✅ statistics_daily 表: ${statsCount[0].count} 条记录`);
    } catch (error) {
      console.log('❌ statistics_daily 表不存在');
    }

    // 检查管理员日志表
    try {
      const [logCount] = await connection.query('SELECT COUNT(*) as count FROM admin_logs');
      console.log(`✅ admin_logs 表: ${logCount[0].count} 条记录`);
    } catch (error) {
      console.log('❌ admin_logs 表不存在');
    }
    console.log('');

    // 总结
    console.log('================================================');
    console.log('  诊断总结');
    console.log('================================================\n');

    if (userCount[0].count === 0 && novelCount[0].count === 0) {
      console.log('❌ 问题：数据库中没有任何用户和小说数据！');
      console.log('\n建议解决方案：');
      console.log('  1. 使用用户前端 (ai-xsread-vue3) 创建一些数据');
      console.log('  2. 或导入测试数据：node scripts/import-seed-data.js');
    } else {
      console.log('✅ 数据库中有数据！');
      console.log(`  - ${userCount[0].count} 个用户`);
      console.log(`  - ${novelCount[0].count} 本小说`);
      console.log(`  - ${chapterCount[0].count} 个章节`);
      
      console.log('\n如果后台管理系统看不到数据，请检查：');
      console.log('  1. admin-backend 是否在 8001 端口运行');
      console.log('  2. admin-frontend 是否在 3010 端口运行');
      console.log('  3. 是否已登录管理员账号');
    }

    await connection.end();

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

checkDatabaseData();


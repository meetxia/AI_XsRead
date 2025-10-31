/**
 * 测试管理后台API
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAPI() {
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

    // 测试用户列表查询（模拟后台管理的查询）
    console.log('=== 测试用户列表查询 ===');
    const whereClause = '1=1';
    const params = [];
    const pageSize = 20;
    const offset = 0;

    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      params
    );
    console.log(`用户总数: ${countResult[0].total}`);

    const [users] = await connection.query(
      `SELECT 
        id, username, email, avatar, gender, birthday, bio,
        role, status, created_at, updated_at,
        (SELECT COUNT(*) FROM bookshelf WHERE user_id = users.id) as total_books,
        (SELECT SUM(reading_time) FROM bookshelf WHERE user_id = users.id) as reading_time
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    console.log(`查询到 ${users.length} 个用户:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID:${user.id} - ${user.username} (${user.email}) - 角色:${user.role}`);
    });
    console.log('');

    // 测试小说列表查询
    console.log('=== 测试小说列表查询 ===');
    const novelWhereClause = '1=1';
    const novelParams = [];
    const sort = 'last_update_time';

    const [novelCountResult] = await connection.query(
      `SELECT COUNT(*) as total FROM novels n WHERE ${novelWhereClause}`,
      novelParams
    );
    console.log(`小说总数: ${novelCountResult[0].total}`);

    const [novels] = await connection.query(
      `SELECT 
        n.*,
        c.name as category
      FROM novels n
      LEFT JOIN categories c ON n.category_id = c.id
      WHERE ${novelWhereClause}
      ORDER BY n.${sort} DESC
      LIMIT ? OFFSET ?`,
      [...novelParams, parseInt(pageSize), offset]
    );

    console.log(`查询到 ${novels.length} 本小说:`);
    novels.forEach((novel, index) => {
      console.log(`  ${index + 1}. ID:${novel.id} - ${novel.title} - 作者:${novel.author} - 分类:${novel.category || '未分类'}`);
    });
    console.log('');

    // 检查表结构
    console.log('=== 检查 users 表结构 ===');
    const [userColumns] = await connection.query('DESCRIBE users');
    console.log('字段列表:');
    userColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    console.log('');

    console.log('=== 检查 novels 表结构 ===');
    const [novelColumns] = await connection.query('DESCRIBE novels');
    console.log('字段列表:');
    novelColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    await connection.end();

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error('详细信息:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

testAPI();


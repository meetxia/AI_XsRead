const mysql = require('mysql2/promise');
require('dotenv').config();

// 验证必需的环境变量（兼容 DB_NAME / DB_DATABASE）
const dbName = process.env.DB_NAME || process.env.DB_DATABASE;
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (!dbName) missingVars.push('DB_NAME (或 DB_DATABASE)');

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的环境变量:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\n请在 .env 文件中配置这些变量，参考 .env.example');
  process.exit(1);
}

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// 测试数据库连接（仅在非测试环境异步触发；测试环境由 src/app.js 启动期自行处理）
if (process.env.NODE_ENV !== 'test') {
  pool.getConnection()
    .then(connection => {
      console.log('✅ 数据库连接成功');
      connection.release();
    })
    .catch(err => {
      console.error('❌ 数据库连接失败:', err.message);
      console.error('请检查 .env 文件中的数据库配置');
    });
}

module.exports = pool;


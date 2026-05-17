/**
 * ============================================
 * 基础数据库连接池
 * ============================================
 *
 * 用途: 提供简单的数据库连接池,适用于大多数场景
 * 配置来源: ./index.js (统一配置入口)
 *
 * 注意:
 * - 如果需要读写分离、监控等高级功能,请使用 ../database/pool.js
 * - 所有配置从环境变量读取,确保安全性
 * - 配置已在 ./index.js 中验证
 */

const mysql = require('mysql2/promise');
const config = require('./index');

// 创建数据库连接池，强制 utf8mb4 字符集
const poolConfig = {
  ...config.database,
  charset: 'utf8mb4',
};
const pool = mysql.createPool(poolConfig);

// 包装 pool.query，确保每次查询前设置字符集
const originalGetConnection = pool.getConnection.bind(pool);
pool.getConnection = async function() {
  const conn = await originalGetConnection();
  try {
    await conn.query("SET NAMES 'utf8mb4'");
  } catch (e) { /* ignore */ }
  return conn;
};

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};


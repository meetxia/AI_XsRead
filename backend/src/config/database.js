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

// 创建数据库连接池 (配置来自统一配置文件)
const pool = mysql.createPool(config.database);

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


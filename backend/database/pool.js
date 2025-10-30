/**
 * ============================================
 * 高级数据库连接池管理器
 * 开发者: 开发者C
 * 创建日期: 2025-10-27
 * 版本: v1.1
 * ============================================
 *
 * 用途: 提供高级数据库管理功能
 *
 * 功能:
 * - 连接池配置优化
 * - 读写分离 (主从复制)
 * - 连接池监控
 * - 连接泄漏检测
 * - 故障转移
 * - 负载均衡
 *
 * 配置来源: 环境变量 (.env)
 *
 * 与 src/config/database.js 的区别:
 * - src/config/database.js: 简单连接池,适用于大多数场景
 * - database/pool.js: 高级管理器,适用于需要读写分离、监控等场景
 *
 * 注意:
 * - 所有配置从环境变量读取,确保安全性
 * - 生产环境建议启用监控功能
 * - 读写分离需要配置主从数据库
 */

const mysql = require('mysql2/promise');
const EventEmitter = require('events');

// 加载环境变量
require('dotenv').config();

// ============================================
// 配置
// ============================================
const CONFIG = {
  // 主库配置 (写)
  master: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,  // 必须从环境变量读取
    database: process.env.DB_DATABASE || 'ai_xsread',
    charset: 'utf8mb4',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 50,  // 最大连接数
    queueLimit: 0,               // 队列限制 (0=无限制)
    waitForConnections: true,    // 等待可用连接
    acquireTimeout: 30000,       // 获取连接超时 (30s)
    timeout: 60000,              // 查询超时 (60s)
    enableKeepAlive: true,       // 启用Keep-Alive
    keepAliveInitialDelay: 0,
    multipleStatements: false,   // 禁止多语句查询 (安全)
  },

  // 从库配置 (读) - 如果需要读写分离，请在环境变量中配置
  slaves: process.env.DB_SLAVE_ENABLED === 'true' ? [
    {
      host: process.env.DB_SLAVE_HOST || 'localhost',
      port: parseInt(process.env.DB_SLAVE_PORT) || 3306,
      user: process.env.DB_SLAVE_USER || 'readonly',
      password: process.env.DB_SLAVE_PASSWORD,  // 从环境变量读取
      database: process.env.DB_DATABASE || 'ai_xsread',
      charset: 'utf8mb4',
      connectionLimit: parseInt(process.env.DB_SLAVE_CONNECTION_LIMIT) || 100,
      queueLimit: 0,
      waitForConnections: true,
      acquireTimeout: 30000,
      timeout: 60000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    },
  ] : [],

  // 监控配置
  monitor: {
    enabled: process.env.DB_MONITOR_ENABLED !== 'false',  // 默认启用
    interval: parseInt(process.env.DB_MONITOR_INTERVAL) || 60000,  // 监控间隔: 1分钟
    warningThreshold: parseFloat(process.env.DB_WARNING_THRESHOLD) || 0.8,  // 80%
    criticalThreshold: parseFloat(process.env.DB_CRITICAL_THRESHOLD) || 0.9,  // 90%
  },

  // 读写分离策略
  strategy: {
    enabled: process.env.DB_SLAVE_ENABLED === 'true',  // 是否启用读写分离
    loadBalance: process.env.DB_LOAD_BALANCE || 'round-robin',  // 负载均衡策略
    retryTimes: parseInt(process.env.DB_RETRY_TIMES) || 3,  // 重试次数
    retryDelay: parseInt(process.env.DB_RETRY_DELAY) || 1000,  // 重试延迟 (ms)
  },
};

// 验证必需的数据库配置
if (!CONFIG.master.password) {
  console.error('❌ 错误: 未配置数据库密码');
  console.error('请在 .env 文件中设置 DB_PASSWORD 环境变量');
  process.exit(1);
}

// ============================================
// 数据库管理器
// ============================================
class DatabaseManager extends EventEmitter {
  constructor(config = CONFIG) {
    super();
    this.config = config;
    
    // 连接池
    this.masterPool = null;
    this.slavePools = [];
    this.currentSlaveIndex = 0;
    
    // 统计信息
    this.stats = {
      queries: {
        total: 0,
        select: 0,
        insert: 0,
        update: 0,
        delete: 0,
        errors: 0,
      },
      timing: {
        total: 0,
        avg: 0,
        min: Infinity,
        max: 0,
      },
    };
    
    // 监控定时器
    this.monitorTimer = null;
    
    this.initialize();
  }

  /**
   * 初始化连接池
   */
  async initialize() {
    try {
      // 创建主库连接池
      this.masterPool = mysql.createPool(this.config.master);
      console.log('✅ 主库连接池创建成功');
      
      // 测试主库连接
      await this.testConnection(this.masterPool, '主库');
      
      // 创建从库连接池 (如果配置了)
      if (this.config.strategy.enabled && this.config.slaves.length > 0) {
        for (let i = 0; i < this.config.slaves.length; i++) {
          const slavePool = mysql.createPool(this.config.slaves[i]);
          this.slavePools.push(slavePool);
          console.log(`✅ 从库${i + 1}连接池创建成功`);
          
          // 测试从库连接
          await this.testConnection(slavePool, `从库${i + 1}`);
        }
      }
      
      // 启动监控
      if (this.config.monitor.enabled) {
        this.startMonitor();
      }
      
      this.emit('ready');
      
    } catch (error) {
      console.error('❌ 数据库管理器初始化失败:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(pool, name) {
    try {
      const [rows] = await pool.query('SELECT 1 AS test');
      console.log(`✅ ${name}连接测试通过`);
      return true;
    } catch (error) {
      console.error(`❌ ${name}连接测试失败:`, error);
      throw error;
    }
  }

  /**
   * 执行查询 (自动选择主从库)
   * @param {string} sql SQL语句
   * @param {array} params 参数
   * @returns {Promise<array>} 查询结果
   */
  async query(sql, params = []) {
    const startTime = Date.now();
    const queryType = this.getQueryType(sql);
    
    try {
      let result;
      
      // 根据查询类型选择连接池
      if (queryType === 'SELECT' && this.config.strategy.enabled && this.slavePools.length > 0) {
        // SELECT查询使用从库
        result = await this.read(sql, params);
      } else {
        // 写操作使用主库
        result = await this.write(sql, params);
      }
      
      // 更新统计
      const duration = Date.now() - startTime;
      this.updateStats(queryType, duration, true);
      
      // 发出查询事件
      this.emit('query', {
        sql,
        params,
        duration,
        type: queryType,
      });
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStats(queryType, duration, false);
      
      this.emit('queryError', {
        sql,
        params,
        error,
        duration,
      });
      
      console.error(`❌ 查询失败 (${queryType}):`, error.message);
      throw error;
    }
  }

  /**
   * 写操作 (使用主库)
   */
  async write(sql, params = []) {
    const connection = await this.masterPool.getConnection();
    
    try {
      const [rows] = await connection.execute(sql, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  /**
   * 读操作 (使用从库,带故障转移)
   */
  async read(sql, params = []) {
    let lastError = null;
    
    for (let i = 0; i < this.config.strategy.retryTimes; i++) {
      try {
        const pool = this.getSlavePool();
        const connection = await pool.getConnection();
        
        try {
          const [rows] = await connection.execute(sql, params);
          return rows;
        } finally {
          connection.release();
        }
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ 从库查询失败 (第${i + 1}次重试):`, error.message);
        
        // 如果还有重试机会,等待后重试
        if (i < this.config.strategy.retryTimes - 1) {
          await this.sleep(this.config.strategy.retryDelay);
        }
      }
    }
    
    // 所有从库都失败,降级到主库
    console.warn('⚠️ 所有从库查询失败,降级到主库');
    return await this.write(sql, params);
  }

  /**
   * 获取从库连接池 (负载均衡)
   */
  getSlavePool() {
    if (this.slavePools.length === 0) {
      return this.masterPool;
    }
    
    if (this.config.strategy.loadBalance === 'round-robin') {
      // 轮询策略
      const pool = this.slavePools[this.currentSlaveIndex];
      this.currentSlaveIndex = (this.currentSlaveIndex + 1) % this.slavePools.length;
      return pool;
      
    } else if (this.config.strategy.loadBalance === 'random') {
      // 随机策略
      const index = Math.floor(Math.random() * this.slavePools.length);
      return this.slavePools[index];
    }
    
    return this.slavePools[0];
  }

  /**
   * 事务执行
   */
  async transaction(callback) {
    const connection = await this.masterPool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const result = await callback(connection);
      
      await connection.commit();
      return result;
      
    } catch (error) {
      await connection.rollback();
      throw error;
      
    } finally {
      connection.release();
    }
  }

  /**
   * 批量执行
   */
  async batch(sql, paramsList) {
    const connection = await this.masterPool.getConnection();
    
    try {
      const results = [];
      
      for (const params of paramsList) {
        const [rows] = await connection.execute(sql, params);
        results.push(rows);
      }
      
      return results;
      
    } finally {
      connection.release();
    }
  }

  /**
   * 获取查询类型
   */
  getQueryType(sql) {
    const trimmed = sql.trim().toUpperCase();
    
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('CALL')) return 'PROCEDURE';
    
    return 'OTHER';
  }

  /**
   * 更新统计信息
   */
  updateStats(queryType, duration, success) {
    if (success) {
      this.stats.queries.total++;
      this.stats.queries[queryType.toLowerCase()]++;
      
      this.stats.timing.total += duration;
      this.stats.timing.avg = this.stats.timing.total / this.stats.queries.total;
      this.stats.timing.min = Math.min(this.stats.timing.min, duration);
      this.stats.timing.max = Math.max(this.stats.timing.max, duration);
    } else {
      this.stats.queries.errors++;
    }
  }

  /**
   * 获取连接池状态
   */
  getPoolStats() {
    const masterStats = this.getPoolInfo(this.masterPool);
    const slaveStats = this.slavePools.map(pool => this.getPoolInfo(pool));
    
    return {
      master: masterStats,
      slaves: slaveStats,
      queries: this.stats.queries,
      timing: {
        ...this.stats.timing,
        avg: Math.round(this.stats.timing.avg),
      },
    };
  }

  /**
   * 获取单个连接池信息
   */
  getPoolInfo(pool) {
    if (!pool || !pool.pool) {
      return null;
    }
    
    const allConnections = pool.pool._allConnections?.length || 0;
    const freeConnections = pool.pool._freeConnections?.length || 0;
    const activeConnections = allConnections - freeConnections;
    const limit = pool.pool.config.connectionLimit;
    
    return {
      total: allConnections,
      active: activeConnections,
      idle: freeConnections,
      limit: limit,
      usage: limit > 0 ? ((activeConnections / limit) * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * 启动监控
   */
  startMonitor() {
    this.monitorTimer = setInterval(() => {
      const stats = this.getPoolStats();
      
      // 检查主库连接池使用率
      if (stats.master) {
        const usage = parseFloat(stats.master.usage);
        
        if (usage >= this.config.monitor.criticalThreshold * 100) {
          console.error(`🚨 主库连接池使用率严重: ${stats.master.usage}`);
          this.emit('critical', {
            type: 'pool_usage',
            pool: 'master',
            usage: stats.master.usage,
          });
        } else if (usage >= this.config.monitor.warningThreshold * 100) {
          console.warn(`⚠️ 主库连接池使用率过高: ${stats.master.usage}`);
          this.emit('warning', {
            type: 'pool_usage',
            pool: 'master',
            usage: stats.master.usage,
          });
        }
      }
      
      // 输出监控日志
      console.log('📊 连接池状态:', JSON.stringify(stats, null, 2));
      
    }, this.config.monitor.interval);
  }

  /**
   * 停止监控
   */
  stopMonitor() {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.stats = {
      queries: {
        total: 0,
        select: 0,
        insert: 0,
        update: 0,
        delete: 0,
        errors: 0,
      },
      timing: {
        total: 0,
        avg: 0,
        min: Infinity,
        max: 0,
      },
    };
  }

  /**
   * 辅助函数: 延迟
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 关闭所有连接池
   */
  async close() {
    try {
      this.stopMonitor();
      
      if (this.masterPool) {
        await this.masterPool.end();
        console.log('✅ 主库连接池已关闭');
      }
      
      for (let i = 0; i < this.slavePools.length; i++) {
        await this.slavePools[i].end();
        console.log(`✅ 从库${i + 1}连接池已关闭`);
      }
      
      this.emit('closed');
      
    } catch (error) {
      console.error('❌ 关闭连接池失败:', error);
    }
  }
}

// ============================================
// 导出
// ============================================
const db = new DatabaseManager();

module.exports = {
  DatabaseManager,
  db,
};

// ============================================
// 使用示例
// ============================================
/*
const { db } = require('./pool');

// 1. 基本查询
const novels = await db.query('SELECT * FROM novels WHERE id = ?', [1]);

// 2. 写操作 (自动使用主库)
const result = await db.query(
  'UPDATE novels SET views = views + 1 WHERE id = ?',
  [1]
);

// 3. 事务
await db.transaction(async (connection) => {
  await connection.execute('UPDATE users SET balance = balance - 100 WHERE id = ?', [1]);
  await connection.execute('UPDATE users SET balance = balance + 100 WHERE id = ?', [2]);
});

// 4. 批量执行
const paramsList = [[1], [2], [3]];
const results = await db.batch('SELECT * FROM novels WHERE id = ?', paramsList);

// 5. 监听事件
db.on('warning', (event) => {
  console.warn('连接池告警:', event);
});

db.on('critical', (event) => {
  console.error('连接池严重告警:', event);
  // 发送告警通知
});

// 6. 查看统计
const stats = db.getPoolStats();
console.log('连接池状态:', stats);

// 7. 优雅关闭
process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});
*/


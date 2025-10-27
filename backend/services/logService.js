/**
 * ============================================
 * 文字之境 - 日志服务
 * 开发者: 开发者C
 * 创建日期: 2025-10-27
 * 版本: v1.0
 * ============================================
 * 
 * 功能:
 * - 访问日志、错误日志、操作日志
 * - 性能日志、安全日志
 * - 日志查询和分析
 * - 日志切割和清理
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// ============================================
// 配置
// ============================================
const CONFIG = {
  // 日志目录
  logDir: './logs',
  
  // 日志级别
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  
  // 日志保留天数
  maxFiles: '30d',
  
  // 单个日志文件最大大小
  maxSize: '20m',
  
  // 数据库配置
  database: {
    enabled: true,
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root123',
    database: 'ai_xsread',
  },
};

// 确保日志目录存在
if (!fs.existsSync(CONFIG.logDir)) {
  fs.mkdirSync(CONFIG.logDir, { recursive: true });
}

// ============================================
// 自定义日志格式
// ============================================
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// ============================================
// 日志传输器配置
// ============================================

// 控制台输出
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
});

// 所有日志文件
const allLogsTransport = new DailyRotateFile({
  filename: path.join(CONFIG.logDir, 'all-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: CONFIG.maxSize,
  maxFiles: CONFIG.maxFiles,
  format: customFormat,
});

// 错误日志文件
const errorLogsTransport = new DailyRotateFile({
  filename: path.join(CONFIG.logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: CONFIG.maxSize,
  maxFiles: CONFIG.maxFiles,
  format: customFormat,
});

// 访问日志文件
const accessLogsTransport = new DailyRotateFile({
  filename: path.join(CONFIG.logDir, 'access-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: CONFIG.maxSize,
  maxFiles: CONFIG.maxFiles,
  format: customFormat,
});

// 性能日志文件
const performanceLogsTransport = new DailyRotateFile({
  filename: path.join(CONFIG.logDir, 'performance-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: CONFIG.maxSize,
  maxFiles: CONFIG.maxFiles,
  format: customFormat,
});

// 安全日志文件
const securityLogsTransport = new DailyRotateFile({
  filename: path.join(CONFIG.logDir, 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: CONFIG.maxSize,
  maxFiles: CONFIG.maxFiles,
  format: customFormat,
});

// ============================================
// 创建日志记录器
// ============================================
const logger = winston.createLogger({
  level: CONFIG.level,
  format: customFormat,
  transports: [
    consoleTransport,
    allLogsTransport,
    errorLogsTransport,
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(CONFIG.logDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(CONFIG.logDir, 'rejections.log'),
    }),
  ],
});

// ============================================
// 日志服务类
// ============================================
class LogService {
  constructor(config = CONFIG) {
    this.config = config;
    this.logger = logger;
    this.pool = null;
    
    if (config.database.enabled) {
      this.initDatabase();
    }
  }

  /**
   * 初始化数据库
   */
  async initDatabase() {
    try {
      this.pool = mysql.createPool(this.config.database);
      
      // 创建日志表
      await this.createLogTable();
      
      console.log('✅ 日志服务数据库初始化成功');
    } catch (error) {
      console.error('❌ 日志服务数据库初始化失败:', error);
    }
  }

  /**
   * 创建日志表
   */
  async createLogTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS logs (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        level VARCHAR(20) NOT NULL,
        type VARCHAR(50) NOT NULL COMMENT 'access, error, operation, performance, security',
        module VARCHAR(100) COMMENT '模块名称',
        action VARCHAR(100) COMMENT '操作名称',
        user_id INT DEFAULT NULL,
        ip VARCHAR(50),
        user_agent TEXT,
        message TEXT,
        data JSON DEFAULT NULL,
        duration INT DEFAULT NULL COMMENT '执行时长(ms)',
        status_code INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_level (level),
        INDEX idx_type (type),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    await this.pool.query(createTableSQL);
  }

  /**
   * 记录访问日志
   */
  async access(data) {
    const logData = {
      level: 'info',
      type: 'access',
      module: data.module || 'api',
      action: data.action,
      user_id: data.userId || null,
      ip: data.ip,
      user_agent: data.userAgent,
      message: `${data.method} ${data.url}`,
      status_code: data.statusCode,
      duration: data.duration,
      data: JSON.stringify({
        method: data.method,
        url: data.url,
        params: data.params,
        body: data.body,
        response: data.response,
      }),
    };
    
    // 写入文件
    this.logger.info(logData.message, logData);
    
    // 写入数据库
    if (this.pool) {
      await this.saveToDatabase(logData);
    }
    
    return logData;
  }

  /**
   * 记录错误日志
   */
  async error(data) {
    const logData = {
      level: 'error',
      type: 'error',
      module: data.module,
      action: data.action,
      user_id: data.userId || null,
      ip: data.ip,
      message: data.error?.message || data.message,
      data: JSON.stringify({
        error: data.error?.stack || data.error,
        context: data.context,
      }),
    };
    
    // 写入文件
    this.logger.error(logData.message, logData);
    
    // 写入数据库
    if (this.pool) {
      await this.saveToDatabase(logData);
    }
    
    return logData;
  }

  /**
   * 记录操作日志
   */
  async operation(data) {
    const logData = {
      level: 'info',
      type: 'operation',
      module: data.module,
      action: data.action,
      user_id: data.userId,
      ip: data.ip,
      message: data.message,
      data: JSON.stringify(data.data || {}),
    };
    
    // 写入文件
    this.logger.info(logData.message, logData);
    
    // 写入数据库
    if (this.pool) {
      await this.saveToDatabase(logData);
    }
    
    return logData;
  }

  /**
   * 记录性能日志
   */
  async performance(data) {
    const logData = {
      level: 'info',
      type: 'performance',
      module: data.module,
      action: data.action,
      message: `${data.action} took ${data.duration}ms`,
      duration: data.duration,
      data: JSON.stringify({
        metrics: data.metrics,
        threshold: data.threshold,
        exceeded: data.duration > (data.threshold || 1000),
      }),
    };
    
    // 如果超过阈值，记录为警告
    if (data.duration > (data.threshold || 1000)) {
      this.logger.warn(logData.message, logData);
    } else {
      this.logger.info(logData.message, logData);
    }
    
    // 写入数据库
    if (this.pool) {
      await this.saveToDatabase(logData);
    }
    
    return logData;
  }

  /**
   * 记录安全日志
   */
  async security(data) {
    const logData = {
      level: data.level || 'warn',
      type: 'security',
      module: 'security',
      action: data.action,
      user_id: data.userId || null,
      ip: data.ip,
      user_agent: data.userAgent,
      message: data.message,
      data: JSON.stringify(data.data || {}),
    };
    
    // 写入文件
    this.logger.warn(logData.message, logData);
    
    // 写入数据库
    if (this.pool) {
      await this.saveToDatabase(logData);
    }
    
    return logData;
  }

  /**
   * 保存到数据库
   */
  async saveToDatabase(logData) {
    try {
      const sql = `
        INSERT INTO logs 
        (level, type, module, action, user_id, ip, user_agent, message, data, duration, status_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        logData.level,
        logData.type,
        logData.module,
        logData.action,
        logData.user_id,
        logData.ip,
        logData.user_agent,
        logData.message,
        logData.data,
        logData.duration,
        logData.status_code,
      ];
      
      await this.pool.query(sql, values);
    } catch (error) {
      console.error('保存日志到数据库失败:', error);
    }
  }

  /**
   * 查询日志
   */
  async query(options = {}) {
    try {
      const {
        type,
        level,
        module,
        userId,
        startDate,
        endDate,
        keyword,
        page = 1,
        pageSize = 50,
      } = options;
      
      let sql = 'SELECT * FROM logs WHERE 1=1';
      const params = [];
      
      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }
      
      if (level) {
        sql += ' AND level = ?';
        params.push(level);
      }
      
      if (module) {
        sql += ' AND module = ?';
        params.push(module);
      }
      
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }
      
      if (startDate) {
        sql += ' AND created_at >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        sql += ' AND created_at <= ?';
        params.push(endDate);
      }
      
      if (keyword) {
        sql += ' AND message LIKE ?';
        params.push(`%${keyword}%`);
      }
      
      // 排序和分页
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(pageSize, (page - 1) * pageSize);
      
      const [logs] = await this.pool.query(sql, params);
      
      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM logs WHERE 1=1';
      const countParams = params.slice(0, -2);  // 移除LIMIT和OFFSET参数
      
      const [[{ total }]] = await this.pool.query(countSql, countParams);
      
      return {
        success: true,
        data: logs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (error) {
      console.error('查询日志失败:', error);
      throw error;
    }
  }

  /**
   * 统计分析
   */
  async analyze(options = {}) {
    try {
      const { type, startDate, endDate } = options;
      
      let sql = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          COUNT(CASE WHEN level = 'error' THEN 1 END) as errors,
          COUNT(CASE WHEN level = 'warn' THEN 1 END) as warnings,
          AVG(duration) as avg_duration
        FROM logs
        WHERE 1=1
      `;
      const params = [];
      
      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }
      
      if (startDate) {
        sql += ' AND created_at >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        sql += ' AND created_at <= ?';
        params.push(endDate);
      }
      
      sql += ' GROUP BY DATE(created_at) ORDER BY date DESC';
      
      const [stats] = await this.pool.query(sql, params);
      
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('日志分析失败:', error);
      throw error;
    }
  }

  /**
   * 清理旧日志
   */
  async cleanup(days = 30) {
    try {
      const sql = 'DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)';
      const [result] = await this.pool.query(sql, [days]);
      
      return {
        success: true,
        message: `清理了 ${result.affectedRows} 条日志记录`,
        deleted: result.affectedRows,
      };
    } catch (error) {
      console.error('清理日志失败:', error);
      throw error;
    }
  }

  /**
   * Express中间件 - 访问日志
   */
  accessMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // 记录响应
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        this.access({
          method: req.method,
          url: req.originalUrl,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          userId: req.user?.id,
          statusCode: res.statusCode,
          duration,
          params: req.params,
          body: req.body,
        });
      });
      
      next();
    };
  }

  /**
   * Express中间件 - 错误日志
   */
  errorMiddleware() {
    return (err, req, res, next) => {
      this.error({
        module: 'api',
        action: `${req.method} ${req.originalUrl}`,
        userId: req.user?.id,
        ip: req.ip || req.connection.remoteAddress,
        error: err,
        context: {
          method: req.method,
          url: req.originalUrl,
          params: req.params,
          body: req.body,
        },
      });
      
      next(err);
    };
  }
}

// ============================================
// 导出
// ============================================
const logService = new LogService();

module.exports = {
  LogService,
  logService,
  logger,
};

// ============================================
// 使用示例
// ============================================
/*
const express = require('express');
const { logService } = require('./logService');

const app = express();

// 使用访问日志中间件
app.use(logService.accessMiddleware());

// 业务路由
app.get('/api/test', (req, res) => {
  // 记录操作日志
  logService.operation({
    module: 'test',
    action: 'test_action',
    userId: req.user?.id,
    ip: req.ip,
    message: '执行测试操作',
    data: { test: 'data' },
  });
  
  res.json({ message: 'success' });
});

// 使用错误日志中间件
app.use(logService.errorMiddleware());

// 查询日志API
app.get('/api/logs', async (req, res) => {
  try {
    const result = await logService.query(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/


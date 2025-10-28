require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 8005,
    env: process.env.NODE_ENV || 'development'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'toefl_user',
    password: process.env.DB_PASSWORD || 'mojz168168-',
    database: process.env.DB_DATABASE || 'ai_xsread',
    
    // 连接池配置优化
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,  // 最大连接数 (10 -> 20)
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,  // 无限队列
    waitForConnections: true,  // 等待可用连接
    
    // 连接管理
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,  // 获取连接超时 30秒
    timeout: parseInt(process.env.DB_TIMEOUT) || 60000,  // 连接超时 60秒
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,  // 建立连接超时 10秒
    
    // 性能优化
    enableKeepAlive: true,  // 保持连接
    keepAliveInitialDelay: 0,
    
    // 字符集
    charset: 'utf8mb4',
    
    // 时区
    timezone: '+08:00',
    
    // 调试模式（仅开发环境）
    debug: process.env.DB_DEBUG === 'true' && process.env.NODE_ENV === 'development',
    
    // 多语句查询
    multipleStatements: false  // 安全起见，禁用多语句查询
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production-2025',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d', // 改为7天
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production-2025',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' // 改为30天
  },

  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3008', 'http://127.0.0.1:3008'],
    credentials: true
  },

  // 文件上传配置
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  }
};


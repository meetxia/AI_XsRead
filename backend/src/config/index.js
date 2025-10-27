require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 8000,
    env: process.env.NODE_ENV || 'development'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'toefl_user',
    password: process.env.DB_PASSWORD || 'mojz168168-',
    database: process.env.DB_DATABASE || 'ai_xsread',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production-2025',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production-2025',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
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


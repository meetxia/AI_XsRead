require('dotenv').config();

module.exports = {
  // 服务器配置
  port: process.env.PORT || 8001,
  env: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // 文件上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 2097152 // 2MB
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3010', 'http://127.0.0.1:3010'],
    credentials: true
  },
  
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info'
  }
};


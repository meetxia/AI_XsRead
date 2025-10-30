require('dotenv').config();

// ============================================
// 环境变量验证
// ============================================
const validateEnv = () => {
  const errors = [];

  // 验证数据库配置
  if (!process.env.DB_HOST) errors.push('DB_HOST');
  if (!process.env.DB_USER) errors.push('DB_USER');
  if (!process.env.DB_PASSWORD) errors.push('DB_PASSWORD');
  if (!process.env.DB_NAME) errors.push('DB_NAME');

  // 验证JWT配置
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET (必需)');
  } else if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET 长度必须至少32个字符');
    console.error(`   当前长度: ${process.env.JWT_SECRET.length} 字符`);
    process.exit(1);
  }

  if (errors.length > 0) {
    console.error('❌ 缺少必需的环境变量:');
    errors.forEach(varName => console.error(`  - ${varName}`));
    console.error('\n请在 .env 文件中配置这些变量，参考 .env.example');
    console.error('\n安全提示:');
    console.error('  - JWT_SECRET 必须是强随机字符串');
    console.error('  - 长度至少32个字符');
    console.error('  - 生产环境请使用加密安全的随机生成器');
    process.exit(1);
  }
};

// 执行验证
validateEnv();

module.exports = {
  // 服务器配置
  port: process.env.PORT || 8001,
  env: process.env.NODE_ENV || 'development',

  // 数据库配置 (已通过验证)
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },

  // JWT配置 (已通过验证,确保密钥安全)
  jwt: {
    secret: process.env.JWT_SECRET,  // 必须配置,长度≥32字符
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


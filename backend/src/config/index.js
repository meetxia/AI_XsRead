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
  if (!process.env.DB_DATABASE) errors.push('DB_DATABASE');

  // 验证JWT配置
  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET (必需)');
  } else if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET 长度必须至少32个字符');
    console.error(`   当前长度: ${process.env.JWT_SECRET.length} 字符`);
    process.exit(1);
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET (必需)');
  } else if (process.env.JWT_REFRESH_SECRET.length < 32) {
    console.error('❌ JWT_REFRESH_SECRET 长度必须至少32个字符');
    console.error(`   当前长度: ${process.env.JWT_REFRESH_SECRET.length} 字符`);
    process.exit(1);
  }

  if (errors.length > 0) {
    console.error('❌ 缺少必需的环境变量:');
    errors.forEach(varName => console.error(`  - ${varName}`));
    console.error('\n请在 .env 文件中配置这些变量，参考 .env.example');
    console.error('\n安全提示:');
    console.error('  - JWT_SECRET 和 JWT_REFRESH_SECRET 必须是强随机字符串');
    console.error('  - 长度至少32个字符');
    console.error('  - 生产环境请使用加密安全的随机生成器');
    process.exit(1);
  }
};

// 执行验证
validateEnv();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 8005,
    env: process.env.NODE_ENV || 'development'
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

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

  // JWT配置 (已通过验证,确保密钥安全)
  jwt: {
    secret: process.env.JWT_SECRET,  // 必须配置,长度≥32字符
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,  // 必须配置,长度≥32字符
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
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


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const db = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { devLogger } = require('./middlewares/logger');

// 创建Express应用
const app = express();

// ===== 安全中间件 =====
app.use(helmet());

// nginx 反代后信任最近一跳代理，否则 req.ip 永远是 127.0.0.1，限流会全站共享一桶
app.set('trust proxy', 1);

// 响应压缩
app.use(compression());

// ===== CORS配置 =====
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// ===== 速率限制 =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100个请求
  standardHeaders: true,
  legacyHeaders: false,
  message: '请求过于频繁，请稍后再试'
});

app.use('/api/admin/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: '登录尝试次数过多，请15分钟后再试'
}));

app.use('/api', limiter);

// ===== 基础中间件 =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 开发环境日志
if (config.env === 'development') {
  app.use(devLogger);
}

// ===== 静态文件服务 =====
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== 根路由 =====
app.get('/', (req, res) => {
  res.json({
    name: 'MOMO小说后台管理API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// ===== API路由 =====
app.use('/api', routes);

// ===== 404处理 =====
app.use(notFoundHandler);

// ===== 错误处理 =====
app.use(errorHandler);

// ===== 启动服务器 =====
const PORT = config.port;

async function startServer() {
  // 启动期数据库探测：撞不到直接 exit（避免把烂坏状态推给运行期）
  try {
    if (db && typeof db.query === 'function') {
      await db.query('SELECT 1');
      console.log('✅ 数据库连接成功');
    }
  } catch (err) {
    console.error('❌ 数据库连接失败，管理后端启动中止:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('  🚀 MOMO小说后台管理API服务');
    console.log('========================================');
    console.log(`  环境: ${config.env}`);
    console.log(`  端口: ${PORT}`);
    console.log(`  地址: http://localhost:${PORT}`);
    console.log('========================================');
    console.log('');
  });

  // 优雅关闭
  process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，开始优雅关闭...');
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n收到SIGINT信号，开始优雅关闭...');
    server.close(() => process.exit(0));
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;

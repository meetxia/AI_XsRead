const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const { testConnection } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/logger');
const swaggerSpec = require('./config/swagger');

// 创建Express应用
const app = express();

// ================== 中间件配置 ==================

// 安全头部
app.use(helmet());

// 跨域配置
app.use(cors(config.cors));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 响应压缩
app.use(compression());

// 请求日志
app.use(requestLogger);

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100个请求
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    timestamp: Date.now()
  }
});

// 应用限流（仅在生产环境）
if (config.server.env === 'production') {
  app.use(limiter);
}

// ================== 路由配置 ==================

// 静态文件（上传目录）
app.use('/uploads', express.static('uploads'));

// API 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '文字之境 API 文档'
}));

// API 文档 JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 注册所有路由
app.use('/', routes);

// ================== 错误处理 ==================

// 404处理
app.use(notFound);

// 全局错误处理
app.use(errorHandler);

// ================== 服务器启动 ==================

const startServer = async () => {
  try {
    // 测试数据库连接
    console.log('🔍 正在测试数据库连接...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动中止');
      process.exit(1);
    }
    
    // 启动服务器
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('🚀 文字之境后端服务启动成功！');
      console.log('========================================');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🌍 环境模式: ${config.server.env}`);
      console.log(`📚 API文档: http://localhost:${PORT}/api-docs`);
      console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
      console.log('========================================\n');
      
      console.log('✅ 可用的API端点:');
      console.log('  - POST   /api/auth/register       用户注册');
      console.log('  - POST   /api/auth/login          用户登录');
      console.log('  - GET    /api/auth/me             获取当前用户');
      console.log('  - GET    /api/novels              获取小说列表');
      console.log('  - GET    /api/novels/:id          获取小说详情');
      console.log('  - GET    /api/novels/recommend    获取推荐小说');
      console.log('  - GET    /api/novels/search       搜索小说');
      console.log('  - GET    /api/chapters/:id        获取章节内容');
      console.log('  - GET    /api/user/bookshelf      获取书架');
      console.log('  - POST   /api/user/bookshelf      添加到书架');
      console.log('  - GET    /api/health              健康检查\n');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅退出
process.on('SIGTERM', () => {
  console.log('👋 收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

// 启动服务器
startServer();

module.exports = app;


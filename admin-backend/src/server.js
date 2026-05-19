const app = require('./app');
const config = require('./config');

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('  🚀 MOMO小说后台管理API服务');
  console.log('========================================');
  console.log(`  环境: ${config.env}`);
  console.log(`  端口: ${PORT}`);
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  文档: http://localhost:${PORT}/api`);
  console.log('========================================');
  console.log('');
});

process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = server;

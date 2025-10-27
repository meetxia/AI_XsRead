const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// 创建日志目录
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 创建写入流
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

// 配置morgan
const logger = morgan('combined', { stream: accessLogStream });

// 开发环境使用彩色日志
const devLogger = morgan('dev');

module.exports = {
  logger,
  devLogger
};


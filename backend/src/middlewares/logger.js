/**
 * 请求日志中间件
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // 记录响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    };
    
    // 根据状态码使用不同的日志级别
    if (res.statusCode >= 500) {
      console.error('❌', JSON.stringify(log));
    } else if (res.statusCode >= 400) {
      console.warn('⚠️', JSON.stringify(log));
    } else {
      console.log('✅', JSON.stringify(log));
    }
  });
  
  next();
};

module.exports = requestLogger;


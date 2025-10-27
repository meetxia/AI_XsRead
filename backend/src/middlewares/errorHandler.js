/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // 数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      code: 400,
      message: '数据已存在',
      timestamp: Date.now()
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 401,
      message: '无效的令牌',
      timestamp: Date.now()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 401,
      message: '令牌已过期',
      timestamp: Date.now()
    });
  }

  // Multer文件上传错误
  if (err.name === 'MulterError') {
    return res.status(400).json({
      code: 400,
      message: '文件上传失败: ' + err.message,
      timestamp: Date.now()
    });
  }

  // 默认错误响应
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: Date.now()
  });
};

/**
 * 404错误处理
 */
const notFound = (req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    path: req.originalUrl,
    timestamp: Date.now()
  });
};

module.exports = {
  errorHandler,
  notFound
};


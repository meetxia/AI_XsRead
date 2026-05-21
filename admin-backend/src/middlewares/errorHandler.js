const Response = require('../utils/response');

const ErrorMessage = {
  ER_DUP_ENTRY: '数据已存在',
  JsonWebTokenError: 'Token 无效',
  TokenExpiredError: 'Token 已过期',
  ValidationError: '参数校验失败'
};

function logError(err, req) {
  // 仅打印必要字段，不要 dump 整个 err（避免 SQL/req.body 泄漏）
  const safe = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    }
  };
  if ((err.statusCode || 500) >= 500) {
    console.error('❌ admin-backend error:', JSON.stringify(safe));
  } else {
    console.warn('⚠️ admin-backend warn:', JSON.stringify(safe));
  }
}

const errorHandler = (err, req, res, next) => {
  logError(err, req);

  // MySQL 唯一键冲突
  if (err.code === 'ER_DUP_ENTRY') {
    return Response.error(res, ErrorMessage.ER_DUP_ENTRY, 400);
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    return Response.error(res, ErrorMessage.JsonWebTokenError, 401);
  }
  if (err.name === 'TokenExpiredError') {
    return Response.error(res, ErrorMessage.TokenExpiredError, 401);
  }

  // 参数校验
  if (err.name === 'ValidationError') {
    return Response.error(res, err.message || ErrorMessage.ValidationError, 400);
  }

  // multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return Response.error(res, '文件大小超过限制', 400);
    }
    return Response.error(res, '文件上传失败', 400);
  }

  // 默认
  const statusCode = err.statusCode || 500;
  // 生产环境：500 错误对外只返回固定文案，避免泄漏底层细节
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && statusCode >= 500
    ? '服务器内部错误'
    : (err.message || '服务器内部错误');

  return Response.error(res, message, statusCode);
};

const notFoundHandler = (req, res) => {
  return Response.error(res, '请求的资源不存在', 404);
};

module.exports = {
  errorHandler,
  notFoundHandler
};

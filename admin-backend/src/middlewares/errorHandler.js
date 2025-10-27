const Response = require('../utils/response');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // 数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    return Response.error(res, '数据已存在', 400);
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return Response.error(res, 'Token无效', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return Response.error(res, 'Token已过期', 401);
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return Response.error(res, err.message, 400);
  }

  // 默认错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  return Response.error(res, message, statusCode);
};

/**
 * 404错误处理
 */
const notFoundHandler = (req, res) => {
  return Response.error(res, '请求的资源不存在', 404);
};

module.exports = {
  errorHandler,
  notFoundHandler
};


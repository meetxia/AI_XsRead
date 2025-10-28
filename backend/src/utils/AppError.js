/**
 * 自定义应用错误类
 */
class AppError extends Error {
  /**
   * @param {number} code - 错误码
   * @param {string} message - 错误消息
   * @param {*} details - 详细信息（可选）
   * @param {number} httpStatus - HTTP状态码（可选，默认400）
   */
  constructor(code, message, details = null, httpStatus = null) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    
    // 根据错误码自动确定HTTP状态码
    if (httpStatus) {
      this.httpStatus = httpStatus;
    } else {
      this.httpStatus = this.determineHttpStatus(code);
    }
    
    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 根据错误码确定HTTP状态码
   * @param {number} code - 错误码
   * @returns {number} HTTP状态码
   */
  determineHttpStatus(code) {
    // 2xxx 认证错误 -> 401
    if (code >= 2000 && code < 3000) {
      if (code === 2008) return 403; // 权限不足
      return 401;
    }
    
    // 3xxx 业务错误 -> 400/404
    if (code >= 3000 && code < 4000) {
      // 所有NOT_FOUND类错误
      if (code % 100 === 1 || code === 3001 || code === 3101 || code === 3301 || code === 3501) {
        return 404;
      }
      // 所有EXISTS/TAKEN类错误
      if (code % 100 === 2 || code === 3002 || code === 3202 || code === 3502) {
        return 409; // Conflict
      }
      return 400;
    }
    
    // 4xxx 数据库错误 -> 500
    if (code >= 4000 && code < 5000) {
      if (code === 4007) return 409; // 重复条目
      return 500;
    }
    
    // 5xxx 外部服务错误 -> 500/503
    if (code >= 5000 && code < 6000) {
      return 503; // Service Unavailable
    }
    
    // 6xxx 验证错误 -> 400
    if (code >= 6000 && code < 7000) {
      return 400;
    }
    
    // 默认
    return code >= 100 && code < 600 ? code : 500;
  }

  /**
   * 转换为响应对象
   * @param {boolean} includeStack - 是否包含堆栈信息
   * @returns {Object} 响应对象
   */
  toJSON(includeStack = false) {
    const response = {
      code: this.code,
      message: this.message,
      timestamp: Date.now()
    };

    if (this.details) {
      response.details = this.details;
    }

    if (includeStack && process.env.NODE_ENV === 'development') {
      response.stack = this.stack;
    }

    return response;
  }
}

module.exports = AppError;


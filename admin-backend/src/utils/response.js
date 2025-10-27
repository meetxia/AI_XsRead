/**
 * 统一响应格式
 */

class Response {
  /**
   * 成功响应
   */
  static success(res, data = null, message = 'success', code = 200) {
    return res.status(200).json({
      code,
      message,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 失败响应
   */
  static error(res, message = 'error', code = 400, errors = null) {
    return res.status(code >= 500 ? 500 : 200).json({
      code,
      message,
      errors,
      timestamp: Date.now()
    });
  }

  /**
   * 分页响应
   */
  static page(res, data = [], total = 0, page = 1, pageSize = 20) {
    return res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        list: data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      timestamp: Date.now()
    });
  }
}

module.exports = Response;


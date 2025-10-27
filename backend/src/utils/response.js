/**
 * 统一响应格式工具
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
    const response = {
      code,
      message,
      timestamp: Date.now()
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return res.status(code >= 500 ? 500 : code >= 400 ? code : 400).json(response);
  }

  /**
   * 分页响应
   */
  static paginate(res, data, pagination, message = 'success') {
    return res.status(200).json({
      code: 200,
      message,
      data,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.pageSize)
      },
      timestamp: Date.now()
    });
  }

  /**
   * 创建成功响应
   */
  static created(res, data, message = 'created') {
    return res.status(201).json({
      code: 201,
      message,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 无内容响应
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = Response;


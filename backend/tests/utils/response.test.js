/**
 * Response 工具单元测试
 * 覆盖 success / error / paginate / created / noContent 五条分支。
 */
const Response = require('../../src/utils/response');

function createMockRes() {
  const res = {
    statusCode: null,
    payload: null,
    sent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
    send() {
      this.sent = true;
      return this;
    }
  };
  return res;
}

describe('utils/response', () => {
  test('success 返回 200 + 默认 message', () => {
    const res = createMockRes();
    Response.success(res, { id: 1 });

    expect(res.statusCode).toBe(200);
    expect(res.payload.code).toBe(200);
    expect(res.payload.message).toBe('success');
    expect(res.payload.data).toEqual({ id: 1 });
    expect(typeof res.payload.timestamp).toBe('number');
  });

  test('error 在 4xx 区间使用传入的 code 作为 HTTP 状态码', () => {
    const res = createMockRes();
    Response.error(res, '参数错误', 422, [{ field: 'x' }]);

    expect(res.statusCode).toBe(422);
    expect(res.payload.code).toBe(422);
    expect(res.payload.message).toBe('参数错误');
    expect(res.payload.data).toBeNull();
    expect(res.payload.errors).toEqual([{ field: 'x' }]);
  });

  test('error 在 5xx 区间统一回退到 HTTP 500', () => {
    const res = createMockRes();
    Response.error(res, '内部错误', 503);
    expect(res.statusCode).toBe(500);
    expect(res.payload.code).toBe(503);
  });

  test('error code < 400 时回退到 400', () => {
    const res = createMockRes();
    Response.error(res, '默认 400', 200);
    expect(res.statusCode).toBe(400);
    expect(res.payload.code).toBe(200);
  });

  test('paginate 计算 totalPages 并保留传入字段', () => {
    const res = createMockRes();
    Response.paginate(res, [{ id: 1 }, { id: 2 }], { page: 1, pageSize: 10, total: 23 });

    expect(res.statusCode).toBe(200);
    expect(res.payload.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 23,
      totalPages: 3
    });
    expect(res.payload.data).toHaveLength(2);
  });

  test('created 返回 201', () => {
    const res = createMockRes();
    Response.created(res, { id: 99 });

    expect(res.statusCode).toBe(201);
    expect(res.payload.code).toBe(201);
    expect(res.payload.data).toEqual({ id: 99 });
  });

  test('noContent 调用 send 并返回 204', () => {
    const res = createMockRes();
    Response.noContent(res);

    expect(res.statusCode).toBe(204);
    expect(res.sent).toBe(true);
  });
});

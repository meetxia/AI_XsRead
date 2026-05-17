/**
 * AppError 单元测试
 * 覆盖 determineHttpStatus 各分支与 toJSON。
 */
const AppError = require('../../src/utils/AppError');

describe('AppError', () => {
  test('显式 httpStatus 优先', () => {
    const err = new AppError(3001, 'x', null, 418);
    expect(err.httpStatus).toBe(418);
  });

  test('2xxx 默认 401，2008 提升为 403', () => {
    expect(new AppError(2001, 'x').httpStatus).toBe(401);
    expect(new AppError(2008, 'x').httpStatus).toBe(403);
  });

  test('3xxx NOT_FOUND 类映射 404', () => {
    expect(new AppError(3001, 'x').httpStatus).toBe(404);
    expect(new AppError(3101, 'x').httpStatus).toBe(404);
    expect(new AppError(3501, 'x').httpStatus).toBe(404);
  });

  test('3xxx EXISTS 类映射 409', () => {
    expect(new AppError(3002, 'x').httpStatus).toBe(409);
    expect(new AppError(3502, 'x').httpStatus).toBe(409);
  });

  test('3xxx 其它落在 400', () => {
    expect(new AppError(3303, 'x').httpStatus).toBe(400);
  });

  test('4007 重复条目映射 409，其它 4xxx 映射 500', () => {
    expect(new AppError(4007, 'x').httpStatus).toBe(409);
    expect(new AppError(4002, 'x').httpStatus).toBe(500);
  });

  test('5xxx 映射 503，6xxx 映射 400', () => {
    expect(new AppError(5001, 'x').httpStatus).toBe(503);
    expect(new AppError(6001, 'x').httpStatus).toBe(400);
  });

  test('已知 HTTP 状态码原值返回；陌生编码兜底 500', () => {
    expect(new AppError(404, 'x').httpStatus).toBe(404);
    expect(new AppError(99999, 'x').httpStatus).toBe(500);
  });

  test('toJSON 暴露 code/message/timestamp 与 details', () => {
    const err = new AppError(3303, '过长', { len: 9999 });
    const json = err.toJSON();
    expect(json.code).toBe(3303);
    expect(json.message).toBe('过长');
    expect(json.details).toEqual({ len: 9999 });
    expect(typeof json.timestamp).toBe('number');
    expect(json.stack).toBeUndefined();
  });

  test('toJSON 在 development + includeStack=true 时附带 stack', () => {
    const original = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'development';
      const err = new AppError(3303, '过长');
      const json = err.toJSON(true);
      expect(typeof json.stack).toBe('string');
      expect(json.stack.length).toBeGreaterThan(0);
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});

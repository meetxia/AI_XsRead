/**
 * errorHandler 中间件单元测试
 *
 * 通过最小 Express app 触发各类错误分支，确认 errorHandler 把它们
 * 都映射到正确的 HTTP 状态码与统一响应壳。
 */
const express = require('express');
const request = require('supertest');
const AppError = require('../../src/utils/AppError');
const { errorHandler, notFound, asyncHandler } = require('../../src/middlewares/errorHandler');
const { ErrorCodes } = require('../../src/constants/errorCodes');

// 屏蔽 errorHandler 内部的 console 噪音
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

function buildApp(throwables) {
  const app = express();

  Object.entries(throwables).forEach(([path, factory]) => {
    app.get(path, asyncHandler(async () => {
      throw factory();
    }));
  });

  // notFound 必须放在所有真实路由之后
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe('middlewares/errorHandler', () => {
  test('AppError 透传 httpStatus 与 code', async () => {
    const app = buildApp({
      '/app-error': () => new AppError(ErrorCodes.NOVEL_NOT_FOUND, '找不到')
    });

    const res = await request(app).get('/app-error');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(ErrorCodes.NOVEL_NOT_FOUND);
    expect(res.body.message).toBe('找不到');
  });

  test('JsonWebTokenError 映射到 401 + 2001', async () => {
    const app = buildApp({
      '/jwt-invalid': () => {
        const e = new Error('jwt malformed');
        e.name = 'JsonWebTokenError';
        return e;
      }
    });

    const res = await request(app).get('/jwt-invalid');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(ErrorCodes.AUTH_TOKEN_INVALID);
  });

  test('TokenExpiredError 映射到 401 + 2002', async () => {
    const app = buildApp({
      '/jwt-expired': () => {
        const e = new Error('jwt expired');
        e.name = 'TokenExpiredError';
        return e;
      }
    });

    const res = await request(app).get('/jwt-expired');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(ErrorCodes.AUTH_TOKEN_EXPIRED);
  });

  test('MySQL ER_DUP_ENTRY 映射到 409 + DB_DUPLICATE_ENTRY', async () => {
    const app = buildApp({
      '/dup': () => {
        const e = new Error('duplicate');
        e.code = 'ER_DUP_ENTRY';
        e.sqlMessage = 'Duplicate entry "x" for key "uk"';
        return e;
      }
    });

    const res = await request(app).get('/dup');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe(ErrorCodes.DB_DUPLICATE_ENTRY);
  });

  test('其它 ER_ 开头 SQL 错误映射到 500 + DB_QUERY_ERROR', async () => {
    const app = buildApp({
      '/sql': () => {
        const e = new Error('parse');
        e.code = 'ER_PARSE_ERROR';
        e.sqlMessage = 'parse';
        return e;
      }
    });

    const res = await request(app).get('/sql');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe(ErrorCodes.DB_QUERY_ERROR);
  });

  test('数据库连接错误映射到 503 + DB_CONNECTION_ERROR', async () => {
    const app = buildApp({
      '/conn': () => {
        const e = new Error('refused');
        e.code = 'ECONNREFUSED';
        return e;
      }
    });

    const res = await request(app).get('/conn');
    expect(res.status).toBe(503);
    expect(res.body.code).toBe(ErrorCodes.DB_CONNECTION_ERROR);
  });

  test('MulterError LIMIT_FILE_SIZE 映射到 400 + FILE_SIZE_EXCEEDED', async () => {
    const app = buildApp({
      '/upload': () => {
        const e = new Error('big');
        e.name = 'MulterError';
        e.code = 'LIMIT_FILE_SIZE';
        return e;
      }
    });

    const res = await request(app).get('/upload');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(ErrorCodes.FILE_SIZE_EXCEEDED);
  });

  test('express-validator 风格错误（提供 .array()）映射到 400 + VALIDATION_ERROR', async () => {
    const app = buildApp({
      '/validate': () => {
        const e = new Error('validate');
        e.array = () => [{ field: 'x', msg: 'bad' }];
        return e;
      }
    });

    const res = await request(app).get('/validate');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(res.body.details).toEqual([{ field: 'x', msg: 'bad' }]);
  });

  test('未知错误兜底为 500 + INTERNAL_ERROR', async () => {
    const app = buildApp({
      '/boom': () => new Error('boom')
    });

    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe(ErrorCodes.INTERNAL_ERROR);
    expect(res.body.message).toBe('boom');
  });

  test('notFound 中间件返回 404 + NOT_FOUND', async () => {
    const app = buildApp({});
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe(ErrorCodes.NOT_FOUND);
  });
});

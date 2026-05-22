/**
 * 密码找回流程单元测试
 *
 * 通过 jest.mock 拦截 ../../src/config/database 的 pool，无需真实 MySQL。
 *
 * 覆盖：
 *   1. forgot-password 临时关闭 → 200 + 联系管理员文案，不查询数据库
 *   2. reset-password 临时关闭 → 400 + 联系管理员文案，不开启事务
 */

jest.mock('../../src/config/database', () => {
  const queryMock = jest.fn();
  const txQueryMock = jest.fn();
  const releaseMock = jest.fn();
  const beginTxMock = jest.fn();
  const commitMock = jest.fn();
  const rollbackMock = jest.fn();
  const getConnectionMock = jest.fn();

  const conn = {
    query: txQueryMock,
    beginTransaction: beginTxMock,
    commit: commitMock,
    rollback: rollbackMock,
    release: releaseMock
  };

  return {
    pool: {
      query: queryMock,
      getConnection: getConnectionMock,
      __conn: conn,
      __mocks: {
        queryMock,
        txQueryMock,
        beginTxMock,
        commitMock,
        rollbackMock,
        releaseMock,
        getConnectionMock
      }
    },
    testConnection: jest.fn().mockResolvedValue(true)
  };
});

// 关闭 helmet 等不相关 console 噪音
process.env.NODE_ENV = 'test';

const request = require('supertest');
// 必须在 mock 之后再 require app
const app = require('../../src/app');
const { pool } = require('../../src/config/database');

const {
  queryMock,
  txQueryMock,
  beginTxMock,
  commitMock,
  rollbackMock,
  releaseMock,
  getConnectionMock
} = pool.__mocks;

beforeEach(() => {
  // jest.config.js 启用了 resetMocks: true，每条用例会清空 implementation；
  // 这里统一在 beforeEach 重新绑定 conn 方法的默认行为
  queryMock.mockReset();
  txQueryMock.mockReset();
  beginTxMock.mockReset().mockResolvedValue(undefined);
  commitMock.mockReset().mockResolvedValue(undefined);
  rollbackMock.mockReset().mockResolvedValue(undefined);
  releaseMock.mockReset();
  getConnectionMock.mockReset().mockResolvedValue(pool.__conn);
});

describe('POST /api/auth/forgot-password', () => {
  it('临时关闭时返回联系管理员文案，且不查询数据库或创建重置 token', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reader@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.message).toContain('密码找回暂未开放');
    expect(res.body.message).toContain('联系管理员');
    expect(res.body.message).toContain('472990945');
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/reset-password', () => {
  it('临时关闭时返回联系管理员文案，且不进入事务重置密码', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(64), newPassword: 'newpass123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('密码找回暂未开放');
    expect(res.body.message).toContain('联系管理员');
    expect(res.body.message).toContain('472990945');
    expect(getConnectionMock).not.toHaveBeenCalled();
    expect(txQueryMock).not.toHaveBeenCalled();
    expect(commitMock).not.toHaveBeenCalled();
  });
});

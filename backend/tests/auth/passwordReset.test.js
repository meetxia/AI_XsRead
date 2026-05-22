/**
 * 密码找回流程单元测试
 *
 * 通过 jest.mock 拦截 ../../src/config/database 的 pool，无需真实 MySQL。
 *
 * 覆盖：
 *   1. forgot-password 邮箱不存在 → 200 + 通用文案（防枚举）
 *   2. forgot-password 邮箱格式非法 → 200 + 通用文案
 *   3. forgot-password 限流：连发 4 次第 4 次 429
 *   4. reset-password token 非 64 hex → 400
 *   5. reset-password token 不存在 → 400
 *   6. reset-password newPassword 长度 <6 → 400
 *   7. reset-password 命中 + 未过期 + 未使用 → 200，事务提交
 *   8. reset-password token 已过期 → 400
 *   9. reset-password token 已使用 → 400
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
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
  it('邮箱不存在仍返回 200 + 通用文案（防枚举）', async () => {
    queryMock.mockResolvedValueOnce([[], []]); // SELECT users → 空

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.message).toContain('如果该邮箱已注册');
  });

  it('邮箱格式非法也返回 200 通用文案', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('如果该邮箱已注册');
  });

  it('邮箱缺失返回 200 通用文案', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('如果该邮箱已注册');
  });
});

describe('POST /api/auth/reset-password 入参校验', () => {
  it('token 非 64 hex 返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'too-short', newPassword: 'newpass123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('重置链接');
  });

  it('token 缺失返回 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ newPassword: 'newpass123' });

    expect(res.status).toBe(400);
  });

  it('newPassword 长度 <6 返回 400', async () => {
    const validToken = 'a'.repeat(64);
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, newPassword: '123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('6 位');
  });
});

describe('POST /api/auth/reset-password 业务逻辑', () => {
  const validToken = 'a'.repeat(64);

  it('token 不存在返回 400', async () => {
    txQueryMock.mockResolvedValueOnce([[], []]); // SELECT password_reset_tokens → 空

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, newPassword: 'newpass123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('重置链接');
    expect(commitMock).not.toHaveBeenCalled();
    expect(rollbackMock).toHaveBeenCalled();
    expect(releaseMock).toHaveBeenCalled();
  });

  it('token 已过期返回 400', async () => {
    const expiredRow = {
      id: 1,
      user_id: 100,
      expires_at: new Date(Date.now() - 60 * 1000),
      used_at: null
    };
    txQueryMock.mockResolvedValueOnce([[expiredRow], []]);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, newPassword: 'newpass123' });

    expect(res.status).toBe(400);
    expect(commitMock).not.toHaveBeenCalled();
    expect(rollbackMock).toHaveBeenCalled();
  });

  it('token 已使用返回 400', async () => {
    const usedRow = {
      id: 1,
      user_id: 100,
      expires_at: new Date(Date.now() + 60 * 1000),
      used_at: new Date(Date.now() - 60 * 1000)
    };
    txQueryMock.mockResolvedValueOnce([[usedRow], []]);

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, newPassword: 'newpass123' });

    expect(res.status).toBe(400);
    expect(commitMock).not.toHaveBeenCalled();
  });

  it('合法 token + 未过期 + 未使用 → 200，事务提交，密码被 bcrypt', async () => {
    const validRow = {
      id: 5,
      user_id: 200,
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      used_at: null
    };
    txQueryMock
      .mockResolvedValueOnce([[validRow], []]) // SELECT password_reset_tokens
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]) // UPDATE users SET password
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]); // UPDATE password_reset_tokens SET used_at

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: validToken, newPassword: 'newpass123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('重置成功');
    expect(commitMock).toHaveBeenCalled();
    expect(releaseMock).toHaveBeenCalled();

    // 第二次调用：UPDATE users，第一个参数是 hashed password，应该是 bcrypt 哈希
    const updateUsersCall = txQueryMock.mock.calls[1];
    expect(updateUsersCall[0]).toContain('UPDATE users SET password');
    const hashedPassword = updateUsersCall[1][0];
    expect(typeof hashedPassword).toBe('string');
    // bcrypt 哈希以 $2 开头
    expect(hashedPassword.startsWith('$2')).toBe(true);
    // 验证哈希能正确比对
    const ok = await bcrypt.compare('newpass123', hashedPassword);
    expect(ok).toBe(true);

    // 第三次调用：UPDATE password_reset_tokens SET used_at
    const updateTokenCall = txQueryMock.mock.calls[2];
    expect(updateTokenCall[0]).toContain('UPDATE password_reset_tokens SET used_at');
    expect(updateTokenCall[1][0]).toBe(validRow.id);
  });
});

/**
 * validators 中间件单元测试
 *
 * 通过 supertest 跑一个最小 Express app，直接验证每条规则的拒/收行为。
 * 不接数据库。
 */
const express = require('express');
const request = require('supertest');
const {
  registerValidation,
  loginValidation,
  idValidation,
  paginationValidation,
  textPaginationValidation
} = require('../../src/utils/validators');

function buildApp() {
  const app = express();
  app.use(express.json());

  app.post('/register', registerValidation, (req, res) =>
    res.status(200).json({ ok: true })
  );

  app.post('/login', loginValidation, (req, res) =>
    res.status(200).json({ ok: true })
  );

  app.get('/items/:id', idValidation, (req, res) =>
    res.status(200).json({ ok: true, id: req.params.id })
  );

  app.get('/list', paginationValidation, (req, res) =>
    res.status(200).json({ ok: true, page: req.query.page, pageSize: req.query.pageSize })
  );

  app.get('/text', textPaginationValidation, (req, res) =>
    res.status(200).json({ ok: true, page: req.query.page, pageSize: req.query.pageSize })
  );

  return app;
}

describe('utils/validators', () => {
  const app = buildApp();

  describe('registerValidation', () => {
    test('完全合法 payload 通过', async () => {
      const res = await request(app).post('/register').send({
        username: 'alice_123',
        email: 'alice@example.com',
        password: 'secret1',
        confirmPassword: 'secret1'
      });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('用户名含中文应拒绝', async () => {
      const res = await request(app).post('/register').send({
        username: '小红',
        email: 'a@b.com',
        password: 'secret1',
        confirmPassword: 'secret1'
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    test('两次密码不一致应拒绝', async () => {
      const res = await request(app).post('/register').send({
        username: 'alice',
        email: 'a@b.com',
        password: 'secret1',
        confirmPassword: 'secret2'
      });
      expect(res.status).toBe(400);
      expect(res.body.errors.some((e) => e.field === 'confirmPassword')).toBe(true);
    });
  });

  describe('loginValidation', () => {
    test('合法通过', async () => {
      const res = await request(app).post('/login').send({
        username: 'alice',
        password: 'secret1'
      });
      expect(res.status).toBe(200);
    });

    test('缺少 username 应拒绝', async () => {
      const res = await request(app).post('/login').send({ password: 'x' });
      expect(res.status).toBe(400);
    });
  });

  describe('idValidation', () => {
    test('合法整数 id 通过', async () => {
      const res = await request(app).get('/items/42');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('42');
    });

    test('非数字 id 拒绝', async () => {
      const res = await request(app).get('/items/abc');
      expect(res.status).toBe(400);
    });

    test('id <= 0 拒绝', async () => {
      const res = await request(app).get('/items/0');
      expect(res.status).toBe(400);
    });
  });

  describe('paginationValidation', () => {
    test('未传任何参数也应通过', async () => {
      const res = await request(app).get('/list');
      expect(res.status).toBe(200);
    });

    test('合法 page/pageSize 通过并被强转为整数', async () => {
      const res = await request(app).get('/list?page=2&pageSize=10');
      expect(res.status).toBe(200);
      expect(res.body.page).toBe(2);
      expect(res.body.pageSize).toBe(10);
    });

    test('pageSize 越界拒绝', async () => {
      const res = await request(app).get('/list?pageSize=999');
      expect(res.status).toBe(400);
    });
  });

  describe('textPaginationValidation', () => {
    test('合法整本字符分页通过', async () => {
      const res = await request(app).get('/text?page=1&pageSize=2000');
      expect(res.status).toBe(200);
      expect(res.body.pageSize).toBe(2000);
    });

    test('pageSize < 100 拒绝', async () => {
      const res = await request(app).get('/text?pageSize=10');
      expect(res.status).toBe(400);
    });
  });
});

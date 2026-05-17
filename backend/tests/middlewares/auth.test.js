const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { authenticate, optionalAuth } = require('../../src/middlewares/auth');

describe('auth middleware', () => {
  test('authenticate returns unified 401 response when token is missing', async () => {
    const app = express();
    app.get('/private', authenticate, (req, res) => res.json({ ok: true }));

    const response = await request(app).get('/private');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 401, message: '请先登录' });
  });

  test('optionalAuth leaves anonymous requests available and decodes valid tokens', async () => {
    const app = express();
    app.get('/optional', optionalAuth, (req, res) => {
      res.json({ userId: req.user ? req.user.id : null });
    });

    const anonymous = await request(app).get('/optional');
    expect(anonymous.status).toBe(200);
    expect(anonymous.body.userId).toBeNull();

    const token = jwt.sign({ id: 42, username: 'reader', role: 'user' }, config.jwt.secret);
    const loggedIn = await request(app)
      .get('/optional')
      .set('Authorization', `Bearer ${token}`);

    expect(loggedIn.status).toBe(200);
    expect(loggedIn.body.userId).toBe(42);
  });
});

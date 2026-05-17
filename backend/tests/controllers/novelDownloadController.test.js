const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const novelController = require('../../src/controllers/novelController');
const novelService = require('../../src/services/novelService');
const membershipService = require('../../src/services/membershipService');
const { authenticate } = require('../../src/middlewares/auth');

jest.mock('../../src/services/novelService', () => ({
  buildNovelDownloadText: jest.fn()
}));

jest.mock('../../src/services/membershipService', () => ({
  isMember: jest.fn()
}));

function createApp() {
  const app = express();
  app.get('/api/novels/:id/download', authenticate, novelController.downloadNovel);
  return app;
}

function signToken(user = {}) {
  return jwt.sign(
    {
      id: user.id || 7,
      username: user.username || 'reader',
      email: user.email || 'reader@example.com',
      role: user.role || 'user'
    },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

describe('novelController.downloadNovel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未登录时返回 401', async () => {
    const res = await request(createApp()).get('/api/novels/1/download');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 401, message: '请先登录' });
    expect(membershipService.isMember).not.toHaveBeenCalled();
    expect(novelService.buildNovelDownloadText).not.toHaveBeenCalled();
  });

  it('非 VIP 用户返回 403 且不生成 TXT', async () => {
    membershipService.isMember.mockResolvedValueOnce(false);

    const res = await request(createApp())
      .get('/api/novels/1/download')
      .set('Authorization', `Bearer ${signToken({ id: 9 })}`);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: 403, message: 'VIP会员才能下载整本书' });
    expect(membershipService.isMember).toHaveBeenCalledWith(9);
    expect(novelService.buildNovelDownloadText).not.toHaveBeenCalled();
  });

  it('VIP 用户返回 TXT 附件', async () => {
    membershipService.isMember.mockResolvedValueOnce(true);
    novelService.buildNovelDownloadText.mockResolvedValueOnce({
      filename: '春日来信.txt',
      text: '《春日来信》\n\n第1章 重逢\n她在雨声里回头。\n'
    });

    const res = await request(createApp())
      .get('/api/novels/1/download')
      .set('Authorization', `Bearer ${signToken({ id: 9 })}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain(encodeURIComponent('春日来信.txt'));
    expect(res.text).toContain('《春日来信》');
    expect(res.text).toContain('第1章 重逢');
    expect(membershipService.isMember).toHaveBeenCalledWith(9);
    expect(novelService.buildNovelDownloadText).toHaveBeenCalledWith('1');
  });

  it('小说不存在时返回 404', async () => {
    membershipService.isMember.mockResolvedValueOnce(true);
    novelService.buildNovelDownloadText.mockRejectedValueOnce(new Error('小说不存在'));

    const res = await request(createApp())
      .get('/api/novels/999/download')
      .set('Authorization', `Bearer ${signToken()}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ code: 404, message: '小说不存在' });
  });
});

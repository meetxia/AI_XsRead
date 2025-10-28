/**
 * 小说 API 集成测试
 */
const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/database');

describe('Novels API Integration Tests', () => {
  let authToken;
  let testNovelId;
  
  // 测试前准备
  beforeAll(async () => {
    // 这里可以设置测试数据库
    // 创建测试用户并获取 token（如果需要）
  });
  
  // 测试后清理
  afterAll(async () => {
    // 清理测试数据
    if (pool && pool.end) {
      await pool.end();
    }
  });
  
  describe('GET /api/novels', () => {
    it('应该返回小说列表', async () => {
      const response = await request(app)
        .get('/api/novels')
        .query({ page: 1, pageSize: 20 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('应该支持分类筛选', async () => {
      const response = await request(app)
        .get('/api/novels')
        .query({ categoryId: 1, page: 1, pageSize: 20 });
      
      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
    });
    
    it('应该支持排序', async () => {
      const response = await request(app)
        .get('/api/novels')
        .query({ 
          sortBy: 'views', 
          order: 'DESC',
          page: 1,
          pageSize: 20
        });
      
      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      
      // 验证排序
      const novels = response.body.data;
      if (novels.length > 1) {
        for (let i = 0; i < novels.length - 1; i++) {
          expect(novels[i].views).toBeGreaterThanOrEqual(novels[i + 1].views);
        }
      }
    });
  });
  
  describe('GET /api/novels/:id', () => {
    it('应该返回小说详情', async () => {
      const response = await request(app)
        .get('/api/novels/1');
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 200);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('title');
        expect(response.body.data).toHaveProperty('author');
      } else {
        // 如果小说不存在，应该返回 404
        expect(response.status).toBe(404);
      }
    });
    
    it('小说不存在时应该返回 404', async () => {
      const response = await request(app)
        .get('/api/novels/999999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('code');
    });
  });
  
  describe('GET /api/novels/recommend', () => {
    it('应该返回推荐小说列表', async () => {
      const response = await request(app)
        .get('/api/novels/recommend')
        .query({ limit: 10 });
      
      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });
  
  describe('GET /api/novels/:id/chapters', () => {
    it('应该返回小说的章节列表', async () => {
      const response = await request(app)
        .get('/api/novels/1/chapters')
        .query({ page: 1, pageSize: 50 });
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code', 200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });
  
  describe('GET /api/chapters/:id', () => {
    it('应该返回章节内容', async () => {
      const response = await request(app)
        .get('/api/chapters/1');
      
      if (response.status === 200) {
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('title');
        expect(response.body.data).toHaveProperty('content');
      }
    });
  });
  
  describe('GET /api/novels/search', () => {
    it('应该根据关键词搜索小说', async () => {
      const response = await request(app)
        .get('/api/novels/search')
        .query({ keyword: '测试', page: 1, pageSize: 20 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('code', 200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('没有关键词时应该返回错误', async () => {
      const response = await request(app)
        .get('/api/novels/search')
        .query({ page: 1, pageSize: 20 });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('code');
    });
  });
  
  describe('GET /api/categories', () => {
    it('应该返回分类列表', async () => {
      const response = await request(app)
        .get('/api/categories');
      
      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});


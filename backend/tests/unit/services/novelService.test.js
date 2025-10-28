/**
 * 小说服务单元测试
 */
const novelService = require('../../../src/services/novelService');
const { pool } = require('../../../src/config/database');

// Mock 数据库连接
jest.mock('../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('NovelService', () => {
  beforeEach(() => {
    // 清除所有 mock
    jest.clearAllMocks();
  });
  
  describe('getNovelList', () => {
    it('应该返回小说列表和分页信息', async () => {
      // 准备测试数据
      const mockNovels = [
        { id: 1, title: '测试小说1', author: '作者1' },
        { id: 2, title: '测试小说2', author: '作者2' }
      ];
      
      const mockCount = [{ total: 2 }];
      
      // 模拟数据库查询
      pool.query
        .mockResolvedValueOnce([mockCount]) // 第一次查询：总数
        .mockResolvedValueOnce([mockNovels]); // 第二次查询：列表
      
      // 执行测试
      const result = await novelService.getNovelList({
        page: 1,
        pageSize: 20
      });
      
      // 断言
      expect(result).toHaveProperty('list');
      expect(result).toHaveProperty('pagination');
      expect(result.list).toEqual(mockNovels);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(20);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
    
    it('应该支持分类筛选', async () => {
      const mockCount = [{ total: 1 }];
      const mockNovels = [
        { id: 1, title: '测试小说1', category_id: 1 }
      ];
      
      pool.query
        .mockResolvedValueOnce([mockCount])
        .mockResolvedValueOnce([mockNovels]);
      
      const result = await novelService.getNovelList({
        categoryId: 1,
        page: 1,
        pageSize: 20
      });
      
      expect(result.list).toEqual(mockNovels);
      // 验证查询参数包含 category_id
      const queryCall = pool.query.mock.calls[1];
      expect(queryCall[0]).toContain('category_id');
    });
    
    it('应该支持排序', async () => {
      const mockCount = [{ total: 2 }];
      const mockNovels = [
        { id: 2, title: '小说B', views: 200 },
        { id: 1, title: '小说A', views: 100 }
      ];
      
      pool.query
        .mockResolvedValueOnce([mockCount])
        .mockResolvedValueOnce([mockNovels]);
      
      await novelService.getNovelList({
        sortBy: 'views',
        order: 'DESC'
      });
      
      // 验证排序参数
      const queryCall = pool.query.mock.calls[1];
      expect(queryCall[0]).toContain('views DESC');
    });
  });
  
  describe('getNovelDetail', () => {
    it('应该返回小说详情', async () => {
      const mockNovel = {
        id: 1,
        title: '测试小说',
        author: '测试作者',
        category_name: '玄幻',
        chapter_count: 100
      };
      
      pool.query.mockResolvedValueOnce([[mockNovel]]);
      
      const result = await novelService.getNovelDetail(1);
      
      expect(result).toEqual(mockNovel);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
    
    it('小说不存在时应该抛出错误', async () => {
      pool.query.mockResolvedValueOnce([[]]);
      
      await expect(novelService.getNovelDetail(999))
        .rejects
        .toThrow('小说不存在');
    });
    
    it('应该返回用户与小说的关系（已登录）', async () => {
      const mockNovel = {
        id: 1,
        title: '测试小说'
      };
      
      pool.query
        .mockResolvedValueOnce([[mockNovel]]) // 小说信息
        .mockResolvedValueOnce([[{ id: 1 }]]) // 点赞记录
        .mockResolvedValueOnce([[{ id: 1 }]]) // 收藏记录
        .mockResolvedValueOnce([[{ chapter_id: 10, progress: 50 }]]); // 阅读进度
      
      const result = await novelService.getNovelDetail(1, 1);
      
      expect(result.isLiked).toBe(true);
      expect(result.isCollected).toBe(true);
      expect(result.readingProgress).toBeDefined();
      expect(result.readingProgress.chapter_id).toBe(10);
    });
  });
  
  describe('increaseViews', () => {
    it('应该增加小说浏览量', async () => {
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      
      await novelService.increaseViews(1);
      
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE novels SET views = views + 1 WHERE id = ?',
        [1]
      );
    });
  });
  
  describe('searchNovels', () => {
    it('应该根据关键词搜索小说', async () => {
      const mockCount = [{ total: 1 }];
      const mockNovels = [
        { id: 1, title: '测试小说', author: '测试' }
      ];
      
      pool.query
        .mockResolvedValueOnce([mockCount])
        .mockResolvedValueOnce([mockNovels]);
      
      const result = await novelService.searchNovels({
        keyword: '测试',
        page: 1,
        pageSize: 20
      });
      
      expect(result.list).toEqual(mockNovels);
      expect(result.pagination.total).toBe(1);
    });
    
    it('没有关键词时应该抛出错误', async () => {
      await expect(novelService.searchNovels({}))
        .rejects
        .toThrow('请输入搜索关键词');
    });
  });
  
  describe('getCategories', () => {
    it('应该返回分类列表', async () => {
      const mockCategories = [
        { id: 1, name: '玄幻', novel_count: 100 },
        { id: 2, name: '都市', novel_count: 80 }
      ];
      
      pool.query.mockResolvedValueOnce([mockCategories]);
      
      const result = await novelService.getCategories();
      
      expect(result).toEqual(mockCategories);
      expect(result.length).toBe(2);
    });
  });
  
  describe('getChapterList', () => {
    it('应该返回章节列表', async () => {
      const mockCount = [{ total: 100 }];
      const mockChapters = [
        { id: 1, chapter_number: 1, title: '第一章' },
        { id: 2, chapter_number: 2, title: '第二章' }
      ];
      
      pool.query
        .mockResolvedValueOnce([mockCount])
        .mockResolvedValueOnce([mockChapters]);
      
      const result = await novelService.getChapterList(1, {
        page: 1,
        pageSize: 50
      });
      
      expect(result.list).toEqual(mockChapters);
      expect(result.pagination.total).toBe(100);
    });
  });
  
  describe('getChapterContent', () => {
    it('应该返回章节内容', async () => {
      const mockChapter = {
        id: 1,
        novel_id: 1,
        chapter_number: 1,
        title: '第一章',
        content: '这是内容',
        is_free: true
      };
      
      pool.query.mockResolvedValueOnce([[mockChapter]]);
      
      const result = await novelService.getChapterContent(1);
      
      expect(result).toEqual(mockChapter);
    });
    
    it('章节不存在时应该抛出错误', async () => {
      pool.query.mockResolvedValueOnce([[]]);
      
      await expect(novelService.getChapterContent(999))
        .rejects
        .toThrow('章节不存在');
    });
  });
});


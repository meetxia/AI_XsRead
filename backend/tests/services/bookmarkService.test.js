const bookmarkService = require('../../src/services/bookmarkService');
const { pool } = require('../../src/config/database');
const schemaCompat = require('../../src/utils/schemaCompat');
const paragraphAnchor = require('../../src/utils/paragraphAnchor');

jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../../src/utils/schemaCompat', () => ({
  hasTable: jest.fn().mockResolvedValue(true),
  hasColumn: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../src/utils/paragraphAnchor', () => ({
  resolveParagraphAnchor: jest.fn().mockResolvedValue({ paragraphIndex: 2, status: 'exact' })
}));

describe('bookmarkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    schemaCompat.hasTable.mockResolvedValue(true);
    schemaCompat.hasColumn.mockResolvedValue(true);
    paragraphAnchor.resolveParagraphAnchor.mockResolvedValue({ paragraphIndex: 2, status: 'exact' });
  });

  test('creates a sanitized bookmark and returns anchor status', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 11 }]);

    const result = await bookmarkService.createBookmark(7, {
      novelId: 3,
      chapterId: 4,
      paragraphIndex: 2,
      paragraphHash: 'abc123',
      charOffset: 9,
      note: '<script>alert(1)</script>落点'
    });

    expect(result.id).toBe(11);
    expect(result.anchorStatus).toBe('exact');
    expect(pool.query.mock.calls[0][0]).toContain('INSERT INTO user_bookmarks');
    expect(pool.query.mock.calls[0][1][6]).toBe('落点');
  });

  test('lists bookmarks with chapter title and preview', async () => {
    const rows = [{
      id: 1,
      chapter_title: '第一章',
      paragraph_preview: '窗外雨声很轻',
      created_at: '2026-05-17'
    }];
    pool.query
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([rows]);

    const result = await bookmarkService.listByNovel(7, 3, { page: 1, pageSize: 10 });

    expect(result.list).toEqual(rows);
    expect(result.pagination.total).toBe(1);
  });
});

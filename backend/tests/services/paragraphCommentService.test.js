const paragraphCommentService = require('../../src/services/paragraphCommentService');
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
  resolveParagraphAnchor: jest.fn().mockResolvedValue({ paragraphIndex: 5, status: 'rehashed' })
}));

describe('paragraphCommentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    schemaCompat.hasTable.mockResolvedValue(true);
    schemaCompat.hasColumn.mockResolvedValue(true);
    paragraphAnchor.resolveParagraphAnchor.mockResolvedValue({ paragraphIndex: 5, status: 'rehashed' });
  });

  test('creates sanitized paragraph comment with resolved anchor', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 21 }]);

    const result = await paragraphCommentService.createComment(8, {
      novelId: 2,
      chapterId: 6,
      paragraphIndex: 3,
      paragraphHash: 'hash',
      content: '<img src=x onerror=alert(1)>这一段很动人'
    });

    expect(result.id).toBe(21);
    expect(result.paragraphIndex).toBe(5);
    expect(result.anchorStatus).toBe('rehashed');
    expect(pool.query.mock.calls[0][1][5]).toBe('这一段很动人');
  });

  test('soft deletes only the current user comment', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const result = await paragraphCommentService.removeComment(8, 21);

    expect(result.deleted).toBe(true);
    expect(pool.query.mock.calls[0][0]).toContain('deleted_at = NOW()');
    expect(pool.query.mock.calls[0][1]).toEqual([21, 8]);
  });
});

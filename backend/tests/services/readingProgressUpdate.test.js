/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 19.2 — userController.updateReadingProgress field passthrough
 *
 * Validates Requirements 4.3, 4.5, 31.2:
 *  - 缺失字段不更新对应列（UPDATE 中不包含 `paragraph_index = ?` / `char_offset = ?` / `paragraph_hash = ?`）；
 *  - 提供 paragraphHash 且 resolveParagraphAnchor 返回 status='exact' 时，
 *    响应 data 中包含 progressApplied: { paragraphIndex, status: 'exact' }。
 */

jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn() }
}));

jest.mock('../../src/utils/schemaCompat', () => ({
  hasColumn: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../src/services/unreadUpdateService', () => ({
  attachUnreadUpdate: jest.fn(),
  markChapterAsRead: jest.fn().mockResolvedValue()
}));

jest.mock('../../src/utils/paragraphAnchor', () => ({
  resolveParagraphAnchor: jest.fn()
}));

const { pool } = require('../../src/config/database');
const { resolveParagraphAnchor } = require('../../src/utils/paragraphAnchor');
const { hasColumn } = require('../../src/utils/schemaCompat');
const userController = require('../../src/controllers/userController');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function findUpdateCall(query) {
  // 匹配第一条 UPDATE reading_progress 语句
  return query.mock.calls.find(([sql]) =>
    typeof sql === 'string' && /^\s*UPDATE\s+reading_progress/i.test(sql)
  );
}

describe('userController.updateReadingProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jest.config.js sets resetMocks: true, which clears any default
    // mock implementation between tests — re-arm them here.
    hasColumn.mockResolvedValue(true);
    // 默认：existing 记录已存在 → 走 UPDATE 路径。
    // recentHistory 查询 → 空数组（无 5 分钟内记录）→ 走 INSERT reading_history。
    pool.query.mockImplementation((sql) => {
      const normalized = String(sql || '').replace(/\s+/g, ' ').trim();
      if (/^SELECT\s+id\s+FROM\s+reading_progress/i.test(normalized)) {
        return Promise.resolve([[{ id: 1 }]]);
      }
      if (/^SELECT\s+id\s+FROM\s+reading_history/i.test(normalized)) {
        return Promise.resolve([[]]);
      }
      // UPDATE / INSERT / bookshelf 都返回成功
      return Promise.resolve([{ affectedRows: 1 }]);
    });
  });

  test('omits paragraph_index column from UPDATE when paragraphIndex is missing', async () => {
    const req = {
      user: { id: 7 },
      body: {
        novelId: 3,
        chapterId: 4,
        progress: 12.5
        // paragraphIndex / charOffset / paragraphHash deliberately missing
      }
    };
    const res = createRes();

    await userController.updateReadingProgress(req, res);

    const updateCall = findUpdateCall(pool.query);
    expect(updateCall).toBeDefined();
    const [sql] = updateCall;
    expect(sql).toMatch(/^\s*UPDATE\s+reading_progress/i);
    expect(sql).not.toMatch(/paragraph_index\s*=\s*\?/);
    expect(sql).not.toMatch(/char_offset\s*=\s*\?/);
    expect(sql).not.toMatch(/paragraph_hash\s*=\s*\?/);
    // 缺失锚点字段时也不应调用 resolveParagraphAnchor
    expect(resolveParagraphAnchor).not.toHaveBeenCalled();
  });

  test('returns progressApplied.status="exact" when paragraphHash resolves exactly', async () => {
    resolveParagraphAnchor.mockResolvedValueOnce({
      paragraphIndex: 17,
      status: 'exact'
    });

    const req = {
      user: { id: 7 },
      body: {
        novelId: 3,
        chapterId: 4,
        paragraphIndex: 17,
        paragraphHash: '2aae6c35c94fcfb4',
        charOffset: 42,
        progress: 33.3,
        duration: 60
      }
    };
    const res = createRes();

    await userController.updateReadingProgress(req, res);

    expect(resolveParagraphAnchor).toHaveBeenCalledTimes(1);
    expect(resolveParagraphAnchor).toHaveBeenCalledWith(
      4,
      17,
      '2aae6c35c94fcfb4',
      pool
    );

    // 响应应包含 progressApplied
    expect(res.json).toHaveBeenCalled();
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody).toMatchObject({
      code: 200,
      data: expect.objectContaining({
        progressApplied: { paragraphIndex: 17, status: 'exact' }
      })
    });

    // 同时 UPDATE 应包含三个段落字段
    const updateCall = findUpdateCall(pool.query);
    const [sql, params] = updateCall;
    expect(sql).toMatch(/paragraph_index\s*=\s*\?/);
    expect(sql).toMatch(/char_offset\s*=\s*\?/);
    expect(sql).toMatch(/paragraph_hash\s*=\s*\?/);
    expect(params).toEqual(expect.arrayContaining([17, 42, '2aae6c35c94fcfb4']));
  });

  test('progressApplied is null when no anchor data is provided', async () => {
    const req = {
      user: { id: 7 },
      body: { novelId: 3, chapterId: 4, progress: 5 }
    };
    const res = createRes();

    await userController.updateReadingProgress(req, res);

    expect(resolveParagraphAnchor).not.toHaveBeenCalled();
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody.data.progressApplied).toBeNull();
  });
});

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a'.repeat(48);
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'b'.repeat(48);
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'root';
process.env.DB_NAME = process.env.DB_NAME || 'ai_xsread_test';

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));

const db = require('../src/config/database');
const NovelController = require('../src/controllers/novelController');

function makeConnection(insertIds = []) {
  let insertIndex = 0;
  return {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
    query: jest.fn(async (sql) => {
      if (/INSERT INTO novels/i.test(sql)) {
        const insertId = insertIds[insertIndex] || (800 + insertIndex);
        insertIndex += 1;
        return [{ insertId }];
      }
      if (/INSERT INTO chapters/i.test(sql)) return [{ affectedRows: 1 }];
      if (/INSERT INTO admin_logs/i.test(sql)) return [{ affectedRows: 1 }];
      return [[]];
    })
  };
}

function fileOf(originalname, text) {
  return {
    originalname,
    buffer: Buffer.from(text, 'utf8'),
    size: Buffer.byteLength(text),
    mimetype: 'text/plain'
  };
}

function longContent(seed = '她摘下戒指离开') {
  return Array.from({ length: 80 }, (_, i) => `${seed} 第${i + 1}段，她终于决定把自己的人生拿回来。`).join('\n\n');
}

describe('admin NovelController batch TXT upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('importAdminTxtNovelFile restores Chinese filename and writes novel plus chapter', async () => {
    const title = '他以为她只是闹脾气，直到她摘下戒指离开';
    const mojibakeName = Buffer.from(`${title}.txt`, 'utf8').toString('latin1');
    const connection = makeConnection([901]);

    db.query.mockResolvedValueOnce([[]]);
    db.getConnection.mockResolvedValueOnce(connection);

    const result = await NovelController.__test__.importAdminTxtNovelFile(
      fileOf(mojibakeName, longContent()),
      { id: 1, username: 'admin' },
      { seenTitles: new Set() }
    );

    expect(result.status).toBe('success');
    expect(result.filename).toBe(`${title}.txt`);
    expect(result.title).toBe(title);
    expect(result.novelId).toBe(901);
    expect(connection.commit).toHaveBeenCalledTimes(1);

    const novelInsert = connection.query.mock.calls.find(([sql]) => /INSERT INTO novels/i.test(sql));
    const chapterInsert = connection.query.mock.calls.find(([sql]) => /INSERT INTO chapters/i.test(sql));
    expect(novelInsert[1]).toEqual(expect.arrayContaining([title, expect.any(String), 1]));
    expect(chapterInsert[0]).toMatch(/chapter_number, title, content/);
    expect(chapterInsert[0]).toMatch(/VALUES \(\?, 1, '正文'/);
    expect(chapterInsert[1]).toEqual(expect.arrayContaining([901, expect.any(String), expect.any(Number)]));
  });

  test('importAdminTxtNovelFile assigns randomized views, collections and rating on upload', async () => {
    const connection = makeConnection([902]);
    db.query.mockResolvedValueOnce([[]]);
    db.getConnection.mockResolvedValueOnce(connection);

    const result = await NovelController.__test__.importAdminTxtNovelFile(
      fileOf('新书热度测试.txt', longContent('新书热度测试')),
      { id: 1, username: 'admin' },
      { seenTitles: new Set() }
    );

    expect(result.status).toBe('success');
    expect(result.views).toEqual(expect.any(Number));
    expect(result.collections).toEqual(expect.any(Number));
    expect(result.rating).toEqual(expect.any(Number));
    expect(result.views).toBeGreaterThanOrEqual(1000);
    expect(result.views).toBeLessThanOrEqual(50000);
    expect(result.collections).toBeGreaterThanOrEqual(50);
    expect(result.collections).toBeLessThanOrEqual(3000);
    expect(result.rating).toBeGreaterThanOrEqual(4.2);
    expect(result.rating).toBeLessThanOrEqual(4.9);

    const novelInsert = connection.query.mock.calls.find(([sql]) => /INSERT INTO novels/i.test(sql));
    expect(novelInsert[0]).toMatch(/views, likes, collections/);
    expect(novelInsert[0]).toMatch(/rating, rating_count/);
    expect(novelInsert[0]).not.toMatch(/1, 0, 0, 0, 0, 0, 0, 0, 0, '正文'/);
    expect(novelInsert[1]).toEqual(expect.arrayContaining([result.views, result.collections, result.rating]));
  });

  test('importAdminTxtNovelFile reports existing and same-batch duplicate without writing', async () => {
    const seenTitles = new Set(['春日来信']);

    const duplicate = await NovelController.__test__.importAdminTxtNovelFile(
      fileOf('春日来信.txt', longContent('春日来信')),
      { id: 1, username: 'admin' },
      { seenTitles }
    );

    expect(duplicate.status).toBe('failed');
    expect(duplicate.reason).toContain('同批次');
    expect(db.query).not.toHaveBeenCalled();

    db.query.mockResolvedValueOnce([[{ id: 88 }]]);
    const existing = await NovelController.__test__.importAdminTxtNovelFile(
      fileOf('旧书已存在.txt', longContent('旧书已存在')),
      { id: 1, username: 'admin' },
      { seenTitles: new Set() }
    );

    expect(existing).toMatchObject({
      status: 'exists',
      title: '旧书已存在',
      novelId: 88
    });
  });
});

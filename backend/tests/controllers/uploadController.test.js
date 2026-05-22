/**
 * uploadController 单元测试
 *
 * 覆盖 TXT 小说批量上传的核心导入行为：
 *   1. 单个合法 TXT 能入 novels + chapters
 *   2. 批量上传支持部分成功、数据库已存在、同批重复、校验失败
 *   3. 临时文件无论成功/失败都会清理
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    getConnection: jest.fn()
  }
}));

const { pool } = require('../../src/config/database');
const uploadController = require('../../src/controllers/uploadController');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeConnection(insertIds = []) {
  let insertIndex = 0;
  return {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
    query: jest.fn(async (sql) => {
      if (/INSERT INTO novels/i.test(sql)) {
        const insertId = insertIds[insertIndex] || (900 + insertIndex);
        insertIndex += 1;
        return [{ insertId }];
      }
      if (/INSERT INTO chapters/i.test(sql)) {
        return [{ affectedRows: 1 }];
      }
      return [[]];
    })
  };
}

function writeTmpTxt(dir, filename, body, diskName = filename) {
  const filePath = path.join(dir, diskName);
  fs.writeFileSync(filePath, body, 'utf8');
  return {
    originalname: filename,
    path: filePath
  };
}

function longContent(seed) {
  return Array.from({ length: 80 }, (_, i) => `${seed} 第${i + 1}段，她在雨声里重新选择自己的生活。`).join('\n\n');
}

describe('uploadController TXT import', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xsread-upload-'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('importTxtNovelFile 插入小说与正文章节并清理临时文件', async () => {
    const file = writeTmpTxt(tmpDir, '春日来信.txt', longContent('春日来信'));
    const connection = makeConnection([321]);

    pool.query.mockResolvedValueOnce([[]]);
    pool.getConnection.mockResolvedValueOnce(connection);

    const result = await uploadController.__test__.importTxtNovelFile(file, 7);

    expect(result.status).toBe('success');
    expect(result.novelId).toBe(321);
    expect(result.title).toBe('春日来信');
    expect(pool.query).toHaveBeenCalledWith('SELECT id FROM novels WHERE title = ?', ['春日来信']);
    expect(connection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(fs.existsSync(file.path)).toBe(false);

    const novelInsert = connection.query.mock.calls.find(([sql]) => /INSERT INTO novels/i.test(sql));
    const chapterInsert = connection.query.mock.calls.find(([sql]) => /INSERT INTO chapters/i.test(sql));
    expect(novelInsert[1]).toEqual(expect.arrayContaining(['春日来信', expect.any(String), 7]));
    expect(chapterInsert[1]).toEqual(expect.arrayContaining([321, 1, '正文']));
  });

  test('batchUploadTxtNovels 返回成功、已存在、同批重复、校验失败明细', async () => {
    const files = [
      writeTmpTxt(tmpDir, '春日来信.txt', longContent('春日来信')),
      writeTmpTxt(tmpDir, '旧书已存在.txt', longContent('旧书已存在')),
      writeTmpTxt(tmpDir, '春日来信.txt', longContent('春日来信'), 'duplicate-春日来信.txt'),
      writeTmpTxt(tmpDir, '短.txt', '太短')
    ];

    const connection = makeConnection([501]);
    pool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ id: 8 }]]);
    pool.getConnection.mockResolvedValueOnce(connection);

    const req = {
      user: { id: 7 },
      files
    };
    const res = makeRes();
    const next = jest.fn();

    await uploadController.batchUploadTxtNovels(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.code).toBe(200);
    expect(payload.data).toMatchObject({
      total: 4,
      successCount: 1,
      failedCount: 2,
      existsCount: 1
    });
    expect(payload.data.details.success[0]).toMatchObject({
      filename: '春日来信.txt',
      novelId: 501,
      title: '春日来信'
    });
    expect(payload.data.details.exists[0]).toMatchObject({
      filename: '旧书已存在.txt',
      title: '旧书已存在',
      novelId: 8
    });
    expect(payload.data.details.failed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filename: '春日来信.txt',
          reason: expect.stringContaining('同批次中已存在同名小说')
        }),
        expect.objectContaining({
          filename: '短.txt',
          reason: expect.stringContaining('标题太短')
        })
      ])
    );

    for (const file of files) {
      expect(fs.existsSync(file.path)).toBe(false);
    }
  });
});

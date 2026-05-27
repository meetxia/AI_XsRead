jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn() }
}));

jest.mock('../../src/utils/schemaCompat', () => ({
  hasColumn: jest.fn()
}));

jest.mock('../../src/services/unreadUpdateService', () => ({
  attachUnreadUpdate: jest.fn()
}));

jest.mock('../../src/utils/paragraphAnchor', () => ({
  resolveParagraphAnchor: jest.fn()
}));

const { pool } = require('../../src/config/database');
const userController = require('../../src/controllers/userController');

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('userController.getUserStatistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns reading durations as whole minutes and keeps second-level detail', async () => {
    pool.query
      .mockResolvedValueOnce([[{
        total_books: 1,
        reading_books: 1,
        finished_books: 0,
        collected_books: 0
      }]])
      .mockResolvedValueOnce([[{
        total_read_time: 125,
        today_read_time: 21,
        weekly_read_time: 125,
        monthly_read_time: 125
      }]])
      .mockResolvedValueOnce([[{
        id: 2,
        name: '都市言情',
        count: 1
      }]])
      .mockResolvedValueOnce([[{
        reading_streak: 1
      }]])
      .mockResolvedValueOnce([[{
        date: '2026-05-27',
        novels_read: 1,
        chapters_read: 1,
        read_time: 21
      }]])
      .mockResolvedValueOnce([[{
        total_chapters: 1,
        total_novels_read: 1
      }]])
      .mockResolvedValueOnce([[{
        joinDays: 0
      }]])
      .mockResolvedValueOnce([[{
        novel_id: 9,
        title: '春日来信',
        author: '佚名',
        cover: '/uploads/covers/9.jpg',
        last_read_time: '2026-05-27 12:00:00',
        read_time: 21,
        chapters_read: 1
      }]]);

    const req = { user: { id: 7 } };
    const res = createRes();

    await userController.getUserStatistics(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe(200);
    expect(body.data.readTime).toMatchObject({
      total: 2,
      today: 0,
      weekly: 2,
      monthly: 2,
      totalSeconds: 125,
      todaySeconds: 21,
      weeklySeconds: 125,
      monthlySeconds: 125
    });
    expect(body.data.readingTrend).toEqual([expect.objectContaining({
      readTime: 0,
      minutes: 0,
      readTimeSeconds: 21,
      novelsRead: 1,
      chaptersRead: 1
    })]);
    expect(body.data.weeklyBooks).toEqual([expect.objectContaining({
      novelId: 9,
      title: '春日来信',
      readTime: 0,
      readTimeSeconds: 21,
      chaptersRead: 1
    })]);
  });
});

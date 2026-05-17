const recommendationService = require('../../src/services/recommendationService');
const { pool } = require('../../src/config/database');

jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

describe('recommendationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    recommendationService.clearCache();
  });

  test('returns guest recommendations with strategy metadata', async () => {
    pool.query.mockResolvedValueOnce([[{
      id: 1,
      title: '雨巷来信',
      author: '青梅',
      rating: 4.8,
      views: 100
    }]]);

    const result = await recommendationService.recommend(null, { limit: 5 });

    expect(result.strategy).toBe('guest');
    expect(result.list).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });
});

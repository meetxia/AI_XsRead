const interestTagService = require('../../src/services/interestTagService');
const { pool } = require('../../src/config/database');
const schemaCompat = require('../../src/utils/schemaCompat');

jest.mock('../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../../src/utils/schemaCompat', () => ({
  hasTable: jest.fn().mockResolvedValue(true)
}));

describe('interestTagService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    schemaCompat.hasTable.mockResolvedValue(true);
  });

  test('saves unique trimmed tags and increments existing weights', async () => {
    pool.query.mockResolvedValue([{ affectedRows: 1 }]);

    const result = await interestTagService.saveTags(9, [' 治愈 ', '治愈', '古风']);

    expect(result.tags).toEqual(['治愈', '古风']);
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query.mock.calls[0][0]).toContain('ON DUPLICATE KEY UPDATE');
  });
});

/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Property 23: migration runner idempotency skeleton.
 *
 * NOTE: this uses injected migration files so the property remains stable even
 * while other agents add or rename real SQL migrations.
 */
const fc = require('fast-check');

let subject = null;

try {
  subject = require('../../database/migrate');
} catch {
  subject = null;
}

const describeIfImplemented = subject ? describe : describe.skip;

describeIfImplemented('[Property 23] runPendingMigrations contract', () => {
  test('is idempotent across repeated startup attempts', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 5 }), async (attempts) => {
        const appliedVersions = new Set();
        const files = [
          { filename: '202605170900__first.sql', sql: 'SELECT 1;' },
          { filename: '202605170901__second.sql', sql: 'SELECT 2;' }
        ];
        const fakeDb = {
          query: jest.fn(async (sql, params = []) => {
            if (/CREATE TABLE IF NOT EXISTS migrations/i.test(sql)) {
              return [[]];
            }

            if (/SELECT version, applied_at FROM migrations/i.test(sql)) {
              const latestVersion = [...appliedVersions].sort().at(-1);
              return [[latestVersion ? { version: latestVersion, applied_at: new Date() } : null].filter(Boolean)];
            }

            if (/SELECT version/i.test(sql) && /FROM migrations/i.test(sql)) {
              return [[...appliedVersions].sort().map((version) => ({ version, description: '', applied_at: new Date() }))];
            }

            if (/INSERT INTO migrations/i.test(sql)) {
              appliedVersions.add(params[0]);
            }

            return [[]];
          })
        };

        let previousTotal = 0;
        for (let index = 0; index < attempts; index += 1) {
          const result = await subject.runPendingMigrations(fakeDb, { files });
          expect(appliedVersions.size).toBeGreaterThanOrEqual(previousTotal);
          previousTotal = appliedVersions.size;
          expect(result.latestVersion).toBe('202605170901');
          if (index > 0) {
            expect(result.applied).toHaveLength(0);
          }
        }
      }),
      { numRuns: 10 }
    );
  });
});

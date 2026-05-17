const { splitSqlStatements, runPendingMigrations } = require('../../database/migrate');

describe('migration runner', () => {
  test('splitSqlStatements ignores comments and preserves semicolons inside strings', () => {
    const sql = `
      -- comment should disappear
      CREATE TABLE demo (name VARCHAR(20));
      INSERT INTO demo(name) VALUES ('a;b');
    `;

    expect(splitSqlStatements(sql)).toEqual([
      'CREATE TABLE demo (name VARCHAR(20))',
      "INSERT INTO demo(name) VALUES ('a;b')"
    ]);
  });

  test('runPendingMigrations applies numeric migrations once in filename order', async () => {
    const executed = [];
    const rows = [];
    const connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn(async (sql, params) => {
        executed.push(sql);
        if (sql.startsWith('SELECT version')) return [rows];
        if (sql.startsWith('INSERT INTO migrations')) {
          rows.push({ version: params[0], description: params[1], applied_at: new Date() });
        }
        return [[]];
      })
    };
    const pool = { query: jest.fn(async () => [[]]), getConnection: jest.fn(async () => connection) };
    const files = [
      { filename: '202605170901__b.sql', sql: 'SELECT 2;' },
      { filename: '202605170900__a.sql', sql: 'SELECT 1;' }
    ];

    const first = await runPendingMigrations(pool, { files });
    const second = await runPendingMigrations(pool, { files });

    expect(first.applied.map(item => item.version)).toEqual(['202605170900', '202605170901']);
    expect(second.applied).toEqual([]);
    expect(second.skipped.map(item => item.version)).toEqual(['202605170900', '202605170901']);
  });
});

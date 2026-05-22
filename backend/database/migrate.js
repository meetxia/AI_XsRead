const fs = require('fs');
const path = require('path');

const MIGRATION_DIR = path.join(__dirname, 'migrations');
const MIGRATION_PATTERN = /^(\d{12})__(.+)\.sql$/;
const BENIGN_IDEMPOTENCY_ERRORS = new Set([
  'ER_DUP_FIELDNAME',
  'ER_DUP_KEYNAME',
  'ER_TABLE_EXISTS_ERROR'
]);

class MigrationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MigrationError';
    this.details = details;
    this.cause = details.cause;
  }
}

function splitSqlStatements(sql = '') {
  const statements = [];
  let current = '';
  let quote = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];
    const prev = sql[i - 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        current += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (!quote && char === '-' && next === '-' && (!prev || /\s/.test(prev)) && /\s/.test(sql[i + 2] || '')) {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (!quote && char === '#') {
      inLineComment = true;
      continue;
    }

    if (!quote && char === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    current += char;

    if ((char === '\'' || char === '"' || char === '`') && prev !== '\\') {
      quote = quote === char ? null : quote || char;
      continue;
    }

    if (!quote && char === ';') {
      const statement = current.slice(0, -1).trim();
      if (statement) statements.push(statement);
      current = '';
    }
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATION_DIR)) {
    return [];
  }

  return fs.readdirSync(MIGRATION_DIR)
    .filter(filename => MIGRATION_PATTERN.test(filename))
    .sort()
    .map(filename => ({
      filename,
      sql: fs.readFileSync(path.join(MIGRATION_DIR, filename), 'utf8')
    }));
}

function parseMigrationFile(file) {
  const match = file.filename.match(MIGRATION_PATTERN);
  if (!match) {
    return null;
  }

  return {
    version: match[1],
    description: match[2].replace(/_/g, ' '),
    filename: file.filename,
    sql: file.sql
  };
}

async function ensureMigrationsTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      version VARCHAR(20) PRIMARY KEY,
      description VARCHAR(255) NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function loadAppliedMigrations(db) {
  const [rows] = await db.query('SELECT version FROM migrations ORDER BY version ASC');
  return rows || [];
}

async function executeStatement(db, statement, migration) {
  try {
    await db.query(statement);
  } catch (error) {
    if (BENIGN_IDEMPOTENCY_ERRORS.has(error.code)) {
      console.warn(`[migration] Ignoring idempotent ${error.code} in ${migration.filename}: ${error.message}`);
      return;
    }
    throw error;
  }
}

async function withMigrationConnection(pool, fn) {
  if (!pool.getConnection) {
    return fn(pool);
  }

  const connection = await pool.getConnection();
  try {
    return await fn(connection);
  } finally {
    if (connection.release) {
      connection.release();
    }
  }
}

async function runSingleMigration(connection, migration) {
  const useTransaction = typeof connection.beginTransaction === 'function';

  try {
    if (useTransaction) {
      await connection.beginTransaction();
    }

    const statements = splitSqlStatements(migration.sql);
    for (const statement of statements) {
      await executeStatement(connection, statement, migration);
    }

    await connection.query(
      'INSERT INTO migrations (version, description, applied_at) VALUES (?, ?, NOW())',
      [migration.version, migration.description]
    );

    if (useTransaction) {
      await connection.commit();
    }
  } catch (error) {
    if (useTransaction && typeof connection.rollback === 'function') {
      await connection.rollback();
    }
    throw new MigrationError(`Migration ${migration.filename} failed`, {
      migration,
      cause: error
    });
  }
}

async function runPendingMigrations(pool, options = {}) {
  const rawFiles = options.files || listMigrationFiles();
  const migrations = rawFiles
    .map(parseMigrationFile)
    .filter(Boolean)
    .sort((a, b) => a.filename.localeCompare(b.filename));

  return withMigrationConnection(pool, async (connection) => {
    await ensureMigrationsTable(connection);
    const alreadyApplied = await loadAppliedMigrations(connection);
    const appliedVersions = new Set(alreadyApplied.map(row => String(row.version)));
    const applied = [];
    const skipped = [];

    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        skipped.push(migration);
        continue;
      }

      await runSingleMigration(connection, migration);

      appliedVersions.add(migration.version);
      applied.push(migration);
    }

    const latestVersion = migrations.length > 0
      ? migrations[migrations.length - 1].version
      : null;

    const [latestRows] = await connection.query(
      'SELECT version, applied_at FROM migrations ORDER BY version DESC LIMIT 1'
    );
    const lastAppliedAt = latestRows?.[0]?.applied_at || null;

    return {
      applied,
      skipped,
      latestVersion,
      total: appliedVersions.size,
      lastAppliedAt
    };
  });
}

module.exports = {
  MIGRATION_PATTERN,
  MigrationError,
  runPendingMigrations,
  splitSqlStatements
};

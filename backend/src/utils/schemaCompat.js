const { pool } = require('../config/database');

const tableCache = new Map();
const columnCache = new Map();

async function hasTable(tableName) {
  if (tableCache.has(tableName)) {
    return tableCache.get(tableName);
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  const exists = Number(rows[0]?.total || 0) > 0;
  tableCache.set(tableName, exists);
  return exists;
}

async function hasColumn(tableName, columnName) {
  const key = `${tableName}.${columnName}`;
  if (columnCache.has(key)) {
    return columnCache.get(key);
  }

  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  const exists = Number(rows[0]?.total || 0) > 0;
  columnCache.set(key, exists);
  return exists;
}

function clearSchemaCompatCache() {
  tableCache.clear();
  columnCache.clear();
}

module.exports = {
  hasTable,
  hasColumn,
  clearSchemaCompatCache
};

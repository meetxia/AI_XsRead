const { pool } = require('../../src/config/database');

async function withTransactionalTestDb(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    return await callback(connection);
  } finally {
    await connection.rollback();
    connection.release();
  }
}

module.exports = withTransactionalTestDb;

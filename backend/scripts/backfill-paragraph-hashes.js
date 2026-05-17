const { pool } = require('../src/config/database');
const { recomputeAllParagraphHashes } = require('../src/services/chapterService');

async function main() {
  try {
    const result = await recomputeAllParagraphHashes();
    console.log(`paragraph_hashes backfill complete: ${result.updated} chapters updated`);
  } catch (error) {
    console.error('paragraph_hashes backfill failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = main;

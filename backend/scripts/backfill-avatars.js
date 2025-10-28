/*
  批量为用户分配随机头像
  使用方法（Windows PowerShell）：
  仅回填缺失头像：
    node backend/scripts/backfill-avatars.js
  强制覆盖所有用户头像：
    node backend/scripts/backfill-avatars.js --force
    node backend/scripts/backfill-avatars.js -f
    node backend/scripts/backfill-avatars.js --all
*/

const { pool } = require('../src/config/database');
const { getRandomAvatarUrl } = require('../src/utils/avatar');

async function backfill() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f') || args.includes('--all');

  console.log(`开始回填用户头像... 模式: ${force ? '强制覆盖' : '仅缺失回填'}`);
  const [rows] = await pool.query('SELECT id, avatar FROM users');

  let updated = 0;
  for (const user of rows) {
    if (force || !user.avatar) {
      const fakeReq = {
        protocol: 'http',
        get: () => `localhost:${process.env.PORT || 8005}`,
      };
      const url = getRandomAvatarUrl(fakeReq);
      if (url) {
        await pool.query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [url, user.id]);
        updated++;
      }
    }
  }

  console.log(`回填完成，更新 ${updated} 个用户。`);
  process.exit(0);
}

backfill().catch(err => {
  console.error('回填失败:', err);
  process.exit(1);
});



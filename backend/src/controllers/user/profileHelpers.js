function buildProfileUpdate(body = {}) {
  const { nickname, bio, gender, birthday } = body;
  const updates = [];
  const values = [];

  if (nickname !== undefined) {
    updates.push('nickname = ?');
    values.push(nickname);
  }

  if (bio !== undefined) {
    updates.push('bio = ?');
    values.push(bio);
  }

  if (gender !== undefined) {
    const parsedGender = Number.parseInt(gender, 10);
    if (![0, 1, 2].includes(parsedGender)) {
      return { error: '性别值无效' };
    }
    updates.push('gender = ?');
    values.push(parsedGender);
  }

  if (birthday !== undefined) {
    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return { error: '生日格式无效，应为 YYYY-MM-DD' };
    }
    updates.push('birthday = ?');
    values.push(birthday || null);
  }

  if (updates.length === 0) {
    return { error: '没有需要更新的字段' };
  }

  return { updates, values };
}

function formatProfileStats(stats = {}) {
  return {
    totalBooks: stats.total_books || 0,
    totalLikes: stats.total_likes || 0,
    totalCollections: stats.total_collections || 0,
    totalComments: stats.total_comments || 0
  };
}

module.exports = {
  buildProfileUpdate,
  formatProfileStats
};

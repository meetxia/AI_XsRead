const ALLOWED_SHELF_TYPES = ['reading', 'finished', 'collected', 'wishlist'];

const BOOKSHELF_SORT_FIELDS = {
  recent_read: 'b.last_read_time',
  recent_update: 'n.updated_at',
  added_at: 'b.added_time',
  title: 'n.title'
};

function normalizeBookshelfQuery(query = {}) {
  const { page = 1, pageSize = 20 } = query;
  const requestedType = typeof query.type === 'string' ? query.type.trim() : '';
  const requestedSortBy = typeof query.sortBy === 'string' ? query.sortBy.trim() : '';

  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const sizeNum = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 20));

  return {
    filterType: ALLOWED_SHELF_TYPES.includes(requestedType) ? requestedType : null,
    sortField: BOOKSHELF_SORT_FIELDS[requestedSortBy] || BOOKSHELF_SORT_FIELDS.recent_read,
    sortDirection: requestedSortBy === 'title' ? 'ASC' : 'DESC',
    pageNum,
    sizeNum,
    offset: (pageNum - 1) * sizeNum
  };
}

function buildBookshelfWhere(userId, filterType) {
  const whereClauses = ['b.user_id = ?'];
  const whereParams = [userId];

  if (filterType) {
    whereClauses.push('b.type = ?');
    whereParams.push(filterType);
  } else {
    whereClauses.push("(b.type IS NULL OR b.type <> 'wishlist')");
  }

  return {
    whereSql: whereClauses.join(' AND '),
    whereParams
  };
}

function buildBookshelfOrder({ hasIsTop, sortField, sortDirection }) {
  const orderClauses = [];
  if (hasIsTop) {
    orderClauses.push('COALESCE(b.is_top, 0) DESC');
  }
  orderClauses.push(`${sortField} ${sortDirection}`);
  orderClauses.push('b.updated_at DESC');
  return orderClauses.join(', ');
}

function buildBookshelfExtraSelect({ hasIsTop, hasGroupName, hasLastSeen }) {
  return [
    hasIsTop ? 'b.is_top' : 'NULL AS is_top',
    hasGroupName ? 'b.group_name' : 'NULL AS group_name',
    hasLastSeen ? 'b.last_seen_chapter_id' : 'NULL AS last_seen_chapter_id'
  ].join(', ');
}

function createBookshelfTotals(rows = []) {
  const totals = { reading: 0, finished: 0, collected: 0, wishlist: 0 };
  for (const row of rows) {
    const key = row.type && Object.prototype.hasOwnProperty.call(totals, row.type)
      ? row.type
      : null;
    if (key) {
      totals[key] = Number(row.cnt || 0);
    }
  }
  return totals;
}

function sanitizeBookshelfIds(ids) {
  return ids
    .map(id => Number.parseInt(id, 10))
    .filter(id => Number.isInteger(id) && id > 0);
}

function normalizeGroupName(groupName) {
  return typeof groupName === 'string' ? groupName.trim().slice(0, 50) : '';
}

module.exports = {
  ALLOWED_SHELF_TYPES,
  buildBookshelfExtraSelect,
  buildBookshelfOrder,
  buildBookshelfWhere,
  createBookshelfTotals,
  normalizeBookshelfQuery,
  normalizeGroupName,
  sanitizeBookshelfIds
};

const LIST_SORT_FIELDS = {
  updated_at: 'n.updated_at',
  last_update_time: 'n.last_update_time',
  word_count: 'n.word_count',
  views: 'n.views',
  rating: 'n.rating',
  likes: 'n.likes',
  default: 'n.updated_at'
};

const SEARCH_SORT_FIELDS = {
  updated_at: 'n.updated_at',
  word_count: 'n.word_count',
  views: 'n.views',
  rating: 'n.rating',
  default: 'n.views'
};

function normalizeTagList(tags) {
  return typeof tags === 'string'
    ? tags.split(',').map(tag => tag.trim()).filter(Boolean)
    : [];
}

function appendCommonNovelFilters(whereParts, params, options = {}) {
  const {
    categoryId,
    wordCountMin,
    wordCountMax,
    ratingMin,
    hasFinished,
    tags,
    exclude
  } = options;

  if (categoryId) {
    whereParts.push('n.category_id = ?');
    params.push(categoryId);
  }

  if (wordCountMin) {
    whereParts.push('n.word_count >= ?');
    params.push(Number.parseInt(wordCountMin, 10));
  }

  if (wordCountMax) {
    whereParts.push('n.word_count <= ?');
    params.push(Number.parseInt(wordCountMax, 10));
  }

  if (ratingMin) {
    whereParts.push('n.rating >= ?');
    params.push(Number(ratingMin));
  }

  if (hasFinished !== undefined) {
    whereParts.push(
      hasFinished === 'true' || hasFinished === true
        ? 'n.status = 0'
        : 'n.status <> 0'
    );
  }

  if (exclude) {
    whereParts.push('n.id <> ?');
    params.push(Number.parseInt(exclude, 10));
  }

  const tagList = normalizeTagList(tags);
  if (tagList.length > 0) {
    whereParts.push(`EXISTS (
        SELECT 1 FROM novel_tags nt
        JOIN tags t ON t.id = nt.tag_id
        WHERE nt.novel_id = n.id AND t.name IN (${tagList.map(() => '?').join(',')})
      )`);
    params.push(...tagList);
  }
}

function toWhereClause(whereParts) {
  return whereParts.length > 0
    ? `WHERE ${whereParts.join(' AND ')}`
    : 'WHERE 1=1';
}

function resolveSort(sortMap, sortBy, order) {
  return {
    safeSort: sortMap[sortBy] || sortMap.default,
    safeOrder: String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
  };
}

function buildNovelListQuery(options = {}) {
  const { status, sortBy = 'updated_at', order = 'DESC' } = options;
  const whereParts = [];
  const params = [];

  appendCommonNovelFilters(whereParts, params, options);

  if (status) {
    if (status === 'finished') {
      whereParts.push('n.status = 0');
    } else {
      whereParts.push('n.status = ?');
      params.push(status);
    }
  }

  const { safeSort, safeOrder } = resolveSort(LIST_SORT_FIELDS, sortBy, order);

  return {
    whereClause: toWhereClause(whereParts),
    params,
    safeSort,
    safeOrder
  };
}

function buildNovelSearchQuery(options = {}) {
  const { keyword, sortBy = 'views', order = 'DESC' } = options;
  const searchTerm = `%${keyword}%`;
  const whereParts = ['(n.title LIKE ? OR n.author LIKE ? OR n.description LIKE ?)'];
  const params = [searchTerm, searchTerm, searchTerm];

  appendCommonNovelFilters(whereParts, params, options);

  const { safeSort, safeOrder } = resolveSort(SEARCH_SORT_FIELDS, sortBy, order);

  return {
    whereClause: toWhereClause(whereParts),
    params,
    safeSort,
    safeOrder
  };
}

module.exports = {
  buildNovelListQuery,
  buildNovelSearchQuery,
  normalizeTagList,
  resolveSort
};

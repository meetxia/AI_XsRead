const defaultStore = new Map();

function normalizeContent(body = {}) {
  const raw = body.content ?? body.note ?? body.text ?? body.comment ?? '';
  return String(raw).trim().replace(/\s+/g, ' ').toLowerCase();
}

function cleanup(bucket, now, windowMs) {
  while (bucket.length > 0 && now - bucket[0] >= windowMs) {
    bucket.shift();
  }
}

function createWriteRateLimiter(options = {}) {
  const {
    windowMs = 60_000,
    maxWrites = 30,
    maxDuplicateWrites = 3,
    store = defaultStore,
    now = () => Date.now()
  } = options;

  return async function writeRateLimiter(req, res, next) {
    const userId = req.user?.id || req.ip || 'anonymous';
    const routeKey = req.baseUrl && req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.originalUrl || req.path || 'unknown';
    const currentTime = now();
    const routeBucketKey = `route:${userId}:${routeKey}`;
    const routeBucket = store.get(routeBucketKey) || [];

    cleanup(routeBucket, currentTime, windowMs);
    if (routeBucket.length >= maxWrites) {
      return res.status(429).json({
        code: 'RATE_LIMITED',
        message: '操作过于频繁，请稍后再试',
        timestamp: Date.now()
      });
    }

    const normalizedContent = normalizeContent(req.body);
    let duplicateBucket = null;
    let duplicateBucketKey = null;
    if (normalizedContent) {
      duplicateBucketKey = `content:${userId}:${routeKey}:${normalizedContent}`;
      duplicateBucket = store.get(duplicateBucketKey) || [];
      cleanup(duplicateBucket, currentTime, windowMs);

      if (duplicateBucket.length >= maxDuplicateWrites) {
        return res.status(429).json({
          code: 'RATE_LIMITED',
          message: '相同内容提交过于频繁，请稍后再试',
          timestamp: Date.now()
        });
      }
    }

    routeBucket.push(currentTime);
    store.set(routeBucketKey, routeBucket);

    if (duplicateBucket) {
      duplicateBucket.push(currentTime);
      store.set(duplicateBucketKey, duplicateBucket);
    }

    return next();
  };
}

module.exports = createWriteRateLimiter();
module.exports.createWriteRateLimiter = createWriteRateLimiter;
module.exports._store = defaultStore;

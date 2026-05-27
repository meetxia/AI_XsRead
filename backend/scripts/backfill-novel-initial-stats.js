/**
 * Backfill missing initial novel stats.
 *
 * Local usage:
 *   node scripts/backfill-novel-initial-stats.js --target local --dry-run
 *   node scripts/backfill-novel-initial-stats.js --target local
 *
 * Production API usage:
 *   node scripts/backfill-novel-initial-stats.js --target production --dry-run
 *   node scripts/backfill-novel-initial-stats.js --target production --confirm-production
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

const repoRoot = path.resolve(__dirname, '..', '..');
const backendEnvPath = path.join(repoRoot, 'backend', '.env');
const env = fs.existsSync(backendEnvPath) ? dotenv.parse(fs.readFileSync(backendEnvPath)) : {};

for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) process.env[key] = value;
}

const DEFAULTS = {
  viewsMin: 3200,
  viewsMax: 88000,
  collectionsMin: 120,
  collectionsMax: 4200,
  ratingMin: 4.2,
  ratingMax: 4.9
};

function parseArgs(argv) {
  const args = {
    target: 'local',
    dryRun: false,
    confirmProduction: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target') args.target = argv[++index] || args.target;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--confirm-production') args.confirmProduction = true;
    else if (arg === '--admin-base-url') args.adminBaseUrl = argv[++index];
    else if (arg === '--admin-token') args.adminToken = argv[++index];
    else if (arg === '--user-base-url') args.userBaseUrl = argv[++index];
  }

  args.adminBaseUrl = stripTrailingSlash(
    args.adminBaseUrl || process.env.XSREAD_ADMIN_BASE_URL || ''
  );
  args.userBaseUrl = stripTrailingSlash(
    args.userBaseUrl || process.env.XSREAD_USER_BASE_URL || 'https://xs.momofx.cn'
  );
  args.adminUsername = process.env.XSREAD_ADMIN_USERNAME || '';
  args.adminPassword = process.env.XSREAD_ADMIN_PASSWORD || '';
  args.adminToken = args.adminToken || process.env.XSREAD_ADMIN_TOKEN || '';

  return args;
}

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isMissingCount(value) {
  return value === null || value === undefined || toNumber(value) <= 0;
}

function isMissingRating(value) {
  return value === null || value === undefined || toNumber(value) <= 0;
}

function randomInteger(min, max) {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

function randomRating(min, max) {
  const value = Math.random() * (max - min) + min;
  return Number(Math.min(5, Math.max(0, value)).toFixed(1));
}

function clampInteger(value, min, max) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function makeStats(row) {
  const currentViews = toNumber(row.views);
  const currentLikes = toNumber(row.likes);
  const currentCollections = toNumber(row.collections);
  const currentRating = toNumber(row.rating);
  const currentRatingCount = toNumber(row.rating_count);

  const views = isMissingCount(row.views)
    ? randomInteger(DEFAULTS.viewsMin, DEFAULTS.viewsMax)
    : currentViews;

  const collections = isMissingCount(row.collections)
    ? randomInteger(DEFAULTS.collectionsMin, Math.min(DEFAULTS.collectionsMax, Math.max(220, Math.floor(views * 0.09))))
    : currentCollections;

  const likes = isMissingCount(row.likes)
    ? clampInteger(views * (0.055 + Math.random() * 0.07), 80, Math.max(100, Math.floor(views * 0.16)))
    : currentLikes;

  const rating = isMissingRating(row.rating)
    ? randomRating(DEFAULTS.ratingMin, DEFAULTS.ratingMax)
    : Number(currentRating.toFixed(1));

  const ratingCount = isMissingCount(row.rating_count)
    ? randomInteger(35, Math.max(60, Math.min(980, Math.floor(collections * (0.18 + Math.random() * 0.22)))))
    : currentRatingCount;

  const hotScore = Math.round(views * 0.4 + likes * 3 + collections * 10 + rating * 100 + ratingCount * 2);

  return {
    views,
    likes,
    collections,
    rating,
    rating_count: ratingCount,
    hot_score: hotScore,
    is_hot: views >= 50000 || collections >= 1800 ? 1 : toNumber(row.is_hot),
    is_recommended: rating >= 4.7 && collections >= 1000 ? 1 : toNumber(row.is_recommended)
  };
}

function needsBackfill(row) {
  return (
    isMissingCount(row.views) ||
    isMissingCount(row.likes) ||
    isMissingCount(row.collections) ||
    isMissingRating(row.rating) ||
    isMissingCount(row.rating_count)
  );
}

function summarizeChange(row, stats) {
  const changes = [];
  for (const key of ['views', 'likes', 'collections', 'rating', 'rating_count']) {
    if (isMissingCount(row[key]) || (key === 'rating' && isMissingRating(row[key]))) {
      changes.push(`${key}:${row[key] ?? 'NULL'}->${stats[key]}`);
    }
  }
  return changes.join(', ');
}

async function createLocalPool() {
  const database = process.env.DB_DATABASE || process.env.DB_NAME;
  if (!process.env.DB_HOST || !process.env.DB_USER || !database) {
    throw new Error('Missing DB_HOST, DB_USER, or DB_DATABASE/DB_NAME in backend/.env');
  }

  return mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });
}

async function queryLocalNovels(pool) {
  const [rows] = await pool.query(
    `SELECT id, title, views, likes, collections, rating, rating_count,
            is_hot, is_recommended, hot_score
       FROM novels
      ORDER BY id ASC`
  );
  return rows;
}

async function backfillLocal(args) {
  const pool = await createLocalPool();
  try {
    const rows = await queryLocalNovels(pool);
    const targets = rows.filter(needsBackfill).map((row) => ({ row, stats: makeStats(row) }));

    console.log(`Local novels checked: ${rows.length}`);
    console.log(`Local novels needing backfill: ${targets.length}`);

    for (const item of targets) {
      console.log(`  #${item.row.id} ${item.row.title} | ${summarizeChange(item.row, item.stats)}`);
    }

    if (args.dryRun || targets.length === 0) {
      console.log(args.dryRun ? 'Dry-run only, no local rows updated.' : 'No local rows need updates.');
      return { checked: rows.length, updated: 0, targets };
    }

    let updated = 0;
    for (const { row, stats } of targets) {
      const [result] = await pool.execute(
        `UPDATE novels
            SET views = ?,
                likes = ?,
                collections = ?,
                rating = ?,
                rating_count = ?,
                hot_score = ?,
                is_hot = ?,
                is_recommended = ?,
                updated_at = NOW()
          WHERE id = ?`,
        [
          stats.views,
          stats.likes,
          stats.collections,
          stats.rating,
          stats.rating_count,
          stats.hot_score,
          stats.is_hot,
          stats.is_recommended,
          row.id
        ]
      );
      updated += result.affectedRows;
    }

    console.log(`Local rows updated: ${updated}`);
    return { checked: rows.length, updated, targets };
  } finally {
    await pool.end();
  }
}

function authHeaders(token, extra = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

async function fetchApiJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response ${res.status}: ${text.slice(0, 160)}`);
  }
  if (!res.ok || json.code === 400 || json.code === 401 || json.code === 403 || json.code === 404 || json.code >= 500) {
    throw new Error(`Bad response ${res.status}: ${json.message || text.slice(0, 160)}`);
  }
  return json;
}

async function loginAdmin(args) {
  if (!args.adminBaseUrl) {
    throw new Error('Production target requires XSREAD_ADMIN_BASE_URL or --admin-base-url');
  }
  if (args.adminToken) return args.adminToken;
  if (!args.adminUsername || !args.adminPassword) {
    throw new Error('Production target requires XSREAD_ADMIN_TOKEN or XSREAD_ADMIN_USERNAME/XSREAD_ADMIN_PASSWORD');
  }
  const json = await fetchApiJson(`${args.adminBaseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: args.adminUsername, password: args.adminPassword })
  });
  const token = json.data && json.data.accessToken;
  if (!token) throw new Error('Admin login did not return an accessToken');
  return token;
}

async function queryProductionNovels(args, token) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const json = await fetchApiJson(`${args.adminBaseUrl}/api/admin/novels?page=${page}&pageSize=200&sort=created_at`, {
      headers: authHeaders(token)
    });
    const data = json.data || {};
    const list = Array.isArray(data.list) ? data.list : [];
    all.push(...list);
    totalPages = Number(data.totalPages || 1);
    page += 1;
  } while (page <= totalPages);
  return all.sort((a, b) => Number(a.id) - Number(b.id));
}

async function backfillProduction(args) {
  if (!args.dryRun && !args.confirmProduction) {
    throw new Error('Production writes require --confirm-production');
  }

  const token = await loginAdmin(args);
  const rows = await queryProductionNovels(args, token);
  const targets = rows.filter(needsBackfill).map((row) => ({ row, stats: makeStats(row) }));

  console.log(`Production novels checked: ${rows.length}`);
  console.log(`Production novels needing public-stat backfill: ${targets.length}`);

  for (const item of targets) {
    console.log(`  #${item.row.id} ${item.row.title} | ${summarizeChange(item.row, item.stats)}`);
  }

  if (args.dryRun || targets.length === 0) {
    console.log(args.dryRun ? 'Dry-run only, no production rows updated.' : 'No production rows need updates.');
    return { checked: rows.length, updated: 0, targets };
  }

  let updated = 0;
  for (const { row, stats } of targets) {
    await fetchApiJson(`${args.adminBaseUrl}/api/admin/novels/${row.id}`, {
      method: 'PUT',
      headers: authHeaders(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        views: stats.views,
        likes: stats.likes,
        collections: stats.collections,
        rating: stats.rating,
        rating_count: stats.rating_count
      })
    });
    updated += 1;
  }

  console.log(`Production rows updated through admin API: ${updated}`);
  return { checked: rows.length, updated, targets };
}

async function verifyUserApi(args) {
  if (!args.userBaseUrl) return;
  const json = await fetchApiJson(`${args.userBaseUrl}/api/novels?page=1&pageSize=12&sortBy=views`);
  const list = Array.isArray(json.data && json.data.list) ? json.data.list : [];
  const missing = list.filter((item) => (
    isMissingCount(item.views) ||
    isMissingCount(item.collections) ||
    isMissingRating(item.rating)
  ));
  console.log(`User API top novels checked: ${list.length}`);
  console.log(`User API top novels still missing visible stats: ${missing.length}`);
  for (const item of missing.slice(0, 10)) {
    console.log(`  #${item.id} ${item.title} | views=${item.views} collections=${item.collections} rating=${item.rating}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.target === 'production') {
    await backfillProduction(args);
    await verifyUserApi(args);
    return;
  }
  if (args.target !== 'local') {
    throw new Error(`Unsupported target: ${args.target}`);
  }
  await backfillLocal(args);
}

main().catch((error) => {
  console.error(`Backfill failed: ${error.message}`);
  process.exit(1);
});

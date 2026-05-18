const { pool } = require('../config/database');

const SITE_URL = 'https://xs.momofx.cn';
const MAX_DYNAMIC_URLS = 1000;
const QUERY_TIMEOUT_MS = 1500;

const BLOCKED_PATHS = [
  '/api/',
  '/admin',
  '/uploads/private/',
  '/login',
  '/register',
  '/security',
  '/profile',
  '/bookshelf',
  '/history',
  '/membership',
  '/upload',
  '/search',
  '/read/',
  '/reading/',
  '/onboarding/'
];

const STATIC_URLS = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/recommend', changefreq: 'daily', priority: '0.9' },
  { loc: '/recommend?tab=hot', changefreq: 'daily', priority: '0.8' },
  { loc: '/recommend?tab=new', changefreq: 'daily', priority: '0.8' },
  { loc: '/recommend?tab=finished', changefreq: 'weekly', priority: '0.7' },
  { loc: '/recommend?tab=editor', changefreq: 'weekly', priority: '0.7' }
];

const FALLBACK_CATEGORIES = [
  { id: 101, updated_at: null },
  { id: 102, updated_at: null },
  { id: 103, updated_at: null },
  { id: 104, updated_at: null },
  { id: 105, updated_at: null },
  { id: 106, updated_at: null }
];

function absoluteUrl(path) {
  if (path === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${path}`;
}

function formatDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function uniqueByLoc(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.loc || seen.has(item.loc)) return false;
    seen.add(item.loc);
    return true;
  });
}

function queryWithTimeout(promise, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${QUERY_TIMEOUT_MS}ms`));
    }, QUERY_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function fetchSitemapNovels(limit = MAX_DYNAMIC_URLS) {
  const [rows] = await queryWithTimeout(pool.query(
    `SELECT id, COALESCE(last_update_time, updated_at, published_at, created_at) AS lastmod
     FROM novels
     WHERE id IS NOT NULL AND status IN (0, 1)
     ORDER BY COALESCE(last_update_time, updated_at, published_at, created_at) DESC
     LIMIT ?`,
    [limit]
  ), 'novels sitemap query');

  return rows.map((row) => ({
    loc: `/novel/${row.id}`,
    lastmod: formatDate(row.lastmod),
    changefreq: 'weekly',
    priority: '0.8'
  }));
}

async function fetchSitemapCategories() {
  const [rows] = await queryWithTimeout(pool.query(
    `SELECT id, updated_at
     FROM categories
     WHERE status = 1
     ORDER BY sort_order ASC, id ASC`
  ), 'categories sitemap query');

  return rows.map((row) => ({
    loc: `/recommend?categoryId=${row.id}`,
    lastmod: formatDate(row.updated_at),
    changefreq: 'weekly',
    priority: '0.7'
  }));
}

async function fetchSitemapAuthors(limit = MAX_DYNAMIC_URLS) {
  const [rows] = await queryWithTimeout(pool.query(
    `SELECT author_id AS id, MAX(COALESCE(last_update_time, updated_at, published_at, created_at)) AS lastmod
     FROM novels
     WHERE author_id IS NOT NULL AND status IN (0, 1)
     GROUP BY author_id
     ORDER BY lastmod DESC
     LIMIT ?`,
    [limit]
  ), 'authors sitemap query');

  return rows.map((row) => ({
    loc: `/author/${row.id}`,
    lastmod: formatDate(row.lastmod),
    changefreq: 'weekly',
    priority: '0.6'
  }));
}

function fallbackCategoryUrls() {
  return FALLBACK_CATEGORIES.map((category) => ({
    loc: `/recommend?categoryId=${category.id}`,
    changefreq: 'weekly',
    priority: '0.7'
  }));
}

async function buildSitemapEntries() {
  const entries = [...STATIC_URLS];

  try {
    entries.push(...await fetchSitemapCategories());
  } catch (error) {
    console.warn('[seo] categories sitemap fallback:', error.message);
    entries.push(...fallbackCategoryUrls());
  }

  try {
    entries.push(...await fetchSitemapNovels());
  } catch (error) {
    console.warn('[seo] novels sitemap skipped:', error.message);
  }

  try {
    entries.push(...await fetchSitemapAuthors());
  } catch (error) {
    console.warn('[seo] authors sitemap skipped:', error.message);
  }

  return uniqueByLoc(entries);
}

async function generateSitemapXml() {
  const entries = await buildSitemapEntries();
  const urls = entries.map((entry) => {
    const lastmod = entry.lastmod ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
    return `  <url>
    <loc>${escapeXml(absoluteUrl(entry.loc))}</loc>${lastmod}
    <changefreq>${escapeXml(entry.changefreq)}</changefreq>
    <priority>${escapeXml(entry.priority)}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function generateRobotsTxt() {
  const rules = [
    'User-agent: *',
    'Allow: /',
    ...BLOCKED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    'User-agent: Googlebot',
    'Allow: /',
    ...BLOCKED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    'User-agent: Bingbot',
    'Allow: /',
    ...BLOCKED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    'User-agent: Baiduspider',
    'Allow: /',
    ...BLOCKED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    'User-agent: Sogou web spider',
    'Allow: /',
    ...BLOCKED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    'User-agent: 360Spider',
    'Allow: /',
    ...BLOCKED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    'User-agent: Bytespider',
    'Allow: /',
    ...BLOCKED_PATHS.map((path) => `Disallow: ${path}`),
    '',
    'User-agent: AhrefsBot',
    'Disallow: /',
    '',
    'User-agent: SemrushBot',
    'Disallow: /',
    '',
    'User-agent: MJ12bot',
    'Disallow: /',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    ''
  ];

  return rules.join('\n');
}

module.exports = {
  BLOCKED_PATHS,
  STATIC_URLS,
  buildSitemapEntries,
  generateRobotsTxt,
  generateSitemapXml
};

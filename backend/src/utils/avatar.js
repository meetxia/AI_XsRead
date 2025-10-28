const fs = require('fs');
const path = require('path');

// 头像所在的子目录（相对项目根目录下的 uploads）
const AVATAR_SUBDIR = path.join('uploads', 'tx');

function getAvatarFilenames() {
  const absoluteDir = path.join(process.cwd(), AVATAR_SUBDIR);
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }
  const all = fs.readdirSync(absoluteDir, { withFileTypes: true });
  // 仅选择文件且是常见图片扩展名
  const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
  return all
    .filter(d => d.isFile())
    .map(d => d.name)
    .filter(name => allowedExt.has(path.extname(name).toLowerCase()));
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

function buildAvatarUrl(req, filename) {
  if (!filename) return null;
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/tx/${encodeURIComponent(filename)}`;
}

function getRandomAvatarUrl(req) {
  const files = getAvatarFilenames();
  const filename = pickRandom(files);
  return buildAvatarUrl(req, filename);
}

module.exports = {
  getRandomAvatarUrl,
  getAvatarFilenames,
  buildAvatarUrl,
};



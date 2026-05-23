/**
 * admin-backend 上传目录回归守护
 *
 * 管理端封面上传返回 /uploads/images/...；生产 Nginx 与用户后端静态服务
 * 都从 backend/uploads 暴露该路径。因此管理端不能把封面写入
 * admin-backend/uploads，否则数据库 URL 正确但文件实际不可访问。
 */

const fs = require('fs');
const path = require('path');

const UPLOAD_SERVICE_FILE = path.resolve(__dirname, '../src/services/uploadService.js');

describe('admin-backend uploadService path', () => {
  test('图片上传落到 backend/uploads/images 共享静态目录', () => {
    const file = fs.readFileSync(UPLOAD_SERVICE_FILE, 'utf-8');

    expect(file).toMatch(/backend['"],\s*['"]uploads['"],\s*['"]images/);
    expect(file).not.toMatch(/\.\.\/\.\.\/uploads\/images/);
  });
});

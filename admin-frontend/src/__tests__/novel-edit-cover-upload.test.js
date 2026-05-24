/**
 * NovelEdit 封面上传回归守护
 *
 * 管理端上传封面必须保存后端返回的 /uploads/... URL，不能把浏览器临时
 * blob: URL 写入小说 cover 字段，否则用户前端和刷新后的管理端都会加载失败。
 */

import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NOVEL_EDIT_FILE = path.resolve(__dirname, '../views/Content/NovelEdit.vue')

describe('NovelEdit cover upload', () => {
  it('封面上传成功后使用 response.data.url 持久化路径', () => {
    const file = fs.readFileSync(NOVEL_EDIT_FILE, 'utf-8')

    expect(file).toMatch(/response\?\.data\?\.url|response\.data\.url/)
    expect(file).toMatch(/form\.cover\s*=\s*upload(ed)?Url/)
  })

  it('不会把 URL.createObjectURL 生成的 blob 地址写入 form.cover', () => {
    const file = fs.readFileSync(NOVEL_EDIT_FILE, 'utf-8')

    expect(file).not.toMatch(/form\.cover\s*=\s*URL\.createObjectURL/)
  })

  it('el-upload 显式携带后台登录 token', () => {
    const file = fs.readFileSync(NOVEL_EDIT_FILE, 'utf-8')

    expect(file).toMatch(/:headers="uploadHeaders"/)
    expect(file).toMatch(/Authorization/)
    expect(file).toMatch(/admin_token/)
  })

  it('编辑表单支持阅读量和收藏量字段', () => {
    const file = fs.readFileSync(NOVEL_EDIT_FILE, 'utf-8')

    expect(file).toMatch(/label="阅读量"/)
    expect(file).toMatch(/v-model="form\.views"/)
    expect(file).toMatch(/label="收藏量"/)
    expect(file).toMatch(/v-model="form\.collections"/)
    expect(file).toMatch(/label="评分"/)
    expect(file).toMatch(/v-model="form\.rating"/)
    expect(file).toMatch(/views:\s*toNonNegativeInteger\(form\.views\)/)
    expect(file).toMatch(/collections:\s*toNonNegativeInteger\(form\.collections\)/)
    expect(file).toMatch(/rating:\s*normalizeRating\(form\.rating\)/)
  })
})

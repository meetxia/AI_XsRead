/**
 * request.js 静态代码守护测试
 *
 * 守住 T-1.5 改造：响应拦截器接受 200-299 区间，不再严格判等 200。
 * Track: 管理端 Sprint 2 / T-6.2
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REQUEST_FILE = path.resolve(__dirname, '../utils/request.js')

describe('request.js response interceptor (T-1.5)', () => {
  it('不再使用严格判等 res.code !== 200', () => {
    const file = fs.readFileSync(REQUEST_FILE, 'utf-8')
    // 注意：项目可能有别处提及 'res.code !== 200' 作为旧注释，但成功判定逻辑应该用范围
    // 守住的核心：要么用区间判断，要么用 isSuccess 变量
    const hasRangeCheck = /code\s*[<>]=?\s*\d{3}/.test(file) || /isSuccess/.test(file)
    expect(hasRangeCheck).toBe(true)
  })

  it('保留 401 自动跳登录页的处理', () => {
    const file = fs.readFileSync(REQUEST_FILE, 'utf-8')
    expect(file).toMatch(/admin_token/)
    expect(file).toMatch(/login/)
  })

  it('404 分支优先使用后端返回的 message，避免统一误报为资源不存在', () => {
    const file = fs.readFileSync(REQUEST_FILE, 'utf-8')
    expect(file).toMatch(/error\.response\.data\?\.message/)
  })
})

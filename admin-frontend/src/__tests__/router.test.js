/**
 * 管理端路由守护测试
 *
 * 激活码详情页必须只接受数字批次 ID，避免 /codes/redemptions
 * 或其它字符串路径被误识别成批次详情，进而弹出“无效的批次 ID”。
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROUTER_FILE = path.resolve(__dirname, '../router/index.js')

describe('admin code routes', () => {
  it('批次详情路由只匹配数字 ID', () => {
    const file = fs.readFileSync(ROUTER_FILE, 'utf-8')
    expect(file).toMatch(/path:\s*['"]codes\/:id\(\\\\d\+\)['"]/)
  })
})

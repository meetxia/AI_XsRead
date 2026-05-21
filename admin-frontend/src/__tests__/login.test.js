/**
 * Login 页硬化测试 - 静态代码检查
 *
 * 不挂载组件，只读源文件，断言 admin/admin123 默认值与文案不再存在。
 * Track: 管理端 Sprint 2 / T-6.2
 */

import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGIN_FILE = path.resolve(__dirname, '../views/Login/index.vue')

describe('Login page hardening (T-2.1)', () => {
  it('Login.vue 不再预填 admin / admin123 reactive 默认值', () => {
    const file = fs.readFileSync(LOGIN_FILE, 'utf-8')
    expect(file).not.toMatch(/username:\s*['"]admin['"]/)
    expect(file).not.toMatch(/password:\s*['"]admin123['"]/)
  })

  it('Login.vue 不再展示"默认账号 admin / 密码 admin123"文案', () => {
    const file = fs.readFileSync(LOGIN_FILE, 'utf-8')
    expect(file).not.toMatch(/默认账号.*admin.*admin123/s)
    expect(file).not.toMatch(/默认账号:\s*admin/)
  })

  it('reactive loginForm 是空字符串初始化', () => {
    const file = fs.readFileSync(LOGIN_FILE, 'utf-8')
    expect(file).toMatch(/username:\s*['"]['"]/)
    expect(file).toMatch(/password:\s*['"]['"]/)
  })
})

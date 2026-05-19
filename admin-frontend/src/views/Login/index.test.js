import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import Login from './index.vue'

const push = vi.fn()

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    useRouter: () => ({
      push
    })
  }
})

describe('Login page', () => {
  it('renders the admin login form', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [createPinia(), ElementPlus]
      }
    })

    expect(wrapper.text()).toContain('MOMO小说后台管理系统')
    expect(wrapper.find('input[placeholder="请输入用户名"]').exists()).toBe(true)
    expect(wrapper.find('input[placeholder="请输入密码"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('默认账号: admin / 密码: admin123')
  })
})

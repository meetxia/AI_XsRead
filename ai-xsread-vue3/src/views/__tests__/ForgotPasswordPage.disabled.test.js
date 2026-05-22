import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

const forgotPasswordMock = vi.fn()

vi.mock('@/api/auth', () => ({
  forgotPassword: forgotPasswordMock,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a><slot /></a>',
  },
}))

const ForgotPasswordPage = (await import('@/views/ForgotPasswordPage.vue')).default

describe('ForgotPasswordPage temporary fallback', () => {
  beforeEach(() => {
    forgotPasswordMock.mockClear()
  })

  it('shows contact-admin guidance instead of calling the reset email API', async () => {
    const wrapper = mount(ForgotPasswordPage, {
      global: {
        stubs: {
          Icon: true,
          ThemeToggle: true,
        },
      },
    })

    await wrapper.find('form').trigger('submit.prevent')

    expect(forgotPasswordMock).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('密码找回暂未开放')
    expect(wrapper.text()).toContain('联系管理员')
    expect(wrapper.text()).toContain('472990945')
  })
})

/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 34.3 — 注册成功后路由跳转到 /onboarding/interests
 * Validates: Requirements 20.1
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// Mock the auth API: simulate a successful register response (后端约定 201)。
vi.mock('@/api/auth', () => ({
  register: vi.fn().mockResolvedValue({
    code: 201,
    message: '注册成功',
    data: {
      accessToken: 'fake-access-token',
      refreshToken: 'fake-refresh-token',
      user: { id: 1, username: 'tester' },
    },
  }),
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
}))

// Stub the user API module so the store import does not fail.
vi.mock('@/api/user', () => ({
  uploadAvatarApi: vi.fn(),
  updateUserProfile: vi.fn(),
}))

// Stub the router composable so we can assert what RegisterPage pushes to.
const pushMock = vi.fn()
const replaceMock = vi.fn()
const backMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    back: backMock,
  }),
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a><slot /></a>',
  },
}))

// Defer importing the SUT until after the mocks above are registered.
const RegisterPage = (await import('@/views/RegisterPage.vue')).default

function fillForm(wrapper) {
  // Inputs in DOM order: username(text), phone(tel), code(text),
  // password(password), agreed(checkbox).
  const inputs = wrapper.findAll('input')
  return Promise.all([
    inputs[0].setValue('alice'),
    inputs[1].setValue('13800138000'),
    inputs[3].setValue('Password123!'),
    inputs[4].setValue(true),
  ])
}

describe('RegisterPage post-register redirect', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    pushMock.mockClear()
    replaceMock.mockClear()
    backMock.mockClear()
  })

  it('navigates to /onboarding/interests with from=register after success', async () => {
    const wrapper = mount(RegisterPage, {
      global: {
        stubs: {
          Icon: true,
          ThemeToggle: true,
        },
      },
    })

    await fillForm(wrapper)
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(pushMock).toHaveBeenCalledTimes(1)
    const target = pushMock.mock.calls[0][0]

    if (typeof target === 'string') {
      expect(target).toContain('/onboarding/interests')
    } else {
      expect(target).toMatchObject({ path: '/onboarding/interests' })
      expect(target.query).toMatchObject({ from: 'register' })
    }
  })
})

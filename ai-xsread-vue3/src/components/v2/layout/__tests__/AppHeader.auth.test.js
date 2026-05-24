import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('/logo.svg', () => ({ default: '/logo.svg' }))

import AppHeader from '../AppHeader.vue'
import { useUserStore } from '@/stores/user'

const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="typeof to === \'string\' ? to : to?.path"><slot /></a>',
}

function mountHeader() {
  return mount(AppHeader, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        Icon: true,
        ThemeToggle: true,
      },
    },
  })
}

describe('v2 AppHeader auth actions', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows login and register links instead of the avatar for guests', () => {
    const wrapper = mountHeader()

    expect(wrapper.text()).toContain('登录')
    expect(wrapper.text()).toContain('注册')
    expect(wrapper.find('[aria-label="我的"]').exists()).toBe(false)
  })

  it('shows the avatar entry for logged-in users', () => {
    const userStore = useUserStore()
    userStore.token = 'token'
    userStore.userInfo = { username: 'reader' }

    const wrapper = mountHeader()

    expect(wrapper.find('[aria-label="我的"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('登录')
    expect(wrapper.text()).not.toContain('注册')
  })
})

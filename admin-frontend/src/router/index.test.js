import { describe, expect, it, beforeEach } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createRouterForAdmin } from './index'
import { removeToken, setToken } from '@/utils/auth'

vi.mock('@/components/Layout/index.vue', () => ({
  default: { template: '<router-view />' }
}))

vi.mock('@/views/Login/index.vue', () => ({
  default: { template: '<div>login</div>' }
}))

vi.mock('@/views/Dashboard/index.vue', () => ({
  default: { template: '<div>dashboard</div>' }
}))

describe('admin router auth guard', () => {
  beforeEach(() => {
    removeToken()
  })

  it('redirects unauthenticated dashboard visits to login', async () => {
    const router = createRouterForAdmin(createMemoryHistory())

    await router.push('/dashboard')

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows authenticated dashboard visits', async () => {
    setToken('test-token')
    const router = createRouterForAdmin(createMemoryHistory())

    await router.push('/dashboard')

    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})

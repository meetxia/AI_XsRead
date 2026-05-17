/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 27.5: views/FollowingAuthorsPage.vue 全部关注作者列表
 *
 * 单元测试：
 *  - 7 天内更新的作者标记 NEW 徽标
 *  - 7 天外更新的作者不标记
 *  - 没有最新作品的作者不标记
 *  - 接口返回空列表时显示空态
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createRouter, createMemoryHistory, RouterLinkStub } from 'vue-router'

vi.mock('@/api/authors', () => ({
  listFollowingAuthors: vi.fn()
}))

vi.mock('@/components/v2/icons/Icon.vue', () => ({
  default: { name: 'IconStub', props: ['name'], template: '<i class="icon-stub" />' }
}))

vi.mock('@/components/bookshelf/UnreadBadge.vue', () => ({
  default: { name: 'UnreadBadgeStub', template: '<i class="unread-badge-stub" />' }
}))

import FollowingAuthorsPage from '@/views/FollowingAuthorsPage.vue'
import { listFollowingAuthors } from '@/api/authors'

const ONE_DAY = 24 * 60 * 60 * 1000

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/profile', component: { template: '<div />' } },
      { path: '/author/:id', component: { template: '<div />' } },
      { path: '/profile/following-authors', component: FollowingAuthorsPage }
    ]
  })
}

async function mountPage() {
  const router = makeRouter()
  router.push('/profile/following-authors')
  await router.isReady()
  const wrapper = mount(FollowingAuthorsPage, {
    global: {
      plugins: [router],
      stubs: { RouterLink: RouterLinkStub }
    }
  })
  await flushPromises()
  await nextTick()
  return wrapper
}

describe('FollowingAuthorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('只对 7 天内更新的作者展示 NEW 徽标', async () => {
    const now = new Date('2026-05-20T12:00:00Z').getTime()
    vi.useFakeTimers()
    vi.setSystemTime(now)

    listFollowingAuthors.mockResolvedValueOnce({
      code: 200,
      data: {
        list: [
          {
            id: 11,
            name: '南风晚晚',
            avatar: '',
            latest_work_title: '山有木兮',
            latest_update_at: new Date(now - 2 * ONE_DAY).toISOString()
          },
          {
            id: 22,
            name: '柳如烟',
            avatar: '',
            latest_work_title: '故人江湖',
            latest_update_at: new Date(now - 30 * ONE_DAY).toISOString()
          },
          {
            id: 33,
            name: '不语',
            avatar: '',
            latest_work_title: null,
            latest_update_at: null
          }
        ],
        pagination: { page: 1, pageSize: 20, total: 3, totalPages: 1 }
      }
    })

    const wrapper = await mountPage()

    const cards = wrapper.findAll('[data-testid="author-card"]')
    expect(cards).toHaveLength(3)

    const badges = wrapper.findAll('[data-testid="new-badge"]')
    expect(badges).toHaveLength(1)

    expect(cards[0].text()).toContain('南风晚晚')
    expect(cards[0].find('[data-testid="new-badge"]').exists()).toBe(true)
    expect(cards[1].find('[data-testid="new-badge"]').exists()).toBe(false)
    expect(cards[2].find('[data-testid="new-badge"]').exists()).toBe(false)

    expect(cards[1].text()).toContain('天前更新')
    expect(cards[2].text()).toContain('暂无新作品')

    expect(wrapper.text()).toContain('我关注的作者 (3)')
  })

  it('接口返回空列表时显示空态文案', async () => {
    listFollowingAuthors.mockResolvedValueOnce({
      code: 200,
      data: { list: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
    })

    const wrapper = await mountPage()

    expect(wrapper.findAll('[data-testid="author-card"]')).toHaveLength(0)
    const empty = wrapper.find('[data-testid="empty-state"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain('你还没有关注任何作者')
    expect(empty.text()).toContain('去发现首页找一位喜欢的吧')
  })
})

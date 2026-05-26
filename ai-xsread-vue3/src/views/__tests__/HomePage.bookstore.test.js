import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'

vi.mock('@/api/novel', () => ({
  getRecommendNovels: vi.fn(),
  getNovelList: vi.fn()
}))

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({ isLogin: false })
}))

vi.mock('@/composables/useSeoMeta', () => ({
  SEO_DEFAULTS: { description: 'MOMO小说', siteUrl: 'https://xs.momofx.cn' },
  useSeoMeta: vi.fn()
}))

vi.mock('@/utils/schema', () => ({
  buildOrganizationSchema: vi.fn(() => ({})),
  buildWebSiteSchema: vi.fn(() => ({}))
}))

vi.mock('/logo.svg', () => ({
  default: '/logo.svg'
}))

vi.mock('@/components/v2/layout/BottomNav.vue', () => ({
  default: { name: 'BottomNavStub', template: '<nav data-testid="bottom-nav" />' }
}))

vi.mock('@/components/v2/layout/AppHeader.vue', () => ({
  default: { name: 'AppHeaderStub', template: '<header class="hidden lg:block" data-testid="desktop-app-header" />' }
}))

vi.mock('@/components/v2/book/BookCover.vue', () => ({
  default: {
    name: 'BookCoverStub',
    props: ['title'],
    template: '<div class="book-cover-stub">{{ title }}</div>'
  }
}))

vi.mock('@/components/v2/icons/Icon.vue', () => ({
  default: { name: 'IconStub', props: ['name'], template: '<i class="icon-stub" />' }
}))

vi.mock('@/components/novel/RankTabSection.vue', () => ({
  default: { name: 'RankTabSectionStub', template: '<section data-testid="legacy-rank-section" />' }
}))

import HomePage from '@/views/HomePage.vue'
import { getNovelList, getRecommendNovels } from '@/api/novel'

const novels = Array.from({ length: 14 }, (_, index) => ({
  id: index + 1,
  title: `第${index + 1}本小说`,
  author: `作者${index + 1}`,
  category_name: index % 2 ? '古风穿越' : '都市言情',
  description: `这是一段适合书城首页展示的简介 ${index + 1}`,
  rating: 8.6 + (index % 3) * 0.1,
  views: 12000 + index * 1300,
  word_count: 320000 + index * 10000,
  cover: ''
}))

async function mountHome() {
  getRecommendNovels.mockResolvedValue({ code: 200, data: novels })
  getNovelList.mockResolvedValue({ code: 200, data: { list: novels.slice().reverse() } })

  const wrapper = mount(HomePage, {
    global: {
      stubs: { RouterLink: RouterLinkStub }
    }
  })
  await flushPromises()
  return wrapper
}

describe('HomePage bookstore layout', () => {
  it('渲染移动书城结构并移除旧首页大榜单', async () => {
    const wrapper = await mountHome()

    expect(wrapper.find('[data-testid="home-search-entry"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-category-nav"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="desktop-app-header"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="desktop-app-header"]').classes()).toContain('lg:block')
    expect(wrapper.find('[data-testid="home-hot-ranking"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="home-hot-rank-item"]').length).toBe(8)
    expect(wrapper.find('[data-testid="home-horizontal-shelf"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-waterfall"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="waterfall-book-card"]').length).toBeGreaterThanOrEqual(8)

    expect(wrapper.text()).not.toContain('今日书城')
    expect(wrapper.text()).not.toContain('挑一本能立刻读进去的故事')
    expect(wrapper.text()).not.toContain('本期主编荐读')
    expect(wrapper.text()).not.toContain('本周读者最爱')
    expect(wrapper.text()).not.toContain('推荐书单')
    expect(wrapper.find('[data-testid="legacy-rank-section"]').exists()).toBe(false)
  })

  it('点击首页分类只刷新首页数据，不跳转搜索页', async () => {
    const wrapper = await mountHome()
    getNovelList.mockClear()

    const urbanTab = wrapper.find('[data-testid="home-category-tab-urban"]')
    expect(urbanTab.exists()).toBe(true)
    expect(urbanTab.attributes('href')).toBeUndefined()

    await urbanTab.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="home-category-tab-urban"]').classes().join(' ')).toContain('border-clay-700')
    expect(getNovelList).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 101 }))
  })
})

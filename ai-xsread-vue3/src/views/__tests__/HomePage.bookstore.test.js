import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'

vi.mock('@/api/novel', () => ({
  getRecommendNovels: vi.fn(),
  getNovelList: vi.fn()
}))

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({ isLogin: mockIsLogin })
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

vi.mock('@/api/user', () => ({
  getReadingHistory: vi.fn(() => Promise.resolve({
    code: 200,
    data: {
      list: [{
        novel_id: 901,
        title: '上次读到的小说',
        author: '浅笑嫣然',
        chapter_number: 12,
        chapter_title: '正文',
        progress: 42,
        chapter_id: 66,
      }]
    }
  }))
}))

import HomePage from '@/views/HomePage.vue'
import { getNovelList, getRecommendNovels } from '@/api/novel'

let mockIsLogin = false

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

const featuredNovels = novels.map((novel, index) => ({
  ...novel,
  id: novel.id + 100,
  title: `精选第${index + 1}本小说`,
}))

const hotNovels = novels.map((novel, index) => ({
  ...novel,
  id: novel.id + 200,
  title: `热榜第${index + 1}本小说`,
}))

async function mountHome({ recommended = featuredNovels, hot = hotNovels } = {}) {
  getRecommendNovels.mockResolvedValue({ code: 200, data: recommended })
  getNovelList.mockResolvedValue({ code: 200, data: { list: hot } })

  const wrapper = mount(HomePage, {
    global: {
      stubs: { RouterLink: RouterLinkStub }
    }
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  mockIsLogin = false
})

describe('HomePage bookstore layout', () => {
  it('渲染移动书城结构并移除旧首页大榜单', async () => {
    const wrapper = await mountHome()

    expect(wrapper.find('[data-testid="home-search-entry"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-category-nav"]').exists()).toBe(true)
    const categoryLabels = wrapper
      .findAll('[data-testid="home-category-nav"] button')
      .map(button => button.text())
    expect(categoryLabels.slice(0, 3)).toEqual(['推荐榜', '精选', '都市言情'])
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
    expect(wrapper.text()).not.toContain('完本榜')
    expect(wrapper.text()).not.toContain('口碑榜')
    expect(wrapper.text()).not.toContain('飙升榜')
    expect(wrapper.text()).not.toContain('完整榜单')
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

  it('推荐榜与精选使用不同内容源', async () => {
    const wrapper = await mountHome()

    expect(wrapper.find('[data-testid="home-hot-ranking"]').text()).toContain('热榜第1本小说')
    expect(wrapper.find('[data-testid="home-hot-ranking"]').text()).not.toContain('精选第1本小说')

    await wrapper.find('[data-testid="home-category-tab-featured"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="home-category-tab-featured"]').classes().join(' ')).toContain('border-clay-700')
    expect(wrapper.find('[data-testid="home-hot-ranking"]').text()).toContain('精选第1本小说')
    expect(wrapper.find('[data-testid="home-hot-ranking"]').text()).not.toContain('热榜第1本小说')
  })

  it('精选内容与推荐榜首屏重叠时优先展示差异内容', async () => {
    const overlappedHot = hotNovels.slice(0, 8)
    const mixedFeatured = [
      ...overlappedHot.slice(0, 5),
      ...featuredNovels.slice(0, 8),
    ]
    const wrapper = await mountHome({ recommended: mixedFeatured, hot: overlappedHot })

    expect(wrapper.find('[data-testid="home-hot-ranking"]').text()).toContain('热榜第1本小说')

    await wrapper.find('[data-testid="home-category-tab-featured"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="home-hot-ranking"]').text()).toContain('精选第1本小说')
    expect(wrapper.find('[data-testid="home-hot-ranking"]').text()).not.toContain('热榜第1本小说')
  })

  it('移动端内容区可左右滑动切换顶部标签', async () => {
    const wrapper = await mountHome()
    const swipeArea = wrapper.find('[data-testid="home-swipe-area"]')

    await swipeArea.trigger('touchstart', { touches: [{ clientX: 260, clientY: 120 }] })
    await swipeArea.trigger('touchend', { changedTouches: [{ clientX: 120, clientY: 128 }] })
    await flushPromises()

    expect(wrapper.find('[data-testid="home-category-tab-featured"]').classes().join(' ')).toContain('border-clay-700')

    await swipeArea.trigger('touchstart', { touches: [{ clientX: 120, clientY: 120 }] })
    await swipeArea.trigger('touchend', { changedTouches: [{ clientX: 260, clientY: 126 }] })
    await flushPromises()

    expect(wrapper.find('[data-testid="home-category-tab-ranking"]').classes().join(' ')).toContain('border-clay-700')
  })

  it('继续阅读以底部悬浮提示展示并在15秒后消失', async () => {
    vi.useFakeTimers()
    mockIsLogin = true

    const wrapper = await mountHome()
    await flushPromises()

    expect(wrapper.find('[data-testid="home-continue-toast"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="home-continue-toast"]').text()).toContain('上次读到的小说')
    expect(wrapper.find('[data-testid="home-continue-progress"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="home-continue-toast"]').text()).not.toContain('浅笑嫣然')
    expect(wrapper.find('[data-testid="home-continue-toast"]').classes().join(' ')).toContain('bottom-24')

    await vi.advanceTimersByTimeAsync(15000)
    await flushPromises()

    expect(wrapper.find('[data-testid="home-continue-toast"]').exists()).toBe(false)
    vi.useRealTimers()
  })
})

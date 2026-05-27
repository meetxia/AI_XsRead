import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'

const { routerPush, scrollIntoView } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  scrollIntoView: vi.fn(),
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: () => ({ params: { id: 42 }, query: {}, fullPath: '/novel/42' }),
    useRouter: () => ({ push: routerPush, back: vi.fn() }),
  }
})

vi.mock('@/api/novel', () => ({
  getNovelDetail: vi.fn(),
  getChapterList: vi.fn(),
  getChapterContent: vi.fn(),
  getComments: vi.fn(),
  getNovelStatus: vi.fn(),
  likeNovel: vi.fn(),
  unlikeNovel: vi.fn(),
  getNovelRating: vi.fn(),
  downloadNovelTxt: vi.fn(),
}))

vi.mock('@/api/user', () => ({
  addToBookshelf: vi.fn(),
  removeFromBookshelf: vi.fn(),
  getReadingProgress: vi.fn(),
}))

vi.mock('@/stores/user', () => ({
  useUserStore: () => ({ isLogin: false }),
}))

vi.mock('@/composables/useReturnUrl', () => ({
  buildLoginUrl: vi.fn((url) => `/login?redirect=${encodeURIComponent(url)}`),
}))

vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({ toggleMode: vi.fn() }),
}))

vi.mock('@/composables/useSeoMeta', () => ({
  SEO_DEFAULTS: {
    siteName: 'MOMO小说',
    siteUrl: 'https://xs.momofx.cn',
    image: 'https://xs.momofx.cn/logo.png',
  },
  useSeoMeta: vi.fn(),
}))

vi.mock('@/utils/schema', () => ({
  buildBookSchema: vi.fn(() => ({})),
  buildBreadcrumbSchema: vi.fn(() => ({})),
}))

vi.mock('@/components/v2/icons/Icon.vue', () => ({
  default: { name: 'IconStub', props: ['name'], template: '<i class="icon-stub" />' },
}))

vi.mock('@/components/v2/ui/ThemeToggle.vue', () => ({
  default: { name: 'ThemeToggleStub', template: '<button type="button" />' },
}))

vi.mock('@/components/v2/book/BookCover.vue', () => ({
  default: { name: 'BookCoverStub', props: ['title'], template: '<div>{{ title }}</div>' },
}))

vi.mock('@/components/novel/SameAuthorRail.vue', () => ({
  default: { name: 'SameAuthorRailStub', template: '<section />' },
}))

vi.mock('@/components/novel/SameTagRail.vue', () => ({
  default: { name: 'SameTagRailStub', template: '<section />' },
}))

vi.mock('@/components/novel/HotNotesSection.vue', () => ({
  default: { name: 'HotNotesSectionStub', template: '<section />' },
}))

vi.mock('@/components/novel/FollowAuthorButton.vue', () => ({
  default: { name: 'FollowAuthorButtonStub', template: '<button type="button" />' },
}))

import NovelDetailPage from '@/views/NovelDetailPage.vue'
import { getChapterContent, getChapterList, getComments, getNovelDetail, getNovelRating, getNovelStatus } from '@/api/novel'
import { getReadingProgress } from '@/api/user'

async function mountPage() {
  getNovelDetail.mockResolvedValue({
    code: 200,
    data: {
      id: 42,
      title: '清冷上司在我怀孕后彻底黏人精上身',
      author: '浅笑依依',
      category_name: '都市言情',
      description: '那天晚上，我本来只是想送你回家。',
      word_count: 12000,
      views: 49000,
      status: 1,
    },
  })
  getNovelStatus.mockResolvedValue({ code: 200, data: { inBookshelf: false, liked: false } })
  getReadingProgress.mockResolvedValue({ code: 200, data: null })
  getNovelRating.mockResolvedValue({ code: 200, data: { ratingCount: 0, average: 4.5, distribution: {} } })
  getComments.mockResolvedValue({ code: 200, data: { list: [], total: 0 } })
  getChapterList.mockResolvedValue({
    code: 200,
    data: {
      total: 1,
      list: [
        { id: 99, chapter_number: 1, title: '正文', word_count: 1800, created_at: '2026-05-20T00:00:00Z' },
      ],
    },
  })
  getChapterContent.mockResolvedValue({
    code: 200,
    data: {
      id: 99,
      title: '正文',
      chapter_number: 1,
      word_count: 1800,
      content: '第一段正文内容。\n第二段正文内容。',
    },
  })

  const wrapper = mount(NovelDetailPage, {
    attachTo: document.body,
    global: {
      stubs: { RouterLink: RouterLinkStub },
    },
  })
  await flushPromises()
  return wrapper
}

describe('NovelDetailPage inline reader', () => {
  it('详情页加载首章正文，并把开始阅读滚动到正文而不是跳转阅读页', async () => {
    Element.prototype.scrollIntoView = scrollIntoView
    const wrapper = await mountPage()

    expect(getChapterContent).toHaveBeenCalledWith(99)
    expect(wrapper.find('[data-testid="inline-reader"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('第一段正文内容。')
    expect(wrapper.text()).toContain('第二段正文内容。')

    await wrapper.find('[data-testid="detail-start-reading"]').trigger('click')

    expect(routerPush).not.toHaveBeenCalledWith(expect.stringContaining('/reading/42'))
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('详情页正文区使用沉浸式阅读工具栏，点击正文可以显示或隐藏菜单', async () => {
    const wrapper = await mountPage()

    expect(wrapper.find('[data-testid="inline-reader-top-toolbar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="inline-reader-bottom-toolbar"]').exists()).toBe(true)

    await wrapper.find('[data-testid="inline-reader-pageflip"]').trigger('click', {
      clientX: 240,
      clientY: 400,
    })

    expect(wrapper.find('[data-testid="inline-reader-top-toolbar"]').classes()).toContain('toolbar-hide-top')
    expect(wrapper.find('[data-testid="inline-reader-bottom-toolbar"]').classes()).toContain('toolbar-hide-bottom')

    await wrapper.find('[data-testid="inline-reader-pageflip"]').trigger('click', {
      clientX: 240,
      clientY: 400,
    })

    expect(wrapper.find('[data-testid="inline-reader-top-toolbar"]').classes()).not.toContain('toolbar-hide-top')
    expect(wrapper.find('[data-testid="inline-reader-bottom-toolbar"]').classes()).not.toContain('toolbar-hide-bottom')
  })
})

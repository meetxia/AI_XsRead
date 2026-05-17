/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 29.2: AchievementsPage 单元测试
 *
 * 覆盖：
 *  - 头部 "我的勋章 (N / 总数)" 摘要文案
 *  - 已解锁分组：unlockedAt DESC 排序 + 按 category 分组
 *  - 未解锁分组：完成度 DESC 排序 + 按 category 分组
 *  - AchievementCard 进度条宽度等于 (currentValue / threshold) * 100
 *  - 空态文案 "暂无解锁勋章" / "暂无可解锁勋章"
 *
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterLinkStub } from 'vue-router'

vi.mock('@/api/achievements', () => ({
  getUserAchievements: vi.fn(),
  listAchievements: vi.fn(),
}))

vi.mock('@/components/v2/icons/Icon.vue', () => ({
  default: { name: 'IconStub', props: ['name'], template: '<i class="icon-stub" />' },
}))

import AchievementsPage from '@/views/AchievementsPage.vue'
import { getUserAchievements } from '@/api/achievements'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/profile', component: { template: '<div />' } },
      { path: '/profile/achievements', component: AchievementsPage },
    ],
  })
}

async function mountPage() {
  const router = makeRouter()
  router.push('/profile/achievements')
  await router.isReady()
  const wrapper = mount(AchievementsPage, {
    global: {
      plugins: [router],
      stubs: { RouterLink: RouterLinkStub },
    },
  })
  await flushPromises()
  await nextTick()
  return wrapper
}

const NOW = new Date('2026-05-20T12:00:00Z').getTime()
const HOUR = 60 * 60 * 1000

function unlockedAt(offsetMs) {
  return new Date(NOW - offsetMs).toISOString()
}

const FIXTURE_ACHIEVEMENTS = [
  // === 已解锁 (3) ===
  {
    id: 'chapters_10',
    code: 'chapters_10',
    name: '初出茅庐',
    description: '阅读10个章节',
    icon: '📖',
    category: 'reading',
    threshold: 10,
    currentValue: 12,
    unlocked: true,
    unlockedAt: unlockedAt(2 * HOUR), // 最近
  },
  {
    id: 'novels_5',
    code: 'novels_5',
    name: '书友新手',
    description: '阅读5本小说',
    icon: '🌱',
    category: 'bookshelf',
    threshold: 5,
    currentValue: 7,
    unlocked: true,
    unlockedAt: unlockedAt(48 * HOUR), // 较早
  },
  {
    id: 'streak_7',
    code: 'streak_7',
    name: '七日之约',
    description: '近30天内阅读7天',
    icon: '🔥',
    category: 'habit',
    threshold: 7,
    currentValue: 8,
    unlocked: true,
    unlockedAt: unlockedAt(10 * HOUR), // 居中
  },

  // === 未解锁 (4) ===
  {
    id: 'chapters_100',
    code: 'chapters_100',
    name: '勤奋读者',
    description: '阅读100个章节',
    icon: '📚',
    category: 'reading',
    threshold: 100,
    currentValue: 80, // 80%
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'novels_20',
    code: 'novels_20',
    name: '阅读爱好者',
    description: '阅读20本小说',
    icon: '⭐',
    category: 'bookshelf',
    threshold: 20,
    currentValue: 5, // 25%
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'finished_1',
    code: 'finished_1',
    name: '善始善终',
    description: '完成1本小说',
    icon: '✅',
    category: 'bookshelf',
    threshold: 1,
    currentValue: 0, // 0%
    unlocked: false,
    unlockedAt: null,
  },
  {
    id: 'time_600',
    code: 'time_600',
    name: '十小时',
    description: '累计阅读10小时',
    icon: '⏱️',
    category: 'milestone',
    threshold: 600,
    currentValue: 300, // 50%
    unlocked: false,
    unlockedAt: null,
  },
]

describe('AchievementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('在加载完成前显示骨架占位（3 张卡）', async () => {
    let resolvePromise
    getUserAchievements.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    const router = makeRouter()
    router.push('/profile/achievements')
    await router.isReady()
    const wrapper = mount(AchievementsPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: RouterLinkStub },
      },
    })
    await nextTick()

    expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true)

    resolvePromise({
      code: 200,
      data: {
        summary: { unlocked: 0, total: 0, percentage: 0 },
        achievements: [],
      },
    })
    await flushPromises()
  })

  it('页面头部展示 "我的勋章 (3 / 7)" 摘要文案', async () => {
    getUserAchievements.mockResolvedValueOnce({
      code: 200,
      data: {
        summary: { unlocked: 3, total: 7, percentage: 43 },
        achievements: FIXTURE_ACHIEVEMENTS,
      },
    })

    const wrapper = await mountPage()
    expect(wrapper.find('[data-testid="page-title"]').text()).toContain('我的勋章 (3 / 7)')
  })

  it('已解锁勋章按 unlockedAt DESC 排序，并按 category 分组', async () => {
    getUserAchievements.mockResolvedValueOnce({
      code: 200,
      data: {
        summary: { unlocked: 3, total: 7, percentage: 43 },
        achievements: FIXTURE_ACHIEVEMENTS,
      },
    })

    const wrapper = await mountPage()

    // unlocked 总数文案
    expect(wrapper.find('[data-testid="unlocked-count"]').text()).toContain('3')

    // 分组应按 CATEGORY_ORDER（reading → bookshelf → habit → milestone）渲染。
    const unlockedSection = wrapper.find('[data-testid="unlocked-section"]')
    const groupKeys = unlockedSection
      .findAll('[data-testid^="unlocked-group-"]')
      .map((n) => n.attributes('data-testid'))
    expect(groupKeys).toEqual([
      'unlocked-group-reading',
      'unlocked-group-bookshelf',
      'unlocked-group-habit',
    ])

    // 每组只有 1 条已解锁记录；扁平后顺序由 CATEGORY_ORDER 决定。
    const titles = unlockedSection
      .findAll('[data-testid="achievement-title"]')
      .map((n) => n.text())
    expect(titles).toEqual(['初出茅庐', '书友新手', '七日之约'])

    // 已解锁卡片均渲染解锁时间，不渲染进度条
    const unlockedCards = unlockedSection.findAll('[data-testid="achievement-card"]')
    expect(unlockedCards).toHaveLength(3)
    for (const card of unlockedCards) {
      expect(card.find('[data-testid="achievement-unlocked-at"]').exists()).toBe(true)
      expect(card.find('[data-testid="achievement-progress-bar"]').exists()).toBe(false)
    }
  })

  it('已解锁同一分组内按 unlockedAt DESC 排序', async () => {
    getUserAchievements.mockResolvedValueOnce({
      code: 200,
      data: {
        summary: { unlocked: 3, total: 3, percentage: 100 },
        achievements: [
          {
            id: 'novels_5',
            code: 'novels_5',
            name: '书友新手',
            description: '阅读5本小说',
            icon: '🌱',
            category: 'bookshelf',
            threshold: 5,
            currentValue: 7,
            unlocked: true,
            unlockedAt: unlockedAt(48 * HOUR),
          },
          {
            id: 'finished_1',
            code: 'finished_1',
            name: '善始善终',
            description: '完成1本小说',
            icon: '✅',
            category: 'bookshelf',
            threshold: 1,
            currentValue: 1,
            unlocked: true,
            unlockedAt: unlockedAt(2 * HOUR),
          },
          {
            id: 'novels_20',
            code: 'novels_20',
            name: '阅读爱好者',
            description: '阅读20本小说',
            icon: '⭐',
            category: 'bookshelf',
            threshold: 20,
            currentValue: 25,
            unlocked: true,
            unlockedAt: unlockedAt(10 * HOUR),
          },
        ],
      },
    })

    const wrapper = await mountPage()
    const group = wrapper.find('[data-testid="unlocked-group-bookshelf"]')
    expect(group.exists()).toBe(true)
    const titles = group.findAll('[data-testid="achievement-title"]').map((n) => n.text())
    // 2h(最近) < 10h < 48h(最早)
    expect(titles).toEqual(['善始善终', '阅读爱好者', '书友新手'])
  })

  it('未解锁勋章按完成度 DESC 排序，并按 category 分组', async () => {
    getUserAchievements.mockResolvedValueOnce({
      code: 200,
      data: {
        summary: { unlocked: 3, total: 7, percentage: 43 },
        achievements: FIXTURE_ACHIEVEMENTS,
      },
    })

    const wrapper = await mountPage()

    expect(wrapper.find('[data-testid="locked-count"]').text()).toContain('4')

    // 分组渲染顺序：reading → bookshelf → milestone（无 habit 未解锁）。
    const lockedSection = wrapper.find('[data-testid="locked-section"]')
    const groupKeys = lockedSection
      .findAll('[data-testid^="locked-group-"]')
      .map((n) => n.attributes('data-testid'))
    expect(groupKeys).toEqual([
      'locked-group-reading',
      'locked-group-bookshelf',
      'locked-group-milestone',
    ])
    expect(wrapper.find('[data-testid="locked-group-habit"]').exists()).toBe(false)

    // 扁平后顺序：reading[勤奋读者] → bookshelf[阅读爱好者25% → 善始善终0%] → milestone[十小时]
    const titles = lockedSection
      .findAll('[data-testid="achievement-title"]')
      .map((n) => n.text())
    expect(titles).toEqual(['勤奋读者', '阅读爱好者', '善始善终', '十小时'])

    // bookshelf 分组内部按完成度 DESC 排序：阅读爱好者(25%) 在前，善始善终(0%) 在后。
    const bookshelfGroup = wrapper.find('[data-testid="locked-group-bookshelf"]')
    const bookshelfTitles = bookshelfGroup
      .findAll('[data-testid="achievement-title"]')
      .map((n) => n.text())
    expect(bookshelfTitles).toEqual(['阅读爱好者', '善始善终'])
  })

  it('未解锁卡片的进度条宽度严格等于 (currentValue / threshold) * 100', async () => {
    getUserAchievements.mockResolvedValueOnce({
      code: 200,
      data: {
        summary: { unlocked: 3, total: 7, percentage: 43 },
        achievements: FIXTURE_ACHIEVEMENTS,
      },
    })

    const wrapper = await mountPage()

    const lockedSection = wrapper.find('[data-testid="locked-section"]')
    const bars = lockedSection.findAll('[data-testid="achievement-progress-bar"]')
    const texts = lockedSection.findAll('[data-testid="achievement-progress-text"]').map((n) => n.text())

    // 4 张未解锁卡（按 reading→bookshelf→milestone 排列），每张都有 progress bar + X / Y 标签
    expect(bars).toHaveLength(4)
    // reading[勤奋读者 80/100] → bookshelf[阅读爱好者 5/20, 善始善终 0/1] → milestone[十小时 300/600]
    expect(texts).toEqual(['80 / 100', '5 / 20', '0 / 1', '300 / 600'])

    // 验证宽度样式与 dataset
    const widths = bars.map((b) => b.attributes('style') || '')
    expect(widths[0]).toContain('width: 80%')
    expect(widths[1]).toContain('width: 25%')
    expect(widths[2]).toContain('width: 0%')
    expect(widths[3]).toContain('width: 50%')

    expect(bars[0].attributes('data-progress')).toBe('80')
    expect(bars[1].attributes('data-progress')).toBe('25')
    expect(bars[2].attributes('data-progress')).toBe('0')
    expect(bars[3].attributes('data-progress')).toBe('50')
  })

  it('当用户没有任何已解锁 / 未解锁勋章时，分别显示对应空态', async () => {
    getUserAchievements.mockResolvedValueOnce({
      code: 200,
      data: {
        summary: { unlocked: 0, total: 0, percentage: 0 },
        achievements: [],
      },
    })

    const wrapper = await mountPage()

    expect(wrapper.find('[data-testid="unlocked-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="unlocked-empty"]').text()).toContain('暂无解锁勋章')

    expect(wrapper.find('[data-testid="locked-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="locked-empty"]').text()).toContain('暂无可解锁勋章')
  })

  it('当只有未解锁勋章时，显示已解锁空态、隐藏未解锁空态', async () => {
    getUserAchievements.mockResolvedValueOnce({
      code: 200,
      data: {
        summary: { unlocked: 0, total: 1, percentage: 0 },
        achievements: [
          {
            id: 'finished_1',
            code: 'finished_1',
            name: '善始善终',
            description: '完成1本小说',
            icon: '✅',
            category: 'bookshelf',
            threshold: 1,
            currentValue: 0,
            unlocked: false,
            unlockedAt: null,
          },
        ],
      },
    })

    const wrapper = await mountPage()

    expect(wrapper.find('[data-testid="unlocked-empty"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="locked-empty"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="achievement-card"]')).toHaveLength(1)
  })
})

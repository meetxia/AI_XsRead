/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 11.4 — ChapterDrawer 分页与搜索
 *
 * 单元测试覆盖：
 *   - 初次打开仅渲染第 1 页 50 条章节
 *   - 滚动到列表底部 200px 内时触发下一页拉取（IntersectionObserver-style 触底回调）
 *   - 顶部搜索框基于已加载范围本地前缀过滤
 *   - 当本地范围内没有命中时，降级到后端 keyword 搜索
 *
 * Validates: Requirements 2.2, 2.3, 2.4, 2.6
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('@/api/novel', () => ({
  getChapterList: vi.fn()
}))

import { getChapterList } from '@/api/novel'
import ChapterDrawer from '../ChapterDrawer.vue'

const PAGE_SIZE = 50

function makeChapter(index) {
  return {
    id: index + 1,
    chapter_number: index + 1,
    title: `第${index + 1}章 章节${index + 1}`,
    word_count: 1500
  }
}

function makePage({ total, page, pageSize = PAGE_SIZE, keyword = '' }) {
  const start = (page - 1) * pageSize
  const end = Math.min(start + pageSize, total)
  let list = []
  for (let i = start; i < end; i += 1) list.push(makeChapter(i))
  if (keyword) {
    list = list.filter((ch) => ch.title.includes(keyword))
  }
  return {
    code: 200,
    data: {
      list,
      pagination: { total, page, pageSize }
    }
  }
}

async function mountDrawer({ total = 50, novelId = 42, keyword = '' } = {}) {
  getChapterList.mockImplementation(async (_id, params = {}) => {
    return makePage({
      total,
      page: params.page || 1,
      pageSize: params.pageSize || PAGE_SIZE,
      keyword: params.keyword || keyword
    })
  })

  const wrapper = mount(ChapterDrawer, {
    props: { visible: false, novelId, pageSize: PAGE_SIZE },
    attachTo: document.body
  })
  await wrapper.setProps({ visible: true })
  await flushPromises()
  return wrapper
}

describe('ChapterDrawer — Task 11.4 paging & search', () => {
  beforeEach(() => {
    getChapterList.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initial render shows first page (50 items) for a 1000-chapter novel', async () => {
    const wrapper = await mountDrawer({ total: 1000 })

    expect(getChapterList).toHaveBeenCalledTimes(1)
    expect(getChapterList.mock.calls[0][0]).toBe(42)
    expect(getChapterList.mock.calls[0][1]).toMatchObject({ page: 1, pageSize: PAGE_SIZE })

    const items = wrapper.findAll('.chapter-item')
    expect(items.length).toBe(PAGE_SIZE)
    expect(items[0].text()).toContain('第1章')
    expect(items[PAGE_SIZE - 1].text()).toContain(`第${PAGE_SIZE}章`)

    wrapper.unmount()
  })

  it('scrolling near bottom (within 200px) triggers next-page fetch', async () => {
    const wrapper = await mountDrawer({ total: 100 })
    expect(getChapterList).toHaveBeenCalledTimes(1)

    const list = wrapper.find('.chapter-list')
    const el = list.element
    // Stub layout metrics so the "near bottom" branch is satisfied.
    Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 5000 })
    Object.defineProperty(el, 'clientHeight', { configurable: true, value: 800 })
    Object.defineProperty(el, 'scrollTop', { configurable: true, writable: true, value: 4100 })

    await list.trigger('scroll')
    await flushPromises()

    expect(getChapterList).toHaveBeenCalledTimes(2)
    expect(getChapterList.mock.calls[1][1]).toMatchObject({ page: 2, pageSize: PAGE_SIZE })

    const items = wrapper.findAll('.chapter-item')
    expect(items.length).toBe(100)

    wrapper.unmount()
  })

  it('search input prefix-matches already-loaded chapters without re-fetch', async () => {
    vi.useFakeTimers()
    const wrapper = await mountDrawer({ total: 50 })
    expect(getChapterList).toHaveBeenCalledTimes(1)

    const input = wrapper.find('.search-input')
    await input.setValue('第7章')

    // The local computed filter is reactive; results update synchronously.
    const visibleTitles = wrapper.findAll('.chapter-title').map((node) => node.text())
    expect(visibleTitles.length).toBeGreaterThan(0)
    expect(visibleTitles.every((t) => t.includes('第7章') || t.includes('7'))).toBe(true)

    // The 250ms backend debounce has not fired yet — only the initial fetch happened.
    expect(getChapterList).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('falls back to backend keyword search after debounce when input changes', async () => {
    vi.useFakeTimers()
    const wrapper = await mountDrawer({ total: 50 })
    expect(getChapterList).toHaveBeenCalledTimes(1)

    const input = wrapper.find('.search-input')
    await input.setValue('完结')

    await vi.advanceTimersByTimeAsync(260)
    await flushPromises()

    expect(getChapterList).toHaveBeenCalledTimes(2)
    const lastCall = getChapterList.mock.calls[getChapterList.mock.calls.length - 1]
    expect(lastCall[1]).toMatchObject({ keyword: '完结', page: 1, pageSize: PAGE_SIZE })

    wrapper.unmount()
  })
})

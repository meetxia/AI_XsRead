/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 16.4 — useUserStats / WeekBarChart 归一化
 *
 * 单元测试覆盖：
 *   - formatMinutes 三档分支（< 60 / = 60 / > 60 向下取整）
 *   - weekTrend 空数据返回 []
 *   - WeekBarChart 高度按最大值归一化
 *   - WeekBarChart 在空数据时显示 "本周还没有阅读记录" 空态
 *
 * Validates: Requirements 14.3, 14.4, 14.5
 */
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/api/user', () => ({
  getUserStatistics: vi.fn().mockResolvedValue({ code: 200, data: {} })
}))

vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="typeof to === \'string\' ? to : \'#\'"><slot /></a>'
  }
}))

import { useUserStats } from '../useUserStats'
import WeekBarChart from '@/components/profile/WeekBarChart.vue'

describe('useUserStats — formatMinutes', () => {
  it('formats values < 60 as `${m}m`', () => {
    const { formatMinutes } = useUserStats()
    expect(formatMinutes(45)).toBe('45m')
    expect(formatMinutes(0)).toBe('0m')
    expect(formatMinutes(59)).toBe('59m')
  })

  it('formats 60 as `1h`', () => {
    const { formatMinutes } = useUserStats()
    expect(formatMinutes(60)).toBe('1h')
  })

  it('floors values > 60 to whole hours', () => {
    const { formatMinutes } = useUserStats()
    expect(formatMinutes(125)).toBe('2h')
    expect(formatMinutes(180)).toBe('3h')
    expect(formatMinutes(719)).toBe('11h')
  })
})

describe('useUserStats — weekTrend default', () => {
  it('returns [] when no stats are loaded yet', () => {
    const { weekTrend } = useUserStats()
    expect(weekTrend.value).toEqual([])
  })
})

describe('WeekBarChart — normalization & empty state', () => {
  it('normalizes bar heights against the weekly max', () => {
    const data = [
      { day: '一', minutes: 10 },
      { day: '二', minutes: 20 },
      { day: '三', minutes: 80 },
      { day: '四', minutes: 0 },
      { day: '五', minutes: 40 },
      { day: '六', minutes: 60 },
      { day: '日', minutes: 100 }
    ]
    const wrapper = mount(WeekBarChart, { props: { data } })
    const bars = wrapper.findAll('[style*="height"]').filter((node) => {
      const style = node.attributes('style') || ''
      return /height:\s*\d+%/.test(style)
    })

    expect(bars.length).toBe(7)

    // The bar with the max value (100) must be at 100% height; others ≤ that.
    const heights = bars.map((node) => {
      const m = (node.attributes('style') || '').match(/height:\s*(\d+)%/)
      return m ? Number(m[1]) : 0
    })
    expect(Math.max(...heights)).toBe(100)
    // No height exceeds the normalized 100%.
    heights.forEach((h) => expect(h).toBeLessThanOrEqual(100))

    // Strictly proportional except for the 8% floor that keeps tiny bars visible.
    // minutes=20 → 20/100*100=20% (above the 8% floor).
    expect(heights[1]).toBe(20)
    // minutes=10 → 10% (above the 8% floor).
    expect(heights[0]).toBe(10)
    // minutes=0 collapses to the 8% visual floor when the week has data.
    expect(heights[3]).toBe(8)
  })

  it('shows the empty state copy when total = 0', () => {
    const wrapper = mount(WeekBarChart, { props: { data: [] } })
    expect(wrapper.text()).toContain('本周还没有阅读记录')

    const wrapper2 = mount(WeekBarChart, {
      props: { data: [{ minutes: 0 }, { minutes: 0 }, { minutes: 0 }] }
    })
    expect(wrapper2.text()).toContain('本周还没有阅读记录')
  })
})

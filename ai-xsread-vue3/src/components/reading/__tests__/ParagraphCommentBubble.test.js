/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 26.2 — ParagraphCommentBubble.vue unit tests
 *
 * Acceptance:
 *   - count === 0 renders nothing
 *   - count > 0 renders a badge containing the number
 *   - click emits `open(paragraphIndex)`
 *
 * Validates: Requirements 27.2
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ParagraphCommentBubble from '../ParagraphCommentBubble.vue'

function mountBubble(props = {}) {
  return mount(ParagraphCommentBubble, {
    props: {
      count: 0,
      paragraphIndex: 0,
      ...props,
    },
  })
}

describe('ParagraphCommentBubble', () => {
  it('renders nothing when count is 0', () => {
    const wrapper = mountBubble({ count: 0, paragraphIndex: 4 })
    expect(wrapper.find('[data-testid="paragraph-comment-bubble"]').exists()).toBe(false)
    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('renders nothing for non-positive / non-finite counts', () => {
    expect(
      mountBubble({ count: -3, paragraphIndex: 1 }).find('[data-testid="paragraph-comment-bubble"]').exists()
    ).toBe(false)
    expect(
      mountBubble({ count: Number.NaN, paragraphIndex: 1 }).find('[data-testid="paragraph-comment-bubble"]').exists()
    ).toBe(false)
  })

  it('renders a clickable badge with the number when count > 0', () => {
    const wrapper = mountBubble({ count: 7, paragraphIndex: 12 })
    const bubble = wrapper.find('[data-testid="paragraph-comment-bubble"]')
    expect(bubble.exists()).toBe(true)
    expect(bubble.text()).toContain('7')
    expect(bubble.attributes('aria-label')).toBe('段评 7 条')
  })

  it('formats large counts as compact thousands', () => {
    const wrapper = mountBubble({ count: 1234, paragraphIndex: 0 })
    const bubble = wrapper.find('[data-testid="paragraph-comment-bubble"]')
    expect(bubble.text()).toContain('1.2k')
  })

  it('emits open(paragraphIndex) when clicked', async () => {
    const wrapper = mountBubble({ count: 3, paragraphIndex: 17 })
    await wrapper.find('[data-testid="paragraph-comment-bubble"]').trigger('click')
    expect(wrapper.emitted('open')).toHaveLength(1)
    expect(wrapper.emitted('open')[0]).toEqual([17])
  })

  it('does not emit when disabled', async () => {
    const wrapper = mountBubble({ count: 3, paragraphIndex: 5, disabled: true })
    const bubble = wrapper.find('[data-testid="paragraph-comment-bubble"]')
    expect(bubble.attributes('disabled')).toBeDefined()

    await bubble.trigger('click')
    expect(wrapper.emitted('open')).toBeFalsy()
  })

  it('uses sticky positioning + translate to avoid layout thrash', () => {
    const wrapper = mountBubble({ count: 3, paragraphIndex: 0 })
    // jsdom doesn't apply scoped stylesheets, but we can at least verify the
    // class is wired up so the CSS rule can target it in the browser.
    const bubble = wrapper.find('[data-testid="paragraph-comment-bubble"]')
    expect(bubble.classes()).toContain('paragraph-comment-bubble')
  })
})

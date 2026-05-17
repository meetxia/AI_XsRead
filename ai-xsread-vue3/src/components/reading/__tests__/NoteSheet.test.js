/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 25.1 — NoteSheet.vue 单元测试
 *
 * Acceptance:
 * - mount with originText, save emits submit with note when length ≤ 500
 * - submit button disabled when note > 500 chars
 * - cancel emits close
 */
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NoteSheet from '../NoteSheet.vue'

function mountSheet(props = {}) {
  return mount(NoteSheet, {
    props: {
      visible: true,
      originText: '山有木兮木有枝',
      ...props,
    },
  })
}

describe('NoteSheet', () => {
  it('renders origin text preview when visible', () => {
    const wrapper = mountSheet()
    expect(wrapper.find('[data-testid="note-origin"]').text()).toContain('山有木兮木有枝')
  })

  it('emits submit with note when length is within 500', async () => {
    const wrapper = mountSheet({ initialNote: '初读心动' })
    await nextTick()

    const textarea = wrapper.find('[data-testid="note-textarea"]')
    await textarea.setValue('这一段写得真好，回头还想再读一遍。')

    const submitBtn = wrapper.find('[data-testid="note-submit"]')
    expect(submitBtn.attributes('disabled')).toBeUndefined()

    await submitBtn.trigger('click')
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('submit')[0][0]).toEqual({ note: '这一段写得真好，回头还想再读一遍。' })
  })

  it('disables submit button when note exceeds 500 chars', async () => {
    const wrapper = mountSheet()
    await nextTick()

    const longText = '想'.repeat(501)
    const textarea = wrapper.find('[data-testid="note-textarea"]')
    await textarea.setValue(longText)

    const submitBtn = wrapper.find('[data-testid="note-submit"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()

    const counter = wrapper.find('[data-testid="note-counter"]')
    expect(counter.text()).toContain('501')
    expect(counter.text()).toContain('500')

    await submitBtn.trigger('click')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('enables submit button right at boundary length 500', async () => {
    const wrapper = mountSheet()
    await nextTick()

    const text = '想'.repeat(500)
    await wrapper.find('[data-testid="note-textarea"]').setValue(text)

    const submitBtn = wrapper.find('[data-testid="note-submit"]')
    expect(submitBtn.attributes('disabled')).toBeUndefined()
  })

  it('emits close when cancel button is clicked', async () => {
    const wrapper = mountSheet()
    await nextTick()

    await wrapper.find('[data-testid="note-cancel"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('emits close when overlay is clicked', async () => {
    const wrapper = mountSheet()
    await nextTick()

    await wrapper.find('[data-testid="note-overlay"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not render sheet when visible=false', () => {
    const wrapper = mountSheet({ visible: false })
    expect(wrapper.find('[data-testid="note-sheet"]').exists()).toBe(false)
  })

  it('initialNote populates textarea on open', async () => {
    const wrapper = mountSheet({ initialNote: '已存想法' })
    await nextTick()

    const textarea = wrapper.find('[data-testid="note-textarea"]')
    expect(textarea.element.value).toBe('已存想法')
  })
})

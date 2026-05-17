/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 23.2 — useHighlightToolbar composable
 *
 * Listens to document `selectionchange` / `mouseup` / `touchend`. When a Selection
 * covers ≥ 1 character inside `containerRef`, computes the toolbar position
 * relative to viewport (range.getBoundingClientRect() + clamp x to [8, vw - 8]).
 *
 * Exposes reactive `state = { visible, x, y, text, paragraphIndex, startOffset, endOffset }`.
 * `compact.value === true` when the viewport width is ≤ 480px (covers the 360px
 * mobile breakpoint required by Requirement 25.8 for the single-row layout).
 *
 * Closes (`visible = false`) when:
 *   - selection becomes empty;
 *   - a click happens outside `containerRef.value`.
 *
 * Validates: Requirements 25.1, 25.7, 25.8
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, unref } from 'vue'

const COMPACT_BREAKPOINT = 480
const TOOLBAR_OFFSET = 8

function clamp(value, min, max) {
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

function getViewportWidth() {
  if (typeof window === 'undefined') return 0
  return window.innerWidth || document.documentElement?.clientWidth || 0
}

function findParagraphElement(node) {
  let cur = node
  if (cur && cur.nodeType === 3 /* TEXT_NODE */) cur = cur.parentNode
  while (cur && cur.nodeType === 1 /* ELEMENT_NODE */) {
    const idx = cur.dataset?.paragraphIndex
    if (idx !== undefined && idx !== '') return cur
    cur = cur.parentNode
  }
  return null
}

function charOffsetWithin(root, node, offset) {
  if (!root) return Number(offset) || 0
  if (typeof document === 'undefined' || !document.createTreeWalker) {
    return Number(offset) || 0
  }
  // NodeFilter.SHOW_TEXT === 4
  const walker = document.createTreeWalker(root, 4)
  let count = 0
  let current = walker.nextNode()
  while (current) {
    if (current === node) return count + (Number(offset) || 0)
    count += current.textContent ? current.textContent.length : 0
    current = walker.nextNode()
  }
  // node not found inside root → conservative fallback
  return count
}

export function useHighlightToolbar({ containerRef } = {}) {
  const state = reactive({
    visible: false,
    x: 0,
    y: 0,
    text: '',
    paragraphIndex: 0,
    startOffset: 0,
    endOffset: 0,
  })

  const viewportWidth = ref(getViewportWidth())
  const compact = computed(() => viewportWidth.value > 0 && viewportWidth.value <= COMPACT_BREAKPOINT)

  function hide() {
    state.visible = false
    state.text = ''
  }

  function readSelection() {
    if (typeof window === 'undefined') return null
    const selection = window.getSelection ? window.getSelection() : null
    if (!selection) return null
    const text = typeof selection.toString === 'function' ? selection.toString() : ''
    if (!text || text.length < 1) return null
    if (typeof selection.rangeCount === 'number' && selection.rangeCount < 1) return null
    let range = null
    try {
      range = selection.getRangeAt(0)
    } catch {
      range = null
    }
    if (!range) return null
    return { selection, range, text }
  }

  function refresh() {
    const container = unref(containerRef)
    if (!container) {
      hide()
      return
    }
    const snapshot = readSelection()
    if (!snapshot) {
      hide()
      return
    }
    const { range, text } = snapshot
    if (!container.contains(range.commonAncestorContainer)) {
      hide()
      return
    }

    const startPara = findParagraphElement(range.startContainer)
    const endPara = findParagraphElement(range.endContainer) || startPara
    const para = startPara || endPara
    const paragraphIndex = para ? Number(para.dataset.paragraphIndex) || 0 : 0

    const startOffset = startPara
      ? charOffsetWithin(startPara, range.startContainer, range.startOffset)
      : 0
    const endOffset = endPara
      ? charOffsetWithin(endPara, range.endContainer, range.endOffset)
      : startOffset + text.length

    let x = 0
    let y = 0
    try {
      const rect = range.getBoundingClientRect()
      const vw = getViewportWidth()
      viewportWidth.value = vw || viewportWidth.value
      const center = rect.left + rect.width / 2
      x = clamp(center, TOOLBAR_OFFSET, Math.max(TOOLBAR_OFFSET, (vw || viewportWidth.value) - TOOLBAR_OFFSET))
      y = Math.max(TOOLBAR_OFFSET, rect.top - TOOLBAR_OFFSET)
    } catch {
      x = TOOLBAR_OFFSET
      y = TOOLBAR_OFFSET
    }

    state.visible = true
    state.x = x
    state.y = y
    state.text = text
    state.paragraphIndex = paragraphIndex
    state.startOffset = Math.min(startOffset, endOffset)
    state.endOffset = Math.max(startOffset, endOffset)
  }

  let pointerTimer = null
  function schedulePointerRefresh() {
    if (pointerTimer) clearTimeout(pointerTimer)
    pointerTimer = setTimeout(() => {
      pointerTimer = null
      refresh()
    }, 0)
  }

  function handleSelectionChange() {
    refresh()
  }

  function handleOutsideClick(event) {
    const container = unref(containerRef)
    if (!container) return
    const target = event?.target
    if (target && container.contains(target)) return
    hide()
  }

  function handleResize() {
    viewportWidth.value = getViewportWidth()
  }

  function attach() {
    if (typeof document === 'undefined') return
    document.addEventListener('selectionchange', handleSelectionChange)
    document.addEventListener('mouseup', schedulePointerRefresh)
    document.addEventListener('touchend', schedulePointerRefresh)
    document.addEventListener('mousedown', handleOutsideClick, true)
    document.addEventListener('touchstart', handleOutsideClick, true)
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }
    handleResize()
  }

  function detach() {
    if (typeof document === 'undefined') return
    document.removeEventListener('selectionchange', handleSelectionChange)
    document.removeEventListener('mouseup', schedulePointerRefresh)
    document.removeEventListener('touchend', schedulePointerRefresh)
    document.removeEventListener('mousedown', handleOutsideClick, true)
    document.removeEventListener('touchstart', handleOutsideClick, true)
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
    }
    if (pointerTimer) {
      clearTimeout(pointerTimer)
      pointerTimer = null
    }
  }

  onMounted(attach)
  onBeforeUnmount(detach)

  return {
    state,
    hide,
    refresh,
    compact,
    // Internal hooks exposed for unit tests / non-Vue callers
    _attach: attach,
    _detach: detach,
  }
}

export default useHighlightToolbar

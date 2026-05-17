import { onBeforeUnmount, onMounted } from 'vue'

const EDGE_GUARD_PX = 12
const SWIPE_DISTANCE_PX = 50
const SWIPE_DURATION_MS = 300

/**
 * Pure decision function used by usePageFlip and PBT tests.
 * Maps gesture / tap geometry to an action without DOM side effects.
 *
 * @param {Object} input
 * @param {'scroll'|'tap'|'swipe'} input.mode - active page flip mode.
 * @param {number} input.startX - touch / click start X (CSS pixels).
 * @param {number} [input.endX] - swipe end X (defaults to startX for taps).
 * @param {number} [input.dy] - vertical delta (defaults to 0 for taps).
 * @param {number} [input.duration] - gesture duration in ms (defaults to 0).
 * @param {number} input.viewportWidth - visible viewport width.
 * @returns {'prev'|'next'|'toggle'|'ignore'}
 */
export function decideAction({
  mode,
  startX,
  endX,
  dy = 0,
  duration = 0,
  viewportWidth
}) {
  const width = Number(viewportWidth) || 0
  if (width <= 0) return 'ignore'

  const sx = Number(startX)
  if (!Number.isFinite(sx) || sx < 0 || sx > width) return 'ignore'

  const ex = Number.isFinite(Number(endX)) ? Number(endX) : sx
  const dx = ex - sx
  const absDx = Math.abs(dx)
  const absDy = Math.abs(Number(dy) || 0)
  const dur = Number(duration) || 0

  // iOS edge swipe guard — only meaningful for swipe gestures, where the
  // browser may steal the gesture as "swipe to go back".
  const isEdge = sx <= EDGE_GUARD_PX || sx >= width - EDGE_GUARD_PX

  if (mode === 'swipe') {
    if (isEdge) return 'ignore'
    if (absDy > 0) return 'ignore'
    if (dur > SWIPE_DURATION_MS) return 'ignore'
    if (absDx < SWIPE_DISTANCE_PX) return 'ignore'
    return dx < 0 ? 'next' : 'prev'
  }

  if (mode === 'tap') {
    // Long swipe-like gestures inside tap mode → ignore (avoid swipe scroll).
    if (absDx >= SWIPE_DISTANCE_PX || dur > SWIPE_DURATION_MS) {
      // Treat as a swipe attempt; honour the same edge / dy guards.
      if (isEdge || absDy > 0) return 'ignore'
      return dx < 0 ? 'next' : 'prev'
    }
    if (sx < width / 3) return 'prev'
    if (sx >= (width / 3) * 2) return 'next'
    return 'toggle'
  }

  // scroll mode keeps native scroll; clicks toggle the toolbar.
  return 'toggle'
}

export function usePageFlip(targetRef, settings, handlers = {}) {
  let startX = 0
  let startY = 0
  let startTime = 0
  let pageIndex = 0

  function pageHeight() {
    return Math.max(240, window.innerHeight - 120)
  }

  function scrollPage(direction) {
    window.scrollBy({ top: direction * pageHeight(), behavior: 'smooth' })
  }

  function prevPage() {
    if (settings.pageFlipMode === 'scroll') scrollPage(-1)
    else pageIndex = Math.max(0, pageIndex - 1)
    handlers.onPrev?.(pageIndex)
  }

  function nextPage() {
    if (settings.pageFlipMode === 'scroll') scrollPage(1)
    else pageIndex += 1
    handlers.onNext?.(pageIndex)
  }

  function handleClick(event) {
    if (event.target.closest('button, a, input, textarea, [data-ignore-pageflip]')) return
    const x = event.clientX
    const width = window.innerWidth

    if (settings.pageFlipMode === 'tap') {
      const action = decideAction({
        mode: 'tap',
        startX: x,
        endX: x,
        dy: 0,
        duration: 0,
        viewportWidth: width
      })
      if (action === 'prev') return prevPage()
      if (action === 'next') return nextPage()
    }
    handlers.onCenterTap?.(event)
  }

  function handleTouchStart(event) {
    const touch = event.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    startTime = Date.now()
  }

  function handleTouchEnd(event) {
    const touch = event.changedTouches[0]
    const action = decideAction({
      mode: settings.pageFlipMode === 'swipe' ? 'swipe' : settings.pageFlipMode,
      startX,
      endX: touch.clientX,
      dy: touch.clientY - startY,
      duration: Date.now() - startTime,
      viewportWidth: window.innerWidth
    })
    if (action === 'next') nextPage()
    else if (action === 'prev') prevPage()
  }

  function mount() {
    const target = targetRef.value
    if (!target) return
    target.addEventListener('click', handleClick)
    target.addEventListener('touchstart', handleTouchStart, { passive: true })
    target.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  function cleanup() {
    const target = targetRef.value
    if (!target) return
    target.removeEventListener('click', handleClick)
    target.removeEventListener('touchstart', handleTouchStart)
    target.removeEventListener('touchend', handleTouchEnd)
  }

  onMounted(mount)
  onBeforeUnmount(cleanup)

  return { prevPage, nextPage, mount, cleanup }
}

export default usePageFlip

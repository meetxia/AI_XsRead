import { computed, nextTick, onBeforeUnmount, ref, unref, watch } from 'vue'

export async function computeParagraphHash(text = '') {
  const source = String(text).slice(0, 50)
  if (crypto?.subtle) {
    const data = new TextEncoder().encode(source)
    const digest = await crypto.subtle.digest('SHA-1', data)
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
  }
  return fallbackHash(source)
}

function fallbackHash(text) {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16)
}

export function normalizeParagraphs(content) {
  if (Array.isArray(content)) return content.map((item) => String(item).trim()).filter(Boolean)
  return String(content || '').split(/\n+/).map((item) => item.trim()).filter(Boolean)
}

export function useParagraphAnchor({ containerRef, paragraphs, chapterId } = {}) {
  const currentAnchor = ref(null)
  const paragraphHashes = ref([])
  const activeIndex = ref(0)
  let observer = null
  let settleTimer = null

  const paragraphList = computed(() => normalizeParagraphs(unref(paragraphs) || []))

  async function rebuildHashes() {
    paragraphHashes.value = await Promise.all(paragraphList.value.map((item) => computeParagraphHash(item)))
  }

  function makeAnchor(index, charOffset = 0) {
    const paragraphIndex = Math.max(0, Math.min(index, paragraphList.value.length - 1))
    return {
      chapterId: Number(unref(chapterId)),
      paragraphIndex,
      paragraphHash: paragraphHashes.value[paragraphIndex] || '',
      charOffset,
      preview: paragraphList.value[paragraphIndex]?.slice(0, 60) || '',
    }
  }

  function setCurrentIndex(index) {
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      activeIndex.value = index
      currentAnchor.value = makeAnchor(index)
    }, 1000)
  }

  function disconnect() {
    observer?.disconnect()
    observer = null
    clearTimeout(settleTimer)
  }

  async function observe() {
    disconnect()
    await nextTick()
    await rebuildHashes()

    const container = unref(containerRef)
    if (!container) return

    const nodes = Array.from(container.querySelectorAll('[data-paragraph-index]'))
    if (!nodes.length) return

    const centerLine = window.innerHeight / 2
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => {
            const rect = entry.target.getBoundingClientRect()
            return {
              index: Number(entry.target.dataset.paragraphIndex),
              distance: Math.abs(rect.top + rect.height / 2 - centerLine),
            }
          })
          .sort((a, b) => a.distance - b.distance)

        if (visible[0]) setCurrentIndex(visible[0].index)
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: '-35% 0px -35% 0px' }
    )

    nodes.forEach((node) => observer.observe(node))
    currentAnchor.value = makeAnchor(activeIndex.value)
  }

  async function restore(anchor, behavior = 'auto') {
    await nextTick()
    const container = unref(containerRef)
    if (!container || !anchor) return false

    let index = Number(anchor.paragraphIndex ?? anchor.paragraph_index ?? 0)
    const hash = anchor.paragraphHash || anchor.paragraph_hash

    if (hash && paragraphHashes.value[index] !== hash) {
      const found = paragraphHashes.value.findIndex((item) => item === hash)
      if (found >= 0) index = found
    }

    const node = container.querySelector(`[data-paragraph-index="${index}"]`)
    if (!node) return false
    node.scrollIntoView({ block: 'center', behavior })
    activeIndex.value = index
    currentAnchor.value = makeAnchor(index, anchor.charOffset || anchor.char_offset || 0)
    return true
  }

  watch(paragraphList, observe, { flush: 'post' })
  watch(() => unref(chapterId), observe, { flush: 'post' })
  onBeforeUnmount(disconnect)

  return {
    currentAnchor,
    activeIndex,
    paragraphHashes,
    makeAnchor,
    observe,
    restore,
    rebuildHashes,
  }
}

export default useParagraphAnchor

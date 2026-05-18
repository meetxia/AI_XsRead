<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import BookmarkSheet from '@/components/reading/BookmarkSheet.vue'
import ChapterDrawer from '@/components/reading/ChapterDrawer.vue'
import HighlightToolbar from '@/components/reading/HighlightToolbar.vue'
import PageFlipController from '@/components/reading/PageFlipController.vue'
import ParagraphCommentBubble from '@/components/reading/ParagraphCommentBubble.vue'
import ParagraphCommentSheet from '@/components/reading/ParagraphCommentSheet.vue'
import SettingPanel from '@/components/reading/SettingPanel.vue'
import TTSControlBar from '@/components/reading/TTSControlBar.vue'
import MembershipWall from '@/components/membership/MembershipWall.vue'
import { useTheme } from '@/composables/useTheme'
import { useReadingSettings } from '@/composables/useReadingSettings'
import { useParagraphAnchor } from '@/composables/useParagraphAnchor'
import { useParagraphCommentBubble } from '@/composables/useParagraphCommentBubble'
import { useReadingHeartbeat } from '@/composables/useReadingHeartbeat'
import { useReturnUrl } from '@/composables/useReturnUrl'
import { useTTS } from '@/composables/useTTS'
import { useWakeLock } from '@/composables/useWakeLock'
import { useHighlightRenderer } from '@/composables/useHighlightRenderer'
import { useHighlightsStore } from '@/stores/highlights'
import { createBookmark, deleteBookmark, listMyBookmarks } from '@/api/bookmarks'
import { createHighlight } from '@/api/highlights'
import { createParagraphComment, deleteParagraphComment, listParagraphComments } from '@/api/paragraphComments'
import { getChapterContent, getChapterList, downloadNovelTxt } from '@/api/novel'
import { getReadingProgress, updateReadingProgress } from '@/api/user'
import { mergeProgress } from '@/composables/useReadingProgress'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { toggleMode } = useTheme()
const { buildLoginUrl } = useReturnUrl()
const { settings, applyToDocument } = useReadingSettings()

const novelId = computed(() => route.params.id)
const currentChapterId = ref(route.query.chapter ? Number(route.query.chapter) : null)
const novelTitle = ref('加载中…')

/** 智能返回：优先浏览器历史后退，无历史时 fallback 到详情页 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace(`/novel/${novelId.value}`)
  }
}
const chapterTitle = ref('')
const chapterIndex = ref(0)
const totalChapters = ref(0)
const wordCount = ref(0)
const chapterDate = ref('')
const readingMinutes = computed(() => Math.max(1, Math.round(wordCount.value / 350)))

const chapterIds = ref([])
const currentChapterPos = computed(() => chapterIds.value.indexOf(currentChapterId.value))
const hasPrev = computed(() => currentChapterPos.value > 0)
const hasNext = computed(() => currentChapterPos.value >= 0 && currentChapterPos.value < chapterIds.value.length - 1)

const content = ref([])
const contentLoading = ref(true)
const readerRef = ref(null)
const progressPercent = ref(0)
const toolbarVisible = ref(true)
const showSettings = ref(false)
const showChapters = ref(false)
const showBookmarks = ref(false)

// VIP 试读相关
const vipRequired = ref(false)
const vipTruncated = ref(false)
const trialLength = ref(1500)
const toastMessage = ref('')
let toastTimer = null
const downloadLoading = ref(false)

const bookmarkLoading = ref(false)
const bookmarks = ref([])
const bookmarkPressTimer = ref(null)
const bookmarkPressActive = ref(false)
const longPressTriggered = ref(false)

const highlightToolbar = ref({ visible: false, x: 0, y: 0, text: '', paragraphIndex: 0 })
const commentSheet = ref({ visible: false, loading: false, comments: [], paragraphIndex: 0, preview: '' })
const ttsHighlightIndex = ref(-1)
let ttsHighlightTimer = null

const activeBookmark = computed(() => {
  const anchor = currentAnchor.value
  if (!anchor) return null
  return bookmarks.value.find((item) => {
    const itemChapter = Number(item.chapterId || item.chapter_id)
    const itemIndex = Number(item.paragraphIndex ?? item.paragraph_index)
    return itemChapter === Number(anchor.chapterId) && itemIndex === Number(anchor.paragraphIndex)
  })
})

const {
  currentAnchor,
  activeIndex,
  observe: observeParagraphs,
  restore: restoreParagraph,
} = useParagraphAnchor({
  containerRef: readerRef,
  paragraphs: content,
  chapterId: currentChapterId,
})

// Task 26.4 / 26.5 — paragraph comment bubble + 5-min cache
const {
  counts: paragraphCommentCounts,
  loadCounts: loadParagraphCommentCounts,
  bumpCount: bumpParagraphCommentCount,
  invalidate: invalidateParagraphCommentCache,
} = useParagraphCommentBubble({
  novelId: computed(() => Number(novelId.value)),
  chapterId: currentChapterId,
})

// Task 23.4 — restore chapter highlights as <mark> wrappers after rendering.
const highlightsStore = useHighlightsStore()
const {
  refresh: refreshHighlights,
  renderToDOM: renderHighlightsToDOM,
} = useHighlightRenderer({
  containerRef: readerRef,
  novelId: computed(() => Number(novelId.value)),
  chapterId: currentChapterId,
  paragraphsRef: content,
})

const ttsVisible = ref(false)
const tts = useTTS({
  paragraphs: content,
  defaultRate: settings.ttsRate,
  defaultVoiceId: settings.ttsVoiceURI,
  onIndexChange: (index) => {
    ttsHighlightIndex.value = index
    clearTimeout(ttsHighlightTimer)
    ttsHighlightTimer = setTimeout(() => {
      // After 300ms fade — keep value (CSS-driven fade), no need to reset.
    }, 300)
    nextTick(() => {
      readerRef.value
        ?.querySelector(`[data-paragraph-index="${index}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  },
  onFinish: async () => {
    if (hasNext.value) {
      await loadNextChapterForTts()
    } else {
      ttsVisible.value = false
      ttsHighlightIndex.value = -1
    }
  },
  onUnsupported: () => {
    ttsVisible.value = false
    showToast('当前浏览器暂不支持听书')
  },
})
const ttsPlaying = tts.playing
const ttsRate = tts.rate
const ttsVoices = tts.voices
const ttsVoiceId = tts.currentVoiceId
const ttsCurrentIndex = tts.currentIndex
const ttsSupported = tts.supported
const ttsPreview = computed(() => content.value[ttsCurrentIndex.value]?.slice(0, 60) || '')

watch(() => settings.ttsRate, (value) => tts.setRate(value))
watch(() => settings.ttsVoiceURI, (value) => {
  if (value && value !== ttsVoiceId.value) tts.setVoice(value)
})
watch(ttsVoiceId, (value) => {
  if (value && value !== settings.ttsVoiceURI) settings.ttsVoiceURI = value
})

const heartbeat = useReadingHeartbeat({
  onBeat: (duration) => saveProgress({ duration }),
})

const wakeLock = useWakeLock(computed(() => settings.keepAwake))

function showToast(message) {
  toastMessage.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 1800)
}

function toggleToolbar() {
  toolbarVisible.value = !toolbarVisible.value
}

function requireLogin() {
  if (userStore.isLogin) return true
  router.push(buildLoginUrl(route.fullPath))
  return false
}

async function downloadTxt() {
  if (!requireLogin() || downloadLoading.value) return
  downloadLoading.value = true
  try {
    await downloadNovelTxt(novelId.value)
    showToast('TXT 下载已开始')
  } catch (error) {
    if (error?.response?.status === 403) {
      showToast('VIP会员才能下载整本书')
    } else {
      showToast(error?.message || '下载失败，请稍后再试')
    }
  } finally {
    downloadLoading.value = false
  }
}

function scrollVirtualPage(direction) {
  window.scrollBy({ top: direction * Math.max(240, window.innerHeight - 120), behavior: 'smooth' })
}

function prevPage() {
  if (settings.pageFlipMode === 'scroll') scrollVirtualPage(-1)
  else scrollVirtualPage(-1)
}

function nextPage() {
  if (settings.pageFlipMode === 'scroll') scrollVirtualPage(1)
  else scrollVirtualPage(1)
}

function calcProgress() {
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  progressPercent.value = docHeight <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((window.scrollY / docHeight) * 100)))
}

function onSliderChange(event) {
  const pct = Number(event.target.value)
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({ top: (pct / 100) * docHeight, behavior: 'auto' })
}

async function saveProgress(extra = {}) {
  if (!userStore.isLogin || !novelId.value || !currentChapterId.value) return
  const anchor = currentAnchor.value
  try {
    await updateReadingProgress({
      novelId: Number(novelId.value),
      chapterId: Number(currentChapterId.value),
      progress: progressPercent.value,
      paragraphIndex: anchor?.paragraphIndex,
      paragraphHash: anchor?.paragraphHash,
      charOffset: anchor?.charOffset || 0,
      ...extra,
    })
    // Task 19.4 — keep localStorage snapshot in sync so the next chapter
    // visit / cross-device merge has up-to-date data.
    writeLocalProgress({
      chapterId: Number(currentChapterId.value),
      paragraphIndex: anchor?.paragraphIndex ?? null,
      paragraphHash: anchor?.paragraphHash ?? null,
      charOffset: anchor?.charOffset || 0,
      progress: progressPercent.value,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.warn('[reading] save progress failed', error)
  }
}

// ---- Task 19.3 / 19.4: server anchor + local merge + sendBeacon flush ----
const serverAnchor = ref(null)

function localProgressKey() {
  return `reading-progress-${novelId.value}`
}

function readLocalProgress() {
  try {
    const raw = localStorage.getItem(localProgressKey())
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

function writeLocalProgress(snapshot) {
  if (!snapshot || !novelId.value) return
  try {
    const payload = { ...snapshot, updatedAt: snapshot.updatedAt || Date.now() }
    localStorage.setItem(localProgressKey(), JSON.stringify(payload))
  } catch (error) {
    /* quota / SSR — ignore */
  }
}

function normalizeServerProgress(raw) {
  if (!raw) return null
  return {
    chapterId: Number(raw.chapter_id ?? raw.chapterId) || null,
    paragraphIndex: raw.paragraph_index ?? raw.paragraphIndex ?? null,
    paragraphHash: raw.paragraph_hash ?? raw.paragraphHash ?? null,
    charOffset: raw.char_offset ?? raw.charOffset ?? 0,
    progress: Number(raw.progress) || 0,
    updatedAt: raw.updated_at || raw.updatedAt
      ? new Date(raw.updated_at || raw.updatedAt).getTime()
      : 0,
  }
}

// Task 19.3 — fetch server anchor before loading chapter content so we can
// scrollIntoView the matching paragraph.  Task 19.4 — merge with local
// snapshot via mergeProgress(local, server) (argmax updatedAt) and persist
// the winner back to both sides.
async function loadServerAnchor() {
  if (!userStore.isLogin || !novelId.value) return null
  const local = readLocalProgress()
  let server = null
  try {
    const res = await getReadingProgress(novelId.value)
    if (res?.code === 200 && res.data) server = normalizeServerProgress(res.data)
  } catch (error) {
    console.warn('[reading] load server anchor failed', error)
  }
  const winner = mergeProgress(local, server)
  serverAnchor.value = winner
  if (winner) writeLocalProgress(winner)
  return winner
}

function buildBeaconPayload() {
  if (!userStore.isLogin || !novelId.value || !currentChapterId.value) return null
  const anchor = currentAnchor.value
  return {
    novelId: Number(novelId.value),
    chapterId: Number(currentChapterId.value),
    progress: progressPercent.value,
    paragraphIndex: anchor?.paragraphIndex,
    paragraphHash: anchor?.paragraphHash,
    charOffset: anchor?.charOffset || 0,
  }
}

// Task 19.4 — fire-and-forget flush on unmount.  Prefer navigator.sendBeacon
// because it survives page unload; if unavailable, fall back to fetch with
// keepalive: true so the request can still complete during navigation.
function flushProgressBeacon() {
  const payload = buildBeaconPayload()
  if (!payload) return false
  const url = '/api/user/reading-progress'
  const body = JSON.stringify(payload)
  let token = null
  try { token = localStorage.getItem('token') } catch { token = null }
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon(url, blob)) return true
    } catch (error) {
      /* fall through */
    }
  }
  if (typeof fetch === 'function') {
    try {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
        keepalive: true,
      }).catch(() => {})
      return true
    } catch (error) {
      return false
    }
  }
  return false
}

async function loadChapterList() {
  if (!novelId.value || novelId.value === 'demo') return
  try {
    const res = await getChapterList(novelId.value, { page: 1, pageSize: 200 })
    if (res?.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.chapters || [])
      chapterIds.value = list.map((item) => Number(item.id || item.chapter_id)).filter(Boolean)
      totalChapters.value = res.data?.pagination?.total || res.data?.total || list.length
    }
  } catch (error) {
    console.warn('[reading] load chapter list failed', error)
  }
}

async function loadChapter(chapterId, { restoreAnchor } = {}) {
  if (!chapterId) {
    if (chapterIds.value.length) return loadChapter(chapterIds.value[0], { restoreAnchor })
    contentLoading.value = false
    content.value = ['暂无章节内容。']
    return
  }

  contentLoading.value = true
  // 重置 VIP 状态——会在响应里被重新赋值
  vipRequired.value = false
  vipTruncated.value = false
  try {
    const res = await getChapterContent(chapterId)
    if (res?.code === 200 && res.data) {
      const data = res.data
      currentChapterId.value = Number(chapterId)
      chapterTitle.value = data.title || ''
      chapterIndex.value = data.chapter_number || data.chapterNumber || 0
      wordCount.value = data.word_count || data.wordCount || 0
      chapterDate.value = (data.created_at || data.createdAt || '').slice(0, 10)
      novelTitle.value = data.novel_title || data.novelTitle || novelTitle.value
      content.value = data.content
        ? String(data.content).split(/\n+/).map((item) => item.trim()).filter(Boolean)
        : ['本章暂无内容。']
      // 后端 VIP gating 字段
      vipRequired.value = Boolean(data.vip_required ?? data.vipRequired ?? false)
      vipTruncated.value = Boolean(data.truncated ?? false)
      trialLength.value = Number(data.trial_length ?? data.trialLength ?? 1500) || 1500
    }
  } catch (error) {
    content.value = ['章节加载失败，请返回重试。']
  } finally {
    contentLoading.value = false
    await nextTick()
    await observeParagraphs()
    if (restoreAnchor) await restoreParagraph(restoreAnchor)
    else window.scrollTo({ top: 0, behavior: 'auto' })
    calcProgress()
    loadBookmarks()
    // Task 23.4 — re-render persisted <mark> wrappers for this chapter.
    refreshHighlights({ force: false }).catch((err) => {
      console.warn('[reading] load highlights failed', err)
    })
    // Task 26.5 — fetch aggregate paragraph comment counts after chapter ready.
    loadParagraphCommentCounts().catch((err) => {
      console.warn('[reading] load paragraph comment counts failed', err)
    })
  }
}

// MembershipWall 触发条件：vip_required && truncated
const showMembershipWall = computed(
  () => vipRequired.value && vipTruncated.value
)

async function onMembershipActivated() {
  if (import.meta.env.DEV) {
    console.log('[reading] activated, reloading chapter content')
  }
  // 激活成功后重新拉取当前章节内容（不再 truncated）
  if (currentChapterId.value) {
    await loadChapter(currentChapterId.value)
  }
}

async function changeChapter(chapterId) {
  if (!chapterId || Number(chapterId) === Number(currentChapterId.value)) return
  await saveProgress()
  router.replace({ query: { ...route.query, chapter: chapterId } })
}

async function goPrev() {
  if (hasPrev.value) await changeChapter(chapterIds.value[currentChapterPos.value - 1])
}

async function goNext() {
  if (hasNext.value) await changeChapter(chapterIds.value[currentChapterPos.value + 1])
}

function normalizeBookmark(item) {
  return {
    ...item,
    id: item.id,
    chapterId: item.chapterId || item.chapter_id,
    chapterTitle: item.chapterTitle || item.chapter_title || item.chapterName,
    paragraphIndex: item.paragraphIndex ?? item.paragraph_index,
    paragraphHash: item.paragraphHash || item.paragraph_hash,
    preview: item.preview || item.content_preview || item.note || '',
  }
}

async function loadBookmarks() {
  if (!userStore.isLogin || !novelId.value) return
  bookmarkLoading.value = true
  try {
    const res = await listMyBookmarks({ novelId: Number(novelId.value), page: 1, pageSize: 100 })
    if (res?.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.bookmarks || [])
      bookmarks.value = list.map(normalizeBookmark)
    }
  } catch (error) {
    console.warn('[reading] load bookmarks failed', error)
  } finally {
    bookmarkLoading.value = false
  }
}

async function toggleBookmark() {
  if (!requireLogin()) return
  const anchor = currentAnchor.value
  if (!anchor) return showToast('还没有定位到段落')

  const existing = activeBookmark.value
  try {
    if (existing?.id) {
      await deleteBookmark(existing.id)
      bookmarks.value = bookmarks.value.filter((item) => item.id !== existing.id)
      showToast('已删除书签')
      return
    }

    const res = await createBookmark({
      novelId: Number(novelId.value),
      chapterId: Number(currentChapterId.value),
      paragraphIndex: anchor.paragraphIndex,
      paragraphHash: anchor.paragraphHash,
      charOffset: anchor.charOffset || 0,
      note: anchor.preview?.slice(0, 80) || '',
    })
    if (res?.code === 200 || res?.code === 201) {
      bookmarks.value.unshift(normalizeBookmark(res.data || { ...anchor, id: Date.now(), chapterTitle: chapterTitle.value }))
      showToast('已加书签')
    }
  } catch (error) {
    showToast('书签操作失败')
  }
}

function startBookmarkPress() {
  bookmarkPressActive.value = true
  longPressTriggered.value = false
  clearTimeout(bookmarkPressTimer.value)
  bookmarkPressTimer.value = setTimeout(() => {
    longPressTriggered.value = true
    if (requireLogin()) {
      showBookmarks.value = true
      loadBookmarks()
    }
  }, 500)
}

function endBookmarkPress() {
  if (!bookmarkPressActive.value) return
  bookmarkPressActive.value = false
  clearTimeout(bookmarkPressTimer.value)
  if (!longPressTriggered.value) toggleBookmark()
}

async function selectBookmark(item) {
  showBookmarks.value = false
  const targetChapter = Number(item.chapterId || item.chapter_id)
  const anchor = {
    paragraphIndex: item.paragraphIndex ?? item.paragraph_index,
    paragraphHash: item.paragraphHash || item.paragraph_hash,
    charOffset: item.charOffset || item.char_offset || 0,
  }
  if (targetChapter && targetChapter !== Number(currentChapterId.value)) {
    router.replace({ query: { ...route.query, chapter: targetChapter } })
    await loadChapter(targetChapter, { restoreAnchor: anchor })
  } else {
    await restoreParagraph(anchor, 'smooth')
  }
}

async function removeBookmark(item) {
  if (!item?.id || !confirm('删除这个书签？')) return
  await deleteBookmark(item.id)
  bookmarks.value = bookmarks.value.filter((bookmark) => bookmark.id !== item.id)
}

function handleSelection() {
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  if (!text || !readerRef.value || !selection.rangeCount) {
    highlightToolbar.value.visible = false
    return
  }
  const range = selection.getRangeAt(0)
  if (!readerRef.value.contains(range.commonAncestorContainer)) return
  const rect = range.getBoundingClientRect()
  highlightToolbar.value = {
    visible: true,
    x: Math.min(window.innerWidth - 8, Math.max(8, rect.left + rect.width / 2)),
    y: Math.max(48, rect.top - 8),
    text,
    paragraphIndex: activeIndex.value,
  }
}

async function saveHighlight(color = 'yellow') {
  if (!requireLogin()) return
  const anchor = currentAnchor.value
  if (!anchor || !highlightToolbar.value.text) return
  try {
    const res = await createHighlight({
      novelId: Number(novelId.value),
      chapterId: Number(currentChapterId.value),
      paragraphIndex: highlightToolbar.value.paragraphIndex ?? anchor.paragraphIndex,
      paragraphHash: anchor.paragraphHash,
      startOffset: 0,
      endOffset: highlightToolbar.value.text.length,
      content: highlightToolbar.value.text,
      color,
    })
    showToast('已保存划线')
    // Task 23.4 — append the new <mark> locally for immediate feedback (≤200ms),
    // then invalidate the cache so the next chapter visit re-fetches.
    const created = res?.data || {
      id: Date.now(),
      novelId: Number(novelId.value),
      chapterId: Number(currentChapterId.value),
      paragraphIndex: highlightToolbar.value.paragraphIndex ?? anchor.paragraphIndex,
      paragraphHash: anchor.paragraphHash,
      startOffset: 0,
      endOffset: highlightToolbar.value.text.length,
      content: highlightToolbar.value.text,
      color,
    }
    highlightsStore.upsertLocal(created)
    setTimeout(() => {
      renderHighlightsToDOM().catch((err) => console.warn('[reading] render highlight failed', err))
    }, 0)
    highlightsStore.invalidate(Number(currentChapterId.value))
  } catch (error) {
    showToast('划线暂不可用')
  } finally {
    highlightToolbar.value.visible = false
    window.getSelection()?.removeAllRanges()
  }
}

async function openComments(index) {
  const preview = content.value[index] || ''
  commentSheet.value = { visible: true, loading: true, comments: [], paragraphIndex: index, preview }
  try {
    const res = await listParagraphComments({
      novelId: Number(novelId.value),
      chapterId: Number(currentChapterId.value),
      paragraphIndex: index,
    })
    const list = res?.code === 200 ? (Array.isArray(res.data) ? res.data : (res.data?.list || [])) : []
    commentSheet.value.comments = list
  } catch (error) {
    commentSheet.value.comments = []
  } finally {
    commentSheet.value.loading = false
  }
}

async function submitComment(contentText) {
  if (!requireLogin()) return
  const text = String(contentText || '').trim()
  if (!text) return
  const anchor = currentAnchor.value
  const paragraphIndex = commentSheet.value.paragraphIndex
  try {
    const res = await createParagraphComment({
      novelId: Number(novelId.value),
      chapterId: Number(currentChapterId.value),
      paragraphIndex,
      paragraphHash: anchor?.paragraphHash || '',
      content: text,
    })
    if (res?.code === 200 || res?.code === 201) {
      commentSheet.value.comments.unshift(res.data || { id: Date.now(), content: text, nickname: '我' })
      // Task 26.5 — optimistic count bump + invalidate aggregate cache so the
      // bubble reflects the new comment immediately and refetches on reopen.
      bumpParagraphCommentCount(paragraphIndex, +1)
      invalidateParagraphCommentCache()
    }
  } catch (error) {
    showToast('段评暂不可用')
  }
}

// Task 26.5 — handle ParagraphCommentSheet `delete` event so the bubble count
// stays in sync with soft-deletes.
async function deleteComment(commentId) {
  if (!requireLogin() || !commentId) return
  const paragraphIndex = commentSheet.value.paragraphIndex
  try {
    await deleteParagraphComment(commentId)
    commentSheet.value.comments = commentSheet.value.comments.filter((item) => item.id !== commentId)
    bumpParagraphCommentCount(paragraphIndex, -1)
    invalidateParagraphCommentCache()
  } catch (error) {
    showToast('删除失败')
  }
}

function speakCurrent() {
  // Kept for backwards compatibility — defers to useTTS.
  tts.start(tts.currentIndex.value)
}

function startTts() {
  if (!ttsSupported.value) {
    showToast('当前浏览器暂不支持听书')
    return
  }
  ttsVisible.value = true
  const initial = activeIndex.value || 0
  const ok = tts.start(initial)
  if (!ok) {
    ttsVisible.value = false
  }
}

function pauseTts() {
  tts.pause()
}

function resumeTts() {
  tts.resume()
}

function nextTts() {
  tts.next()
}

function prevTts() {
  tts.prev()
}

function stopTts() {
  tts.stop()
  ttsVisible.value = false
  ttsHighlightIndex.value = -1
}

function onTtsRateChange(value) {
  settings.ttsRate = value
  tts.setRate(value)
}

function onTtsVoiceChange(value) {
  settings.ttsVoiceURI = value
  tts.setVoice(value)
}

async function loadNextChapterForTts() {
  if (!hasNext.value) {
    ttsVisible.value = false
    return
  }
  const nextChapter = chapterIds.value[currentChapterPos.value + 1]
  if (!nextChapter) {
    ttsVisible.value = false
    return
  }
  await saveProgress()
  await loadChapter(nextChapter)
  router.replace({ query: { ...route.query, chapter: nextChapter } })
  // Auto continue from the first paragraph of the new chapter.
  if (ttsVisible.value && ttsSupported.value) {
    nextTick(() => tts.start(0))
  }
}

watch(() => route.query.chapter, async (chapter) => {
  const id = chapter ? Number(chapter) : null
  if (id && id !== Number(currentChapterId.value)) await loadChapter(id)
})

watch(currentAnchor, () => {
  calcProgress()
  saveProgress()
}, { deep: true })

onMounted(async () => {
  applyToDocument()
  window.addEventListener('scroll', calcProgress, { passive: true })
  document.addEventListener('selectionchange', handleSelection)
  heartbeat.mount()
  await loadChapterList()
  // Task 19.3 + 19.4 — pull the server anchor and merge with the local
  // snapshot before loading chapter content.  loadChapter() will use the
  // returned anchor to scrollIntoView the matching paragraph.
  const merged = await loadServerAnchor()
  const qChapter = route.query.chapter ? Number(route.query.chapter) : null
  const targetChapter =
    qChapter
      || (merged?.chapterId ?? null)
      || chapterIds.value[0]
  await loadChapter(targetChapter, { restoreAnchor: merged })
})

onUnmounted(async () => {
  window.removeEventListener('scroll', calcProgress)
  document.removeEventListener('selectionchange', handleSelection)
    clearTimeout(toastTimer)
    clearTimeout(bookmarkPressTimer.value)
    bookmarkPressActive.value = false
  stopTts()
  await heartbeat.flush()
  // Task 19.4 — fire-and-forget beacon so the last position survives unload.
  flushProgressBeacon()
  await saveProgress()
})
</script>

<template>
  <div :data-bg="settings.background" class="reading-page font-sans antialiased min-h-screen transition-colors duration-300">
    <div class="reading-dimmer"></div>
    <header
      class="toolbar fixed top-0 inset-x-0 z-30 bg-stone-50/95 dark:bg-night-900/95 backdrop-blur-xl border-b border-stone-200 dark:border-night-700 pt-safe"
      :class="{ 'toolbar-hide-top': !toolbarVisible }"
    >
      <div class="max-w-screen-md mx-auto px-3 h-14 flex items-center justify-between">
        <button @click="goBack()" class="w-10 h-10 grid place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-night-800 transition-colors" aria-label="返回">
          <Icon name="back" class="w-5 h-5" />
        </button>
        <div class="flex-1 px-3 min-w-0 text-center">
          <p class="text-[11px] font-mono text-stone-500 dark:text-stone-300 truncate">{{ novelTitle }}</p>
          <p class="text-xs font-medium truncate">
            <span v-if="chapterIndex">第{{ chapterIndex }}章 · </span>{{ chapterTitle || '加载中…' }}
          </p>
        </div>
        <button @click="toggleMode" class="w-10 h-10 grid place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-night-800 transition-colors" aria-label="主题">
          <Icon name="moon" class="w-5 h-5 dark:hidden" />
          <Icon name="sun" class="w-5 h-5 hidden dark:inline-block" />
        </button>
      </div>
    </header>

    <main ref="readerRef" class="reading-area max-w-[680px] mx-auto pt-20 pb-32">
      <PageFlipController
        :mode="settings.pageFlipMode"
        :transition-key="currentChapterId"
        @prev="prevPage"
        @next="nextPage"
        @toggle="toggleToolbar"
      >
      <header class="mb-6 pb-5 border-b border-stone-200 dark:border-night-700">
        <p v-if="chapterIndex" class="text-[11px] font-mono uppercase text-accent-500 mb-2">CHAPTER {{ chapterIndex }}</p>
        <h1 class="font-serif text-2xl sm:text-3xl font-semibold leading-tight">{{ chapterTitle || '加载中…' }}</h1>
        <div v-if="wordCount" class="flex items-center gap-3 text-[11px] font-mono text-stone-500 dark:text-stone-300 mt-3">
          <span>{{ wordCount.toLocaleString() }} 字</span>
          <span>·</span>
          <span>约 {{ readingMinutes }} 分钟</span>
          <span v-if="chapterDate">·</span>
          <span v-if="chapterDate">{{ chapterDate }}</span>
        </div>
      </header>

      <div v-if="contentLoading" class="space-y-4">
        <div v-for="i in 8" :key="i" :class="['h-4 rounded', i % 3 === 0 ? 'w-3/4' : 'w-full']" style="background: rgba(127,121,117,.15); animation: shimmer 1.6s infinite;"></div>
      </div>

      <article v-else class="reading-text">
        <p
          v-for="(p, i) in content"
          :key="i"
          :data-paragraph-index="i"
          :data-tts-active="ttsVisible && ttsHighlightIndex === i ? 'true' : null"
          :class="{ 'tts-active': ttsVisible && ttsHighlightIndex === i }"
        >
          {{ p }}
          <ParagraphCommentBubble
            :count="paragraphCommentCounts[i] || 0"
            :paragraph-index="i"
            @open="openComments"
          />
        </p>
      </article>

      <!-- VIP 会员墙：vip_required && truncated 时渲染 -->
      <section
        v-if="!contentLoading && showMembershipWall"
        class="my-8 relative"
        data-test="reading-membership-wall"
      >
        <!-- 顶部渐变遮罩，提示"下面被截断" -->
        <div class="absolute -top-16 inset-x-0 h-16 bg-gradient-to-b from-transparent to-stone-50 dark:to-night-900 pointer-events-none"></div>
        <MembershipWall
          :trial-length="trialLength"
          @activated="onMembershipActivated"
        />
      </section>

      <footer v-if="!contentLoading && !showMembershipWall" class="mt-12 pt-8 border-t border-stone-200 dark:border-night-700">
        <div class="flex items-center justify-between text-xs font-mono text-stone-500 dark:text-stone-300 mb-6">
          <span>— 本章完 —</span>
          <span>约 {{ readingMinutes }} 分钟</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <button @click="goPrev" :disabled="!hasPrev" class="h-12 rounded-full border text-sm font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-40">
            <Icon name="back" class="w-4 h-4" /> 上一章
          </button>
          <button @click="goNext" :disabled="!hasNext" class="h-12 rounded-full text-sm font-semibold transition flex items-center justify-center gap-1.5 bg-stone-900 text-stone-50 disabled:bg-stone-200 disabled:text-stone-400">
            下一章 <Icon name="arrowRight" class="w-4 h-4" />
          </button>
        </div>
      </footer>
      </PageFlipController>
    </main>

    <nav
      class="toolbar fixed bottom-0 inset-x-0 z-30 bg-stone-50/95 dark:bg-night-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-night-700 pb-safe"
      :class="{ 'toolbar-hide-bottom': !toolbarVisible }"
    >
      <div class="px-4 pt-3">
        <div class="flex items-center gap-3">
          <span class="text-[11px] font-mono text-stone-500 dark:text-stone-300 w-10">{{ progressPercent }}%</span>
          <input type="range" min="0" max="100" :value="progressPercent" class="reading-slider flex-1" @input="onSliderChange" />
          <span class="text-[11px] font-mono text-stone-500 dark:text-stone-300 w-16 text-right">{{ chapterIndex }}/{{ totalChapters || '?' }}</span>
        </div>
      </div>

      <div class="grid grid-cols-6 px-2 pb-2 pt-1">
        <button @click="showChapters = true" class="tool-btn">
          <Icon name="list" class="w-5 h-5" />
          <span>目录</span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: activeBookmark }"
          @pointerdown="startBookmarkPress"
          @pointerup="endBookmarkPress"
          @pointerleave="endBookmarkPress"
        >
          <Icon :name="activeBookmark ? 'bookmarkFill' : 'bookmark'" class="w-5 h-5" />
          <span>书签</span>
        </button>
        <button @click="showSettings = true" class="tool-btn">
          <Icon name="settings" class="w-5 h-5" />
          <span>阅读</span>
        </button>
        <button @click="startTts" class="tool-btn">
          <Icon name="chat" class="w-5 h-5" />
          <span>听书</span>
        </button>
        <button @click="toggleMode" class="tool-btn">
          <Icon name="moon" class="w-5 h-5 dark:hidden" />
          <Icon name="sun" class="w-5 h-5 hidden dark:inline-block" />
          <span>夜间</span>
        </button>
        <button @click="downloadTxt" class="tool-btn" :disabled="downloadLoading">
          <Icon name="download" class="w-5 h-5" />
          <span>{{ downloadLoading ? '准备' : '下载' }}</span>
        </button>
      </div>
    </nav>

    <p v-if="toastMessage" class="reading-toast">{{ toastMessage }}</p>

    <SettingPanel :visible="showSettings" @close="showSettings = false" />
    <ChapterDrawer :visible="showChapters" :novel-id="novelId" :current-chapter-id="currentChapterId" @close="showChapters = false" @select-chapter="changeChapter($event.id)" />
    <BookmarkSheet :visible="showBookmarks" :bookmarks="bookmarks" :loading="bookmarkLoading" @close="showBookmarks = false" @select="selectBookmark" @delete="removeBookmark" />
    <HighlightToolbar v-bind="highlightToolbar" @highlight="saveHighlight" @note="saveHighlight('yellow')" @close="highlightToolbar.visible = false" />
    <ParagraphCommentSheet
      v-bind="commentSheet"
      @close="commentSheet.visible = false"
      @submit="submitComment"
      @delete="deleteComment"
    />
    <TTSControlBar
      :visible="ttsVisible"
      :playing="ttsPlaying"
      :preview="ttsPreview"
      :rate="ttsRate"
      :voices="ttsVoices"
      :current-voice-id="ttsVoiceId"
      @pause="pauseTts"
      @resume="resumeTts"
      @prev="prevTts"
      @next="nextTts"
      @close="stopTts"
      @change-rate="onTtsRateChange"
      @change-voice="onTtsVoiceChange"
    />
  </div>
</template>

<style scoped>
.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-height: 3rem;
  padding: 0.5rem 0.25rem;
  color: rgb(68 64 60);
  transition: color 0.2s ease;
}

.tool-btn span {
  font-size: 0.625rem;
}

.tool-btn:hover,
.tool-btn.active {
  color: var(--color-primary, #d95468);
}

.reading-toast {
  position: fixed;
  left: 50%;
  bottom: calc(8.5rem + env(safe-area-inset-bottom));
  z-index: 60;
  margin: 0;
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: rgba(41, 37, 36, 0.92);
  color: #fffaf5;
  font-size: 0.8rem;
  transform: translateX(-50%);
}

.reading-text p {
  position: relative;
}

.tts-active {
  border-radius: 0.35rem;
  background: rgba(250, 204, 21, 0.18);
}

/* The paragraph comment button was replaced by `<ParagraphCommentBubble>` in
   Task 26.2 / 26.5 — the bubble owns its own scoped styles. */
</style>

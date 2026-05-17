<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import { useTheme } from '@/composables/useTheme'
import { getChapterContent, getChapterList } from '@/api/novel'
import { updateReadingProgress } from '@/api/user'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const { toggleMode } = useTheme()
const userStore = useUserStore()

// ─── 章节状态 ───
const novelId = computed(() => route.params.id)
const currentChapterId = ref(route.query.chapter ? Number(route.query.chapter) : null)
const novelTitle = ref('加载中…')
const chapterTitle = ref('')
const chapterIndex = ref(0)
const totalChapters = ref(0)
const wordCount = ref(0)
const chapterDate = ref('')
const readingMinutes = computed(() => Math.max(1, Math.round(wordCount.value / 350)))

// 章节导航列表（id 数组，用于上一章/下一章）
const chapterIds = ref([])
const currentChapterPos = computed(() => chapterIds.value.indexOf(currentChapterId.value))
const hasPrev = computed(() => currentChapterPos.value > 0)
const hasNext = computed(() => currentChapterPos.value < chapterIds.value.length - 1)

// ─── 内容 ───
const content = ref([])
const contentLoading = ref(true)

// ─── 工具栏显隐 ───
const toolbarVisible = ref(true)
function toggleToolbar() { toolbarVisible.value = !toolbarVisible.value }
function onContentClick(e) {
  if (e.target.closest('button, a')) return
  toggleToolbar()
}

// ─── 阅读设置 ───
const STORE_KEY = 'xs-reading-prefs-v2'
const settings = ref({ fontSize: 18, lineHeight: 1.85, bg: 'white', font: 'serif' })

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) settings.value = { ...settings.value, ...JSON.parse(raw) }
  } catch (e) {}
}
function savePrefs() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(settings.value)) } catch (e) {}
}

const fontSizes = [
  { v: 14, label: '小' }, { v: 16, label: '中' }, { v: 18, label: '标准' },
  { v: 20, label: '大' }, { v: 22, label: '特大' },
]
const lineHeights = [
  { v: 1.6, label: '紧凑' }, { v: 1.85, label: '舒适' }, { v: 2.1, label: '疏朗' },
]
const bgOptions = [
  { v: 'white', label: '日间', bg: '#FAFAF9', text: '#1A1917' },
  { v: 'sepia', label: '柔黄', bg: '#F4ECD8', text: '#3E2C1B' },
  { v: 'eye',   label: '护眼', bg: '#CCE0CC', text: '#1F2F22' },
  { v: 'dark',  label: '夜间', bg: '#0A0A0A', text: '#B5B0A8' },
]
const fontOptions = [
  { v: 'serif', label: '衬线（默认）', family: '"Noto Serif SC", serif' },
  { v: 'sans',  label: '无衬线',       family: '"Inter", "PingFang SC", system-ui, sans-serif' },
]

function applyPrefs() {
  const root = document.documentElement
  root.style.setProperty('--reading-font-size', settings.value.fontSize + 'px')
  root.style.setProperty('--reading-line-height', String(settings.value.lineHeight))
  const fontMap = Object.fromEntries(fontOptions.map(f => [f.v, f.family]))
  root.style.setProperty('--reading-font', fontMap[settings.value.font] || fontOptions[0].family)
}

watch(settings, () => { applyPrefs(); savePrefs() }, { deep: true })

// ─── 阅读进度 ───
const progressPercent = ref(0)
function calcProgress() {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  if (docHeight <= 0) { progressPercent.value = 0; return }
  progressPercent.value = Math.max(0, Math.min(100, Math.round((scrollTop / docHeight) * 100)))
}
function onSliderChange(e) {
  const pct = Number(e.target.value)
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  window.scrollTo({ top: (pct / 100) * docHeight, behavior: 'auto' })
}

// 自动保存进度（防抖，每 30 秒或离开时保存）
let saveTimer = null
function scheduleSave() {
  if (!userStore.isLogin || !novelId.value || !currentChapterId.value) return
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveProgress, 30000)
}
async function saveProgress() {
  if (!userStore.isLogin || !novelId.value) return
  try {
    await updateReadingProgress({
      novelId: Number(novelId.value),
      chapterId: currentChapterId.value,
      progress: progressPercent.value,
    })
  } catch (e) { /* 静默失败 */ }
}

// ─── 设置面板 ───
const showSettings = ref(false)

// ─── 加载章节列表（用于上一章/下一章） ───
async function loadChapterList() {
  if (!novelId.value || novelId.value === 'demo') return
  try {
    const res = await getChapterList(novelId.value, { page: 1, pageSize: 200 })
    if (res?.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      chapterIds.value = list.map(c => c.id)
      totalChapters.value = res.data?.pagination?.total || list.length
    }
  } catch (e) { /* ignore */ }
}

// ─── 加载章节内容 ───
async function loadChapter(chapterId) {
  if (!chapterId) {
    // 没有指定章节，加载第一章
    if (chapterIds.value.length > 0) {
      currentChapterId.value = chapterIds.value[0]
      return loadChapter(currentChapterId.value)
    }
    // 没有章节列表，显示占位内容
    contentLoading.value = false
    content.value = ['暂无章节内容，请先上传小说内容。']
    return
  }

  contentLoading.value = true
  try {
    const res = await getChapterContent(chapterId)
    if (res?.code === 200 && res.data) {
      const d = res.data
      chapterTitle.value = d.title || ''
      chapterIndex.value = d.chapter_number || 0
      wordCount.value = d.word_count || 0
      chapterDate.value = (d.created_at || '').slice(0, 10)
      novelTitle.value = d.novel_title || novelTitle.value

      if (d.content) {
        content.value = String(d.content)
          .split(/\n+/)
          .map(p => p.trim())
          .filter(Boolean)
      } else {
        content.value = ['本章暂无内容。']
      }
    }
  } catch (e) {
    content.value = ['章节加载失败，请返回重试。']
  } finally {
    contentLoading.value = false
    window.scrollTo({ top: 0, behavior: 'auto' })
    calcProgress()
  }
}

// ─── 上一章/下一章 ───
async function goPrev() {
  if (!hasPrev.value) return
  const prevId = chapterIds.value[currentChapterPos.value - 1]
  await saveProgress()
  currentChapterId.value = prevId
  router.replace({ query: { ...route.query, chapter: prevId } })
  await loadChapter(prevId)
}

async function goNext() {
  if (!hasNext.value) return
  const nextId = chapterIds.value[currentChapterPos.value + 1]
  await saveProgress()
  currentChapterId.value = nextId
  router.replace({ query: { ...route.query, chapter: nextId } })
  await loadChapter(nextId)
}

onMounted(async () => {
  loadPrefs()
  applyPrefs()
  window.addEventListener('scroll', calcProgress, { passive: true })
  window.addEventListener('scroll', scheduleSave, { passive: true })
  calcProgress()

  // 先加载章节列表，再加载内容
  await loadChapterList()

  const qChapter = route.query.chapter ? Number(route.query.chapter) : null
  if (qChapter) {
    currentChapterId.value = qChapter
    await loadChapter(qChapter)
  } else if (chapterIds.value.length > 0) {
    currentChapterId.value = chapterIds.value[0]
    await loadChapter(currentChapterId.value)
  } else {
    contentLoading.value = false
    content.value = ['暂无章节内容。']
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', calcProgress)
  window.removeEventListener('scroll', scheduleSave)
  clearTimeout(saveTimer)
  saveProgress() // 离开时保存一次
  document.documentElement.style.removeProperty('--reading-font-size')
  document.documentElement.style.removeProperty('--reading-line-height')
  document.documentElement.style.removeProperty('--reading-font')
})
</script>

<template>
  <div :data-bg="settings.bg" class="reading-page font-sans antialiased min-h-screen transition-colors duration-300">
    <!-- 顶栏 -->
    <header
      class="toolbar fixed top-0 inset-x-0 z-30 bg-stone-50/95 dark:bg-night-900/95 backdrop-blur-xl border-b border-stone-200 dark:border-night-700 pt-safe"
      :class="{ 'toolbar-hide-top': !toolbarVisible }"
    >
      <div class="max-w-screen-md mx-auto px-3 h-14 flex items-center justify-between">
        <button @click="router.push(`/novel/${novelId}`)" class="w-10 h-10 grid place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-night-800 transition-colors" aria-label="返回">
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

    <!-- 阅读区 -->
    <main class="reading-area max-w-[680px] mx-auto px-5 sm:px-8 pt-20 pb-32" @click="onContentClick">
      <!-- 章节标题 -->
      <header class="mb-6 pb-5 border-b border-stone-200 dark:border-night-700">
        <p v-if="chapterIndex" class="text-[11px] font-mono uppercase tracking-[0.2em] text-accent-500 mb-2">CHAPTER {{ chapterIndex }}</p>
        <h1 class="font-serif text-2xl sm:text-3xl font-semibold tracking-tight leading-tight" style="font-family: 'Noto Serif SC', serif;">
          {{ chapterTitle || '加载中…' }}
        </h1>
        <div v-if="wordCount" class="flex items-center gap-3 text-[11px] font-mono text-stone-500 dark:text-stone-300 mt-3">
          <span>{{ wordCount.toLocaleString() }} 字</span>
          <span>·</span>
          <span>约 {{ readingMinutes }} 分钟</span>
          <span v-if="chapterDate">·</span>
          <span v-if="chapterDate">{{ chapterDate }}</span>
        </div>
      </header>

      <!-- 加载中 -->
      <div v-if="contentLoading" class="space-y-4">
        <div v-for="i in 8" :key="i" :class="['h-4 rounded', i % 3 === 0 ? 'w-3/4' : 'w-full']" style="background: rgba(127,121,117,.15); animation: shimmer 1.6s infinite;"></div>
      </div>

      <!-- 正文 -->
      <article v-else class="reading-text">
        <p v-for="(p, i) in content" :key="i">{{ p }}</p>
      </article>

      <!-- 章节末尾 -->
      <footer v-if="!contentLoading" class="mt-12 pt-8 border-t border-stone-200 dark:border-night-700">
        <div class="flex items-center justify-between text-xs font-mono text-stone-500 dark:text-stone-300 mb-6">
          <span>— 本章完 —</span>
          <span>约 {{ readingMinutes }} 分钟</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="goPrev"
            :disabled="!hasPrev"
            :class="['h-12 rounded-full border text-sm font-medium transition flex items-center justify-center gap-1.5',
              hasPrev
                ? 'border-stone-300 dark:border-night-600 hover:bg-stone-100 dark:hover:bg-night-800'
                : 'border-stone-200 dark:border-night-700 opacity-40 cursor-not-allowed'
            ]"
          >
            <Icon name="back" class="w-4 h-4" /> 上一章
          </button>
          <button
            @click="goNext"
            :disabled="!hasNext"
            :class="['h-12 rounded-full text-sm font-semibold transition flex items-center justify-center gap-1.5',
              hasNext
                ? 'bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:bg-accent-500 dark:hover:bg-accent-500 dark:hover:text-stone-50'
                : 'bg-stone-200 dark:bg-night-700 text-stone-400 cursor-not-allowed'
            ]"
          >
            下一章 <Icon name="arrowRight" class="w-4 h-4" />
          </button>
        </div>

        <div class="mt-8 grid grid-cols-3 gap-3 text-center">
          <button class="py-3 rounded-2xl bg-stone-100 dark:bg-night-800 hover:bg-stone-200 dark:hover:bg-night-700 transition">
            <Icon name="bookmark" class="block mx-auto mb-1 w-5 h-5" />
            <span class="text-xs">收藏</span>
          </button>
          <button class="py-3 rounded-2xl bg-stone-100 dark:bg-night-800 hover:bg-stone-200 dark:hover:bg-night-700 transition">
            <Icon name="heart" class="block mx-auto mb-1 w-5 h-5" />
            <span class="text-xs">推荐</span>
          </button>
          <RouterLink :to="`/novel/${novelId}`" class="py-3 rounded-2xl bg-stone-100 dark:bg-night-800 hover:bg-stone-200 dark:hover:bg-night-700 transition block">
            <Icon name="list" class="block mx-auto mb-1 w-5 h-5" />
            <span class="text-xs">目录</span>
          </RouterLink>
        </div>
      </footer>
    </main>

    <!-- 底栏 -->
    <nav
      class="toolbar fixed bottom-0 inset-x-0 z-30 bg-stone-50/95 dark:bg-night-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-night-700 pb-safe"
      :class="{ 'toolbar-hide-bottom': !toolbarVisible }"
    >
      <div class="px-4 pt-3">
        <div class="flex items-center gap-3">
          <span class="text-[11px] font-mono text-stone-500 dark:text-stone-300 w-10">{{ progressPercent }}%</span>
          <input type="range" min="0" max="100" :value="progressPercent" class="reading-slider flex-1" @input="onSliderChange" />
          <span class="text-[11px] font-mono text-stone-500 dark:text-stone-300 w-16 text-right">
            {{ chapterIndex }}/{{ totalChapters || '?' }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-5 px-2 pb-2 pt-1">
        <RouterLink :to="`/novel/${novelId}`" class="flex flex-col items-center gap-1 py-2 text-stone-700 dark:text-stone-300 hover:text-accent-500 transition">
          <Icon name="list" class="w-5 h-5" />
          <span class="text-[10px]">目录</span>
        </RouterLink>
        <button class="flex flex-col items-center gap-1 py-2 text-stone-700 dark:text-stone-300 hover:text-accent-500 transition">
          <Icon name="bookmark" class="w-5 h-5" />
          <span class="text-[10px]">书签</span>
        </button>
        <button @click="showSettings = true" class="flex flex-col items-center gap-1 py-2 text-stone-700 dark:text-stone-300 hover:text-accent-500 transition">
          <Icon name="settings" class="w-5 h-5" />
          <span class="text-[10px]">阅读</span>
        </button>
        <button @click="toggleMode" class="flex flex-col items-center gap-1 py-2 text-stone-700 dark:text-stone-300 hover:text-accent-500 transition">
          <Icon name="moon" class="w-5 h-5 dark:hidden" />
          <Icon name="sun" class="w-5 h-5 hidden dark:inline-block" />
          <span class="text-[10px]">夜间</span>
        </button>
        <button class="flex flex-col items-center gap-1 py-2 text-stone-700 dark:text-stone-300 hover:text-accent-500 transition">
          <Icon name="share" class="w-5 h-5" />
          <span class="text-[10px]">更多</span>
        </button>
      </div>
    </nav>

    <!-- 设置面板 -->
    <Transition
      enter-from-class="translate-y-full" enter-to-class="translate-y-0"
      leave-from-class="translate-y-0" leave-to-class="translate-y-full"
      enter-active-class="transition-transform duration-300"
      leave-active-class="transition-transform duration-300"
    >
      <div v-if="showSettings" class="fixed inset-x-0 bottom-0 z-40 bg-stone-50 dark:bg-night-800 border-t border-stone-200 dark:border-night-700 rounded-t-3xl shadow-2xl pb-safe">
        <div class="max-w-screen-md mx-auto p-5">
          <div class="w-10 h-1 mx-auto rounded-full bg-stone-300 dark:bg-night-600 mb-5"></div>
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-serif text-lg font-semibold">阅读设置</h3>
            <button @click="showSettings = false" class="w-8 h-8 grid place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-night-700">
              <Icon name="close" class="w-5 h-5" />
            </button>
          </div>

          <!-- 字号 -->
          <div class="mb-6">
            <p class="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3">字号</p>
            <div class="grid grid-cols-5 gap-2">
              <button v-for="f in fontSizes" :key="f.v" @click="settings.fontSize = f.v"
                :class="['h-10 rounded-xl text-sm', settings.fontSize === f.v ? 'bg-accent-500 text-white font-medium' : 'bg-stone-100 dark:bg-night-700 hover:bg-stone-200']">
                {{ f.label }}
              </button>
            </div>
          </div>

          <!-- 行距 -->
          <div class="mb-6">
            <p class="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3">行距</p>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="lh in lineHeights" :key="lh.v" @click="settings.lineHeight = lh.v"
                :class="['h-10 rounded-xl text-sm', settings.lineHeight === lh.v ? 'bg-accent-500 text-white font-medium' : 'bg-stone-100 dark:bg-night-700 hover:bg-stone-200']">
                {{ lh.label }}
              </button>
            </div>
          </div>

          <!-- 背景 -->
          <div class="mb-6">
            <p class="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3">背景色</p>
            <div class="grid grid-cols-4 gap-2">
              <button v-for="b in bgOptions" :key="b.v" @click="settings.bg = b.v"
                :style="{ background: b.bg, color: b.text }"
                :class="['h-12 rounded-xl border-2 text-xs font-medium', settings.bg === b.v ? 'border-accent-500' : 'border-transparent']">
                {{ b.label }}
              </button>
            </div>
          </div>

          <!-- 字体 -->
          <div class="mb-2">
            <p class="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3">字体</p>
            <div class="grid grid-cols-2 gap-2">
              <button v-for="f in fontOptions" :key="f.v" @click="settings.font = f.v"
                :style="{ fontFamily: f.family }"
                :class="['h-10 rounded-xl text-sm', settings.font === f.v ? 'bg-accent-500 text-white font-medium' : 'bg-stone-100 dark:bg-night-700 hover:bg-stone-200']">
                {{ f.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import Icon from '@/components/v2/icons/Icon.vue'
import ChapterDrawer from '@/components/reading/ChapterDrawer.vue'
import PageFlipController from '@/components/reading/PageFlipController.vue'
import SettingPanel from '@/components/reading/SettingPanel.vue'
import { useReadingSettings } from '@/composables/useReadingSettings'
import { useTheme } from '@/composables/useTheme'

const props = defineProps({
  novelId: {
    type: [Number, String],
    required: true,
  },
  novelTitle: {
    type: String,
    default: '',
  },
  chapter: {
    type: Object,
    default: () => ({}),
  },
  content: {
    type: Array,
    default: () => [],
  },
  chapters: {
    type: Array,
    default: () => [],
  },
  totalChapters: {
    type: Number,
    default: 0,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  downloadLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-chapter', 'download'])

const { settings, applyToDocument } = useReadingSettings()
const { toggleMode } = useTheme()

const toolbarVisible = ref(true)
const showSettings = ref(false)
const showChapters = ref(false)
const rootRef = ref(null)

const currentChapterId = computed(() => props.chapter?.id || null)
const currentIndex = computed(() => {
  const index = props.chapters.findIndex(chapter => String(chapter.id) === String(currentChapterId.value))
  return index >= 0 ? index : -1
})
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < props.chapters.length - 1)
const chapterNumber = computed(() => props.chapter?.chapterNumber || 0)
const chapterTitle = computed(() => props.chapter?.title || '正文')
const wordCount = computed(() => Number(props.chapter?.wordCount || 0))
const readingMinutes = computed(() => Math.max(1, Math.round(wordCount.value / 350)))

function toggleToolbar() {
  toolbarVisible.value = !toolbarVisible.value
}

function scrollVirtualPage(direction) {
  window.scrollBy({ top: direction * Math.max(240, window.innerHeight - 120), behavior: 'smooth' })
}

function prevPage() {
  scrollVirtualPage(-1)
}

function nextPage() {
  scrollVirtualPage(1)
}

function selectChapter(chapter) {
  if (!chapter?.id) return
  emit('select-chapter', chapter.id)
  nextTick(() => {
    rootRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function goPrevChapter() {
  if (!hasPrev.value) return
  selectChapter(props.chapters[currentIndex.value - 1])
}

function goNextChapter() {
  if (!hasNext.value) return
  selectChapter(props.chapters[currentIndex.value + 1])
}

function openSettings() {
  showSettings.value = true
  toolbarVisible.value = true
}

function openChapters() {
  showChapters.value = true
  toolbarVisible.value = true
}

function setReaderTheme() {
  applyToDocument()
  toggleMode()
}
</script>

<template>
  <section
    ref="rootRef"
    :data-bg="settings.background"
    data-testid="inline-reader"
    class="inline-reading-experience relative min-h-screen scroll-mt-0 overflow-hidden transition-colors duration-300"
  >
    <div class="reading-dimmer"></div>

    <header
      data-testid="inline-reader-top-toolbar"
      class="toolbar sticky top-0 z-30 bg-stone-50/95 dark:bg-night-900/95 backdrop-blur-xl border-b border-stone-200 dark:border-night-700"
      :class="{ 'toolbar-hide-top': !toolbarVisible }"
    >
      <div class="max-w-screen-md mx-auto px-3 h-14 flex items-center justify-between">
        <button type="button" class="w-10 h-10 grid place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-night-800 transition-colors" aria-label="返回书籍信息" @click="rootRef?.previousElementSibling?.scrollIntoView({ behavior: 'smooth', block: 'start' })">
          <Icon name="back" class="w-5 h-5" />
        </button>
        <div class="flex-1 px-3 min-w-0 text-center">
          <p class="text-[11px] font-mono text-stone-500 dark:text-stone-300 truncate">{{ novelTitle }}</p>
          <p class="text-xs font-medium truncate">
            <span v-if="chapterNumber">第{{ chapterNumber }}章 · </span>{{ chapterTitle }}
          </p>
        </div>
        <button type="button" class="w-10 h-10 grid place-items-center rounded-full hover:bg-stone-100 dark:hover:bg-night-800 transition-colors" aria-label="主题" @click="setReaderTheme">
          <Icon name="moon" class="w-5 h-5 dark:hidden" />
          <Icon name="sun" class="w-5 h-5 hidden dark:inline-block" />
        </button>
      </div>
    </header>

    <main class="reading-area max-w-[680px] mx-auto pt-8 pb-32">
      <PageFlipController
        data-testid="inline-reader-pageflip"
        :mode="settings.pageFlipMode"
        :transition-key="currentChapterId"
        @prev="prevPage"
        @next="nextPage"
        @toggle="toggleToolbar"
      >
        <header class="mb-6 pb-5 border-b border-stone-200 dark:border-night-700">
          <p v-if="chapterNumber" class="text-[11px] font-mono uppercase text-accent-500 mb-2">CHAPTER {{ chapterNumber }}</p>
          <h2 class="font-serif text-2xl sm:text-3xl font-semibold leading-tight">{{ chapterTitle }}</h2>
          <div v-if="wordCount" class="flex items-center gap-3 text-[11px] font-mono text-stone-500 dark:text-stone-300 mt-3">
            <span>{{ wordCount.toLocaleString() }} 字</span>
            <span>·</span>
            <span>约 {{ readingMinutes }} 分钟</span>
            <span v-if="chapter.date">·</span>
            <span v-if="chapter.date">{{ chapter.date }}</span>
          </div>
        </header>

        <div v-if="loading" class="space-y-4">
          <div v-for="i in 8" :key="i" :class="['h-4 rounded', i % 3 === 0 ? 'w-3/4' : 'w-full']" style="background: rgba(127,121,117,.15); animation: shimmer 1.6s infinite;"></div>
        </div>

        <article v-else class="reading-text">
          <p v-for="(paragraph, index) in content" :key="`${currentChapterId}-${index}`">
            {{ paragraph }}
          </p>
        </article>

        <div v-if="!loading && chapter.vipRequired && chapter.truncated" class="mt-8 rounded-xl border border-stone-300/50 bg-stone-50/70 dark:bg-night-800/70 p-4 text-sm text-stone-600 dark:text-stone-300">
          本章后续为 VIP 内容，开通会员后可继续阅读完整正文。
        </div>

        <footer v-if="!loading && !(chapter.vipRequired && chapter.truncated)" class="mt-12 pt-8 border-t border-stone-200 dark:border-night-700">
          <div class="flex items-center justify-between text-xs font-mono text-stone-500 dark:text-stone-300 mb-6">
            <span>— 本章完 —</span>
            <span>约 {{ readingMinutes }} 分钟</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button type="button" @click="goPrevChapter" :disabled="!hasPrev" class="h-12 rounded-full border text-sm font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-40">
              <Icon name="back" class="w-4 h-4" /> 上一章
            </button>
            <button type="button" @click="goNextChapter" :disabled="!hasNext" class="h-12 rounded-full text-sm font-semibold transition flex items-center justify-center gap-1.5 bg-stone-900 text-stone-50 disabled:bg-stone-200 disabled:text-stone-400">
              下一章 <Icon name="arrowRight" class="w-4 h-4" />
            </button>
          </div>
        </footer>
      </PageFlipController>
    </main>

    <nav
      data-testid="inline-reader-bottom-toolbar"
      class="toolbar fixed bottom-0 inset-x-0 z-40 bg-stone-50/95 dark:bg-night-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-night-700 pb-safe"
      :class="{ 'toolbar-hide-bottom': !toolbarVisible }"
    >
      <div class="grid grid-cols-5 px-2 pb-2 pt-2 max-w-screen-md mx-auto">
        <button type="button" @click="openChapters" class="tool-btn">
          <Icon name="list" class="w-5 h-5" />
          <span>目录</span>
        </button>
        <button type="button" @click="openSettings" class="tool-btn">
          <Icon name="settings" class="w-5 h-5" />
          <span>阅读</span>
        </button>
        <button type="button" @click="goPrevChapter" class="tool-btn" :disabled="!hasPrev">
          <Icon name="back" class="w-5 h-5" />
          <span>上章</span>
        </button>
        <button type="button" @click="goNextChapter" class="tool-btn" :disabled="!hasNext">
          <Icon name="arrowRight" class="w-5 h-5" />
          <span>下章</span>
        </button>
        <button type="button" @click="$emit('download')" class="tool-btn" :disabled="downloadLoading">
          <Icon name="download" class="w-5 h-5" />
          <span>{{ downloadLoading ? '准备' : '下载' }}</span>
        </button>
      </div>
    </nav>

    <SettingPanel :visible="showSettings" @close="showSettings = false" />
    <ChapterDrawer
      :visible="showChapters"
      :chapters="chapters"
      :novel-id="novelId"
      :current-chapter-id="currentChapterId"
      @close="showChapters = false"
      @select-chapter="selectChapter"
    />
  </section>
</template>

<style scoped>
.inline-reading-experience {
  background: var(--reading-bg);
  color: var(--reading-text);
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-height: 3rem;
  padding: 0.5rem 0.25rem;
  color: rgb(68 64 60);
  transition: color 0.2s ease, opacity 0.2s ease;
}

.tool-btn span {
  font-size: 0.625rem;
}

.tool-btn:hover {
  color: var(--color-primary, #d95468);
}

.tool-btn:disabled {
  opacity: 0.4;
}
</style>

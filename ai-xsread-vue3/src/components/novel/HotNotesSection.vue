<script setup>
/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 25.4 — NovelDetailPage "读者想法" 区块（HotNotesSection.vue）
 *
 * - 拉取 GET /api/novels/:novelId/notes/hot?limit=5
 * - 渲染至多 5 张卡片：头像 + 昵称 + 原文片段（≤ 60 字省略）+ 想法正文 + 点赞数
 * - 空态：暂无读者想法，去为这本书写下第一条想法 →
 * - Loading skeleton
 *
 * Validates: Requirement 26.5
 */
import { ref, watch } from 'vue'
import Icon from '@/components/v2/icons/Icon.vue'
import { listHotNotesForNovel } from '@/api/notes'

const props = defineProps({
  novelId: { type: [String, Number], default: null },
})

const notes = ref([])
const loading = ref(false)
const loaded = ref(false)
const errorMessage = ref('')

const ORIGIN_MAX_CHARS = 60

function truncateOrigin(text) {
  if (!text) return ''
  const str = String(text)
  return str.length > ORIGIN_MAX_CHARS ? `${str.slice(0, ORIGIN_MAX_CHARS)}…` : str
}

function unwrapList(payload) {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.list)) return data.list
  return []
}

function normalize(item, index) {
  const username = item.username || item.user?.username || item.user?.nickname || '匿名读者'
  return {
    id: item.id ?? item.highlight_id ?? `hot-note-${index}`,
    username,
    avatar: item.avatar || item.user?.avatar || '',
    avatarLetter: (username[0] || '读').toUpperCase(),
    originText: truncateOrigin(item.content || item.origin_text || item.originText || ''),
    note: item.note || '',
    likes: Number(item.likes ?? item.like_count ?? 0),
    chapterTitle: item.chapter_title || item.chapterTitle || '',
    chapterDeleted: Boolean(item.chapter_deleted ?? item.chapterDeleted ?? false),
  }
}

async function load() {
  if (!props.novelId) {
    notes.value = []
    loaded.value = true
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await listHotNotesForNovel(props.novelId, { limit: 5 })
    const list = unwrapList(res)
    notes.value = list
      .filter((item) => (item.note || '').trim().length > 0)
      .slice(0, 5)
      .map(normalize)
  } catch (err) {
    errorMessage.value = err?.message || '加载失败'
    notes.value = []
  } finally {
    loading.value = false
    loaded.value = true
  }
}

watch(
  () => props.novelId,
  () => {
    notes.value = []
    loaded.value = false
    load()
  },
  { immediate: true }
)
</script>

<template>
  <section v-if="props.novelId" data-testid="hot-notes-section">
    <h2 class="font-serif text-base font-semibold mb-3 flex items-center gap-2">
      <span class="w-1 h-4 rounded-full bg-clay-500"></span>
      读者想法
    </h2>

    <!-- Loading skeleton -->
    <div v-if="loading && !loaded" class="space-y-3" data-testid="hot-notes-skeleton">
      <div
        v-for="n in 3"
        :key="n"
        class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4 animate-pulse"
      >
        <div class="flex items-center gap-3 mb-2.5">
          <div class="w-9 h-9 rounded-full bg-cream-200 dark:bg-night-700"></div>
          <div class="flex-1 space-y-1.5">
            <div class="h-3 w-1/3 rounded bg-cream-200 dark:bg-night-700"></div>
            <div class="h-3 w-2/3 rounded bg-cream-200 dark:bg-night-700"></div>
          </div>
        </div>
        <div class="h-3 w-full rounded bg-cream-200 dark:bg-night-700"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="loaded && !notes.length"
      class="rounded-2xl bg-cream-100 dark:bg-night-800 p-5 text-center text-sm text-ink-500 dark:text-ink-300"
      data-testid="hot-notes-empty"
    >
      <p>暂无读者想法，去为这本书写下第一条想法 →</p>
    </div>

    <!-- Notes list -->
    <div v-else class="space-y-3" data-testid="hot-notes-list">
      <article
        v-for="note in notes"
        :key="note.id"
        class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4"
        data-testid="hot-note-card"
      >
        <div class="flex items-center gap-3 mb-2.5">
          <span class="w-9 h-9 rounded-full bg-clay-500/15 text-clay-700 dark:text-clay-400 grid place-items-center font-serif text-sm overflow-hidden shrink-0">
            <img v-if="note.avatar" :src="note.avatar" :alt="note.username" class="w-full h-full object-cover" />
            <span v-else>{{ note.avatarLetter }}</span>
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate" data-testid="hot-note-user">{{ note.username }}</p>
            <p v-if="note.chapterTitle" class="text-[11px] text-ink-500 dark:text-ink-300 truncate">{{ note.chapterTitle }}</p>
          </div>
        </div>

        <blockquote
          class="hot-note-origin rounded-lg px-3 py-2 text-xs leading-relaxed font-serif text-ink-700 dark:text-ink-200"
          data-testid="hot-note-origin"
        >
          <span v-if="note.chapterDeleted" class="text-ink-400">原文已被作者删除</span>
          <span v-else>{{ note.originText || '（无原文片段）' }}</span>
        </blockquote>

        <p class="mt-2.5 text-sm text-ink-700 dark:text-ink-300 leading-relaxed" data-testid="hot-note-body">{{ note.note }}</p>

        <div class="flex items-center gap-1.5 mt-3 text-xs text-ink-500 dark:text-ink-300" data-testid="hot-note-likes">
          <Icon name="heart" class="w-3.5 h-3.5" />
          <span>{{ note.likes }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.hot-note-origin {
  background: rgba(250, 220, 130, 0.22);
  border-left: 3px solid rgba(200, 140, 40, 0.55);
  word-break: break-word;
}

:global(.dark) .hot-note-origin {
  background: rgba(250, 220, 130, 0.14);
  border-left-color: rgba(255, 200, 100, 0.45);
}
</style>

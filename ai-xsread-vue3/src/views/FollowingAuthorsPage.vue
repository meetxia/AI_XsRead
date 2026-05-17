<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import UnreadBadge from '@/components/bookshelf/UnreadBadge.vue'
import { listFollowingAuthors } from '@/api/authors'

const PAGE_SIZE = 20
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const authors = ref([])
const loading = ref(false)
const initialLoaded = ref(false)
const errorMessage = ref('')
const page = ref(1)
const total = ref(0)
const sentinelEl = ref(null)
let observer = null

const hasMore = computed(() => authors.value.length < total.value)
const headerLabel = computed(() => `我关注的作者 (${total.value || authors.value.length || 0})`)

function nameOf(author) {
  return author?.name || author?.author || '佚名'
}

function avatarUrlOf(author) {
  return author?.avatar || author?.avatar_url || ''
}

function authorIdOf(author) {
  return author?.id || author?.author_id
}

function avatarLetterOf(author) {
  const name = nameOf(author)
  return (name[0] || '作').toUpperCase()
}

function latestTitleOf(author) {
  return (
    author?.latest_work_title
    || author?.latestWorkTitle
    || author?.latest_title
    || author?.latestNovel?.title
    || ''
  )
}

function latestUpdateMs(author) {
  const raw = (
    author?.latest_update_at
    || author?.latestUpdatedAt
    || author?.latest_work_updated_at
    || author?.latestNovel?.updated_at
    || null
  )
  if (!raw) return null
  const ms = new Date(raw).getTime()
  return Number.isFinite(ms) ? ms : null
}

function updateLabelOf(author) {
  const ms = latestUpdateMs(author)
  if (ms === null) return '暂无新作品'
  const diff = Date.now() - ms
  if (diff < 0) return '今日更新'
  const days = Math.floor(diff / ONE_DAY_MS)
  if (days <= 0) return '今日更新'
  return `${days} 天前更新`
}

function isNewAuthor(author) {
  const ms = latestUpdateMs(author)
  if (ms === null) return false
  const diff = Date.now() - ms
  return diff >= 0 && diff < SEVEN_DAYS_MS
}

function unwrapList(payload) {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return { list: data, total: data.length }
  if (data && Array.isArray(data.list)) {
    const t = Number(data.pagination?.total ?? data.total)
    return { list: data.list, total: Number.isFinite(t) ? t : data.list.length }
  }
  return { list: [], total: 0 }
}

async function loadPage(target) {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await listFollowingAuthors({ page: target, pageSize: PAGE_SIZE })
    const { list, total: t } = unwrapList(res)
    if (target <= 1) {
      authors.value = list
    } else {
      authors.value = authors.value.concat(list)
    }
    total.value = Math.max(t, authors.value.length)
    page.value = target
  } catch (err) {
    errorMessage.value = err?.message || '加载失败，请稍后再试'
  } finally {
    loading.value = false
    initialLoaded.value = true
  }
}

function ensureObserver() {
  if (observer || typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') return
  observer = new window.IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && hasMore.value && !loading.value) {
        loadPage(page.value + 1)
        break
      }
    }
  }, { rootMargin: '120px 0px' })
}

watch(sentinelEl, (el) => {
  ensureObserver()
  if (observer && el) observer.observe(el)
})

onMounted(() => loadPage(1))

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <div class="min-h-screen bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 paper-texture">
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-md mx-auto px-4 h-14 flex items-center gap-3">
        <RouterLink to="/profile" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="返回">
          <Icon name="back" />
        </RouterLink>
        <h1 class="font-serif text-lg font-semibold">{{ headerLabel }}</h1>
      </div>
    </header>

    <main class="max-w-screen-md mx-auto px-4 pb-24">
      <!-- 初次加载骨架屏 -->
      <div v-if="!initialLoaded && loading" class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="loading-skeleton">
        <div
          v-for="n in 4"
          :key="n"
          class="rounded-2xl bg-cream-100 dark:bg-night-800 p-3 flex items-center gap-3 animate-pulse"
        >
          <div class="w-12 h-12 rounded-full bg-cream-200 dark:bg-night-700"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-1/2 rounded bg-cream-200 dark:bg-night-700"></div>
            <div class="h-3 w-3/4 rounded bg-cream-200 dark:bg-night-700"></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="initialLoaded && !authors.length && !errorMessage"
        class="mt-10 rounded-2xl bg-cream-100 dark:bg-night-800 p-6 text-center"
        data-testid="empty-state"
      >
        <p class="text-sm text-ink-500 dark:text-ink-300">你还没有关注任何作者，</p>
        <RouterLink to="/" class="mt-2 inline-block text-sm font-medium text-clay-700 dark:text-clay-400 hover:underline">
          去发现首页找一位喜欢的吧 →
        </RouterLink>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="errorMessage && !authors.length" class="mt-10 rounded-2xl bg-cream-100 dark:bg-night-800 p-6 text-center">
        <p class="text-sm text-ink-500 dark:text-ink-300">{{ errorMessage }}</p>
        <button
          type="button"
          class="mt-3 px-4 py-1.5 rounded-full text-xs bg-clay-500 text-cream-50 hover:bg-clay-700"
          @click="loadPage(1)"
        >重试</button>
      </div>

      <!-- 作者列表 -->
      <div v-else class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <component
          :is="authorIdOf(author) ? RouterLink : 'div'"
          v-for="(author, index) in authors"
          :key="authorIdOf(author) || `idx-${index}`"
          :to="authorIdOf(author) ? `/author/${authorIdOf(author)}` : undefined"
          class="relative rounded-2xl bg-cream-100 dark:bg-night-800 p-3 flex items-center gap-3 hover:bg-cream-200/60 dark:hover:bg-night-700/60 transition"
          data-testid="author-card"
        >
          <span class="w-12 h-12 rounded-full bg-clay-500/15 text-clay-700 dark:text-clay-400 grid place-items-center font-serif overflow-hidden shrink-0">
            <img v-if="avatarUrlOf(author)" :src="avatarUrlOf(author)" :alt="nameOf(author)" class="w-full h-full object-cover" />
            <span v-else>{{ avatarLetterOf(author) }}</span>
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-medium truncate">{{ nameOf(author) }}</span>
            <span class="block text-xs text-ink-500 dark:text-ink-300 truncate">{{ latestTitleOf(author) || '暂无新作品' }}</span>
            <span class="block mt-0.5 text-[11px] text-ink-400 dark:text-ink-300/70">{{ updateLabelOf(author) }}</span>
          </span>
          <span
            v-if="isNewAuthor(author)"
            class="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-moss-500 text-cream-50 font-medium tracking-wide"
            data-testid="new-badge"
          >NEW</span>
          <UnreadBadge v-else-if="author.hasUnreadUpdate" class="absolute top-2 right-2" />
        </component>
      </div>

      <!-- 底部加载提示 / 哨兵 -->
      <div v-if="initialLoaded && authors.length" class="mt-4 text-center text-xs text-ink-400 dark:text-ink-300/70">
        <div ref="sentinelEl" class="h-6"></div>
        <span v-if="loading">加载中...</span>
        <span v-else-if="!hasMore">已经到底啦</span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import BookCover from '@/components/v2/book/BookCover.vue'
import { getReadingHistory } from '@/api/user'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '浏览记录',
  description: 'MOMO小说个人浏览记录，用于继续阅读最近打开的作品。',
  url: `${SEO_DEFAULTS.siteUrl}/history`,
  robots: 'noindex,follow',
})

const router = useRouter()

const groups = ref([])
const loading = ref(false)
const empty = ref(false)

function groupByDate(list) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const todayItems = []
  const yesterdayItems = []
  const weekItems = []
  const olderItems = []

  list.forEach(item => {
    const d = new Date(item.read_time || item.last_read_time || item.updated_at || 0)
    if (d >= today) todayItems.push(item)
    else if (d >= yesterday) yesterdayItems.push(item)
    else if (d >= weekAgo) weekItems.push(item)
    else olderItems.push(item)
  })

  const result = []
  if (todayItems.length) result.push({ title: '今天', items: todayItems })
  if (yesterdayItems.length) result.push({ title: '昨天', items: yesterdayItems })
  if (weekItems.length) result.push({ title: '本周更早', items: weekItems })
  if (olderItems.length) result.push({ title: '更早', items: olderItems })
  return result
}

async function loadHistory() {
  loading.value = true
  try {
    const res = await getReadingHistory({ page: 1, pageSize: 50 })
    if (res?.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      if (list.length === 0) {
        empty.value = true
        groups.value = []
        return
      }
      const mapped = list.map((item, i) => ({
        id: item.id,
        bookId: item.novel_id,
        chapterId: item.chapter_id,
        title: item.title || '未知小说',
        chapterTitle: item.chapter_title || '',
        meta: [
          item.author,
          item.read_time ? new Date(item.read_time).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
        ].filter(Boolean).join(' · '),
        progress: item.progress || 0,
        variant: i % 6,
        cover: item.cover,
        read_time: item.read_time || item.last_read_time,
      }))
      groups.value = groupByDate(mapped)
    }
  } catch (e) {
    console.warn('[History] load error', e?.message)
    empty.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadHistory)
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="返回">
          <Icon name="back" class="w-5 h-5" />
        </button>
        <h1 class="font-serif text-base font-semibold">浏览记录</h1>
        <button @click="groups = []; empty = true" class="px-3 h-9 rounded-full text-sm text-ink-700 dark:text-ink-300 hover:bg-cream-100 dark:hover:bg-night-800 transition">清空</button>
      </div>
    </header>

    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <!-- 加载中 -->
      <div v-if="loading" class="mt-8 space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 p-3 rounded-2xl bg-cream-100 dark:bg-night-800">
          <div class="w-12 h-16 rounded-lg skeleton shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-3/4 rounded skeleton"></div>
            <div class="h-3 w-1/2 rounded skeleton"></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="empty || groups.length === 0" class="mt-20 text-center">
        <p class="text-sm text-ink-500 dark:text-ink-300">暂无浏览记录</p>
        <RouterLink to="/" class="inline-block mt-4 px-5 py-2 rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 text-sm">去发现好书</RouterLink>
      </div>

      <!-- 分组列表 -->
      <template v-else>
        <section v-for="(g, gi) in groups" :key="gi" :class="['mt-6', gi > 0 && 'mt-8']">
          <div class="flex items-baseline gap-3 mb-3">
            <h2 class="text-xs uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium">{{ g.title }}</h2>
            <span class="text-[11px] text-ink-500 dark:text-ink-300">{{ g.items.length }} 本</span>
          </div>
          <div class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
            <RouterLink
              v-for="it in g.items"
              :key="it.id"
              :to="it.chapterId ? `/reading/${it.bookId}?chapter=${it.chapterId}` : `/novel/${it.bookId}`"
              class="flex items-center gap-3 p-3.5 hover:bg-cream-200/40 dark:hover:bg-night-700/40 transition"
            >
              <div class="w-12 h-16 rounded-lg overflow-hidden shadow-cream shrink-0 bg-cream-200 dark:bg-night-700">
                <BookCover :title="it.title.slice(0, 2)" :variant="it.variant" :cover="it.cover" :footer="false" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-serif font-semibold text-sm truncate">{{ it.title }}</h4>
                <p v-if="it.chapterTitle" class="text-xs text-clay-700 dark:text-clay-400 mt-0.5 truncate">{{ it.chapterTitle }}</p>
                <p class="text-xs text-ink-500 dark:text-ink-300 mt-0.5 truncate">{{ it.meta }}</p>
              </div>
              <span v-if="it.progress === 100" class="text-[11px] px-2 py-0.5 rounded-full bg-moss-500/15 text-moss-600 dark:text-moss-500 shrink-0">完读</span>
              <span v-else-if="it.progress > 0" class="text-[11px] px-2 py-0.5 rounded-full bg-clay-500/10 text-clay-700 dark:text-clay-400 shrink-0">{{ it.progress }}%</span>
            </RouterLink>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

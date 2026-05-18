<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/v2/layout/AppHeader.vue'
import BottomNav from '@/components/v2/layout/BottomNav.vue'
import BookCover from '@/components/v2/book/BookCover.vue'
import Icon from '@/components/v2/icons/Icon.vue'
import BookshelfTabBar from '@/components/bookshelf/BookshelfTabBar.vue'
import GroupSelector from '@/components/bookshelf/GroupSelector.vue'
import BatchActionBar from '@/components/bookshelf/BatchActionBar.vue'
import UnreadBadge from '@/components/bookshelf/UnreadBadge.vue'
import { getBookshelf, batchBookshelf } from '@/api/bookshelf'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '我的书架',
  description: 'MOMO小说个人书架，用于管理在读、已读和想读作品。',
  url: `${SEO_DEFAULTS.siteUrl}/bookshelf`,
  robots: 'noindex,follow',
})

const activeTab = ref('all') // all | reading | finished | wishlist
const viewMode = ref('grid') // grid | list
const sortBy = ref('lastRead')
const groupName = ref('')
const manageMode = ref(false)
const selectedIds = ref([])
const books = ref([])
const loading = ref(false)

const filtered = computed(() => {
  let list = activeTab.value === 'all' ? books.value : books.value.filter(b => b.status === activeTab.value)
  if (groupName.value) list = list.filter(b => b.groupName === groupName.value)
  const sorted = [...list]
  sorted.sort((a, b) => {
    if (sortBy.value === 'title') return a.title.localeCompare(b.title)
    if (sortBy.value === 'progress') return b.progress - a.progress
    if (sortBy.value === 'updated') return new Date(b.updateTime || 0) - new Date(a.updateTime || 0)
    return Number(b.isTop) - Number(a.isTop) || new Date(b.lastReadTime || b.addTime || 0) - new Date(a.lastReadTime || a.addTime || 0)
  })
  return sorted
})

const stats = computed(() => {
  const r = books.value.filter(b => b.status === 'reading').length
  const f = books.value.filter(b => b.status === 'finished').length
  const w = books.value.filter(b => b.status === 'wishlist').length
  return {
    reading: r,
    finished: f,
    wishlist: w,
    total: r + f + w,
  }
})

const tabs = computed(() => [
  { key: 'all',      label: '全部', count: stats.value.total },
  { key: 'reading',  label: '在读', count: stats.value.reading },
  { key: 'finished', label: '已读', count: stats.value.finished },
  { key: 'wishlist', label: '想读', count: stats.value.wishlist },
])

const groups = computed(() => [...new Set(books.value.map(b => b.groupName).filter(Boolean))])

// 推荐补全
const recommends = ref([])

async function loadRecommends() {
  try {
    const { getRecommendNovels } = await import('@/api/novel')
    const res = await getRecommendNovels({ limit: 4 })
    if (res?.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      recommends.value = list.slice(0, 4).map((n, i) => ({
        id: n.id,
        title: n.title,
        author: n.author || '佚名',
        variant: i,
        cover: n.cover,
      }))
    }
  } catch (e) { /* ignore */ }
}

function normalizeBook(item, index) {
  const id = item.novel_id || item.id
  const type = item.type || (Number(item.progress || item.reading_progress || 0) >= 100 ? 'finished' : 'reading')
  return {
    id,
    title: item.title || '未命名小说',
    author: item.author || '佚名',
    cat: item.category_name || item.cat || '',
    progress: Math.max(0, Math.min(100, Math.round(Number(item.progress || item.reading_progress || 0)))),
    last: relativeTime(item.last_read_time || item.updated_at || item.added_time),
    status: type === 'wishlist' ? 'wishlist' : (type === 'finished' ? 'finished' : 'reading'),
    variant: Number(id || index) % 6,
    cover: item.cover,
    groupName: item.group_name || item.groupName || '',
    isTop: Boolean(item.is_top || item.isTop),
    hasUnreadUpdate: Boolean(item.hasUnreadUpdate || item.has_unread_update),
    lastReadTime: item.last_read_time,
    addTime: item.added_time || item.created_at,
    updateTime: item.updated_at,
  }
}

function relativeTime(value) {
  if (!value) return '最近'
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return `${days} 天前`
  return new Date(value).toLocaleDateString('zh-CN')
}

async function loadBookshelf() {
  loading.value = true
  try {
    const res = await getBookshelf({ sortBy: sortBy.value, type: activeTab.value === 'all' ? undefined : activeTab.value })
    const list = Array.isArray(res?.data) ? res.data : (res?.data?.data || res?.data?.list || [])
    books.value = list.map(normalizeBook)
  } catch (e) {
    books.value = []
  } finally {
    loading.value = false
  }
}

function toggleSelect(id) {
  if (!manageMode.value) return
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(item => item !== id)
    : [...selectedIds.value, id]
}

async function runBatch(action, extra = {}) {
  if (!selectedIds.value.length) return
  await batchBookshelf(action, selectedIds.value, extra).catch(() => {})
  selectedIds.value = []
  manageMode.value = false
  await loadBookshelf()
}

onMounted(async () => {
  await loadBookshelf()
  loadRecommends()
})
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <AppHeader />

    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <!-- 标题 + 阅读统计（PC 横向） -->
      <section class="pt-5 lg:flex lg:items-end lg:gap-8">
        <div class="flex-1 min-w-0">
          <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">My Library</p>
          <h1 class="font-serif text-2xl sm:text-3xl font-semibold tracking-tight">我的书架</h1>
          <p class="mt-1 text-sm text-ink-700 dark:text-ink-300">书架是港湾，每本书都等待重逢。</p>
        </div>

        <!-- 阅读统计（PC 移到右侧） -->
        <div class="mt-5 lg:mt-0 lg:w-auto">
          <div class="grid grid-cols-4 gap-2.5 rounded-2xl bg-cream-100 dark:bg-night-800 px-4 py-3 lg:min-w-[420px]">
            <div class="text-center">
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ stats.reading }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">在读</p>
            </div>
            <div class="text-center border-l border-cream-200 dark:border-night-700">
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ stats.finished }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">已读</p>
            </div>
            <div class="text-center border-l border-cream-200 dark:border-night-700">
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ stats.wishlist }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">想读</p>
            </div>
            <div class="text-center border-l border-cream-200 dark:border-night-700">
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ stats.total }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">总数</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabs + 视图切换 -->
      <section class="mt-5 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <BookshelfTabBar v-model:active="activeTab" :tabs="tabs" />
          <button
            class="px-3 h-9 rounded-full bg-cream-100 dark:bg-night-800 text-xs font-medium"
            @click="manageMode = !manageMode; selectedIds = []"
          >
            {{ manageMode ? '完成' : '管理' }}
          </button>
        </div>

        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <select v-model="sortBy" class="h-9 rounded-full bg-cream-100 dark:bg-night-800 px-3 text-xs outline-none">
              <option value="lastRead">最近阅读</option>
              <option value="updated">最近更新</option>
              <option value="progress">阅读进度</option>
              <option value="title">书名排序</option>
            </select>
            <GroupSelector v-model="groupName" :groups="groups" />
          </div>
          <div class="flex gap-1">
          <button
            @click="viewMode = 'grid'"
            :class="['w-9 h-9 grid place-items-center rounded-full transition',
              viewMode === 'grid' ? 'bg-cream-100 dark:bg-night-800 text-clay-700 dark:text-clay-400' : 'text-ink-500 hover:bg-cream-100 dark:hover:bg-night-800'
            ]"
            aria-label="网格视图"
          ><Icon name="grid" class="w-[18px] h-[18px]" /></button>
          <button
            @click="viewMode = 'list'"
            :class="['w-9 h-9 grid place-items-center rounded-full transition',
              viewMode === 'list' ? 'bg-cream-100 dark:bg-night-800 text-clay-700 dark:text-clay-400' : 'text-ink-500 hover:bg-cream-100 dark:hover:bg-night-800'
            ]"
            aria-label="列表视图"
          ><Icon name="list" class="w-[18px] h-[18px]" /></button>
          </div>
        </div>
      </section>

      <!-- 网格视图 -->
      <section v-if="viewMode === 'grid'" class="mt-4">
        <div v-if="filtered.length" class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          <component
            :is="manageMode ? 'button' : RouterLink"
            v-for="b in filtered"
            :key="b.id"
            :to="`/novel/${b.id}`"
            class="book-card group text-left"
            @click="toggleSelect(b.id)"
          >
            <div class="aspect-[3/4] rounded-xl overflow-hidden shadow-cream relative bg-cream-200 dark:bg-night-800">
              <BookCover :title="b.title.slice(0,2)" :variant="b.variant" :cover="b.cover" />
              <UnreadBadge v-if="b.hasUnreadUpdate && b.progress < 100" class="absolute top-2 right-2" />
              <div v-if="manageMode" :class="['absolute top-2 left-2 w-5 h-5 rounded-full border-2 grid place-items-center', selectedIds.includes(b.id) ? 'bg-clay-500 border-clay-500 text-cream-50' : 'bg-cream-50/80 border-cream-50']">
                <Icon v-if="selectedIds.includes(b.id)" name="check" class="w-3 h-3" />
              </div>
              <div v-if="b.progress < 100" class="absolute bottom-0 inset-x-0 h-1 bg-cream-50/30">
                <div class="h-full bg-cream-50" :style="{ width: b.progress + '%' }"></div>
              </div>
              <div v-else class="absolute top-2 right-2 w-6 h-6 rounded-full bg-moss-500 grid place-items-center text-cream-50">
                <Icon name="check" class="w-3.5 h-3.5" />
              </div>
            </div>
            <p class="mt-2 text-xs font-medium line-clamp-1">{{ b.title }}</p>
            <p class="text-[10px] text-ink-500 dark:text-ink-300 line-clamp-1">{{ b.status === 'wishlist' ? '想读' : (b.progress < 100 ? `进度 ${b.progress}%` : '已读完') }}</p>
          </component>
        </div>
        <div v-else-if="loading" class="py-20 text-center text-sm text-ink-500">书架加载中...</div>
        <div v-else class="py-20 text-center">
          <p class="text-sm text-ink-500 dark:text-ink-300">书架空空如也</p>
          <RouterLink to="/recommend" class="inline-block mt-4 px-5 py-2 rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 text-sm">去发现新故事</RouterLink>
        </div>
      </section>

      <!-- 列表视图 -->
      <section v-else class="mt-4">
        <div v-if="filtered.length" class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
          <component
            :is="manageMode ? 'button' : RouterLink"
            v-for="b in filtered"
            :key="b.id"
            :to="`/novel/${b.id}`"
            class="w-full text-left flex items-center gap-3 p-3 hover:bg-cream-200/40 dark:hover:bg-night-700/40 transition"
            @click="toggleSelect(b.id)"
          >
            <span v-if="manageMode" :class="['w-5 h-5 rounded-full border-2 grid place-items-center shrink-0', selectedIds.includes(b.id) ? 'bg-clay-500 border-clay-500 text-cream-50' : 'border-ink-300']">
              <Icon v-if="selectedIds.includes(b.id)" name="check" class="w-3 h-3" />
            </span>
            <div class="w-12 h-16 rounded-lg overflow-hidden shadow-cream shrink-0 bg-cream-200 dark:bg-night-700">
              <BookCover :title="b.title.slice(0,2)" :variant="b.variant" :cover="b.cover" :footer="false" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-serif font-semibold text-sm truncate">{{ b.title }}</h4>
              <p class="text-xs text-ink-500 dark:text-ink-300 mt-0.5 truncate">{{ b.author }} · {{ b.cat }} · {{ b.last }}</p>
              <div v-if="b.progress < 100" class="mt-1.5 h-1 rounded-full bg-cream-200 dark:bg-night-700 overflow-hidden">
                <div class="h-full bg-clay-500 rounded-full" :style="{ width: b.progress + '%' }"></div>
              </div>
              <p v-else class="mt-1.5 text-[10px] text-moss-600 dark:text-moss-500 font-medium">已读完 ✓</p>
            </div>
            <UnreadBadge v-if="b.hasUnreadUpdate && b.progress < 100" />
            <span v-if="b.status === 'reading'" class="text-[11px] px-2 py-0.5 rounded-full bg-clay-500/10 text-clay-700 dark:text-clay-400 shrink-0">{{ b.progress }}%</span>
          </component>
        </div>
      </section>

      <!-- 推荐补全 -->
      <section class="mt-10">
        <div class="flex items-end justify-between mb-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-moss-600 dark:text-moss-500 font-medium mb-1">For You</p>
            <h2 class="font-serif text-lg sm:text-xl font-semibold tracking-tight">猜你也会喜欢</h2>
          </div>
          <RouterLink to="/recommend" class="text-sm text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition">查看更多</RouterLink>
        </div>
        <div class="flex gap-3 overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-1">
          <RouterLink v-for="r in recommends" :key="r.id" :to="`/novel/${r.id}`" class="shrink-0 w-24 sm:w-28">
            <div class="aspect-[3/4] rounded-xl overflow-hidden shadow-cream">
              <BookCover :title="r.title.slice(0,2)" :variant="r.variant" :cover="r.cover" />
            </div>
            <p class="mt-2 text-xs font-medium line-clamp-1">{{ r.title }}</p>
            <p class="text-[10px] text-ink-500 dark:text-ink-300">{{ r.author }}</p>
          </RouterLink>
        </div>
      </section>
    </main>

    <BottomNav />
    <BatchActionBar
      v-if="manageMode && selectedIds.length"
      :count="selectedIds.length"
      :groups="groups"
      @delete="runBatch('delete')"
      @top="runBatch('top')"
      @untop="runBatch('untop')"
      @group="runBatch('group', { groupName: $event })"
    />
  </div>
</template>

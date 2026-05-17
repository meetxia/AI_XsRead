<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '@/components/v2/layout/AppHeader.vue'
import BottomNav from '@/components/v2/layout/BottomNav.vue'
import BookCover from '@/components/v2/book/BookCover.vue'
import Icon from '@/components/v2/icons/Icon.vue'
import { useBookshelfStore } from '@/stores/bookshelf'

const bookshelfStore = useBookshelfStore()

// ─── Tab/视图状态 ───
const activeTab = ref('all') // all | reading | finished
const viewMode = ref('grid') // grid | list

// ─── 占位数据（接 API 后会被覆盖） ───
const localBooks = ref([
  { id:1, title:'山有木兮',          author:'沈砚白', cat:'古风',   progress:42, last:'2 小时前', status:'reading',  variant:1 },
  { id:2, title:'归棠记事',          author:'沈砚白', cat:'古风',   progress:78, last:'昨日',     status:'reading',  variant:0 },
  { id:3, title:'夜窗集',            author:'阮宁',   cat:'治愈',   progress:100,last:'3 天前',   status:'finished', variant:1 },
  { id:4, title:'流光记',            author:'温知秋', cat:'都市',   progress:35, last:'本周',     status:'reading',  variant:4 },
  { id:5, title:'迷雾镇·第七封信',   author:'江聿',   cat:'悬疑',   progress:100,last:'上月',     status:'finished', variant:5 },
  { id:6, title:'长安的秋天',        author:'沈砚白', cat:'古风',   progress:62, last:'3 天前',   status:'reading',  variant:0 },
  { id:7, title:'霜降',              author:'林深',   cat:'都市',   progress:100,last:'2 月前',   status:'finished', variant:2 },
  { id:8, title:'第七个春天',        author:'温知秋', cat:'治愈',   progress:18, last:'1 周前',   status:'reading',  variant:4 },
  { id:9, title:'春寒料峭',          author:'温知秋', cat:'校园',   progress:100,last:'去年',     status:'finished', variant:1 },
])

// 合并 store 数据（如果有）
const books = computed(() => {
  const reading = bookshelfStore.reading || []
  const finished = bookshelfStore.finished || []
  if (!reading.length && !finished.length) return localBooks.value

  const mapped = [
    ...reading.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author || '佚名',
      cat: b.category_name || b.cat || '',
      progress: b.progress || 0,
      last: '最近',
      status: 'reading',
      variant: (b.id % 6),
      cover: b.cover,
    })),
    ...finished.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author || '佚名',
      cat: b.category_name || b.cat || '',
      progress: 100,
      last: '已读完',
      status: 'finished',
      variant: (b.id % 6),
      cover: b.cover,
    })),
  ]
  return mapped.length ? mapped : localBooks.value
})

const filtered = computed(() => {
  if (activeTab.value === 'all') return books.value
  return books.value.filter(b => b.status === activeTab.value)
})

const stats = computed(() => {
  const r = books.value.filter(b => b.status === 'reading').length
  const f = books.value.filter(b => b.status === 'finished').length
  return {
    reading: r,
    finished: f,
    total: r + f,
    hours: 287,
  }
})

const tabs = computed(() => [
  { key: 'all',      label: '全部', count: stats.value.total },
  { key: 'reading',  label: '在读', count: stats.value.reading },
  { key: 'finished', label: '已读', count: stats.value.finished },
])

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

onMounted(async () => {
  try { await bookshelfStore.fetchBookshelf() } catch (e) { /* ignore */ }
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
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ stats.hours }}<span class="text-xs ml-0.5 text-ink-500">h</span></p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">阅读</p>
            </div>
            <div class="text-center border-l border-cream-200 dark:border-night-700">
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ stats.total }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">总数</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabs + 视图切换 -->
      <section class="mt-5 flex items-center justify-between">
        <div class="flex gap-1 bg-cream-100 dark:bg-night-800 p-1 rounded-full">
          <button
            v-for="t in tabs"
            :key="t.key"
            @click="activeTab = t.key"
            :class="['px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition',
              activeTab === t.key ? 'bg-clay-700 text-cream-50 dark:bg-clay-500' : 'hover:bg-cream-200 dark:hover:bg-night-700'
            ]"
          >
            {{ t.label }} <span class="ml-1 opacity-75 text-xs">{{ t.count }}</span>
          </button>
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
      </section>

      <!-- 网格视图 -->
      <section v-if="viewMode === 'grid'" class="mt-4">
        <div v-if="filtered.length" class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
          <RouterLink v-for="b in filtered" :key="b.id" :to="`/novel/${b.id}`" class="book-card group">
            <div class="aspect-[3/4] rounded-xl overflow-hidden shadow-cream relative bg-cream-200 dark:bg-night-800">
              <BookCover :title="b.title.slice(0,2)" :variant="b.variant" :cover="b.cover" />
              <div v-if="b.progress < 100" class="absolute bottom-0 inset-x-0 h-1 bg-cream-50/30">
                <div class="h-full bg-cream-50" :style="{ width: b.progress + '%' }"></div>
              </div>
              <div v-else class="absolute top-2 right-2 w-6 h-6 rounded-full bg-moss-500 grid place-items-center text-cream-50">
                <Icon name="check" class="w-3.5 h-3.5" />
              </div>
            </div>
            <p class="mt-2 text-xs font-medium line-clamp-1">{{ b.title }}</p>
            <p class="text-[10px] text-ink-500 dark:text-ink-300 line-clamp-1">{{ b.progress < 100 ? `进度 ${b.progress}%` : '已读完' }}</p>
          </RouterLink>
        </div>
        <div v-else class="py-20 text-center">
          <p class="text-sm text-ink-500 dark:text-ink-300">书架空空如也</p>
          <RouterLink to="/recommend" class="inline-block mt-4 px-5 py-2 rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 text-sm">去发现新故事</RouterLink>
        </div>
      </section>

      <!-- 列表视图 -->
      <section v-else class="mt-4">
        <div v-if="filtered.length" class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
          <RouterLink v-for="b in filtered" :key="b.id" :to="`/novel/${b.id}`" class="flex items-center gap-3 p-3 hover:bg-cream-200/40 dark:hover:bg-night-700/40 transition">
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
            <span v-if="b.status === 'reading'" class="text-[11px] px-2 py-0.5 rounded-full bg-clay-500/10 text-clay-700 dark:text-clay-400 shrink-0">{{ b.progress }}%</span>
          </RouterLink>
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
              <BookCover :title="r.title.slice(0,2)" :variant="r.variant" />
            </div>
            <p class="mt-2 text-xs font-medium line-clamp-1">{{ r.title }}</p>
            <p class="text-[10px] text-ink-500 dark:text-ink-300">{{ r.author }}</p>
          </RouterLink>
        </div>
      </section>
    </main>

    <BottomNav />
  </div>
</template>

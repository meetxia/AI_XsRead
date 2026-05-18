<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import BookCover from '@/components/v2/book/BookCover.vue'
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar.vue'
import SearchFilterPanel from '@/components/novel/SearchFilterPanel.vue'
import {
  getSearchHistory, saveSearchHistory, clearSearchHistory,
  getHotSearch, searchNovels
} from '@/api/search'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '搜索',
  description: '在 MOMO小说 搜索书名、作者和标签，快速找到想看的小说。',
  url: `${SEO_DEFAULTS.siteUrl}/search`,
  robots: 'noindex,follow',
})

const router = useRouter()
const route = useRoute()

const keyword = ref('')
const filters = ref({
  hasFinished: '',
  wordCount: '',
  wordCountMin: '',
  wordCountMax: '',
  ratingMin: '',
  sortBy: 'default',
})
const history = ref([])
const hotList = ref([
  { id: 1, label: '山有木兮：那一年长安飘雪', tag: 'HOT' },
  { id: 2, label: '沈砚白', tag: '作者' },
  { id: 3, label: '长安的秋天', tag: '完结' },
  { id: 4, label: '迷雾镇·第七封信', tag: '新' },
  { id: 5, label: '治愈系小说' },
  { id: 6, label: '温知秋', tag: '作者' },
])
const hotCategories = ['古风言情','都市恋曲','悬疑推理','治愈系','奇幻冒险','校园青春','职场','穿越重生']
const guesses = ref([
  { id:'g1', title:'霜信',      author:'林深', cat:'都市言情', rating:9.0, variant:0 },
  { id:'g2', title:'深巷里的灯', author:'江聿', cat:'悬疑',     rating:9.1, variant:2 },
])
const searched = ref(false)
const loading = ref(false)

function loadHistory() {
  history.value = getSearchHistory()
}
function clearAll() {
  clearSearchHistory()
  history.value = []
}
function removeOne(k) {
  history.value = history.value.filter(h => h !== k)
  localStorage.setItem('searchHistory', JSON.stringify(history.value))
}

function readQuery() {
  keyword.value = route.query.keyword || route.query.q || ''
  filters.value = {
    hasFinished: route.query.hasFinished || '',
    wordCount: route.query.wordCount || '',
    wordCountMin: route.query.wordCountMin || '',
    wordCountMax: route.query.wordCountMax || '',
    ratingMin: route.query.ratingMin || '',
    sortBy: route.query.sortBy || 'default',
  }
}

function syncUrl(q) {
  const query = { ...route.query }
  if (q) query.keyword = q
  else delete query.keyword

  Object.entries(filters.value).forEach(([key, value]) => {
    if (value && value !== 'default') query[key] = value
    else delete query[key]
  })
  router.replace({ path: '/search', query })
}

async function doSearch(k, sync = true) {
  const q = (k || keyword.value || '').trim()
  if (!q && !hasActiveFilters()) return
  keyword.value = q
  if (q) {
    saveSearchHistory(q)
    loadHistory()
  }
  if (sync) syncUrl(q)
  loading.value = true
  searched.value = true
  try {
    const params = {
      keyword: q,
      page: 1,
      limit: 10,
      pageSize: 10,
      hasFinished: filters.value.hasFinished || undefined,
      wordCountMin: filters.value.wordCountMin || undefined,
      wordCountMax: filters.value.wordCountMax || undefined,
      ratingMin: filters.value.ratingMin || undefined,
      sortBy: filters.value.sortBy === 'default' ? undefined : filters.value.sortBy,
    }
    const res = await searchNovels(params)
    if (res?.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      guesses.value = list.map((n, i) => ({
        id: n.id,
        title: n.title,
        author: n.author || '佚名',
        cat: n.category_name || '',
        rating: Number(n.rating || 0).toFixed(1),
        variant: i,
        cover: n.cover,
      }))
    }
  } catch (e) { /* ignore */ }
  finally { loading.value = false }
}

function hasActiveFilters() {
  return Boolean(filters.value.hasFinished || filters.value.wordCountMin || filters.value.wordCountMax || filters.value.ratingMin || (filters.value.sortBy && filters.value.sortBy !== 'default'))
}

function resetFilters() {
  filters.value = { hasFinished: '', wordCount: '', wordCountMin: '', wordCountMax: '', ratingMin: '', sortBy: 'default' }
  doSearch(keyword.value)
}

async function loadHot() {
  try {
    const res = await getHotSearch()
    if (res?.code === 200 && Array.isArray(res.data) && res.data.length) {
      hotList.value = res.data.map((it, i) => ({
        id: i + 1,
        label: it.keyword || it.title || it.label || String(it),
        tag: i < 3 ? 'HOT' : (it.tag || ''),
      }))
    }
  } catch (e) { /* 保留默认热搜 */ }
}

onMounted(() => {
  readQuery()
  loadHistory()
  loadHot()
  if (keyword.value || hasActiveFilters()) doSearch(keyword.value, false)
})

watch(() => route.query, () => {
  readQuery()
  if (keyword.value || hasActiveFilters()) doSearch(keyword.value, false)
})

watch(filters, () => doSearch(keyword.value), { deep: true })
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <!-- 极简搜索头 -->
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center gap-2">
        <button @click="router.back()" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="返回">
          <Icon name="back" class="w-5 h-5" />
        </button>
        <div class="flex-1 relative">
          <EnhancedSearchBar v-model="keyword" placeholder="搜书名、作者、标签..." @search="doSearch" />
        </div>
        <button @click="doSearch()" class="px-3 h-9 rounded-full text-sm text-clay-700 dark:text-clay-400 font-medium hover:bg-cream-100 dark:hover:bg-night-800 transition">搜索</button>
      </div>
    </header>

    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <!-- 历史 -->
      <section v-if="history.length" class="mt-5">
        <div class="flex items-end justify-between mb-2.5">
          <h2 class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium">最近搜索</h2>
          <button @click="clearAll" class="text-xs text-ink-500 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition">清空</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-for="h in history" :key="h" @click="doSearch(h)" class="px-3 py-1.5 rounded-full bg-cream-100 dark:bg-night-800 text-sm hover:bg-cream-200 dark:hover:bg-night-700 transition">{{ h }}</button>
        </div>
      </section>

      <SearchFilterPanel v-model="filters" class="mt-5" @reset="resetFilters" />

      <!-- PC 双栏：左 热搜榜单+分类；右 猜你想看 -->
      <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <!-- 左栏 -->
        <div class="space-y-6 min-w-0">
          <!-- 热搜榜 -->
          <section>
            <div class="flex items-end justify-between mb-3">
              <div>
                <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Trending Now</p>
                <h2 class="font-serif text-lg sm:text-xl font-semibold tracking-tight">热搜榜单</h2>
              </div>
            </div>
            <ol class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
              <li v-for="(it, i) in hotList" :key="it.id">
                <button @click="doSearch(it.label)" class="w-full flex items-center gap-3 p-3 hover:bg-cream-200/40 dark:hover:bg-night-700/40 transition text-left">
                  <span :class="['font-serif text-base font-semibold w-5 text-center shrink-0',
                    i < 2 ? 'text-clay-700 dark:text-clay-400' : 'text-ink-500 dark:text-ink-300']">{{ i + 1 }}</span>
                  <p class="flex-1 text-sm font-medium truncate">{{ it.label }}</p>
                  <span v-if="it.tag === 'HOT'" class="text-[11px] px-2 py-0.5 rounded-full bg-cinnabar-500/10 text-cinnabar-500 font-medium shrink-0">HOT</span>
                  <span v-else-if="it.tag" class="text-[11px] text-ink-500 dark:text-ink-300 shrink-0">{{ it.tag }}</span>
                </button>
              </li>
            </ol>
          </section>

          <!-- 分类 chip -->
          <section>
            <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-2.5">热门分类</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="c in hotCategories" :key="c"
                @click="doSearch(c)"
                class="px-3 py-1.5 rounded-full bg-cream-100 dark:bg-night-800 text-sm hover:bg-clay-500 hover:text-cream-50 transition"
              >{{ c }}</button>
            </div>
          </section>
        </div>

        <!-- 右栏：猜你想看 -->
        <section class="min-w-0">
          <div class="flex items-end justify-between mb-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">For You</p>
              <h2 class="font-serif text-lg sm:text-xl font-semibold tracking-tight">猜你想看</h2>
            </div>
          </div>
          <div class="space-y-2.5">
            <div v-if="loading" class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4 text-sm text-ink-500">搜索中...</div>
            <div v-else-if="searched && !guesses.length" class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4 text-sm text-ink-500">没有符合条件的小说，试试放宽筛选 →</div>
            <RouterLink v-for="g in guesses" :key="g.id" :to="`/novel/${g.id}`" class="flex items-center gap-3 p-3 rounded-2xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200/60 dark:hover:bg-night-700/60 transition">
              <div class="w-12 h-16 rounded-lg overflow-hidden shadow-cream shrink-0">
                <BookCover :title="g.title.slice(0,2)" :variant="g.variant" :cover="g.cover" :footer="false" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-serif font-semibold text-sm truncate">{{ g.title }}</h4>
                <p class="text-xs text-ink-500 dark:text-ink-300 mt-0.5 truncate">{{ g.author }} · {{ g.cat }} · 评分 {{ g.rating }}</p>
              </div>
              <span class="text-xs text-clay-700 dark:text-clay-400 shrink-0">推荐</span>
            </RouterLink>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

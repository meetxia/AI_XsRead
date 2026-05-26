<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppHeader from '@/components/v2/layout/AppHeader.vue'
import BottomNav from '@/components/v2/layout/BottomNav.vue'
import BookCard from '@/components/v2/book/BookCard.vue'
import BookCover from '@/components/v2/book/BookCover.vue'
import Icon from '@/components/v2/icons/Icon.vue'
import RankTabSection from '@/components/novel/RankTabSection.vue'
import { getNovelList, getRecommendNovels } from '@/api/novel'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '分类',
  description: 'MOMO小说分类页汇总都市言情、古风穿越、悬疑推理等频道入口，并提供主编推荐、读者最爱、分榜速览和推荐书单。',
  url: `${SEO_DEFAULTS.siteUrl}/recommend`,
  type: 'website',
  keywords: '小说分类,小说榜单,热门小说,主编推荐,推荐书单,都市言情,古风穿越,悬疑推理,MOMO小说',
  jsonLd: {
    '@type': 'CollectionPage',
    name: 'MOMO小说分类',
    description: '按频道和榜单浏览 MOMO小说 的精选内容。',
    url: `${SEO_DEFAULTS.siteUrl}/recommend`,
    inLanguage: 'zh-CN',
  },
})

const route = useRoute()

const tabs = [
  { key: 'recommend', label: '为你推荐' },
  { key: 'hot',       label: '本周热门' },
  { key: 'new',       label: '新书上架' },
  { key: 'finished',  label: '完结好书' },
  { key: 'editor',    label: '编辑推荐' },
]
const activeTab = ref(route.query.tab || 'recommend')
const activeCategoryId = ref(route.query.categoryId ? Number(route.query.categoryId) : null)

const categories = [
  { id: 101, name: '都市言情', icon: 'fire',      color: 'bg-clay-500/10 text-clay-700 dark:text-clay-400' },
  { id: 102, name: '古风穿越', icon: 'starFill',  color: 'bg-moss-500/10 text-moss-600 dark:text-moss-500' },
  { id: 104, name: '悬疑推理', icon: 'eye',       color: 'bg-clay-500/10 text-clay-700 dark:text-clay-400' },
  { id: 103, name: '玄幻修仙', icon: 'sparkle',   color: 'bg-moss-500/10 text-moss-600 dark:text-moss-500' },
  { id: 105, name: '科幻未来', icon: 'heart',     color: 'bg-clay-500/10 text-clay-700 dark:text-clay-400' },
]

const books = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const editorPick = ref(null)
const ranks = ref([])
const recommendBooks = ref([])
const rankingsLoading = ref(false)

function normalizeBook(n, i = 0) {
  return {
    id: n.id,
    title: n.title,
    author: n.author || '佚名',
    cat: n.category_name || '',
    rating: Number(n.rating || 0).toFixed(1),
    cover: n.cover,
    variant: i % 6,
  }
}

async function loadRankingBlocks() {
  rankingsLoading.value = true
  try {
    const [recRes, hotRes] = await Promise.allSettled([
      getRecommendNovels({ limit: 12 }),
      getNovelList({ sortBy: 'views', order: 'DESC', page: 1, pageSize: 5 }),
    ])

    if (recRes.status === 'fulfilled' && recRes.value?.code === 200) {
      const list = Array.isArray(recRes.value.data)
        ? recRes.value.data
        : (recRes.value.data?.list || [])

      if (list.length > 0) {
        const first = list[0]
        editorPick.value = {
          id: first.id,
          title: first.title,
          category: first.category_name || '小说',
          author: first.author || '佚名',
          wordCount: first.word_count ? `${Math.round(first.word_count / 10000)} 万字` : '未知',
          intro: (first.description || '').replace(/\r\n/g, ' ').slice(0, 120) + '…',
          rating: Number(first.rating || 0).toFixed(1),
          readers: first.views ? `${(first.views / 10000).toFixed(1)} 万` : '0',
          cover: first.cover,
        }
        recommendBooks.value = list.slice(1, 11).map((n, i) => normalizeBook(n, i))
      }
    }

    if (hotRes.status === 'fulfilled' && hotRes.value?.code === 200) {
      const list = Array.isArray(hotRes.value.data)
        ? hotRes.value.data
        : (hotRes.value.data?.list || [])
      ranks.value = list.slice(0, 5).map((n, i) => ({
        ...normalizeBook(n, i),
        rank: i + 1,
        readers: n.views ? `${(n.views / 10000).toFixed(1)} 万` : '0',
      }))
    }
  } catch (e) {
    console.warn('[Category] ranking load error', e?.message)
  } finally {
    rankingsLoading.value = false
  }
}

async function loadBooks(reset = true) {
  if (loading.value) return
  loading.value = true
  if (reset) {
    page.value = 1
    books.value = []
    hasMore.value = true
  }

  try {
    let res
    const params = { page: page.value, pageSize: 20 }

    if (activeCategoryId.value) {
      params.categoryId = activeCategoryId.value
      res = await getNovelList(params)
    } else {
      switch (activeTab.value) {
        case 'hot':
          res = await getNovelList({ ...params, sortBy: 'views', order: 'DESC' })
          break
        case 'new':
          res = await getNovelList({ ...params, sortBy: 'created_at', order: 'DESC' })
          break
        case 'finished':
          res = await getNovelList({ ...params, status: 0 })
          break
        case 'editor':
          res = await getNovelList({ ...params, sortBy: 'is_recommended', order: 'DESC' })
          break
        default:
          res = await getRecommendNovels({ limit: 20 })
      }
    }

    if (res?.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      const newBooks = list.map((n, i) => normalizeBook(n, books.value.length + i))
      if (reset) {
        books.value = newBooks
      } else {
        books.value.push(...newBooks)
      }
      const pagination = res.data?.pagination
      hasMore.value = pagination ? page.value < pagination.totalPages : newBooks.length >= 20
    }
  } catch (e) {
    console.warn('[Recommend] load error', e?.message)
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!hasMore.value || loading.value) return
  page.value++
  loadBooks(false)
}

function selectCategory(id) {
  activeCategoryId.value = activeCategoryId.value === id ? null : id
  loadBooks()
}

function selectedContentTitle() {
  if (activeCategoryId.value) return categories.find(c => c.id === activeCategoryId.value)?.name || '分类精选'
  return tabs.find(t => t.key === activeTab.value)?.label || '为你推荐'
}

watch(activeTab, () => {
  activeCategoryId.value = null
  loadBooks()
})

onMounted(() => {
  loadRankingBlocks()
  loadBooks()
})
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <AppHeader />

    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <section class="pt-5">
        <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Categories</p>
        <h1 class="font-serif text-2xl sm:text-3xl font-semibold tracking-tight">分类</h1>
        <p class="mt-1 text-sm text-ink-700 dark:text-ink-300">先按频道进入，再看本周榜单和编辑精选。</p>
      </section>

      <!-- 频道入口 -->
      <section class="mt-5">
        <div class="flex gap-2 overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-1">
          <button
            v-for="t in tabs"
            :key="t.key"
            @click="activeTab = t.key"
            :class="['shrink-0 px-4 h-8 inline-flex items-center rounded-full text-sm font-medium transition',
              activeTab === t.key && !activeCategoryId
                ? 'bg-clay-700 dark:bg-clay-500 text-cream-50'
                : 'bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700'
            ]"
          >{{ t.label }}</button>
        </div>
      </section>

      <section class="mt-4">
        <div class="grid grid-cols-5 gap-2 sm:gap-3">
          <button
            v-for="c in categories"
            :key="c.id"
            @click="selectCategory(c.id)"
            :class="['flex flex-col items-center gap-1 py-2.5 sm:py-3 rounded-xl transition',
              activeCategoryId === c.id
                ? 'bg-clay-700 dark:bg-clay-500 text-cream-50'
                : 'bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700'
            ]"
          >
            <span :class="['w-8 h-8 rounded-lg grid place-items-center', activeCategoryId === c.id ? 'text-cream-50' : c.color]">
              <Icon :name="c.icon" class="w-4 h-4" />
            </span>
            <span class="text-[11px]">{{ c.name }}</span>
          </button>
        </div>
      </section>

      <!-- 榜单：主编推荐 + 读者最爱 -->
      <div class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section v-if="editorPick" class="lg:col-span-2 min-w-0">
          <div class="flex items-end justify-between mb-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Editor's Pick</p>
              <h2 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight">本期主编荐读</h2>
            </div>
            <button
              type="button"
              class="text-sm text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition"
              @click="activeTab = 'editor'"
            >
              全部
            </button>
          </div>

          <article class="rounded-2xl overflow-hidden bg-cream-100 dark:bg-night-800 shadow-cream">
            <RouterLink :to="`/novel/${editorPick.id}`" class="flex gap-3 sm:gap-5">
              <div class="relative w-[100px] sm:w-44 lg:w-52 aspect-[3/4] sm:aspect-[4/5] shrink-0 overflow-hidden bg-clay-500">
                <BookCover
                  :title="editorPick.title"
                  sub="EDITOR'S PICK"
                  :variant="0"
                  :cover="editorPick.cover"
                />
                <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cream-50 text-clay-700">编辑荐</span>
              </div>
              <div class="py-3 pr-3 sm:py-5 sm:pr-5 flex-1 min-w-0 flex flex-col">
                <div class="flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-300 mb-1">
                  <span>{{ editorPick.category }}</span>
                  <span class="w-0.5 h-0.5 rounded-full bg-current"></span>
                  <span class="truncate">{{ editorPick.author }}</span>
                  <span class="w-0.5 h-0.5 rounded-full bg-current hidden sm:inline-block"></span>
                  <span class="hidden sm:inline">{{ editorPick.wordCount }}</span>
                </div>
                <h3 class="font-serif text-base sm:text-xl font-semibold leading-snug mb-1 line-clamp-2">{{ editorPick.title }}</h3>
                <p class="text-xs sm:text-sm text-ink-700 dark:text-ink-300 leading-relaxed line-clamp-2 sm:line-clamp-3">{{ editorPick.intro }}</p>
                <div class="mt-auto pt-2 sm:pt-3 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 text-[11px] text-ink-500 dark:text-ink-300 min-w-0">
                    <span class="flex items-center gap-1 text-clay-500 dark:text-clay-400 shrink-0">
                      <Icon name="starFill" class="w-3 h-3" />
                      <span class="font-medium text-ink-900 dark:text-cream-100">{{ editorPick.rating }}</span>
                    </span>
                    <span class="truncate">· {{ editorPick.readers }}人在读</span>
                  </div>
                  <span class="shrink-0 text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 h-7 sm:h-8 inline-flex items-center rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 hover:bg-clay-600 transition">
                    阅读
                  </span>
                </div>
              </div>
            </RouterLink>
          </article>
        </section>

        <section v-else-if="rankingsLoading" class="lg:col-span-2 min-w-0">
          <div class="h-6 w-32 rounded skeleton mb-3"></div>
          <div class="rounded-2xl overflow-hidden bg-cream-100 dark:bg-night-800 flex">
            <div class="w-[100px] sm:w-44 lg:w-52 aspect-[3/4] sm:aspect-[4/5] skeleton shrink-0"></div>
            <div class="p-4 space-y-2.5 flex-1">
              <div class="h-3 w-3/4 rounded skeleton"></div>
              <div class="h-5 w-1/2 rounded skeleton"></div>
              <div class="h-3 w-full rounded skeleton"></div>
              <div class="h-3 w-2/3 rounded skeleton"></div>
            </div>
          </div>
        </section>

        <section class="lg:col-span-1 min-w-0">
          <div class="flex items-end justify-between mb-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Top Charts</p>
              <h2 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight">本周读者最爱</h2>
            </div>
            <button
              type="button"
              class="text-sm text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition"
              @click="activeTab = 'hot'"
            >
              完整榜单
            </button>
          </div>
          <ol v-if="ranks.length" class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
            <li v-for="r in ranks" :key="r.id">
              <RouterLink :to="`/novel/${r.id}`" class="flex items-center gap-3 p-3 hover:bg-cream-200/40 dark:hover:bg-night-700/40 transition-colors">
                <span :class="['font-serif text-lg font-semibold w-6 text-center shrink-0', r.rank <= 2 ? 'text-clay-700 dark:text-clay-400' : 'text-ink-500 dark:text-ink-300']">{{ r.rank }}</span>
                <div class="w-10 h-14 rounded shadow-cream shrink-0 overflow-hidden bg-cream-200 dark:bg-night-700">
                  <BookCover :title="r.title" :variant="r.variant" :cover="r.cover" :footer="false" />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-serif font-semibold text-sm truncate">{{ r.title }}</h4>
                  <p class="text-xs text-ink-500 dark:text-ink-300 mt-0.5 truncate">{{ r.author }} · {{ r.cat }}</p>
                </div>
                <span class="text-xs text-clay-500 dark:text-clay-400 font-medium shrink-0">{{ r.rating }}</span>
              </RouterLink>
            </li>
          </ol>
          <div v-else-if="rankingsLoading" class="rounded-2xl bg-cream-100 dark:bg-night-800 overflow-hidden divide-y divide-cream-200 dark:divide-night-700">
            <div v-for="i in 5" :key="i" class="flex items-center gap-3 p-3">
              <div class="w-6 h-6 rounded skeleton"></div>
              <div class="w-10 h-14 rounded skeleton"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-3/4 rounded skeleton"></div>
                <div class="h-3 w-1/2 rounded skeleton"></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="mt-8">
        <RankTabSection />
      </section>

      <!-- 推荐书单 -->
      <section class="mt-8">
        <div class="flex items-end justify-between mb-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">For You</p>
            <h2 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight">推荐书单</h2>
          </div>
          <button
            type="button"
            class="text-sm text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition"
            @click="activeTab = 'recommend'"
          >
            查看更多
          </button>
        </div>
        <div v-if="recommendBooks.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <BookCard v-for="b in recommendBooks" :key="b.id" :book="b" />
        </div>
        <div v-else-if="rankingsLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <div v-for="i in 5" :key="i" class="aspect-[3/4] rounded-2xl skeleton"></div>
        </div>
      </section>

      <!-- 精选内容 -->
      <section class="mt-8">
        <div class="flex items-end justify-between mb-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Curated Reads</p>
            <h2 class="font-serif text-lg sm:text-xl font-semibold tracking-tight">{{ selectedContentTitle() }}</h2>
          </div>
          <span class="text-xs text-ink-500 dark:text-ink-300">{{ books.length }} 本</span>
        </div>

        <div v-if="books.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <BookCard v-for="b in books" :key="b.id" :book="b" />
        </div>

        <!-- 骨架屏 -->
        <div v-else-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <div v-for="i in 10" :key="i" class="aspect-[3/4] rounded-2xl skeleton"></div>
        </div>

        <!-- 空状态 -->
        <div v-else class="py-16 text-center">
          <p class="text-sm text-ink-500 dark:text-ink-300">暂无内容</p>
        </div>

        <!-- 加载更多 -->
        <button
          v-if="hasMore && !loading && books.length"
          @click="loadMore"
          class="mt-6 w-full py-2.5 text-sm font-medium border border-cream-200 dark:border-night-700 rounded-xl hover:bg-cream-100 dark:hover:bg-night-800 transition"
        >
          加载更多
        </button>
        <div v-if="loading && books.length" class="mt-4 text-center text-sm text-ink-500">加载中…</div>
      </section>
    </main>

    <BottomNav />
  </div>
</template>

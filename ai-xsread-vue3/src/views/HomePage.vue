<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppHeader from '@/components/v2/layout/AppHeader.vue'
import BottomNav from '@/components/v2/layout/BottomNav.vue'
import BookCover from '@/components/v2/book/BookCover.vue'
import Icon from '@/components/v2/icons/Icon.vue'
import { getRecommendNovels, getNovelList } from '@/api/novel'
import { useUserStore } from '@/stores/user'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'
import { buildOrganizationSchema, buildWebSiteSchema } from '@/utils/schema'

useSeoMeta({
  title: 'MOMO小说',
  description: SEO_DEFAULTS.description,
  url: SEO_DEFAULTS.siteUrl + '/',
  type: 'website',
  keywords: 'MOMO小说,免费小说,在线阅读,都市言情,古风穿越,悬疑推理,治愈系,奇幻冒险,女频小说',
  jsonLd: [buildWebSiteSchema(), buildOrganizationSchema()],
})

const router = useRouter()
const userStore = useUserStore()

const searchKeyword = ref('')
const loading = ref(false)
const continueBook = ref(null)
const hasContinue = ref(false)
const featuredBooks = ref([])
const hotBooks = ref([])
const visibleFeedCount = ref(8)
const loadMoreSentinel = ref(null)
const activeCategoryKey = ref('featured')
let observer = null

const categories = [
  { key: 'featured', label: '精选' },
  { key: 'urban', label: '都市言情', categoryId: 101 },
  { key: 'ancient', label: '古风穿越', categoryId: 102 },
  { key: 'mystery', label: '悬疑推理', categoryId: 103 },
  { key: 'healing', label: '治愈甜宠', categoryId: 104 },
  { key: 'fantasy', label: '奇幻冒险', categoryId: 105 },
  { key: 'finished', label: '完结', status: 0 },
]

const activeCategory = computed(() => (
  categories.find(item => item.key === activeCategoryKey.value) || categories[0]
))

const shelfGroups = computed(() => [
  {
    key: 'warm',
    title: '女生热读',
    subtitle: '高收藏 · 高人气',
    books: hotBooks.value.slice(0, 8),
    accent: 'text-rose-600 dark:text-rose-300',
  },
  {
    key: 'new',
    title: '新书抢先',
    subtitle: '刚上架的故事',
    books: featuredBooks.value.slice(3, 11),
    accent: 'text-moss-600 dark:text-moss-400',
  },
  {
    key: 'complete',
    title: '完结可追',
    subtitle: '一口气读完',
    books: mergedBooks.value.slice(6, 14),
    accent: 'text-clay-700 dark:text-clay-300',
  },
].filter(group => group.books.length > 0))

const mergedBooks = computed(() => {
  const byId = new Map()
  ;[...featuredBooks.value, ...hotBooks.value].forEach((book) => {
    if (book?.id && !byId.has(book.id)) {
      byId.set(book.id, book)
    }
  })
  return [...byId.values()]
})

const feedSource = computed(() => {
  const source = mergedBooks.value
  if (source.length === 0) return []

  const targetSize = Math.max(24, source.length * 2)
  return Array.from({ length: targetSize }, (_, index) => {
    const base = source[index % source.length]
    return {
      ...base,
      feedKey: `${base.id}-${index}`,
      tag: index % 3 === 0 ? '口碑上升' : (index % 3 === 1 ? '适合睡前读' : '本周有人追'),
    }
  })
})

const waterfallBooks = computed(() => feedSource.value.slice(0, visibleFeedCount.value))
const canLoadMore = computed(() => visibleFeedCount.value < feedSource.value.length)
const hotRankingBooks = computed(() => {
  const source = hotBooks.value.length ? hotBooks.value : mergedBooks.value
  return source.slice(0, 8)
})

function normalizeNovel(novel, index = 0) {
  const views = Number(novel.views || novel.read_count || 0)
  const wordCount = Number(novel.word_count || novel.words || 0)
  const description = String(novel.description || novel.summary || '她在命运转弯处遇见新的自己，故事从此有了温度。')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    id: novel.id || novel.novel_id || index + 1,
    title: novel.title || '未命名小说',
    author: novel.author || novel.author_name || '佚名',
    category: novel.category_name || novel.category || '小说',
    description,
    rating: Number(novel.rating || 0).toFixed(1),
    readers: views > 0 ? `${(views / 10000).toFixed(1)}万人在读` : '新书上架',
    wordCount: wordCount > 0 ? `${Math.max(1, Math.round(wordCount / 10000))}万字` : '连载中',
    cover: novel.cover || novel.cover_url || '',
    variant: index,
  }
}

function extractList(response) {
  const data = response?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.items)) return data.items
  return []
}

function submitSearch() {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    router.push('/search')
    return
  }
  router.push(`/search?keyword=${encodeURIComponent(keyword)}`)
}

function loadMore() {
  if (!canLoadMore.value) return
  visibleFeedCount.value = Math.min(visibleFeedCount.value + 6, feedSource.value.length)
}

async function loadData() {
  loading.value = true
  try {
    const currentCategory = activeCategory.value
    const hotParams = {
      sortBy: 'views',
      order: 'DESC',
      page: 1,
      pageSize: 18,
    }
    if (currentCategory.categoryId) hotParams.categoryId = currentCategory.categoryId
    if (currentCategory.status !== undefined) hotParams.status = currentCategory.status

    const [recRes, hotRes] = await Promise.allSettled([
      currentCategory.key === 'featured'
        ? getRecommendNovels({ limit: 18 })
        : getNovelList({ ...hotParams, sortBy: 'created_at', order: 'DESC' }),
      getNovelList(hotParams),
    ])

    if (recRes.status === 'fulfilled' && recRes.value?.code === 200) {
      featuredBooks.value = extractList(recRes.value).map(normalizeNovel)
    }

    if (hotRes.status === 'fulfilled' && hotRes.value?.code === 200) {
      hotBooks.value = extractList(hotRes.value).map(normalizeNovel)
    }

    if (featuredBooks.value.length === 0 && hotBooks.value.length > 0) {
      featuredBooks.value = hotBooks.value.slice(0, 12)
    }
    if (hotBooks.value.length === 0 && featuredBooks.value.length > 0) {
      hotBooks.value = featuredBooks.value.slice().reverse()
    }

    if (userStore.isLogin) {
      loadContinueReading()
    }
  } catch (error) {
    console.warn('[Home] load bookstore data error', error?.message)
  } finally {
    loading.value = false
  }
}

async function selectCategory(item) {
  if (activeCategoryKey.value === item.key || loading.value) return
  activeCategoryKey.value = item.key
  visibleFeedCount.value = 8
  featuredBooks.value = []
  hotBooks.value = []
  await loadData()
  await nextTick()
  observer?.disconnect()
  observer = null
  setupLoadMoreObserver()
}

async function loadContinueReading() {
  try {
    const { getReadingHistory } = await import('@/api/user')
    const res = await getReadingHistory({ page: 1, pageSize: 1 })
    if (res?.code !== 200) return

    const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
    if (list.length === 0) return

    const history = list[0]
    const progress = Math.max(0, Math.min(100, Math.round(Number(history.progress || history.reading_progress || 0))))
    const chapterNumber = history.chapter_number || history.chapter_no || ''
    const chapterTitle = history.chapter_title || '继续阅读'

    continueBook.value = {
      id: history.novel_id,
      title: history.title || '未知小说',
      author: history.author || '佚名',
      chapter: chapterNumber ? `第 ${chapterNumber} 章 · ${chapterTitle}` : `上次读到 · ${chapterTitle}`,
      progress,
      chapterId: history.chapter_id,
    }
    hasContinue.value = true
  } catch (error) {
    // 最近阅读不是首页首屏的强依赖，失败时静默降级。
  }
}

function setupLoadMoreObserver() {
  if (!loadMoreSentinel.value || typeof IntersectionObserver === 'undefined') return

  observer = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) {
      loadMore()
    }
  }, { rootMargin: '240px 0px' })

  observer.observe(loadMoreSentinel.value)
}

onMounted(async () => {
  await loadData()
  await nextTick()
  setupLoadMoreObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div class="home-page min-h-screen bg-cream-50 text-ink-900 dark:bg-night-900 dark:text-cream-100 paper-texture">
    <AppHeader class="hidden lg:block" />

    <main class="mx-auto max-w-screen-xl px-4 pb-32 sm:px-6 lg:px-8">
      <header class="sticky top-0 z-20 -mx-4 bg-cream-50/95 px-4 pb-2 pt-3 backdrop-blur dark:bg-night-900/95 sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pb-4 lg:pt-5 lg:backdrop-blur-none lg:dark:bg-transparent">
        <form
          class="flex h-11 items-center gap-2 rounded-full border border-cream-200 bg-white px-4 shadow-sm dark:border-night-700 dark:bg-night-800"
          data-testid="home-search-entry"
          @submit.prevent="submitSearch"
        >
          <Icon name="search" class="h-5 w-5 text-ink-400 dark:text-ink-300" />
          <input
            v-model="searchKeyword"
            type="search"
            class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400 dark:placeholder:text-ink-300"
            placeholder="搜索书名、作者、人物"
            aria-label="搜索小说"
          />
          <button type="submit" class="shrink-0 text-sm font-medium text-clay-700 dark:text-clay-300">搜索</button>
        </form>

        <nav
          class="no-scrollbar -mx-4 mt-3 flex gap-5 overflow-x-auto px-4 text-[15px] font-semibold sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0"
          data-testid="home-category-nav"
          aria-label="首页分类导航"
        >
          <button
            v-for="item in categories"
            :key="item.key"
            type="button"
            :data-testid="`home-category-tab-${item.key}`"
            @click="selectCategory(item)"
            :class="[
              'shrink-0 border-b-2 pb-2 transition-colors',
              activeCategoryKey === item.key
                ? 'border-clay-700 text-clay-800 dark:border-clay-300 dark:text-clay-200'
                : 'border-transparent text-ink-500 hover:text-clay-700 dark:text-ink-300 dark:hover:text-clay-300'
            ]"
          >
            {{ item.label }}
          </button>
        </nav>
      </header>

      <section class="pt-4" data-testid="home-hot-ranking">
        <div class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-cream-200 dark:bg-night-800 dark:ring-night-700">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="no-scrollbar flex min-w-0 flex-1 gap-5 overflow-x-auto text-lg font-semibold">
              <span class="shrink-0 text-ink-950 dark:text-cream-50">推荐榜</span>
              <span class="shrink-0 text-ink-400 dark:text-ink-300">完本榜</span>
              <span class="shrink-0 text-ink-400 dark:text-ink-300">口碑榜</span>
              <span class="shrink-0 text-ink-400 dark:text-ink-300">飙升榜</span>
            </div>
            <RouterLink to="/recommend?tab=hot" class="shrink-0 text-sm font-medium text-ink-700 dark:text-ink-300">
              完整榜单
            </RouterLink>
          </div>

          <div v-if="hotRankingBooks.length" class="grid grid-cols-2 gap-x-3 gap-y-4">
            <RouterLink
              v-for="(book, index) in hotRankingBooks"
              :key="`hot-rank-${book.id}`"
              :to="`/novel/${book.id}`"
              class="flex min-w-0 gap-2"
              data-testid="home-hot-rank-item"
            >
              <div class="h-[70px] w-[52px] shrink-0 overflow-hidden rounded-md bg-cream-200 shadow-sm dark:bg-night-700">
                <BookCover :title="book.title" :variant="book.variant + index" :cover="book.cover" :footer="false" />
              </div>
              <div class="min-w-0 flex-1 pt-1">
                <div class="flex items-baseline gap-1.5">
                  <span
                    :class="[
                      'w-5 shrink-0 text-center font-serif text-lg font-bold leading-none',
                      index < 3 ? 'text-clay-500 dark:text-clay-300' : 'text-ink-900 dark:text-cream-100'
                    ]"
                  >
                    {{ index + 1 }}
                  </span>
                  <h2 class="line-clamp-2 text-[15px] font-semibold leading-5 text-ink-950 dark:text-cream-50">{{ book.title }}</h2>
                </div>
                <p class="mt-1 truncate pl-6 text-xs text-clay-500 dark:text-clay-300">{{ book.category }} · {{ book.readers }}</p>
              </div>
            </RouterLink>
          </div>

          <div v-else class="grid grid-cols-2 gap-x-3 gap-y-4">
            <div v-for="item in 8" :key="item" class="flex gap-2">
              <div class="h-[70px] w-[52px] shrink-0 rounded-md skeleton"></div>
              <div class="flex-1 space-y-2 pt-1">
                <div class="h-4 w-20 rounded skeleton"></div>
                <div class="h-4 w-14 rounded skeleton"></div>
                <div class="h-3 w-16 rounded skeleton"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="hasContinue && continueBook" class="pt-4">
        <RouterLink
          :to="continueBook.chapterId ? `/reading/${continueBook.id}?chapter=${continueBook.chapterId}` : `/reading/${continueBook.id}`"
          class="block rounded-2xl bg-gradient-to-br from-clay-700 via-clay-600 to-rose-700 p-4 text-cream-50 shadow-cream"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs text-cream-100/75">继续阅读</p>
              <h1 class="mt-1 truncate font-serif text-xl font-semibold">{{ continueBook.title }}</h1>
              <p class="mt-1 truncate text-xs text-cream-100/80">{{ continueBook.author }} · {{ continueBook.chapter }}</p>
            </div>
            <span class="rounded-full bg-cream-50 px-3 py-1.5 text-xs font-semibold text-clay-700">续读</span>
          </div>
          <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-cream-50/20">
            <div class="h-full rounded-full bg-cream-50" :style="{ width: continueBook.progress + '%' }"></div>
          </div>
        </RouterLink>
      </section>

      <section v-if="loading && mergedBooks.length === 0" class="mt-5 space-y-5">
        <div v-for="group in 3" :key="group" class="space-y-3">
          <div class="h-5 w-28 rounded skeleton"></div>
          <div class="flex gap-3 overflow-hidden">
            <div v-for="item in 4" :key="item" class="w-28 shrink-0">
              <div class="aspect-[3/4] rounded-xl skeleton"></div>
              <div class="mt-2 h-4 w-20 rounded skeleton"></div>
            </div>
          </div>
        </div>
      </section>

      <section v-else class="mt-5 space-y-7" data-testid="home-horizontal-shelf">
        <section v-for="group in shelfGroups" :key="group.key">
          <div class="mb-3 flex items-end justify-between">
            <div>
              <h2 class="font-serif text-xl font-semibold">{{ group.title }}</h2>
              <p :class="['mt-0.5 text-xs font-medium', group.accent]">{{ group.subtitle }}</p>
            </div>
            <RouterLink to="/search" class="text-sm text-ink-500 dark:text-ink-300">更多</RouterLink>
          </div>

          <div class="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <RouterLink
              v-for="(book, index) in group.books"
              :key="`${group.key}-${book.id}`"
              :to="`/novel/${book.id}`"
              class="w-[112px] shrink-0"
            >
              <div class="aspect-[3/4] overflow-hidden rounded-xl bg-cream-200 shadow-sm dark:bg-night-700">
                <BookCover :title="book.title" :variant="book.variant + index" :cover="book.cover" :footer="false" />
              </div>
              <h3 class="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5">{{ book.title }}</h3>
              <p class="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-300">{{ book.category }} · {{ book.rating }}</p>
            </RouterLink>
          </div>
        </section>
      </section>

      <section class="mt-8" data-testid="home-waterfall">
        <div class="mb-3 flex items-end justify-between">
          <div>
            <h2 class="font-serif text-xl font-semibold">猜你喜欢</h2>
            <p class="mt-0.5 text-xs text-ink-500 dark:text-ink-300">双列书流 · 下滑自动加载</p>
          </div>
          <span class="text-xs text-ink-400 dark:text-ink-500">{{ waterfallBooks.length }}/{{ feedSource.length }}</span>
        </div>

        <div v-if="waterfallBooks.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <RouterLink
            v-for="(book, index) in waterfallBooks"
            :key="book.feedKey"
            :to="`/novel/${book.id}`"
            class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-cream-200 transition active:scale-[0.98] dark:bg-night-800 dark:ring-night-700"
            data-testid="waterfall-book-card"
          >
            <div class="aspect-[3/4] overflow-hidden bg-cream-200 dark:bg-night-700">
              <BookCover :title="book.title" :variant="book.variant + index" :cover="book.cover" :footer="false" />
            </div>
            <div class="p-3">
              <div class="mb-1 flex items-center gap-1 text-[11px] text-clay-600 dark:text-clay-300">
                <Icon name="sparkle" class="h-3 w-3" />
                <span class="truncate">{{ book.tag }}</span>
              </div>
              <h3 class="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5">{{ book.title }}</h3>
              <p class="mt-1 truncate text-xs text-ink-500 dark:text-ink-300">{{ book.author }} · {{ book.category }}</p>
              <p class="mt-2 line-clamp-2 text-xs leading-5 text-ink-600 dark:text-ink-300">{{ book.description }}</p>
              <div class="mt-3 flex items-center justify-between gap-2 text-[11px] text-ink-500 dark:text-ink-300">
                <span class="truncate">{{ book.readers }}</span>
                <span class="shrink-0 rounded-full bg-cream-100 px-2 py-0.5 text-clay-700 dark:bg-night-700 dark:text-clay-300">{{ book.wordCount }}</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div v-else-if="!loading" class="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 ring-1 ring-cream-200 dark:bg-night-800 dark:text-ink-300 dark:ring-night-700">
          暂时没有可展示的书籍，稍后再来看看。
        </div>

        <div ref="loadMoreSentinel" class="h-8"></div>
        <button
          v-if="canLoadMore"
          type="button"
          class="mx-auto mt-1 flex h-10 items-center rounded-full bg-ink-900 px-5 text-sm font-medium text-cream-50 dark:bg-cream-100 dark:text-night-900"
          @click="loadMore"
        >
          加载更多
        </button>
        <p v-else-if="waterfallBooks.length" class="mt-3 text-center text-xs text-ink-400 dark:text-ink-500">已经到底啦</p>
      </section>
    </main>

    <BottomNav />
  </div>
</template>

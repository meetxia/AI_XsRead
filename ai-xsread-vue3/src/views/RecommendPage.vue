<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppHeader from '@/components/v2/layout/AppHeader.vue'
import BottomNav from '@/components/v2/layout/BottomNav.vue'
import BookCard from '@/components/v2/book/BookCard.vue'
import Icon from '@/components/v2/icons/Icon.vue'
import { getNovelList, getRecommendNovels } from '@/api/novel'

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

const collections = [
  { categoryId: 101, no: '都市言情专题', title: '在文字里，我们都是赶路人', from: '#6B7B5A', to: '#2A2520' },
  { categoryId: 102, no: '古风穿越专题', title: '长安城里的故事',           from: '#A87A56', to: '#5C3B25' },
  { categoryId: 104, no: '悬疑推理专题', title: '我猜不到结局',             from: '#9A3429', to: '#2A2520' },
]

const books = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

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
      const newBooks = list.map((n, i) => ({
        id: n.id,
        title: n.title,
        author: n.author || '佚名',
        cat: n.category_name || '',
        rating: Number(n.rating || 0).toFixed(1),
        cover: n.cover,
        variant: (books.value.length + i) % 6,
      }))
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

watch(activeTab, () => {
  activeCategoryId.value = null
  loadBooks()
})

onMounted(loadBooks)
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <AppHeader />

    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <section class="pt-5">
        <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Discover</p>
        <h1 class="font-serif text-2xl sm:text-3xl font-semibold tracking-tight">发现新故事</h1>
        <p class="mt-1 text-sm text-ink-700 dark:text-ink-300">每周精选，编辑亲挑。</p>
      </section>

      <!-- Tabs -->
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

      <!-- 分类入口 -->
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

      <!-- 大图专题 -->
      <section class="mt-8">
        <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-2">Curated Collections</p>
        <div class="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-1">
          <RouterLink
            v-for="col in collections"
            :key="col.categoryId"
            :to="`/recommend?categoryId=${col.categoryId}`"
            @click="activeCategoryId = col.categoryId; loadBooks()"
            class="snap-start shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden bg-cream-100 dark:bg-night-800 shadow-cream"
          >
            <div class="relative aspect-[16/7]">
              <div class="absolute inset-0" :style="{ background: `linear-gradient(135deg, ${col.from} 0%, ${col.to} 100%)` }"></div>
              <div class="absolute inset-0 p-4 flex flex-col justify-end text-cream-50">
                <p class="text-[10px] tracking-[0.2em] uppercase text-cream-200/70">{{ col.no }}</p>
                <p class="font-serif text-base sm:text-lg font-semibold mt-0.5">{{ col.title }}</p>
              </div>
            </div>
          </RouterLink>
        </div>
      </section>

      <!-- 书单列表 -->
      <section class="mt-8">
        <div class="flex items-end justify-between mb-3">
          <h2 class="font-serif text-lg sm:text-xl font-semibold tracking-tight">
            {{ activeCategoryId ? categories.find(c => c.id === activeCategoryId)?.name : '为你精选' }}
          </h2>
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

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppHeader from '@/components/v2/layout/AppHeader.vue'
import BottomNav from '@/components/v2/layout/BottomNav.vue'
import BookCard from '@/components/v2/book/BookCard.vue'
import Icon from '@/components/v2/icons/Icon.vue'
import RankTabSection from '@/components/novel/RankTabSection.vue'
import { getRecommendNovels, getNovelList } from '@/api/novel'
import { useUserStore } from '@/stores/user'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '首页',
  description: SEO_DEFAULTS.description,
  url: SEO_DEFAULTS.siteUrl + '/',
  type: 'website',
  keywords: 'MOMO小说,免费小说,在线阅读,都市言情,古风穿越,悬疑推理,治愈系,奇幻冒险,女频小说',
  jsonLd: {
    '@type': 'CollectionPage',
    name: 'MOMO小说 - 首页',
    description: SEO_DEFAULTS.description,
    url: SEO_DEFAULTS.siteUrl + '/',
    inLanguage: 'zh-CN',
  },
})

const router = useRouter()
const userStore = useUserStore()

// ─── 继续阅读（从阅读进度接口获取） ───
const continueBook = ref(null)
const hasContinue = ref(false)

// ─── 主编荐读（第一本推荐小说） ───
const editorPick = ref(null)

// ─── 推荐书单 ───
const books = ref([])

// ─── 排行榜（按浏览量排序） ───
const ranks = ref([])

const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    // 并行加载推荐和排行
    const [recRes, hotRes] = await Promise.allSettled([
      getRecommendNovels({ limit: 12 }),
      getNovelList({ sortBy: 'views', order: 'DESC', page: 1, pageSize: 5 }),
    ])

    // 推荐数据
    if (recRes.status === 'fulfilled' && recRes.value?.code === 200) {
      const list = Array.isArray(recRes.value.data)
        ? recRes.value.data
        : (recRes.value.data?.list || [])

      if (list.length > 0) {
        // 第一本作为主编荐读
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
        }
        // 其余作为书单（PC 端最多显示 10 本）
        books.value = list.slice(1, 11).map((n, i) => ({
          id: n.id,
          title: n.title,
          author: n.author || '佚名',
          cat: n.category_name || '',
          rating: Number(n.rating || 0).toFixed(1),
          cover: n.cover,
          variant: i,
        }))
      }
    }

    // 排行榜
    if (hotRes.status === 'fulfilled' && hotRes.value?.code === 200) {
      const list = Array.isArray(hotRes.value.data)
        ? hotRes.value.data
        : (hotRes.value.data?.list || [])
      const colors = [
        'from-clay-400 to-clay-700',
        'from-moss-500 to-moss-600',
        'from-night-800 to-clay-700',
        'from-cream-300 to-clay-500',
        'from-clay-500 to-moss-600',
      ]
      ranks.value = list.slice(0, 5).map((n, i) => ({
        rank: i + 1,
        id: n.id,
        title: n.title,
        author: n.author || '佚名',
        cat: n.category_name || '',
        readers: n.views ? `${(n.views / 10000).toFixed(1)} 万` : '0',
        rating: Number(n.rating || 0).toFixed(1),
        color: colors[i],
      }))
    }

    // 如果已登录，加载最近阅读进度
    if (userStore.isLogin) {
      loadContinueReading()
    }
  } catch (e) {
    console.warn('[Home] load data error', e?.message)
  } finally {
    loading.value = false
  }
}

async function loadContinueReading() {
  try {
    // 从阅读历史获取最近一本
    const { getReadingHistory } = await import('@/api/user')
    const res = await getReadingHistory({ page: 1, pageSize: 1 })
    if (res?.code === 200) {
      const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
      if (list.length > 0) {
        const h = list[0]
        const progress = Math.max(0, Math.min(100, Math.round(Number(h.progress || h.reading_progress || 0))))
        const wordCount = Number(h.word_count || h.total_words || 0)
        const remainWords = wordCount && progress < 100 ? Math.round(wordCount * (100 - progress) / 100) : 0
        const remainMinutes = remainWords ? Math.max(1, Math.ceil(remainWords / 350)) : null
        const chapterNumber = h.chapter_number || h.chapter_no || ''
        const chapterTitle = h.chapter_title || '继续阅读'
        continueBook.value = {
          id: h.novel_id,
          title: h.title || '未知小说',
          category: h.category_name || '',
          author: h.author || '佚名',
          chapter: chapterNumber ? `第 ${chapterNumber} 章 · ${chapterTitle}` : `上次读到 · ${chapterTitle}`,
          progress,
          remaining: remainMinutes ? `预计剩余 ${remainMinutes} 分钟` : '点此继续',
          chapterId: h.chapter_id,
        }
        hasContinue.value = true
      }
    }
  } catch (e) {
    // 静默失败
  }
}

onMounted(loadData)
</script>

<template>
  <div class="home-page bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <AppHeader />

    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

      <!-- 继续阅读（仅登录且有记录时显示） -->
      <section v-if="hasContinue && continueBook" class="pt-5 pb-1">
        <div class="flex items-end justify-between mb-3">
          <div>
            <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Continue Reading</p>
            <h2 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight">继续你的故事</h2>
          </div>
        </div>

        <RouterLink
          :to="continueBook.chapterId ? `/reading/${continueBook.id}?chapter=${continueBook.chapterId}` : `/reading/${continueBook.id}`"
          class="book-card relative block rounded-2xl overflow-hidden bg-gradient-to-br from-clay-500 to-clay-700 dark:from-clay-600 dark:to-clay-700 text-cream-50 shadow-cream"
        >
          <div class="absolute inset-0 opacity-90">
            <svg viewBox="0 0 400 160" class="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8B5E3C"/><stop offset="100%" stop-color="#5C3B25"/></linearGradient>
                <radialGradient id="heroGlow" cx="0.78" cy="0.32"><stop offset="0%" stop-color="#E5D6C4" stop-opacity="0.55"/><stop offset="100%" stop-color="#5C3B25" stop-opacity="0"/></radialGradient>
              </defs>
              <rect width="400" height="160" fill="url(#heroBg)"/>
              <rect width="400" height="160" fill="url(#heroGlow)"/>
              <circle cx="332" cy="46" r="18" fill="#FDFAF6" opacity="0.85"/>
              <circle cx="326" cy="42" r="16" fill="#A87A56" opacity="0.95"/>
            </svg>
          </div>
          <div class="relative p-4 sm:p-5 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-cream-50/15 backdrop-blur border border-cream-50/20 font-medium">
                  <span class="w-1.5 h-1.5 rounded-full bg-cream-50 animate-pulse"></span>
                  <span class="truncate max-w-[18ch]">{{ continueBook.chapter }}</span>
                </span>
                <h3 class="mt-2 font-serif text-lg sm:text-xl font-semibold leading-tight">{{ continueBook.title }}</h3>
                <p class="mt-0.5 text-xs text-cream-200/80">{{ continueBook.author }}<span v-if="continueBook.category"> · {{ continueBook.category }}</span></p>
              </div>
              <span class="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-3 h-8 rounded-full bg-cream-50 text-clay-700 hover:bg-cream-100 transition">
                续读
                <Icon name="arrowRight" class="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <div class="flex items-center justify-between text-[11px] text-cream-200/90 mb-1">
                <span>已读 {{ continueBook.progress }}%</span>
                <span class="opacity-75">{{ continueBook.remaining }}</span>
              </div>
              <div class="h-1 rounded-full bg-cream-50/20 overflow-hidden">
                <div class="h-full bg-cream-50 rounded-full transition-[width] duration-500" :style="{ width: continueBook.progress + '%' }"></div>
              </div>
            </div>
          </div>
        </RouterLink>
      </section>

      <!-- 未登录时的欢迎语 -->
      <section v-else class="pt-6 pb-1">
        <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Welcome</p>
        <h1 class="font-serif text-2xl sm:text-3xl font-semibold tracking-tight">故事入境，杂念自消</h1>
        <p class="mt-1.5 text-sm text-ink-700 dark:text-ink-300">
          <RouterLink to="/login" class="text-clay-700 dark:text-clay-400 underline underline-offset-4">登录</RouterLink>
          后可同步阅读进度
        </p>
      </section>

      <!-- 快捷入口 -->
      <section class="mt-5">
        <div class="grid grid-cols-4 gap-2 sm:gap-3">
          <RouterLink to="/recommend?tab=hot" class="group flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-clay-500/10 dark:bg-clay-400/15 grid place-items-center text-clay-600 dark:text-clay-400 group-active:scale-90 transition-transform">
              <Icon name="fire" class="w-[18px] h-[18px]" />
            </div>
            <span class="text-xs font-medium">本周热门</span>
          </RouterLink>
          <RouterLink to="/recommend?tab=new" class="group flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-moss-500/10 dark:bg-moss-500/20 grid place-items-center text-moss-600 dark:text-moss-500 group-active:scale-90 transition-transform">
              <Icon name="plus" class="w-[18px] h-[18px]" />
            </div>
            <span class="text-xs font-medium">新书上架</span>
          </RouterLink>
          <RouterLink to="/recommend?tab=finished" class="group flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-clay-500/10 dark:bg-clay-400/15 grid place-items-center text-clay-600 dark:text-clay-400 group-active:scale-90 transition-transform">
              <Icon name="check" class="w-[18px] h-[18px]" />
            </div>
            <span class="text-xs font-medium">完结好书</span>
          </RouterLink>
          <RouterLink to="/recommend?tab=editor" class="group flex flex-col items-center gap-1.5 py-3 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 transition-colors">
            <div class="w-9 h-9 rounded-xl bg-moss-500/10 dark:bg-moss-500/20 grid place-items-center text-moss-600 dark:text-moss-500 group-active:scale-90 transition-transform">
              <Icon name="starFill" class="w-[18px] h-[18px]" />
            </div>
            <span class="text-xs font-medium">编辑推荐</span>
          </RouterLink>
        </div>
      </section>

      <!-- 横向 chip：分类切换 -->
      <section class="mt-6">
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <RouterLink to="/recommend" class="shrink-0 px-4 h-8 inline-flex items-center rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 text-sm font-medium">为你推荐</RouterLink>
          <RouterLink to="/recommend?categoryId=101" class="shrink-0 px-4 h-8 inline-flex items-center rounded-full bg-cream-100 dark:bg-night-800 text-ink-900 dark:text-cream-100 text-sm font-medium">都市言情</RouterLink>
          <RouterLink to="/recommend?categoryId=102" class="shrink-0 px-4 h-8 inline-flex items-center rounded-full bg-cream-100 dark:bg-night-800 text-ink-900 dark:text-cream-100 text-sm font-medium">古风穿越</RouterLink>
          <RouterLink to="/recommend?categoryId=104" class="shrink-0 px-4 h-8 inline-flex items-center rounded-full bg-cream-100 dark:bg-night-800 text-ink-900 dark:text-cream-100 text-sm font-medium">悬疑推理</RouterLink>
          <RouterLink to="/recommend?categoryId=103" class="shrink-0 px-4 h-8 inline-flex items-center rounded-full bg-cream-100 dark:bg-night-800 text-ink-900 dark:text-cream-100 text-sm font-medium">玄幻修仙</RouterLink>
          <RouterLink to="/recommend?categoryId=105" class="shrink-0 px-4 h-8 inline-flex items-center rounded-full bg-cream-100 dark:bg-night-800 text-ink-900 dark:text-cream-100 text-sm font-medium">科幻未来</RouterLink>
        </div>
      </section>

      <!-- PC 双栏：编辑荐读 + 排行榜；移动端：堆叠 -->
      <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 主编荐读（PC 占 2/3，缩小成横向卡） -->
        <section v-if="editorPick" class="lg:col-span-2 min-w-0">
          <div class="flex items-end justify-between mb-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Editor's Pick</p>
              <h2 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight">本期主编荐读</h2>
            </div>
            <RouterLink to="/recommend" class="text-sm text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition">全部</RouterLink>
          </div>

          <article class="rounded-2xl overflow-hidden bg-cream-100 dark:bg-night-800 shadow-cream">
            <RouterLink :to="`/novel/${editorPick.id}`" class="flex gap-3 sm:gap-5">
              <!-- 头图：移动端 ≈ 100×144（封面比例），PC 大些 -->
              <div class="relative w-[100px] sm:w-44 lg:w-52 aspect-[3/4] sm:aspect-[4/5] shrink-0 overflow-hidden bg-clay-500">
                <svg viewBox="0 0 200 280" class="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <defs><linearGradient id="pickBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6B7B5A"/><stop offset="100%" stop-color="#2A2520"/></linearGradient></defs>
                  <rect width="200" height="280" fill="url(#pickBg)"/>
                  <path d="M0,210 Q40,180 90,195 T200,200 L200,280 L0,280 Z" fill="#1A1714" opacity="0.35"/>
                  <text x="20" y="135" font-family="Noto Serif SC, serif" font-size="22" font-weight="600" fill="#FDFAF6" letter-spacing="2">{{ editorPick.title.slice(0, 4) }}</text>
                  <text x="20" y="158" font-family="Inter, sans" font-size="9" fill="#FDFAF6" opacity="0.7" letter-spacing="2">EDITOR'S PICK</text>
                </svg>
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

        <!-- 骨架屏（加载中） -->
        <section v-else-if="loading" class="lg:col-span-2 min-w-0">
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

        <!-- 排行榜：PC 占 1/3 -->
        <section class="lg:col-span-1 min-w-0">
          <div class="flex items-end justify-between mb-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Top Charts</p>
              <h2 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight">本周读者最爱</h2>
            </div>
            <RouterLink to="/recommend?tab=hot" class="text-sm text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition">完整榜单</RouterLink>
          </div>
          <ol v-if="ranks.length" class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
            <li v-for="r in ranks" :key="r.id">
              <RouterLink :to="`/novel/${r.id}`" class="flex items-center gap-3 p-3 hover:bg-cream-200/40 dark:hover:bg-night-700/40 transition-colors">
                <span :class="['font-serif text-lg font-semibold w-6 text-center shrink-0', r.rank <= 2 ? 'text-clay-700 dark:text-clay-400' : 'text-ink-500 dark:text-ink-300']">{{ r.rank }}</span>
                <div :class="['w-10 h-14 rounded shadow-cream shrink-0 bg-gradient-to-br', r.color]"></div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-serif font-semibold text-sm truncate">{{ r.title }}</h4>
                  <p class="text-xs text-ink-500 dark:text-ink-300 mt-0.5 truncate">{{ r.author }} · {{ r.cat }}</p>
                </div>
                <span class="text-xs text-clay-500 dark:text-clay-400 font-medium shrink-0">{{ r.rating }}</span>
              </RouterLink>
            </li>
          </ol>
          <div v-else-if="loading" class="rounded-2xl bg-cream-100 dark:bg-night-800 overflow-hidden divide-y divide-cream-200 dark:divide-night-700">
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
          <RouterLink to="/recommend" class="text-sm text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition">查看更多</RouterLink>
        </div>
        <div v-if="books.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <BookCard v-for="b in books" :key="b.id" :book="b" />
        </div>
        <div v-else-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <div v-for="i in 5" :key="i" class="aspect-[3/4] rounded-2xl skeleton"></div>
        </div>
      </section>

      <!-- 分类专题（紧凑版） -->
      <section class="mt-8">
        <div class="rounded-2xl overflow-hidden bg-cream-100 dark:bg-night-800 border border-cream-200 dark:border-night-700">
          <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
            <div class="flex-1 min-w-0">
              <p class="text-[11px] uppercase tracking-[0.25em] text-moss-600 dark:text-moss-500 font-medium mb-1">Curated · 专题</p>
              <h3 class="font-serif text-lg font-semibold leading-tight">在文字里，我们都是赶路人</h3>
              <p class="mt-1 text-sm text-ink-700 dark:text-ink-300 leading-relaxed">精选各类型好书，总有一本适合你。</p>
              <RouterLink to="/recommend" class="mt-2 inline-flex items-center gap-1 text-sm font-medium text-moss-600 dark:text-moss-500 hover:gap-2 transition-all">
                进入发现 <Icon name="arrowRight" class="w-3.5 h-3.5" />
              </RouterLink>
            </div>
            <div class="flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              <RouterLink to="/recommend?categoryId=101" class="shrink-0 w-14 sm:w-16 aspect-[3/4] rounded-lg bg-gradient-to-br from-clay-400 to-clay-700 hover:scale-105 transition-transform"></RouterLink>
              <RouterLink to="/recommend?categoryId=102" class="shrink-0 w-14 sm:w-16 aspect-[3/4] rounded-lg bg-gradient-to-br from-moss-500 to-moss-600 hover:scale-105 transition-transform"></RouterLink>
              <RouterLink to="/recommend?categoryId=104" class="shrink-0 w-14 sm:w-16 aspect-[3/4] rounded-lg bg-gradient-to-br from-cream-300 to-clay-500 hover:scale-105 transition-transform"></RouterLink>
              <RouterLink to="/recommend?categoryId=103" class="shrink-0 w-14 sm:w-16 aspect-[3/4] rounded-lg bg-gradient-to-br from-night-800 to-clay-700 hover:scale-105 transition-transform"></RouterLink>
              <RouterLink to="/recommend?categoryId=105" class="shrink-0 w-14 sm:w-16 aspect-[3/4] rounded-lg bg-gradient-to-br from-clay-500 to-moss-600 hover:scale-105 transition-transform"></RouterLink>
            </div>
          </div>
        </div>
      </section>

      <footer class="mt-10 mb-8 text-center">
        <p class="font-serif text-sm text-ink-500 dark:text-ink-300 italic">"故事入境，杂念自消"</p>
        <p class="text-[11px] mt-2 text-ink-300 dark:text-ink-500 tracking-wider">© MOMO小说</p>
      </footer>
    </main>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import BookCover from '@/components/v2/book/BookCover.vue'
import SameAuthorRail from '@/components/novel/SameAuthorRail.vue'
import SameTagRail from '@/components/novel/SameTagRail.vue'
import HotNotesSection from '@/components/novel/HotNotesSection.vue'
import FollowAuthorButton from '@/components/novel/FollowAuthorButton.vue'
import { getNovelDetail, getChapterList, getComments, getNovelStatus, likeNovel, unlikeNovel, getNovelRating } from '@/api/novel'
import { addToBookshelf, removeFromBookshelf, getReadingProgress } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { buildLoginUrl } from '@/composables/useReturnUrl'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const novelId = computed(() => route.params.id || 'demo')

const novel = ref({
  id: null,
  title: '',
  subtitle: '',
  category: '',
  subCategory: '',
  author: '',
  authorId: null,
  authorAvatar: '',
  authorFans: null,
  rating: null,
  wordCount: '',
  readers: null,
  likeCount: null,
  commentCount: null,
  status: '',
  tags: [],
  intro: '',
  introExtra: '',
  cover: '',
  variant: 1,
})

const chapters = ref([])
const totalChapters = ref(0)

const comments = ref([])
const totalComments = ref(0)
const toast = ref('')
const statusState = ref({ inBookshelf: false, liked: false })
const statusLoading = ref(false)
const bookshelfLoading = ref(false)
const likeLoading = ref(false)
const progress = ref(null)
const ratingInfo = ref({ ratingCount: 0, average: null, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })

// 简介展开
const introExpanded = ref(false)

// 倒序
const reverse = ref(false)
const sortedChapters = computed(() => {
  const arr = [...chapters.value]
  return reverse.value ? arr.reverse() : arr
})

const ratingRows = computed(() => [5, 4, 3, 2, 1].map(star => ({
  star,
  pct: Number(ratingInfo.value.distribution?.[star] || 0),
})))

const displayRating = computed(() => {
  const value = ratingInfo.value.average ?? novel.value.rating
  return value === null || value === undefined || value === '' ? '0.0' : Number(value || 0).toFixed(1)
})

const continueChapter = computed(() => {
  if (!progress.value?.chapter_id) return null
  return chapters.value.find(c => String(c.id) === String(progress.value.chapter_id)) || {
    id: progress.value.chapter_id,
    title: progress.value.chapter_title || progress.value.chapterTitle || '上次阅读章节',
  }
})

const ctaText = computed(() => continueChapter.value?.title ? `续读 · ${continueChapter.value.title}` : '开始阅读')

// ─── 加载真实数据 ───
async function loadDetail() {
  try {
    const res = await getNovelDetail(novelId.value)
    if (res?.code === 200 && res.data) {
      const d = res.data
      novel.value = {
        ...novel.value,
        id: d.id,
        title: d.title || '',
        subtitle: d.subtitle || '',
        author: d.author || '',
        authorId: d.author_id || d.authorId || null,
        authorAvatar: (d.author || '作')[0],
        authorFans: d.author_fans ?? d.authorFans ?? null,
        category: d.category_name || d.category || '',
        subCategory: d.category_name || '',
        rating: d.rating ?? null,
        wordCount: d.word_count ? `${Math.round(d.word_count / 10000)} 万` : '',
        readers: d.readers ?? d.views ?? null,
        likeCount: d.like_count ?? d.likeCount ?? null,
        commentCount: d.comment_count ?? d.commentCount ?? null,
        status: d.status === 0 || d.status === 'finished' ? '完结' : '连载中',
        tags: Array.isArray(d.tags) ? d.tags : (d.tags ? d.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
        intro: d.description || '',
        introExtra: d.introExtra || '',
        cover: d.cover,
      }
    }
  } catch (e) {
    // ignore
  }
}

async function loadChapters() {
  try {
    const res = await getChapterList(novelId.value, { page: 1, limit: 50 })
    if (res?.code === 200 && Array.isArray(res.data?.list)) {
      chapters.value = res.data.list.map(c => ({
        id: c.id,
        title: c.chapter_number ? `第${c.chapter_number}章 · ${c.title}` : c.title,
        date: (c.created_at || '').slice(0, 10),
        words: c.word_count ? `${c.word_count.toLocaleString()} 字` : '',
        free: !c.is_vip,
        current: String(c.id) === String(progress.value?.chapter_id),
      }))
      totalChapters.value = res.data.total || chapters.value.length
    }
  } catch (e) { /* ignore */ }
}

async function loadComments() {
  try {
    const res = await getComments(novelId.value, { page: 1, limit: 5 })
    if (res?.code === 200 && Array.isArray(res.data?.list) && res.data.list.length) {
      comments.value = res.data.list.map((c, i) => ({
        id: c.id,
        user: c.user?.username || '匿名',
        avatarColor: i === 0 ? 'from-clay-400 to-clay-600' : 'from-moss-500 to-moss-600',
        avatarLetter: (c.user?.username || '匿')[0],
        rating: c.rating || 5,
        time: relativeTime(c.created_at),
        content: c.content,
        likes: c.like_count || 0,
        replies: c.reply_count || 0,
      }))
      totalComments.value = res.data.total || comments.value.length
      if (novel.value.commentCount === null) novel.value.commentCount = totalComments.value
    }
  } catch (e) { /* ignore */ }
}

async function loadStatus() {
  statusLoading.value = true
  try {
    const res = await getNovelStatus(novelId.value)
    if (res?.code === 200 && res.data) {
      statusState.value = {
        inBookshelf: Boolean(res.data.inBookshelf),
        liked: Boolean(res.data.liked),
      }
    }
  } catch (e) {
    statusState.value = { inBookshelf: false, liked: false }
  } finally {
    statusLoading.value = false
  }
}

async function loadProgress() {
  if (!userStore.isLogin) return
  try {
    const res = await getReadingProgress(novelId.value)
    if (res?.code === 200 && res.data) progress.value = res.data
  } catch (e) {
    progress.value = null
  }
}

async function loadRating() {
  try {
    const res = await getNovelRating(novelId.value)
    if (res?.code === 200 && res.data) {
      ratingInfo.value = {
        ratingCount: Number(res.data.ratingCount || res.data.rating_count || 0),
        average: res.data.average ?? res.data.rating ?? null,
        distribution: res.data.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }
    }
  } catch (e) {
    ratingInfo.value = { ratingCount: 0, average: null, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }
}

function formatNumber(n) {
  if (n === null || n === undefined || n === '') return ''
  n = Number(n)
  if (n >= 10000) return `${(n/10000).toFixed(1)} 万`
  return n.toLocaleString()
}

function relativeTime(s) {
  if (!s) return ''
  try {
    const d = new Date(s)
    const diff = Date.now() - d.getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 30) return `${days} 天前`
    return d.toLocaleDateString('zh-CN')
  } catch (e) { return s }
}

const authorLink = computed(() => {
  if (novel.value.authorId) return `/author/${novel.value.authorId}`
  return `/search?keyword=${encodeURIComponent(novel.value.author || '')}`
})

async function loadAll() {
  introExpanded.value = false
  await Promise.allSettled([loadDetail(), loadStatus(), loadProgress(), loadRating(), loadComments()])
  await loadChapters()
}

function showToast(message) {
  toast.value = message
  window.setTimeout(() => {
    if (toast.value === message) toast.value = ''
  }, 1800)
}

function onFollowError() {
  showToast('操作失败，请稍后再试')
}

function onFollowChange(payload) {
  if (payload?.redirected) return
  if (payload?.following) showToast('已关注作者')
  else showToast('已取消关注')
}

function requireLogin() {
  if (userStore.isLogin) return true
  router.push(buildLoginUrl(route.fullPath))
  return false
}

async function toggleBookshelf() {
  if (!requireLogin() || bookshelfLoading.value) return
  const previous = statusState.value.inBookshelf
  bookshelfLoading.value = true
  statusState.value.inBookshelf = !previous
  try {
    if (previous) {
      await removeFromBookshelf(novelId.value)
      showToast('已从书架移除')
    } else {
      await addToBookshelf({ novelId: novelId.value, type: 'reading' })
      showToast('已加入书架')
    }
  } catch (e) {
    statusState.value.inBookshelf = previous
    showToast('操作失败，请稍后再试')
  } finally {
    bookshelfLoading.value = false
  }
}

async function toggleLike() {
  if (!requireLogin() || likeLoading.value) return
  const previous = statusState.value.liked
  const count = novel.value.likeCount
  likeLoading.value = true
  statusState.value.liked = !previous
  if (count !== null) novel.value.likeCount = Math.max(0, Number(count) + (previous ? -1 : 1))
  try {
    if (previous) await unlikeNovel(novelId.value)
    else await likeNovel(novelId.value)
  } catch (e) {
    statusState.value.liked = previous
    novel.value.likeCount = count
    showToast('操作失败，请稍后再试')
  } finally {
    likeLoading.value = false
  }
}

const goReading = () => {
  const targetCh = continueChapter.value || chapters.value[0]
  if (targetCh) {
    router.push(`/reading/${novelId.value}?chapter=${targetCh.id}`)
  } else {
    router.push(`/reading/${novelId.value}`)
  }
}

onMounted(loadAll)
watch(novelId, loadAll)

watch(progress, () => {
  chapters.value = chapters.value.map(c => ({ ...c, current: String(c.id) === String(progress.value?.chapter_id) }))
})
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <!-- 极简返回栏 -->
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800 transition-colors" aria-label="返回">
          <Icon name="back" />
        </button>
        <div class="flex items-center gap-1">
          <RouterLink to="/search" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800 transition-colors" aria-label="搜索">
            <Icon name="search" />
          </RouterLink>
          <button class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800 transition-colors" aria-label="分享">
            <Icon name="share" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="max-w-screen-xl mx-auto pb-32">
      <!-- 头图渐隐 -->
      <section class="relative">
        <div class="absolute inset-0 overflow-hidden">
          <svg viewBox="0 0 400 400" class="w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="bookHero" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6B7B5A"/>
                <stop offset="100%" stop-color="#2A2520"/>
              </linearGradient>
              <radialGradient id="bookHeroGlow" cx="0.5" cy="0.3">
                <stop offset="0%" stop-color="#FDFAF6" stop-opacity="0.18"/>
                <stop offset="100%" stop-color="#000" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <rect width="400" height="400" fill="url(#bookHero)"/>
            <rect width="400" height="400" fill="url(#bookHeroGlow)"/>
            <path d="M0,300 Q100,260 200,280 T400,275 L400,400 L0,400 Z" fill="#1A1714" opacity="0.45"/>
          </svg>
          <div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-cream-50 dark:to-night-900"></div>
        </div>

        <div class="relative px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-5">
          <div class="flex gap-4 sm:gap-5 items-start">
            <div class="w-24 sm:w-28 lg:w-32 aspect-[3/4] rounded-xl overflow-hidden shadow-cream-lg shrink-0">
              <BookCover :title="novel.title" :sub="novel.subtitle" :variant="novel.variant" :cover="novel.cover" />
            </div>
            <div class="flex-1 min-w-0 text-cream-50 mt-2 sm:mt-4">
              <p class="text-[11px] uppercase tracking-[0.2em] opacity-70 mb-1">{{ novel.category }}<span v-if="novel.subCategory"> · {{ novel.subCategory }}</span></p>
              <h1 class="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight">{{ novel.title || '小说详情' }}</h1>
              <p class="mt-1 text-sm opacity-85 line-clamp-1">{{ novel.subtitle }}</p>
              <RouterLink :to="authorLink" class="mt-2 inline-flex items-center gap-2 text-sm">
                <span class="w-6 h-6 rounded-full bg-cream-50/20 grid place-items-center text-[10px] font-serif">{{ novel.authorAvatar || '作' }}</span>
                <span>{{ novel.author || '佚名' }}</span>
                <template v-if="novel.authorFans !== null">
                  <span class="w-1 h-1 rounded-full bg-cream-50/40"></span>
                  <span class="opacity-75">关注 {{ formatNumber(novel.authorFans) }}</span>
                </template>
              </RouterLink>
              <FollowAuthorButton
                v-if="novel.authorId"
                :author-id="novel.authorId"
                variant="translucent"
                class="mt-2"
                @error="onFollowError"
                @change="onFollowChange"
              />
            </div>
          </div>

          <!-- 数据条 -->
          <div class="relative mt-5 flex items-center justify-around py-3 px-2 rounded-2xl bg-cream-50 dark:bg-night-800 shadow-cream">
            <div class="text-center">
              <p class="font-serif text-lg sm:text-xl font-semibold text-clay-700 dark:text-clay-400">{{ displayRating }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">EVALUATION</p>
            </div>
            <div class="w-px h-8 bg-cream-200 dark:bg-night-700"></div>
            <div class="text-center">
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ novel.wordCount.replace(' ', '') }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">字数</p>
            </div>
            <div v-if="novel.readers !== null" class="w-px h-8 bg-cream-200 dark:bg-night-700"></div>
            <div v-if="novel.readers !== null" class="text-center">
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ formatNumber(novel.readers).replace(' ', '') }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">在读</p>
            </div>
            <div class="w-px h-8 bg-cream-200 dark:bg-night-700"></div>
            <div class="text-center">
              <p class="font-serif text-lg sm:text-xl font-semibold text-moss-600 dark:text-moss-500">{{ novel.status }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">状态</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 标签 -->
      <section class="px-4 sm:px-6 lg:px-8 mt-2">
        <div class="flex flex-wrap gap-2">
          <span v-for="t in novel.tags" :key="t" class="px-2.5 py-1 rounded-full text-[11px] bg-clay-500/10 text-clay-700 dark:text-clay-400 font-medium">{{ t }}</span>
        </div>
      </section>

      <!-- PC 双栏：左 简介+评分；右 章节+评论+推荐 -->
      <div class="px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <!-- 左栏 -->
        <div class="lg:col-span-1 min-w-0 space-y-6">
          <!-- 简介 -->
          <section v-if="novel.intro">
            <h2 class="font-serif text-base font-semibold mb-3 flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-clay-500"></span>
              故事简介
            </h2>
            <div class="text-[15px] text-ink-700 dark:text-ink-300 leading-relaxed">
              <p>{{ novel.intro }}</p>
              <p v-show="introExpanded" class="mt-3">{{ novel.introExtra }}</p>
              <button v-if="!introExpanded && novel.introExtra" @click="introExpanded = true" class="text-clay-700 dark:text-clay-400 text-sm underline underline-offset-4 mt-2">展开全部</button>
            </div>
          </section>

          <!-- 评分模块 -->
          <section>
            <h2 class="font-serif text-base font-semibold mb-3 flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-clay-500"></span>
              读者评分
            </h2>
            <div class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4">
              <div class="flex items-center gap-5">
                <div class="text-center shrink-0">
                  <p class="font-serif text-4xl font-bold text-clay-700 dark:text-clay-400 leading-none">{{ displayRating }}</p>
                  <div class="flex justify-center gap-0.5 mt-1.5 text-clay-500 dark:text-clay-400">
                    <Icon v-for="i in 5" :key="i" :name="ratingInfo.ratingCount ? 'starFill' : 'star'" class="w-3 h-3" />
                  </div>
                  <p class="text-[11px] text-ink-500 mt-1">{{ ratingInfo.ratingCount ? `${formatNumber(ratingInfo.ratingCount)} 人评分` : '本书暂无评分' }}</p>
                </div>
                <div class="flex-1 space-y-1.5">
                  <p v-if="!ratingInfo.ratingCount" class="text-xs text-ink-500 dark:text-ink-300 mb-2">成为第一个评分的人 →</p>
                  <div v-for="row in ratingRows" :key="row.star" class="flex items-center gap-2 text-xs">
                    <span class="text-ink-500 dark:text-ink-300 w-3">{{ row.star }}</span>
                    <div class="flex-1 h-1.5 rounded-full bg-cream-200 dark:bg-night-700 overflow-hidden">
                      <div class="h-full bg-clay-500 rounded-full" :style="{ width: row.pct + '%' }"></div>
                    </div>
                    <span class="text-ink-500 dark:text-ink-300 w-8 text-right">{{ row.pct }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 右栏 -->
        <div class="lg:col-span-2 min-w-0 space-y-6">
          <!-- 章节列表 -->
          <section>
            <div class="flex items-end justify-between mb-3">
              <h2 class="font-serif text-base font-semibold flex items-center gap-2">
                <span class="w-1 h-4 rounded-full bg-clay-500"></span>
                目录 · 共 {{ totalChapters }} 章
              </h2>
              <button class="text-xs text-ink-700 dark:text-ink-300 flex items-center gap-1 hover:text-clay-700 dark:hover:text-clay-400 transition" @click="reverse = !reverse">
                {{ reverse ? '正序' : '倒序' }} <Icon name="arrowDown" class="w-3 h-3" />
              </button>
            </div>

            <div class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
              <RouterLink
                v-for="ch in sortedChapters"
                :key="ch.id"
                :to="`/reading/${novelId}?chapter=${ch.id}`"
                :class="['flex items-center justify-between gap-3 p-3.5 transition', ch.current ? 'bg-clay-500/10 dark:bg-clay-400/10' : 'hover:bg-cream-200/40 dark:hover:bg-night-700/40']"
              >
                <div class="flex-1 min-w-0">
                  <p :class="['font-serif text-sm font-medium truncate', ch.current && 'text-clay-700 dark:text-clay-400']">{{ ch.title }}</p>
                  <p class="text-[11px] text-ink-500 dark:text-ink-300 mt-0.5">{{ ch.date }} · {{ ch.words }}<span v-if="ch.current"> · 上次阅读到这里</span></p>
                </div>
                <span v-if="ch.current" class="text-[11px] px-2 py-0.5 rounded-full bg-clay-500 text-cream-50 shrink-0">续读</span>
                <span v-else-if="ch.free" class="text-[11px] px-2 py-0.5 rounded-full bg-cream-200 dark:bg-night-700 text-ink-700 dark:text-ink-300 shrink-0">免费</span>
              </RouterLink>
            </div>
            <div v-if="!chapters.length" class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4 text-sm text-ink-500 dark:text-ink-300">目录暂未开放</div>
            <button class="w-full mt-3 py-2.5 text-sm text-ink-700 dark:text-ink-300 font-medium border border-cream-200 dark:border-night-700 rounded-xl hover:bg-cream-100 dark:hover:bg-night-800 transition">
              查看全部 {{ totalChapters }} 章
            </button>
          </section>

          <!-- 评论 -->
          <section>
            <div class="flex items-end justify-between mb-3">
              <h2 class="font-serif text-base font-semibold flex items-center gap-2">
                <span class="w-1 h-4 rounded-full bg-clay-500"></span>
                书友评论<span v-if="novel.commentCount !== null || totalComments"> · {{ formatNumber(novel.commentCount ?? totalComments) }}</span>
              </h2>
              <a href="#" class="text-xs text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition">查看全部</a>
            </div>

            <div class="space-y-3">
              <div v-for="c in comments" :key="c.id" class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4">
                <div class="flex items-center gap-3 mb-2.5">
                  <div :class="['w-9 h-9 rounded-full grid place-items-center text-cream-50 font-serif text-sm bg-gradient-to-br shrink-0', c.avatarColor]">{{ c.avatarLetter }}</div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ c.user }}</p>
                    <div class="flex items-center gap-2 text-[11px] text-ink-500 dark:text-ink-300">
                      <span class="flex gap-0.5 text-clay-500">
                        <Icon v-for="i in c.rating" :key="i" name="starFill" class="w-2.5 h-2.5" />
                      </span>
                      <span>·</span>
                      <span>{{ c.time }}</span>
                    </div>
                  </div>
                </div>
                <p class="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{{ c.content }}</p>
                <div class="flex items-center gap-4 mt-3 text-xs text-ink-500 dark:text-ink-300">
                  <button class="flex items-center gap-1 hover:text-clay-700 transition">
                    <Icon name="heart" class="w-4 h-4" /> <span>{{ c.likes }}</span>
                  </button>
                  <button class="flex items-center gap-1 hover:text-clay-700 transition">
                    <Icon name="chat" class="w-4 h-4" /> <span>{{ c.replies }}</span>
                  </button>
                </div>
              </div>
            </div>
            <div v-if="!comments.length" class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4 text-sm text-ink-500 dark:text-ink-300">还没有书友评论</div>
          </section>

          <SameAuthorRail :author-id="novel.authorId" :exclude-id="novelId" />
          <HotNotesSection :novel-id="novelId" />
          <SameTagRail :tags="novel.tags" :exclude-id="novelId" />
        </div>
      </div>
    </main>

    <!-- 浮动 CTA 条 -->
    <div class="fixed bottom-0 inset-x-0 z-40 bg-cream-50/95 dark:bg-night-900/95 backdrop-blur-xl border-t border-cream-200 dark:border-night-700 pb-safe">
      <div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2">
        <button
          class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition disabled:opacity-60"
          :disabled="statusLoading || bookshelfLoading"
          aria-label="加入书架"
          @click="toggleBookshelf"
        >
          <Icon :name="statusState.inBookshelf ? 'bookmarkFill' : 'bookmark'" class="w-5 h-5" />
          <span class="text-[10px]">{{ bookshelfLoading ? '...' : (statusState.inBookshelf ? '已加入' : '加书架') }}</span>
        </button>
        <button
          class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition disabled:opacity-60"
          :disabled="statusLoading || likeLoading"
          aria-label="点赞"
          @click="toggleLike"
        >
          <Icon :name="statusState.liked ? 'heartFill' : 'heart'" class="w-5 h-5" />
          <span class="text-[10px]">{{ likeLoading ? '...' : (novel.likeCount !== null ? formatNumber(novel.likeCount) : '喜欢') }}</span>
        </button>
        <button @click="goReading" class="flex-1 h-12 rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif text-base font-semibold grid place-items-center hover:bg-clay-600 active:scale-[0.98] transition shadow-cream">
          {{ ctaText }}
        </button>
      </div>
    </div>
    <div v-if="toast" class="fixed left-1/2 -translate-x-1/2 bottom-24 z-50 rounded-full bg-night-900 text-cream-50 px-4 py-2 text-sm shadow-cream">
      {{ toast }}
    </div>
  </div>
</template>

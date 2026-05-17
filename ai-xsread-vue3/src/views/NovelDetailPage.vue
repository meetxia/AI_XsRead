<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import BookCover from '@/components/v2/book/BookCover.vue'
import { getNovelDetail, getChapterList, getComments } from '@/api/novel'

const router = useRouter()
const route = useRoute()

const novelId = computed(() => route.params.id || 'demo')

// ─── 占位数据（接 API 失败时使用） ───
const novel = ref({
  id: 'demo',
  title: '山有木兮',
  subtitle: '那一年长安飘雪',
  category: '古风',
  subCategory: '言情',
  author: '沈砚白',
  authorId: 'sengyanbai',
  authorAvatar: '沈',
  authorFans: '12.3k',
  rating: 9.2,
  wordCount: '32 万',
  readers: '12.4 万',
  status: '完结',
  tags: ['甜虐交织', '将军言情', '失忆梗', 'HE', '慢热'],
  intro: '她是失了记忆的将军遗孤，他是江湖最不该现身的剑客。命运把两个人推向一座无名雪山，所有的爱恨都在那里——重新写一遍。一卷长安雪，一壶月下酒，一个不肯说出口的名字。本以为是路人，却在三年后的元宵夜，撞见彼此最不愿被人知道的过往。',
  introExtra: '沈砚白以诗一般的笔触，写尽了一段错过又重逢的旧梦。书中既有家国大义，也有儿女情长；既有金戈铁马的紧张感，也有炉火夜话的温度。每一回都像一帧古画，慢慢展开。',
  cover: '',
  variant: 1,
})

const chapters = ref([
  { id:1, title:'第一章 · 雪夜初见',     date:'2025-08-14', words:'4,231 字', free:true },
  { id:2, title:'第二章 · 长安城里的旧人', date:'2025-08-15', words:'5,012 字', free:true },
  { id:12, title:'第十二章 · 雪夜归人',  date:'2025-09-01', words:'6,138 字', current:true },
  { id:13, title:'第十三章 · 春寒料峭',  date:'2025-09-02', words:'4,867 字' },
])
const totalChapters = ref(36)

const comments = ref([
  {
    id: 1,
    user: '林深时见鹿',
    avatarColor: 'from-clay-400 to-clay-600',
    avatarLetter: '林',
    rating: 5,
    time: '3 天前',
    content: '沈大写的故事总是有一种慢慢渗进心里的力量，像北方冬天的炉火。第十二章看哭了，强烈推荐。',
    likes: 238,
    replies: 12,
  },
  {
    id: 2,
    user: '夜雨临轩',
    avatarColor: 'from-moss-500 to-moss-600',
    avatarLetter: '夜',
    rating: 5,
    time: '5 天前',
    content: '古风言情写得这么有重量的不多了。"一壶月下酒"那一段，反复看了三次。',
    likes: 87,
    replies: 5,
  }
])
const totalComments = ref(1284)

// 评分分布
const distribution = [78, 15, 5, 1, 1]

// 简介展开
const introExpanded = ref(false)

// 倒序
const reverse = ref(false)
const sortedChapters = computed(() => {
  const arr = [...chapters.value]
  return reverse.value ? arr.reverse() : arr
})

// 类似推荐
const similarBooks = ref([
  { id:'sim-1', title:'归棠记事',         author:'沈砚白', variant:0 },
  { id:'sim-2', title:'长安的秋天',       author:'沈砚白', variant:2 },
  { id:'sim-3', title:'流光记',           author:'温知秋', variant:3 },
  { id:'sim-4', title:'迷雾镇·第七封信',  author:'江聿',   variant:5 },
])

// ─── 加载真实数据 ───
async function loadDetail() {
  try {
    const res = await getNovelDetail(novelId.value)
    if (res?.code === 200 && res.data) {
      const d = res.data
      novel.value = {
        ...novel.value,
        id: d.id,
        title: d.title || novel.value.title,
        subtitle: d.subtitle || '',
        author: d.author || novel.value.author,
        authorId: d.author_id || d.authorId || null,
        category: d.category_name || d.category || novel.value.category,
        subCategory: d.category_name || '',
        rating: Number(d.rating || 0).toFixed(1),
        wordCount: d.word_count ? `${Math.round(d.word_count / 10000)} 万` : novel.value.wordCount,
        readers: d.views ? `${(d.views / 10000).toFixed(1)} 万` : novel.value.readers,
        status: d.status === 0 ? '完结' : '连载中',
        tags: d.tags ? d.tags.split(',').map(t => t.trim()).filter(Boolean) : novel.value.tags,
        intro: d.description || novel.value.intro,
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
    }
  } catch (e) { /* ignore */ }
}

function formatNumber(n) {
  if (!n) return '0'
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

    // 作者链接：优先用 author_id，没有则用 author 名字搜索
    const authorLink = computed(() => {
      if (novel.value.authorId) return `/author/${novel.value.authorId}`
      return `/search?keyword=${encodeURIComponent(novel.value.author)}`
    })

    const goReading = () => {
      // 找到续读章节（当前进度章节或第一章）
      const currentCh = chapters.value.find(c => c.current)
      const firstCh = chapters.value[0]
      const targetCh = currentCh || firstCh
      if (targetCh) {
        router.push(`/reading/${novelId.value}?chapter=${targetCh.id}`)
      } else {
        router.push(`/reading/${novelId.value}`)
      }
    }

onMounted(() => {
  loadDetail()
  loadChapters()
  loadComments()
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
              <p class="text-[11px] uppercase tracking-[0.2em] opacity-70 mb-1">{{ novel.category }} · {{ novel.subCategory }}</p>
              <h1 class="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight">{{ novel.title }}</h1>
              <p class="mt-1 text-sm opacity-85 line-clamp-1">{{ novel.subtitle }}</p>
              <RouterLink :to="authorLink" class="mt-2 inline-flex items-center gap-2 text-sm">
                <span class="w-6 h-6 rounded-full bg-cream-50/20 grid place-items-center text-[10px] font-serif">{{ novel.authorAvatar }}</span>
                <span>{{ novel.author }}</span>
                <span class="w-1 h-1 rounded-full bg-cream-50/40"></span>
                <span class="opacity-75">关注 {{ novel.authorFans }}</span>
              </RouterLink>
            </div>
          </div>

          <!-- 数据条 -->
          <div class="relative mt-5 flex items-center justify-around py-3 px-2 rounded-2xl bg-cream-50 dark:bg-night-800 shadow-cream">
            <div class="text-center">
              <p class="font-serif text-lg sm:text-xl font-semibold text-clay-700 dark:text-clay-400">{{ novel.rating }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">EVALUATION</p>
            </div>
            <div class="w-px h-8 bg-cream-200 dark:bg-night-700"></div>
            <div class="text-center">
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ novel.wordCount.replace(' ', '') }}</p>
              <p class="text-[10px] text-ink-500 dark:text-ink-300 mt-0.5 tracking-wider">字数</p>
            </div>
            <div class="w-px h-8 bg-cream-200 dark:bg-night-700"></div>
            <div class="text-center">
              <p class="font-serif text-lg sm:text-xl font-semibold">{{ novel.readers.replace(' ', '') }}</p>
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
          <section>
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
                  <p class="font-serif text-4xl font-bold text-clay-700 dark:text-clay-400 leading-none">{{ novel.rating }}</p>
                  <div class="flex justify-center gap-0.5 mt-1.5 text-clay-500 dark:text-clay-400">
                    <Icon v-for="i in 5" :key="i" name="starFill" class="w-3 h-3" />
                  </div>
                  <p class="text-[11px] text-ink-500 mt-1">3,421 人评分</p>
                </div>
                <div class="flex-1 space-y-1.5">
                  <div v-for="(pct, i) in distribution" :key="i" class="flex items-center gap-2 text-xs">
                    <span class="text-ink-500 dark:text-ink-300 w-3">{{ 5 - i }}</span>
                    <div class="flex-1 h-1.5 rounded-full bg-cream-200 dark:bg-night-700 overflow-hidden">
                      <div class="h-full bg-clay-500 rounded-full" :style="{ width: pct + '%' }"></div>
                    </div>
                    <span class="text-ink-500 dark:text-ink-300 w-8 text-right">{{ pct }}%</span>
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
            <button class="w-full mt-3 py-2.5 text-sm text-ink-700 dark:text-ink-300 font-medium border border-cream-200 dark:border-night-700 rounded-xl hover:bg-cream-100 dark:hover:bg-night-800 transition">
              查看全部 {{ totalChapters }} 章
            </button>
          </section>

          <!-- 评论 -->
          <section>
            <div class="flex items-end justify-between mb-3">
              <h2 class="font-serif text-base font-semibold flex items-center gap-2">
                <span class="w-1 h-4 rounded-full bg-clay-500"></span>
                书友评论 · {{ totalComments.toLocaleString() }}
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
          </section>

          <!-- 类似推荐 -->
          <section>
            <h2 class="font-serif text-base font-semibold mb-3 flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-clay-500"></span>
              看过的人还看了
            </h2>
            <div class="flex gap-3 overflow-x-auto no-scrollbar -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 pb-1">
              <RouterLink v-for="b in similarBooks" :key="b.id" :to="`/novel/${b.id}`" class="shrink-0 w-24 sm:w-28">
                <div class="aspect-[3/4] rounded-lg overflow-hidden shadow-cream">
                  <BookCover :title="b.title" :variant="b.variant" :cover="b.cover" />
                </div>
                <p class="mt-2 text-xs font-medium line-clamp-1">{{ b.title }}</p>
                <p class="text-[10px] text-ink-500 dark:text-ink-300">{{ b.author }}</p>
              </RouterLink>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- 浮动 CTA 条 -->
    <div class="fixed bottom-0 inset-x-0 z-40 bg-cream-50/95 dark:bg-night-900/95 backdrop-blur-xl border-t border-cream-200 dark:border-night-700 pb-safe">
      <div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2">
        <button class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition" aria-label="加入书架">
          <Icon name="bookmark" class="w-5 h-5" />
          <span class="text-[10px]">加书架</span>
        </button>
        <button class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition" aria-label="点赞">
          <Icon name="heart" class="w-5 h-5" />
          <span class="text-[10px]">2.1k</span>
        </button>
        <button @click="goReading" class="flex-1 h-12 rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif text-base font-semibold grid place-items-center hover:bg-clay-600 active:scale-[0.98] transition shadow-cream">
          续读 · 第十二章
        </button>
      </div>
    </div>
  </div>
</template>

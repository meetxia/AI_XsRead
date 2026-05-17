<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import BookCard from '@/components/v2/book/BookCard.vue'
import { getAuthorInfo, getAuthorWorks } from '@/api/novel'

const route = useRoute()
const router = useRouter()

const author = ref({
  id: route.params.id || 'demo',
  name: '沈砚白',
  bio: '写一段长安的雪，写一壶月下的酒。古风言情作者，主写慢热与重逢。',
  avatar: '沈',
  fans: '12.3k',
  works: 7,
  totalWords: '128 万',
})

const works = ref([
  { id:1, title:'山有木兮', cat:'古风', author:'沈砚白', rating:9.2, variant:1 },
  { id:2, title:'归棠记事', cat:'古风', author:'沈砚白', rating:9.0, variant:0 },
  { id:3, title:'长安的秋天', cat:'古风', author:'沈砚白', rating:9.3, variant:2 },
])

const followed = ref(false)

async function load() {
  try {
    const [a, w] = await Promise.all([
      getAuthorInfo(author.value.id).catch(() => null),
      getAuthorWorks(author.value.id, { page: 1, limit: 9 }).catch(() => null),
    ])
    if (a?.code === 200 && a.data) {
      author.value = {
        ...author.value,
        name: a.data.name || a.data.username || author.value.name,
        bio: a.data.bio || author.value.bio,
        avatar: (a.data.name || a.data.username || '佚')[0],
        fans: a.data.followers?.toLocaleString() || author.value.fans,
        works: a.data.work_count || author.value.works,
      }
    }
    if (w?.code === 200 && Array.isArray(w.data?.list)) {
      works.value = w.data.list.map((n, i) => ({
        id: n.id,
        title: n.title,
        cat: n.category_name || '',
        author: author.value.name,
        rating: n.rating || 9.0,
        variant: i,
        cover: n.cover,
      }))
    }
  } catch (e) { /* ignore */ }
}

onMounted(load)
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="返回">
          <Icon name="back" class="w-5 h-5" />
        </button>
        <h1 class="font-serif text-base font-semibold">作者主页</h1>
        <ThemeToggle />
      </div>
    </header>

    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <!-- 作者卡 -->
      <section class="mt-5">
        <div class="rounded-2xl overflow-hidden bg-gradient-to-br from-clay-500 to-clay-700 dark:from-clay-600 dark:to-clay-700 text-cream-50 shadow-cream-lg p-5 sm:p-6 relative">
          <div class="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-cream-50/10 blur-2xl"></div>

          <div class="relative flex items-center gap-4">
            <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cream-50/20 ring-2 ring-cream-50/40 grid place-items-center font-serif text-xl sm:text-2xl font-semibold backdrop-blur shrink-0">
              {{ author.avatar }}
            </div>
            <div class="flex-1 min-w-0">
              <h1 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight truncate">{{ author.name }}</h1>
              <p class="text-sm text-cream-200/85 mt-0.5">{{ author.fans }} 关注 · {{ author.works }} 部作品</p>
            </div>
            <button
              @click="followed = !followed"
              :class="['px-4 py-1.5 rounded-full text-xs font-medium transition shrink-0',
                followed
                  ? 'bg-cream-50/15 backdrop-blur border border-cream-50/25'
                  : 'bg-cream-50 text-clay-700 hover:bg-cream-100'
              ]"
            >{{ followed ? '已关注' : '关注' }}</button>
          </div>

          <p class="relative mt-3 text-sm text-cream-200/90 italic font-serif leading-relaxed">"{{ author.bio }}"</p>
        </div>
      </section>

      <!-- 作品 -->
      <section class="mt-6">
        <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-3">作品 · {{ author.works }}</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          <BookCard v-for="b in works" :key="b.id" :book="b" />
        </div>
      </section>
    </main>
  </div>
</template>

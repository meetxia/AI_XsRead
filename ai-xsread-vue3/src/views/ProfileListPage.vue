<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import { listMyBookmarks } from '@/api/bookmarks'
import { listMyHighlights } from '@/api/highlights'
import { listMyNotes } from '@/api/notes'
import { getFollowingAuthors } from '@/api/user'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

const route = useRoute()
const items = ref([])
const loading = ref(false)

const config = computed(() => {
  const type = route.meta.kind
  if (type === 'notes') return { title: '我的想法', loader: listMyNotes }
  if (type === 'highlights') return { title: '我的划线', loader: listMyHighlights }
  if (type === 'following') return { title: '关注作者', loader: getFollowingAuthors }
  return { title: '我的书签', loader: listMyBookmarks }
})

useSeoMeta(() => ({
  title: config.value.title,
  description: `MOMO小说个人中心 - ${config.value.title}`,
  url: `${SEO_DEFAULTS.siteUrl}${route.path}`,
  robots: 'noindex,follow',
}))

function itemTitle(item) {
  return item.title || item.novel_title || item.name || item.author || '未命名'
}

function itemSub(item) {
  return item.chapter_title || item.content || item.excerpt || item.latest_title || item.note || ''
}

async function load() {
  loading.value = true
  try {
    const res = await config.value.loader({ page: 1, pageSize: 20 })
    items.value = Array.isArray(res?.data) ? res.data : (res?.data?.list || [])
  } catch (e) {
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 paper-texture">
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-md mx-auto px-4 h-14 flex items-center gap-3">
        <RouterLink to="/profile" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="返回">
          <Icon name="back" />
        </RouterLink>
        <h1 class="font-serif text-lg font-semibold">{{ config.title }}</h1>
      </div>
    </header>

    <main class="max-w-screen-md mx-auto px-4 pb-24">
      <div v-if="loading" class="mt-6 text-sm text-ink-500">加载中...</div>
      <div v-else-if="!items.length" class="mt-6 rounded-2xl bg-cream-100 dark:bg-night-800 p-5 text-sm text-ink-500">暂时没有内容</div>
      <div v-else class="mt-5 rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
        <RouterLink
          v-for="item in items"
          :key="item.id || item.author_id"
          :to="item.novel_id ? `/novel/${item.novel_id}` : (item.author_id || item.id ? `/author/${item.author_id || item.id}` : '/profile')"
          class="block p-4 hover:bg-cream-200/50 dark:hover:bg-night-700/50"
        >
          <h2 class="font-serif text-sm font-semibold">{{ itemTitle(item) }}</h2>
          <p v-if="itemSub(item)" class="mt-1 text-xs text-ink-500 dark:text-ink-300 line-clamp-2">{{ itemSub(item) }}</p>
        </RouterLink>
      </div>
    </main>
  </div>
</template>

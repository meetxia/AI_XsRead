<script setup>
import { RouterLink } from 'vue-router'
import UnreadBadge from '@/components/bookshelf/UnreadBadge.vue'

defineProps({
  authors: { type: Array, default: () => [] },
})

function isNew(item) {
  const date = item.updated_at || item.latestUpdatedAt || item.latest_work_updated_at
  if (!date) return false
  return Date.now() - new Date(date).getTime() <= 7 * 86400000
}
</script>

<template>
  <section v-if="authors.length">
    <div class="flex items-end justify-between mb-3">
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Following</p>
        <h2 class="font-serif text-lg sm:text-xl font-semibold tracking-tight">我关注的作者</h2>
      </div>
      <RouterLink to="/profile/following-authors" class="text-sm text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400">查看全部</RouterLink>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <RouterLink
        v-for="author in authors"
        :key="author.id || author.author_id"
        :to="`/author/${author.author_id || author.id}`"
        class="relative rounded-2xl bg-cream-100 dark:bg-night-800 p-3 flex items-center gap-3 hover:bg-cream-200/60 dark:hover:bg-night-700/60 transition"
      >
        <span class="w-10 h-10 rounded-full bg-clay-500/15 text-clay-700 dark:text-clay-400 grid place-items-center font-serif shrink-0">
          {{ (author.name || author.author || '作')[0] }}
        </span>
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-medium truncate">{{ author.name || author.author || '佚名' }}</span>
          <span class="block text-xs text-ink-500 dark:text-ink-300 truncate">{{ author.latest_title || author.latestWorkTitle || '暂无新作品' }}</span>
        </span>
        <span v-if="isNew(author)" class="text-[10px] px-2 py-0.5 rounded-full bg-moss-500 text-cream-50">NEW</span>
        <UnreadBadge v-if="author.hasUnreadUpdate" class="absolute top-2 right-2" />
      </RouterLink>
    </div>
  </section>
</template>

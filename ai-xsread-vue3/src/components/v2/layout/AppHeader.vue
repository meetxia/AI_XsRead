<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'

const props = defineProps({
  showSearch: { type: Boolean, default: true },
  showThemeToggle: { type: Boolean, default: true },
  showAvatar: { type: Boolean, default: true },
})

const userStore = useUserStore()

const avatarLetter = computed(() => {
  const name = userStore.userInfo?.username || userStore.userInfo?.nickname || ''
  return (name[0] || '读').toUpperCase()
})
const avatarUrl = computed(() => userStore.userInfo?.avatar || '')
</script>

<template>
  <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl border-b border-cream-200/60 dark:border-night-700/60 pt-safe">
    <div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2 group">
        <img src="/logo.svg" alt="MOMO小说" class="w-8 h-8 rounded-lg transition-transform group-active:scale-95" />
        <span class="font-serif text-lg font-semibold tracking-tight">MOMO小说</span>
      </RouterLink>

      <!-- 桌面端导航 -->
      <nav class="hidden lg:flex items-center gap-1 ml-auto mr-2">
        <RouterLink to="/" class="px-3 py-1.5 rounded-full text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-cream-100 dark:hover:bg-night-800 transition-colors">首页</RouterLink>
        <RouterLink to="/recommend" class="px-3 py-1.5 rounded-full text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-cream-100 dark:hover:bg-night-800 transition-colors">分类</RouterLink>
        <RouterLink to="/bookshelf" class="px-3 py-1.5 rounded-full text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-cream-100 dark:hover:bg-night-800 transition-colors">书架</RouterLink>
        <RouterLink to="/history" class="px-3 py-1.5 rounded-full text-sm font-medium text-ink-700 dark:text-ink-300 hover:bg-cream-100 dark:hover:bg-night-800 transition-colors">历史</RouterLink>
      </nav>

      <div class="flex items-center gap-1">
        <RouterLink
          v-if="showSearch"
          to="/search"
          class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800 transition-colors"
          aria-label="搜索"
        >
          <Icon name="search" class="w-5 h-5" />
        </RouterLink>

        <ThemeToggle v-if="showThemeToggle" />

        <RouterLink
          v-if="showAvatar && userStore.isLogin"
          to="/profile"
          class="w-9 h-9 ml-1 rounded-full bg-gradient-to-br from-clay-400 to-clay-600 ring-2 ring-cream-100 dark:ring-night-700 grid place-items-center text-cream-50 text-sm font-medium overflow-hidden"
          aria-label="我的"
        >
          <img v-if="avatarUrl" :src="avatarUrl" alt="头像" class="w-full h-full object-cover" />
          <span v-else>{{ avatarLetter }}</span>
        </RouterLink>

        <div v-else-if="showAvatar" class="ml-2 flex items-center gap-2">
          <RouterLink
            to="/login"
            class="h-9 px-3 grid place-items-center rounded-full text-sm font-medium text-ink-700 dark:text-ink-200 hover:bg-cream-100 dark:hover:bg-night-800 transition-colors"
          >
            登录
          </RouterLink>
          <RouterLink
            to="/register"
            class="h-9 px-3 grid place-items-center rounded-full bg-clay-600 text-sm font-medium text-cream-50 hover:bg-clay-700 transition-colors"
          >
            注册
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
</template>

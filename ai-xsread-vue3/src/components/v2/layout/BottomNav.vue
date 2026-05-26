<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'

const route = useRoute()

const items = [
  { key: 'home',     to: '/',           label: '书城',  icon: 'home' },
  { key: 'discover', to: '/recommend',  label: '分类',  icon: 'grid' },
  { key: 'shelf',    to: '/bookshelf',  label: '书架',  icon: 'shelf' },
  { key: 'profile',  to: '/profile',    label: '我的',  icon: 'user' },
]

const activeKey = computed(() => {
  const p = route.path
  if (p === '/') return 'home'
  if (p.startsWith('/bookshelf')) return 'shelf'
  if (p.startsWith('/recommend') || p.startsWith('/discover')) return 'discover'
  if (p.startsWith('/profile')) return 'profile'
  return ''
})
</script>

<template>
  <nav class="fixed bottom-0 inset-x-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl border-t border-cream-200 dark:border-night-700 pb-safe lg:hidden">
    <div class="max-w-screen-md mx-auto grid grid-cols-4 px-2">
      <RouterLink
        v-for="it in items"
        :key="it.key"
        :to="it.to"
        :class="[
          'flex flex-col items-center gap-0.5 py-2.5',
          activeKey === it.key
            ? 'text-clay-700 dark:text-clay-400'
            : 'text-ink-500 dark:text-ink-300'
        ]"
      >
        <Icon :name="it.icon" class="w-5 h-5" />
        <span :class="['text-[10px]', activeKey === it.key && 'font-medium']">{{ it.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

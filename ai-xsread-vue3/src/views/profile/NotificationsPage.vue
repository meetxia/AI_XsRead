<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import NotificationItem from '@/components/profile/NotificationItem.vue'

useSeoMeta({
  title: '通知中心',
  description: 'MOMO小说通知中心：系统消息、会员到期、勋章解锁等。',
  url: `${SEO_DEFAULTS.siteUrl}/profile/notifications`,
  robots: 'noindex,follow',
})

const router = useRouter()
const store = useNotificationStore()
const userStore = useUserStore()

const markingAll = ref(false)

const showSkeleton = computed(() => store.loading && store.list.length === 0)
const showEmpty = computed(() => !store.loading && store.list.length === 0)

async function refresh() {
  if (!userStore.isLogin) {
    store.reset()
    return
  }
  await Promise.all([
    store.fetchList({ page: 1, pageSize: 20 }),
    store.fetchUnreadCount(),
  ])
}

async function handleItemClick(item) {
  try {
    await store.markRead(item.id)
  } catch (err) {
    // 出错也允许跳转，最差就是再次进入时还是未读
  }
  if (item?.link && typeof item.link === 'string') {
    // 优先使用 vue-router；外链则直接 window.open
    if (/^https?:\/\//i.test(item.link)) {
      window.open(item.link, '_blank', 'noopener')
    } else {
      router.push(item.link).catch(() => {})
    }
  }
}

async function handleMarkAll() {
  if (markingAll.value || store.unreadCount === 0) return
  markingAll.value = true
  try {
    await store.markAllRead()
  } catch (err) {
    // store 内部已 console.warn，不再额外提示
  } finally {
    markingAll.value = false
  }
}

onMounted(() => {
  refresh()
})

watch(
  () => userStore.isLogin,
  (next, prev) => {
    if (next === prev) return
    if (next) {
      refresh()
    } else {
      store.reset()
    }
  }
)
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-md mx-auto px-3 h-14 flex items-center justify-between">
        <button
          @click="router.back()"
          class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800"
          aria-label="返回"
        >
          <Icon name="back" class="w-5 h-5" />
        </button>
        <h1 class="font-serif text-base font-semibold">通知中心</h1>
        <button
          v-if="store.unreadCount > 0"
          @click="handleMarkAll"
          :disabled="markingAll"
          class="px-3 h-9 rounded-full text-xs text-clay-700 dark:text-clay-400 hover:bg-cream-100 dark:hover:bg-night-800 disabled:opacity-50"
        >
          {{ markingAll ? '处理中…' : '全部已读' }}
        </button>
        <span v-else class="w-10"></span>
      </div>
    </header>

    <main class="max-w-screen-md mx-auto px-4 sm:px-5 pt-3 pb-12">
      <!-- 未登录态 -->
      <div v-if="!userStore.isLogin" class="text-center py-20">
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-cream-100 dark:bg-night-800 grid place-items-center text-ink-300">
          <Icon name="bell" class="w-8 h-8" />
        </div>
        <p class="text-sm text-ink-500 mb-3">登录后可以查看消息通知</p>
        <RouterLink
          to="/login"
          class="inline-flex items-center px-4 h-9 rounded-full bg-clay-700 text-white text-sm hover:bg-clay-600"
        >去登录</RouterLink>
      </div>

      <!-- 加载骨架 -->
      <div v-else-if="showSkeleton" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-4 sm:p-5 flex gap-3 sm:gap-4 animate-pulse"
        >
          <div class="w-10 h-10 rounded-full bg-cream-100 dark:bg-night-700"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-1/2 rounded bg-cream-100 dark:bg-night-700"></div>
            <div class="h-3 w-3/4 rounded bg-cream-100 dark:bg-night-700"></div>
            <div class="h-3 w-2/5 rounded bg-cream-100 dark:bg-night-700"></div>
          </div>
        </div>
      </div>

      <!-- 空态 -->
      <div v-else-if="showEmpty" class="text-center py-20">
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-cream-100 dark:bg-night-800 grid place-items-center text-ink-300">
          <Icon name="bell" class="w-8 h-8" />
        </div>
        <p class="font-serif text-base text-ink-700 dark:text-cream-200">暂时还没有通知</p>
        <p class="mt-1 text-xs text-ink-500">有新消息时我们会在这里告诉你</p>
      </div>

      <!-- 列表 -->
      <ul v-else class="space-y-3">
        <li v-for="item in store.list" :key="item.id">
          <NotificationItem :notification="item" @click="handleItemClick" />
        </li>
      </ul>
    </main>
  </div>
</template>

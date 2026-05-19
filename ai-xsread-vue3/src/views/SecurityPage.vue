<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import ChangePasswordDialog from '@/components/profile/ChangePasswordDialog.vue'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '账号安全',
  description: 'MOMO小说账号安全设置页面。',
  url: `${SEO_DEFAULTS.siteUrl}/security`,
  robots: 'noindex,follow',
})

const router = useRouter()

// 修改密码弹窗显隐
const dialogVisible = ref(false)

const openDialog = () => {
  dialogVisible.value = true
}

// 占位提示
const showComingSoon = (label) => {
  // eslint-disable-next-line no-alert
  alert(`${label} 功能即将开放`)
}
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-md mx-auto px-3 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="返回">
          <Icon name="back" />
        </button>
        <h1 class="font-serif text-base font-semibold">账号安全</h1>
        <ThemeToggle />
      </div>
    </header>

    <main class="max-w-md mx-auto px-5 pt-6 pb-12">
      <div class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
        <button
          type="button"
          class="w-full text-left flex items-center gap-3 p-4 hover:bg-cream-200/40 dark:hover:bg-night-700/40"
          @click="openDialog"
        >
          <span class="flex-1 text-sm">修改密码</span>
          <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
        </button>
        <button
          type="button"
          class="w-full text-left flex items-center gap-3 p-4 hover:bg-cream-200/40 dark:hover:bg-night-700/40"
          @click="showComingSoon('绑定手机')"
        >
          <span class="flex-1 text-sm">绑定手机</span>
          <span class="text-xs text-ink-400 dark:text-ink-300 mr-2">即将开放</span>
          <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
        </button>
        <button
          type="button"
          class="w-full text-left flex items-center gap-3 p-4 hover:bg-cream-200/40 dark:hover:bg-night-700/40"
          @click="showComingSoon('绑定邮箱')"
        >
          <span class="flex-1 text-sm">绑定邮箱</span>
          <span class="text-xs text-ink-400 dark:text-ink-300 mr-2">即将开放</span>
          <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
        </button>
        <button
          type="button"
          class="w-full text-left flex items-center gap-3 p-4 hover:bg-cream-200/40 dark:hover:bg-night-700/40"
          @click="showComingSoon('登录设备管理')"
        >
          <span class="flex-1 text-sm">登录设备管理</span>
          <span class="text-xs text-ink-400 dark:text-ink-300 mr-2">即将开放</span>
          <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
        </button>
        <button
          type="button"
          class="w-full text-left flex items-center gap-3 p-4 hover:bg-cream-200/40 dark:hover:bg-night-700/40 text-cinnabar-500"
          @click="showComingSoon('注销账号')"
        >
          <span class="flex-1 text-sm font-medium">注销账号</span>
          <span class="text-xs opacity-70 mr-2">即将开放</span>
          <Icon name="arrowRight" class="w-4 h-4" />
        </button>
      </div>

      <p class="mt-6 text-xs text-ink-500 dark:text-ink-300 text-center">所有操作均会记录在登录设备管理中</p>
    </main>

    <!-- 修改密码弹窗（已抽出为独立组件） -->
    <ChangePasswordDialog v-model="dialogVisible" />
  </div>
</template>

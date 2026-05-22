<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '忘记密码',
  description: 'MOMO 小说账号密码找回暂未开放，请联系管理员 QQ：472990945 处理。',
  url: `${SEO_DEFAULTS.siteUrl}/forgot-password`,
  robots: 'noindex,follow',
})

const router = useRouter()

const email = ref('')
const errorMsg = ref('')
const adminQq = '472990945'
const helpMsg = ref(`密码找回暂未开放，请联系管理员 QQ：${adminQq} 处理。`)

function onSubmit() {
  errorMsg.value = ''
  helpMsg.value = `密码找回暂未开放，请联系管理员 QQ：${adminQq} 处理。`
}

async function copyAdminQq() {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(adminQq)
    }
    helpMsg.value = `已复制管理员 QQ：${adminQq}`
  } catch (error) {
    helpMsg.value = `管理员 QQ：${adminQq}`
  }
}
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <header class="sticky top-0 z-40 pt-safe">
      <div class="max-w-screen-md mx-auto px-3 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="返回">
          <Icon name="back" />
        </button>
        <ThemeToggle />
      </div>
    </header>

    <main class="max-w-md mx-auto px-6 pt-12 pb-12 min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div class="text-center mb-10">
        <h1 class="font-serif text-3xl font-semibold tracking-tight">找回密码</h1>
        <p class="text-sm text-ink-700 dark:text-ink-300 mt-2">邮箱验证码开通前，请联系管理员处理账号找回</p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">邮箱</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="your@example.com"
            class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition"
          />
        </div>

        <p v-if="errorMsg" class="text-sm text-cinnabar-500">{{ errorMsg }}</p>
        <p class="text-sm text-ink-700 dark:text-ink-300 leading-6">{{ helpMsg }}</p>

        <button
          type="button"
          @click="copyAdminQq"
          class="w-full h-12 mt-2 rounded-xl bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold hover:bg-clay-600 active:scale-[0.98] transition shadow-cream disabled:opacity-60"
        >
          复制管理员 QQ
        </button>
      </form>

      <p class="mt-auto pt-10 text-center text-sm text-ink-700 dark:text-ink-300">
        想起来了？
        <RouterLink to="/login" class="text-clay-700 dark:text-clay-400 font-medium underline-offset-4 hover:underline">返回登录</RouterLink>
      </p>
    </main>
  </div>
</template>

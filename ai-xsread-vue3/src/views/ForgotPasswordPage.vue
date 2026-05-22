<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import { forgotPassword } from '@/api/auth'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '忘记密码',
  description: '通过注册邮箱找回 MOMO 小说账号密码。',
  url: `${SEO_DEFAULTS.siteUrl}/forgot-password`,
  robots: 'noindex,follow',
})

const router = useRouter()

const email = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function onSubmit() {
  if (!email.value) {
    errorMsg.value = '请填写邮箱'
    return
  }
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true
  try {
    const res = await forgotPassword({ email: email.value.trim() })
    successMsg.value = res?.message || '如果该邮箱已注册，我们已发送重置链接，请检查邮箱（30 分钟内有效）'
  } catch (err) {
    // 后端对正常入参一律 200，这里只在限流 / 网络异常时进入
    errorMsg.value = err?.message || '请求失败，请稍后再试'
  } finally {
    loading.value = false
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
        <p class="text-sm text-ink-700 dark:text-ink-300 mt-2">输入注册邮箱，我们会给你发送重置链接</p>
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
        <p v-if="successMsg" class="text-sm text-emerald-600 dark:text-emerald-400">{{ successMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full h-12 mt-2 rounded-xl bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold hover:bg-clay-600 active:scale-[0.98] transition shadow-cream disabled:opacity-60"
        >
          {{ loading ? '发送中…' : '发送重置链接' }}
        </button>
      </form>

      <p class="mt-auto pt-10 text-center text-sm text-ink-700 dark:text-ink-300">
        想起来了？
        <RouterLink to="/login" class="text-clay-700 dark:text-clay-400 font-medium underline-offset-4 hover:underline">返回登录</RouterLink>
      </p>
    </main>
  </div>
</template>

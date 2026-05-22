<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import { resetPassword } from '@/api/auth'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '重置密码',
  description: '设置新密码完成 MOMO 小说账号找回。',
  url: `${SEO_DEFAULTS.siteUrl}/reset-password`,
  robots: 'noindex,follow',
})

const router = useRouter()
const route = useRoute()

const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const tokenLooksValid = computed(() => /^[a-f0-9]{64}$/i.test(token.value || ''))

onMounted(() => {
  const t = route.query.token
  if (typeof t === 'string') {
    token.value = t.trim()
  }
  if (!tokenLooksValid.value) {
    errorMsg.value = '重置链接无效或已过期，请重新申请'
  }
})

async function onSubmit() {
  errorMsg.value = ''
  successMsg.value = ''

  if (!tokenLooksValid.value) {
    errorMsg.value = '重置链接无效或已过期，请重新申请'
    return
  }
  if (!newPassword.value || newPassword.value.length < 6) {
    errorMsg.value = '新密码至少 6 位'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  try {
    await resetPassword({ token: token.value, newPassword: newPassword.value })
    successMsg.value = '密码已重置，正在为你跳转登录…'
    setTimeout(() => {
      router.replace('/login')
    }, 1200)
  } catch (err) {
    errorMsg.value = err?.message || '密码重置失败，请稍后再试'
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
        <h1 class="font-serif text-3xl font-semibold tracking-tight">设置新密码</h1>
        <p class="text-sm text-ink-700 dark:text-ink-300 mt-2">链接 30 分钟内有效，仅可使用一次</p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">新密码</label>
          <div class="relative">
            <input
              v-model="newPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="请输入新密码（至少 6 位）"
              class="w-full h-12 pl-4 pr-12 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition"
            />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-500 hover:text-clay-700" aria-label="显示密码">
              <Icon name="eye" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">确认新密码</label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="再次输入新密码"
            class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition"
          />
        </div>

        <p v-if="errorMsg" class="text-sm text-cinnabar-500">{{ errorMsg }}</p>
        <p v-if="successMsg" class="text-sm text-emerald-600 dark:text-emerald-400">{{ successMsg }}</p>

        <button
          type="submit"
          :disabled="loading || !tokenLooksValid"
          class="w-full h-12 mt-2 rounded-xl bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold hover:bg-clay-600 active:scale-[0.98] transition shadow-cream disabled:opacity-60"
        >
          {{ loading ? '提交中…' : '重置密码' }}
        </button>
      </form>

      <p class="mt-auto pt-10 text-center text-sm text-ink-700 dark:text-ink-300">
        没收到邮件？
        <RouterLink to="/forgot-password" class="text-clay-700 dark:text-clay-400 font-medium underline-offset-4 hover:underline">重新发送</RouterLink>
      </p>
    </main>
  </div>
</template>

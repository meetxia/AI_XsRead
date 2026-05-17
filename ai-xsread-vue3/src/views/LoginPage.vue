<script setup>
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import { useUserStore } from '@/stores/user'
import { safeReturnUrl } from '@/composables/useReturnUrl'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const account = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function onSubmit() {
  if (!account.value || !password.value) {
    errorMsg.value = '请填写账号和密码'
    return
  }
  errorMsg.value = ''
  loading.value = true
  try {
    await userStore.login({
      account: account.value,
      password: password.value,
      rememberMe: remember.value,
    })
    const redirect = safeReturnUrl(route.query.returnUrl || route.query.redirect || '/')
    router.replace(redirect)
  } catch (err) {
    errorMsg.value = err.message || '登录失败'
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
      <!-- Logo -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-clay-500 text-cream-50 font-serif text-2xl font-semibold mb-4 shadow-cream-lg">境</div>
        <h1 class="font-serif text-3xl font-semibold tracking-tight">欢迎回来</h1>
        <p class="text-sm text-ink-700 dark:text-ink-300 mt-2">故事入境，杂念自消</p>
      </div>

      <form class="space-y-5" @submit.prevent="onSubmit">
        <!-- 账号 -->
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">账号</label>
          <input
            v-model="account"
            type="text"
            autocomplete="username"
            placeholder="手机号 / 邮箱 / 用户名"
            class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition"
          />
        </div>

        <!-- 密码 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 uppercase tracking-wider">密码</label>
            <a href="#" class="text-xs text-clay-700 dark:text-clay-400 underline-offset-4 hover:underline">忘记密码？</a>
          </div>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="请输入密码"
              class="w-full h-12 pl-4 pr-12 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition"
            />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-500 hover:text-clay-700" aria-label="显示密码">
              <Icon name="eye" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 记住我 -->
        <label class="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-300 cursor-pointer">
          <input type="checkbox" v-model="remember" class="peer sr-only" />
          <span class="w-5 h-5 rounded-md border-2 border-ink-300 peer-checked:bg-clay-500 peer-checked:border-clay-500 grid place-items-center text-cream-50 transition">
            <Icon v-show="remember" name="check" class="w-3.5 h-3.5" />
          </span>
          <span>30 天内自动登录</span>
        </label>

        <p v-if="errorMsg" class="text-sm text-cinnabar-500">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full h-12 rounded-xl bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold hover:bg-clay-600 active:scale-[0.98] transition shadow-cream disabled:opacity-60"
        >
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </form>

      <div class="my-8 flex items-center gap-3">
        <div class="flex-1 h-px bg-cream-200 dark:bg-night-700"></div>
        <span class="text-[11px] text-ink-500 dark:text-ink-300 tracking-widest uppercase">Or</span>
        <div class="flex-1 h-px bg-cream-200 dark:bg-night-700"></div>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <button type="button" class="h-12 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 grid place-items-center transition">
          <svg class="w-5 h-5 text-[#07C160]" fill="currentColor" viewBox="0 0 24 24"><path d="M8.4 6.5c.3 0 .6-.3.6-.6s-.3-.6-.6-.6-.6.3-.6.6.3.6.6.6zm-3.5 0c.3 0 .6-.3.6-.6s-.3-.6-.6-.6-.6.3-.6.6.3.6.6.6zm14.7 8.5c0-2.7-2.7-4.9-6-4.9-3.3 0-6 2.2-6 4.9 0 2.7 2.7 4.9 6 4.9.7 0 1.3-.1 1.9-.3l1.7 1-.5-1.6c1.7-.9 2.9-2.3 2.9-4z"/></svg>
        </button>
        <button type="button" class="h-12 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 grid place-items-center transition">
          <svg class="w-5 h-5 text-[#FF6900]" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>
        </button>
        <button type="button" class="h-12 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 grid place-items-center transition">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-2.7 0-5 2.3-5 5 0 2.7 2.3 5 5 5s5-2.3 5-5c0-2.7-2.3-5-5-5zM4 20v-1c0-3.4 2.7-6 6-6h4c3.4 0 6 2.7 6 6v1H4z"/></svg>
        </button>
      </div>

      <p class="mt-auto pt-10 text-center text-sm text-ink-700 dark:text-ink-300">
        还没有账号？
        <RouterLink to="/register" class="text-clay-700 dark:text-clay-400 font-medium underline-offset-4 hover:underline">立即注册</RouterLink>
      </p>

      <p class="mt-3 text-center text-[11px] text-ink-500 dark:text-ink-300">
        登录即表示同意
        <a href="#" class="underline-offset-2 underline decoration-cream-300">用户协议</a>
        和
        <a href="#" class="underline-offset-2 underline decoration-cream-300">隐私政策</a>
      </p>
    </main>
  </div>
</template>

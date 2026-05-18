<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'
import { useUserStore } from '@/stores/user'

useSeoMeta({
  title: '账号安全',
  description: 'MOMO小说账号安全设置页面。',
  url: `${SEO_DEFAULTS.siteUrl}/security`,
  robots: 'noindex,follow',
})

const router = useRouter()
const userStore = useUserStore()

// 修改密码 - 弹窗状态
const dialogVisible = ref(false)
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const canSubmit = computed(() => {
  return (
    form.oldPassword.length > 0 &&
    form.newPassword.length >= 6 &&
    form.confirmPassword === form.newPassword &&
    !submitting.value
  )
})

const resetForm = () => {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  errorMsg.value = ''
  successMsg.value = ''
}

const openDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const closeDialog = () => {
  if (submitting.value) return
  dialogVisible.value = false
}

const submitChangePassword = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!form.oldPassword) {
    errorMsg.value = '请输入旧密码'
    return
  }
  if (form.newPassword.length < 6) {
    errorMsg.value = '新密码至少 6 位'
    return
  }
  if (form.newPassword === form.oldPassword) {
    errorMsg.value = '新密码不能与旧密码相同'
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    errorMsg.value = '两次输入的新密码不一致'
    return
  }

  submitting.value = true
  try {
    await userStore.changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    })
    successMsg.value = '密码修改成功，请妥善保管'
    setTimeout(() => {
      dialogVisible.value = false
      resetForm()
    }, 1200)
  } catch (e) {
    errorMsg.value = (e && e.message) || '修改密码失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

// 占位提示
const showComingSoon = (label) => {
  // 简易提示：复用 errorMsg 区域不合适，这里直接 alert（保持轻量）
  // 也避免引入额外的 toast 库
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

    <!-- 修改密码弹窗 -->
    <div
      v-if="dialogVisible"
      class="fixed inset-0 z-50 flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeDialog"></div>
      <div class="relative w-full max-w-sm rounded-2xl bg-cream-50 dark:bg-night-800 shadow-xl p-6">
        <h2 id="change-password-title" class="font-serif text-lg font-semibold mb-4">修改密码</h2>

        <form class="space-y-3" @submit.prevent="submitChangePassword">
          <label class="block text-xs text-ink-500 dark:text-ink-300">
            旧密码
            <input
              v-model="form.oldPassword"
              type="password"
              autocomplete="current-password"
              class="mt-1 w-full rounded-lg border border-cream-200 dark:border-night-700 bg-cream-50 dark:bg-night-900 px-3 py-2 text-sm text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-cinnabar-400"
              placeholder="请输入当前密码"
            />
          </label>
          <label class="block text-xs text-ink-500 dark:text-ink-300">
            新密码
            <input
              v-model="form.newPassword"
              type="password"
              autocomplete="new-password"
              minlength="6"
              class="mt-1 w-full rounded-lg border border-cream-200 dark:border-night-700 bg-cream-50 dark:bg-night-900 px-3 py-2 text-sm text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-cinnabar-400"
              placeholder="至少 6 位"
            />
          </label>
          <label class="block text-xs text-ink-500 dark:text-ink-300">
            确认新密码
            <input
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              minlength="6"
              class="mt-1 w-full rounded-lg border border-cream-200 dark:border-night-700 bg-cream-50 dark:bg-night-900 px-3 py-2 text-sm text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-cinnabar-400"
              placeholder="再次输入新密码"
            />
          </label>

          <p v-if="errorMsg" class="text-xs text-cinnabar-500" role="alert">{{ errorMsg }}</p>
          <p v-if="successMsg" class="text-xs text-emerald-500">{{ successMsg }}</p>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-lg text-sm hover:bg-cream-100 dark:hover:bg-night-700"
              :disabled="submitting"
              @click="closeDialog"
            >取消</button>
            <button
              type="submit"
              class="px-4 py-2 rounded-lg text-sm bg-cinnabar-500 text-white hover:bg-cinnabar-600 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canSubmit"
            >{{ submitting ? '提交中…' : '确认修改' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

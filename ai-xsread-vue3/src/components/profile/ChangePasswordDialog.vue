<script setup>
/**
 * 修改密码弹窗组件
 *
 * Props:
 *   - modelValue (Boolean): 控制弹窗显隐
 *
 * Emits:
 *   - update:modelValue: 关闭弹窗时触发
 *   - success: 改密成功时触发（在强制重登前）
 *
 * 行为：
 *   1. 校验：旧密码非空、新密码 >= 6 位、新旧不同、确认密码与新密码一致
 *   2. 调 userStore.changePassword({ oldPassword, newPassword })
 *   3. 成功后：
 *      - 显示 toast 「密码已更新，请重新登录」
 *      - 等待 1.2s
 *      - 调 userStore.logout()
 *      - 跳 /login
 */
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import PasswordStrengthBar from './PasswordStrengthBar.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'success'])

const router = useRouter()
const userStore = useUserStore()

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
    form.newPassword !== form.oldPassword &&
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

const closeDialog = () => {
  if (submitting.value) return
  emit('update:modelValue', false)
}

// 弹窗每次打开时重置内部状态
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) resetForm()
  }
)

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

    successMsg.value = '密码已更新，请重新登录'
    emit('success')

    // 1.2s 后强制重登
    setTimeout(async () => {
      try {
        await userStore.logout()
      } catch (err) {
        // 即使后端 logout 接口失败，本地 token 也已被清空
        // logout 内部已 finally 清理
        console.warn('退出登录调用失败：', err)
      } finally {
        emit('update:modelValue', false)
        resetForm()
        router.push('/login')
      }
    }, 1200)
  } catch (e) {
    errorMsg.value = (e && e.message) || '修改密码失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div
    v-if="modelValue"
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
            class="mt-1 w-full rounded-lg border border-cream-200 dark:border-night-700 bg-cream-50 dark:bg-night-900 px-3 py-2 text-sm text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-cinnabar-500"
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
            class="mt-1 w-full rounded-lg border border-cream-200 dark:border-night-700 bg-cream-50 dark:bg-night-900 px-3 py-2 text-sm text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-cinnabar-500"
            placeholder="至少 6 位"
          />
          <PasswordStrengthBar :password="form.newPassword" />
        </label>
        <label class="block text-xs text-ink-500 dark:text-ink-300">
          确认新密码
          <input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="6"
            class="mt-1 w-full rounded-lg border border-cream-200 dark:border-night-700 bg-cream-50 dark:bg-night-900 px-3 py-2 text-sm text-ink-900 dark:text-cream-100 focus:outline-none focus:ring-2 focus:ring-cinnabar-500"
            placeholder="再次输入新密码"
          />
        </label>

        <p v-if="errorMsg" class="text-xs text-cinnabar-500" role="alert">{{ errorMsg }}</p>
        <p v-if="successMsg" class="text-xs text-emerald-500" role="status">{{ successMsg }}</p>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm hover:bg-cream-100 dark:hover:bg-night-700"
            :disabled="submitting"
            @click="closeDialog"
          >取消</button>
          <button
            type="submit"
            class="px-4 py-2 rounded-lg text-sm bg-cinnabar-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!canSubmit"
          >{{ submitting ? '提交中…' : '确认修改' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

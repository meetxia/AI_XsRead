<script setup>
/**
 * 激活码输入表单
 * - 4 个 4 字符 input
 * - 自动跳到下一格
 * - 粘贴一长串自动拆 4-4-4-4
 * - 实时大写
 * - 点"立即激活" → membershipStore.activate
 *
 * Props:
 *   channel: 'profile'|'reading_wall' 默认 'profile'
 * Emits:
 *   activated(payload)  // payload 是后端返回的 data（含 days_added 等）
 */
import { computed, ref } from 'vue'
import { useMembershipStore } from '@/stores/membership'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  channel: { type: String, default: 'profile' },
  autofocus: { type: Boolean, default: false }
})

const emit = defineEmits(['activated'])

const membershipStore = useMembershipStore()
const userStore = useUserStore()

const segments = ref(['', '', '', ''])
const inputs = ref([])
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const VALID_CHARS = /[ACDEFGHJKLMNPQRSTUVWXYZ234567]/g

const fullCode = computed(() => segments.value.join('').toUpperCase())
const canSubmit = computed(() => fullCode.value.length === 16 && !submitting.value)

function sanitize(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[\s-]/g, '')
    // 后端字符集是 A-Z 0-9 去掉 O 0 I 1 B 8，前端宽松点：先 A-Z0-9 都允许，过短的非法字符在最后过滤
    .replace(/[^A-Z0-9]/g, '')
}

function distributeCode(raw) {
  const cleaned = sanitize(raw).slice(0, 16)
  segments.value = [
    cleaned.slice(0, 4),
    cleaned.slice(4, 8),
    cleaned.slice(8, 12),
    cleaned.slice(12, 16)
  ]
}

function focusSegment(idx) {
  const el = inputs.value[idx]
  if (el && typeof el.focus === 'function') {
    el.focus()
    if (typeof el.select === 'function') el.select()
  }
}

function onInput(idx, event) {
  errorMsg.value = ''
  const raw = event.target.value
  // 如果一次粘了超过 4 个字符（粘贴会进 input 事件），整体拆分
  if (raw && sanitize(raw).length > 4) {
    distributeCode(segments.value.slice(0, idx).join('') + raw)
    // 跳到第一个空格位置
    const lastFilled = fullCode.value.length
    const nextIdx = Math.min(3, Math.floor(lastFilled / 4))
    setTimeout(() => focusSegment(nextIdx), 0)
    return
  }
  const cleaned = sanitize(raw).slice(0, 4)
  segments.value[idx] = cleaned
  if (cleaned.length === 4 && idx < 3) {
    setTimeout(() => focusSegment(idx + 1), 0)
  }
}

function onPaste(idx, event) {
  const raw = (event.clipboardData || window.clipboardData)?.getData('text') || ''
  if (!raw) return
  event.preventDefault()
  distributeCode(segments.value.slice(0, idx).join('') + raw)
  const lastFilled = fullCode.value.length
  const nextIdx = Math.min(3, Math.floor(lastFilled / 4))
  setTimeout(() => focusSegment(nextIdx), 0)
}

function onKeydown(idx, event) {
  if (event.key === 'Backspace' && !segments.value[idx] && idx > 0) {
    setTimeout(() => focusSegment(idx - 1), 0)
  }
  if (event.key === 'ArrowLeft' && idx > 0) {
    setTimeout(() => focusSegment(idx - 1), 0)
  }
  if (event.key === 'ArrowRight' && idx < 3) {
    setTimeout(() => focusSegment(idx + 1), 0)
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    submit()
  }
}

function clearAll() {
  segments.value = ['', '', '', '']
  errorMsg.value = ''
  successMsg.value = ''
  setTimeout(() => focusSegment(0), 0)
}

function mapErrorMessage(error) {
  // request 拦截器在 res.code 非 2xx 时会 reject 一个 Error，原始 axios 错误的 response 仍可能存在
  const status = error?.response?.status || error?.status
  const code = error?.response?.data?.code || error?.code
  const finalStatus = status || code
  if (finalStatus === 400) return '激活码格式错误（应为 16 位字母与数字）'
  if (finalStatus === 404) return '激活码无效或已使用'
  if (finalStatus === 409) return '您已是永久会员，无需激活'
  if (finalStatus === 429) return '激活过于频繁，请稍后再试'
  if (error?.message?.includes('Network Error')) return '网络错误，请检查网络连接'
  if (error?.message?.includes('timeout')) return '网络错误，请检查网络连接'
  return error?.message || '激活失败，请稍后再试'
}

async function submit() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!userStore.isLogin) {
    errorMsg.value = '请先登录后再激活'
    return
  }
  if (fullCode.value.length !== 16) {
    errorMsg.value = '请输入完整的 16 位激活码'
    return
  }
  submitting.value = true
  try {
    const data = await membershipStore.activate(fullCode.value, props.channel)
    if (import.meta.env.DEV) {
      console.log('[membership] activate ok', data)
    }
    successMsg.value = data?.days_added
      ? `激活成功！本次延长 ${data.days_added} 天`
      : '激活成功！欢迎成为会员'
    segments.value = ['', '', '', '']
    emit('activated', data || {})
  } catch (error) {
    errorMsg.value = mapErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

if (props.autofocus) {
  setTimeout(() => focusSegment(0), 50)
}
</script>

<template>
  <form class="activate-form space-y-3" @submit.prevent="submit">
    <div class="flex items-center gap-2 sm:gap-3 justify-center">
      <template v-for="(seg, idx) in segments" :key="idx">
        <input
          ref="inputs"
          :value="seg"
          type="text"
          inputmode="latin"
          autocomplete="off"
          spellcheck="false"
          maxlength="4"
          :placeholder="['XXXX','XXXX','XXXX','XXXX'][idx]"
          aria-label="激活码第 {{ idx + 1 }} 段"
          class="w-16 sm:w-20 h-12 text-center font-mono tracking-[0.25em] text-base sm:text-lg uppercase rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none transition"
          @input="onInput(idx, $event)"
          @paste="onPaste(idx, $event)"
          @keydown="onKeydown(idx, $event)"
        />
        <span v-if="idx < 3" class="text-ink-300 dark:text-ink-500 text-base sm:text-lg select-none">-</span>
      </template>
    </div>

    <p v-if="errorMsg" class="text-sm text-cinnabar-500 text-center">{{ errorMsg }}</p>
    <p v-else-if="successMsg" class="text-sm text-moss-600 dark:text-moss-500 text-center">{{ successMsg }}</p>
    <p v-else class="text-xs text-ink-500 dark:text-ink-300 text-center">支持粘贴整段激活码，自动拆分</p>

    <div class="flex items-center gap-3 justify-center">
      <button
        type="button"
        class="text-xs text-ink-500 dark:text-ink-300 underline-offset-4 hover:underline"
        @click="clearAll"
      >
        清空
      </button>
      <button
        type="submit"
        :disabled="!canSubmit"
        class="h-11 px-6 rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold hover:bg-clay-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-cream"
      >
        {{ submitting ? '激活中…' : '立即激活' }}
      </button>
    </div>
  </form>
</template>

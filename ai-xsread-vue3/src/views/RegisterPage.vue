<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import { useUserStore } from '@/stores/user'
import { useMembershipStore } from '@/stores/membership'
import { safeReturnUrl } from '@/composables/useReturnUrl'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const membershipStore = useMembershipStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const activationCode = ref('')
const showActivationField = ref(false)
const loading = ref(false)
const errorMsg = ref('')

// 自动生成一个随机用户名（后续可在个人中心修改）
// 形如 xs_l8w2k9bh，碰撞概率极低；如真碰撞了，提交时一次重试
function genUsername() {
  const t = Date.now().toString(36).slice(-6)
  const r = Math.random().toString(36).slice(2, 4)
  return `xs_${t}${r}`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailValid = computed(() => !email.value || EMAIL_RE.test(email.value.trim()))
const passwordsMatch = computed(() => !confirmPassword.value || password.value === confirmPassword.value)

function normalizedActivationCode() {
  return String(activationCode.value || '').replace(/[\s-]/g, '').toUpperCase()
}
const activationCodeValid = computed(() => {
  const v = normalizedActivationCode()
  return v.length === 0 || v.length === 16
})

async function doRegister(payload) {
  return userStore.register(payload)
}

async function onSubmit() {
  errorMsg.value = ''

  const e = email.value.trim()
  if (!e || !EMAIL_RE.test(e)) {
    errorMsg.value = '请输入有效的邮箱'
    return
  }
  if (!password.value || password.value.length < 6) {
    errorMsg.value = '密码至少 6 位'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  try {
    const payload = {
      username: genUsername(),
      email: e,
      password: password.value,
    }
    const code = normalizedActivationCode()
    if (code.length === 16) {
      payload.activationCode = code
    }

    let response
    try {
      response = await doRegister(payload)
    } catch (err) {
      // 极少数情况下随机用户名冲突，重试一次
      if (/用户名/.test(err.message || '')) {
        payload.username = genUsername()
        response = await doRegister(payload)
      } else {
        throw err
      }
    }

    // 解析激活状态提示
    const status = response?.data?.activation_status
    const message = response?.data?.activation_message || ''
    const memberData = response?.data?.membership

    if (memberData) {
      membershipStore.applyMembershipPayload(memberData)
      membershipStore.loaded = true
    }
    if (status === 'success') {
      const label = memberData?.vip_level_label || '会员'
      window.alert(`欢迎成为${label}！`)
    } else if (status === 'failed') {
      window.alert(`注册成功，但激活码失败：${message || '未知原因'}。可在个人中心重试。`)
    }

    // 跳转：优先 returnUrl，否则去兴趣引导（在那里选偏好或跳过）
    const redirect = safeReturnUrl(route.query.returnUrl || route.query.redirect || '', '')
    if (redirect && redirect !== '/') {
      router.replace(redirect)
    } else {
      router.push({ path: '/onboarding/interests', query: { from: 'register' } })
    }
  } catch (err) {
    errorMsg.value = err.message || '注册失败'
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

    <main class="max-w-md mx-auto px-6 pt-10 pb-12 min-h-[calc(100vh-3.5rem)] flex flex-col">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-clay-500 text-cream-50 font-serif text-2xl font-semibold mb-4 shadow-cream-lg">M</div>
        <h1 class="font-serif text-3xl font-semibold tracking-tight">创建账号</h1>
        <p class="text-sm text-ink-700 dark:text-ink-300 mt-2">输入邮箱即可开始阅读</p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <!-- 邮箱 -->
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">邮箱</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="example@mail.com"
            class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition"
            :class="{ 'border-cinnabar-500': email && !emailValid }"
          />
          <p v-if="email && !emailValid" class="mt-1 text-[11px] text-cinnabar-500">邮箱格式不正确</p>
        </div>

        <!-- 密码 -->
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">密码</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="至少 6 位"
              class="w-full h-12 pl-4 pr-12 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition"
            />
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-500 hover:text-clay-700" aria-label="显示密码">
              <Icon name="eye" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 确认密码 -->
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">确认密码</label>
          <input
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="再次输入密码"
            class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition"
            :class="{ 'border-cinnabar-500': !passwordsMatch }"
          />
          <p v-if="!passwordsMatch" class="mt-1 text-[11px] text-cinnabar-500">两次输入的密码不一致</p>
        </div>

        <!-- 激活码（可选可折叠） -->
        <div class="pt-1">
          <button
            type="button"
            class="flex items-center gap-2 text-xs font-medium text-clay-700 dark:text-clay-400 underline-offset-4 hover:underline"
            @click="showActivationField = !showActivationField"
            data-test="register-activation-toggle"
          >
            <Icon :name="showActivationField ? 'arrowDown' : 'arrowRight'" class="w-3.5 h-3.5" />
            <span>{{ showActivationField ? '收起激活码' : '我有激活码（可选）' }}</span>
          </button>
          <div v-if="showActivationField" class="mt-2 space-y-1">
            <input
              v-model="activationCode"
              type="text"
              maxlength="20"
              placeholder="16 位激活码"
              class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition uppercase tracking-wider font-mono"
              data-test="register-activation-input"
              @input="activationCode = String($event.target.value || '').toUpperCase()"
            />
            <p
              :class="[
                'text-[11px]',
                activationCodeValid
                  ? 'text-ink-500 dark:text-ink-300'
                  : 'text-cinnabar-500'
              ]"
            >
              <template v-if="!activationCode">未填将跳过激活，可在个人中心补激活</template>
              <template v-else-if="activationCodeValid">已填写激活码，注册时一并提交</template>
              <template v-else>激活码长度应为 16 位（不计 -）</template>
            </p>
          </div>
        </div>

        <p v-if="errorMsg" class="text-sm text-cinnabar-500">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full h-12 mt-2 rounded-xl bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold hover:bg-clay-600 active:scale-[0.98] transition shadow-cream disabled:opacity-60"
        >
          {{ loading ? '创建中…' : '创建账号' }}
        </button>

        <p class="text-center text-[11px] text-ink-500 dark:text-ink-300 leading-relaxed">
          注册即表示同意
          <a href="#" class="underline-offset-2 underline decoration-cream-300">用户协议</a>
          和
          <a href="#" class="underline-offset-2 underline decoration-cream-300">隐私政策</a>
        </p>
      </form>

      <p class="mt-auto pt-10 text-center text-sm text-ink-700 dark:text-ink-300">
        已有账号？
        <RouterLink to="/login" class="text-clay-700 dark:text-clay-400 font-medium underline-offset-4 hover:underline">直接登录</RouterLink>
      </p>
    </main>
  </div>
</template>

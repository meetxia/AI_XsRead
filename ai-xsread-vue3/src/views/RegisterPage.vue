<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const phoneCode = ref('+86')
const phone = ref('')
const code = ref('')
const password = ref('')
const agreed = ref(false)
const prefs = ref(new Set())
const loading = ref(false)
const errorMsg = ref('')

const passwordStrength = computed(() => {
  const v = password.value
  if (!v) return 0
  let s = 0
  if (v.length >= 8) s++
  if (/[a-zA-Z]/.test(v) && /[0-9]/.test(v)) s++
  if (/[^a-zA-Z0-9]/.test(v)) s++
  if (v.length >= 12) s++
  return Math.min(4, s)
})
const strengthLabel = computed(() => ['', '较弱', '中等', '良好', '极强'][passwordStrength.value])

const allPrefs = ['古风言情','都市恋曲','悬疑推理','治愈系','奇幻冒险','校园青春']
function togglePref(p) {
  if (prefs.value.has(p)) prefs.value.delete(p)
  else prefs.value.add(p)
  prefs.value = new Set(prefs.value)
}

async function onSubmit() {
  if (!username.value || !phone.value || !password.value) {
    errorMsg.value = '请填写完整信息'
    return
  }
  if (!agreed.value) {
    errorMsg.value = '请先同意用户协议和隐私政策'
    return
  }
  errorMsg.value = ''
  loading.value = true
  try {
    await userStore.register({
      username: username.value,
      email: phone.value + '@example.com', // 后端如果只接受邮箱，这里临时占位
      password: password.value,
    })
    router.replace('/')
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

    <main class="max-w-md mx-auto px-6 pt-8 pb-12 min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div class="mb-8">
        <p class="text-xs font-medium uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 mb-2">Welcome</p>
        <h1 class="font-serif text-3xl font-semibold tracking-tight">开始你的阅读旅程</h1>
        <p class="text-sm text-ink-700 dark:text-ink-300 mt-2">一步步创建账号，加入文字之境。</p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">用户名</label>
          <input v-model="username" type="text" placeholder="为自己取个名字（2-16 字）" class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition" />
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">手机号</label>
          <div class="flex gap-2">
            <select v-model="phoneCode" class="h-12 px-3 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 outline-none text-sm">
              <option>+86</option>
              <option>+852</option>
              <option>+1</option>
            </select>
            <input v-model="phone" type="tel" placeholder="11 位手机号" class="flex-1 h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">验证码</label>
          <div class="flex gap-2">
            <input v-model="code" type="text" placeholder="6 位验证码" class="flex-1 h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition" />
            <button type="button" class="h-12 px-5 rounded-xl bg-clay-500/10 text-clay-700 dark:text-clay-400 font-medium text-sm hover:bg-clay-500/15">获取验证码</button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">设置密码</label>
          <input v-model="password" type="password" placeholder="至少 8 位，含字母与数字" class="w-full h-12 px-4 rounded-xl bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition" />
          <div class="mt-2 flex gap-1.5">
            <span :class="['flex-1 h-1 rounded-full', passwordStrength >= 1 ? 'bg-cinnabar-500' : 'bg-cream-200 dark:bg-night-700']"></span>
            <span :class="['flex-1 h-1 rounded-full', passwordStrength >= 2 ? 'bg-clay-500' : 'bg-cream-200 dark:bg-night-700']"></span>
            <span :class="['flex-1 h-1 rounded-full', passwordStrength >= 3 ? 'bg-moss-500' : 'bg-cream-200 dark:bg-night-700']"></span>
            <span :class="['flex-1 h-1 rounded-full', passwordStrength >= 4 ? 'bg-moss-600' : 'bg-cream-200 dark:bg-night-700']"></span>
          </div>
          <p class="mt-1 text-[11px] text-ink-500 dark:text-ink-300">密码强度：{{ strengthLabel || '请设置密码' }}</p>
        </div>

        <!-- 偏好 -->
        <div class="pt-2">
          <label class="block text-xs font-medium text-ink-700 dark:text-ink-300 mb-2 uppercase tracking-wider">阅读偏好（可选）</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in allPrefs" :key="p" type="button"
              @click="togglePref(p)"
              :class="['px-3 py-1.5 rounded-full text-xs border transition',
                prefs.has(p)
                  ? 'bg-clay-500/10 border-clay-500 text-clay-700 dark:text-clay-400'
                  : 'bg-cream-100 dark:bg-night-800 border-transparent'
              ]"
            >{{ p }}</button>
          </div>
        </div>

        <!-- 协议 -->
        <label class="flex items-start gap-2 pt-2 cursor-pointer">
          <input type="checkbox" v-model="agreed" class="peer sr-only" />
          <span class="w-5 h-5 mt-0.5 rounded-md border-2 border-ink-300 peer-checked:bg-clay-500 peer-checked:border-clay-500 grid place-items-center text-cream-50 transition shrink-0">
            <Icon v-show="agreed" name="check" class="w-3.5 h-3.5" />
          </span>
          <span class="text-xs text-ink-700 dark:text-ink-300 leading-relaxed">
            我已阅读并同意
            <a href="#" class="text-clay-700 dark:text-clay-400 underline">用户协议</a>
            和
            <a href="#" class="text-clay-700 dark:text-clay-400 underline">隐私政策</a>
          </span>
        </label>

        <p v-if="errorMsg" class="text-sm text-cinnabar-500">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full h-12 rounded-xl bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold hover:bg-clay-600 active:scale-[0.98] transition shadow-cream disabled:opacity-60"
        >
          {{ loading ? '创建中…' : '创建账号' }}
        </button>
      </form>

      <p class="mt-auto pt-10 text-center text-sm text-ink-700 dark:text-ink-300">
        已有账号？
        <RouterLink to="/login" class="text-clay-700 dark:text-clay-400 font-medium underline-offset-4 hover:underline">直接登录</RouterLink>
      </p>
    </main>
  </div>
</template>

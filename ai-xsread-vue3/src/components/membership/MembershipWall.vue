<script setup>
/**
 * 会员墙
 *
 * Props:
 *  trialLength: number 默认 1500（来自后端 trial_length）
 *
 * 内容：
 *  - 渐变背景 + "VIP 会员可读全文" 大字
 *  - 三档卡片（月卡/年卡/永久），写权益
 *  - 已登录：嵌入 ActivateForm；激活成功 emit 'activated'
 *  - 未登录：显示"立即登录" + "注册（可填激活码）"两个按钮，跳到 /login?returnUrl / /register?returnUrl
 *  - 底部嵌入 ContactCard
 */
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { buildLoginUrl } from '@/composables/useReturnUrl'
import ActivateForm from './ActivateForm.vue'
import ContactCard from './ContactCard.vue'

const props = defineProps({
  trialLength: { type: [Number, String], default: 1500 }
})

const emit = defineEmits(['activated'])

const route = useRoute()
const userStore = useUserStore()

const loginHref = computed(() => buildLoginUrl(route.fullPath || '/'))
const registerHref = computed(
  () => `/register?returnUrl=${encodeURIComponent(route.fullPath || '/')}`
)

const tiers = [
  {
    key: 'monthly',
    title: '月卡会员',
    suffix: '30 天',
    badge: '☾ 月卡',
    features: ['全部 VIP 书籍可读', '无章节限速', '阅读体验优化']
  },
  {
    key: 'yearly',
    title: '年卡会员',
    suffix: '365 天',
    badge: '★ 年卡',
    features: ['全部 VIP 书籍可读', '无广告', '比月卡更划算', '专属会员标识']
  },
  {
    key: 'permanent',
    title: '永久会员',
    suffix: '终身有效',
    badge: '👑 永久',
    features: ['一次激活终身可读', '永久去广告', '后续新增 VIP 书籍同步解锁'],
    highlight: true
  }
]

function onActivated(payload) {
  emit('activated', payload)
}
</script>

<template>
  <section
    class="membership-wall relative rounded-3xl overflow-hidden border border-cream-200/60 dark:border-night-700"
    aria-label="会员墙"
  >
    <!-- 背景渐变 -->
    <div class="absolute inset-0 bg-gradient-to-br from-clay-500/10 via-cream-100 to-amber-100/40 dark:from-clay-600/20 dark:via-night-800 dark:to-amber-900/10"></div>
    <div class="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-amber-300/30 blur-3xl"></div>
    <div class="absolute -bottom-16 -left-12 w-72 h-72 rounded-full bg-pink-300/30 blur-3xl"></div>

    <div class="relative px-5 sm:px-8 py-8 sm:py-10 space-y-6">
      <!-- 顶部 -->
      <header class="text-center max-w-xl mx-auto">
        <p class="text-[11px] uppercase tracking-[0.3em] text-clay-500 dark:text-clay-400 font-medium">VIP MEMBERSHIP</p>
        <h2 class="mt-2 font-serif text-2xl sm:text-3xl font-semibold tracking-tight">VIP 会员可读全文</h2>
        <p class="mt-3 text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
          已为您试读 {{ trialLength }} 字，开通会员后立即解锁本书全部章节及全部 VIP 书库。
        </p>
      </header>

      <!-- 三档 -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div
          v-for="tier in tiers"
          :key="tier.key"
          :class="[
            'rounded-2xl p-4 backdrop-blur bg-cream-50/90 dark:bg-night-900/85 border',
            tier.highlight
              ? 'border-amber-400 shadow-cream-lg'
              : 'border-cream-200/70 dark:border-night-700'
          ]"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-clay-700 dark:text-clay-400">{{ tier.badge }}</span>
            <span class="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-300">{{ tier.suffix }}</span>
          </div>
          <h3 class="font-serif text-base font-semibold mb-3">{{ tier.title }}</h3>
          <ul class="space-y-1.5">
            <li
              v-for="feat in tier.features"
              :key="feat"
              class="flex items-start gap-2 text-xs text-ink-700 dark:text-ink-300 leading-relaxed"
            >
              <span class="mt-0.5 text-clay-500 dark:text-clay-400">✓</span>
              <span>{{ feat }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 激活表单 / 登录注册引导 -->
      <div
        class="rounded-2xl bg-cream-50/95 dark:bg-night-900/95 backdrop-blur p-5 sm:p-6 border border-cream-200/60 dark:border-night-700"
      >
        <template v-if="userStore.isLogin">
          <p class="text-center text-sm text-ink-700 dark:text-ink-300 mb-3">已有激活码？立即输入解锁</p>
          <ActivateForm channel="reading_wall" @activated="onActivated" />
        </template>
        <template v-else>
          <p class="text-center text-sm text-ink-700 dark:text-ink-300 mb-3">登录后即可输入激活码解锁</p>
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <RouterLink
              :to="loginHref"
              class="h-11 px-6 rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold inline-flex items-center justify-center hover:bg-clay-600 transition shadow-cream"
            >
              立即登录
            </RouterLink>
            <RouterLink
              :to="registerHref"
              class="h-11 px-6 rounded-full bg-cream-100 dark:bg-night-800 text-clay-700 dark:text-clay-400 font-medium inline-flex items-center justify-center hover:bg-cream-200 dark:hover:bg-night-700 transition"
            >
              注册（可填激活码）
            </RouterLink>
          </div>
        </template>
      </div>

      <ContactCard variant="wall" />
    </div>
  </section>
</template>

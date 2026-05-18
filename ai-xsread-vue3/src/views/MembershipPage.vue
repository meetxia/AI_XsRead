<script setup>
/**
 * 个人中心 → 会员中心
 *
 * 路由 /profile/membership，meta.requiresAuth=true
 *
 * 内容：
 *  - 顶部 Header + 返回按钮（参考 ProfilePage 风格）
 *  - 当前会员状态卡片（MembershipBadge + Countdown）
 *  - 激活区：标题"输入激活码" + ActivateForm
 *  - 三档介绍 grid
 *  - 客服 ContactCard
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import MembershipBadge from '@/components/membership/MembershipBadge.vue'
import Countdown from '@/components/membership/Countdown.vue'
import ActivateForm from '@/components/membership/ActivateForm.vue'
import ContactCard from '@/components/membership/ContactCard.vue'
import { useUserStore } from '@/stores/user'
import { useMembershipStore } from '@/stores/membership'
import { buildLoginUrl } from '@/composables/useReturnUrl'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '会员中心',
  description: 'MOMO小说会员中心，用于查看会员状态和激活会员权益。',
  url: `${SEO_DEFAULTS.siteUrl}/profile/membership`,
  robots: 'noindex,follow',
})

const router = useRouter()
const userStore = useUserStore()
const membershipStore = useMembershipStore()

const toast = ref('')
let toastTimer = null
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2200)
}

const tiers = [
  {
    key: 'permanent',
    title: '永久会员',
    badge: '👑 永久',
    suffix: '终身有效',
    features: [
      '一次激活终身可读',
      '永久去广告',
      '后续新增 VIP 同步解锁',
      '专属永久会员标识'
    ],
    highlight: true
  },
  {
    key: 'yearly',
    title: '年卡会员',
    badge: '★ 年卡',
    suffix: '365 天',
    features: ['全部 VIP 书籍可读', '无广告', '比月卡更划算', '专属年卡标识']
  },
  {
    key: 'monthly',
    title: '月卡会员',
    badge: '☾ 月卡',
    suffix: '30 天',
    features: ['全部 VIP 书籍可读', '阅读体验优化', '可叠加续期']
  }
]

const expiresFormatted = computed(() => {
  const raw = membershipStore.expiresAt
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  // 永久会员显示"永久"
  if (membershipStore.isPermanent || d.getUTCFullYear() >= 2099) return '永久有效'
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
})

const userInfo = computed(() => userStore.userInfo || {})

function onActivated(payload) {
  if (payload?.days_added) {
    showToast(`激活成功！本次延长 ${payload.days_added} 天`)
  } else if (payload?.is_permanent || payload?.vip_level === 3) {
    showToast('激活成功！欢迎成为永久会员')
  } else {
    showToast('激活成功！')
  }
  membershipStore.fetch({ force: true })
}

onMounted(() => {
  // 兜底：未登录直接跳到登录页（项目目前没启用全局 router guards，
  // 各页面靠 onMounted 自检）
  if (!userStore.isLogin) {
    router.replace(buildLoginUrl('/profile/membership'))
    return
  }
  membershipStore.fetch()
})
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-md mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
        <button @click="router.back()" class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="返回">
          <Icon name="back" />
        </button>
        <h1 class="font-serif text-base sm:text-lg font-semibold">会员中心</h1>
        <ThemeToggle />
      </div>
    </header>

    <main class="max-w-screen-md mx-auto px-4 sm:px-6 pb-24">
      <!-- 当前会员状态卡片 -->
      <section class="mt-5">
        <div class="rounded-3xl overflow-hidden relative bg-gradient-to-br from-clay-500 to-clay-700 dark:from-clay-600 dark:to-clay-700 text-cream-50 shadow-cream-lg p-6">
          <div class="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-cream-50/10 blur-3xl"></div>
          <div class="absolute -bottom-12 -left-10 w-56 h-56 rounded-full bg-amber-300/15 blur-3xl"></div>

          <div class="relative">
            <p class="text-[11px] uppercase tracking-[0.2em] text-cream-200/80 mb-2">My Membership</p>

            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="font-serif text-2xl sm:text-3xl font-semibold tracking-tight truncate" data-test="membership-level-label">
                  {{ membershipStore.levelLabel || '普通用户' }}
                </h2>
                <p class="mt-1 text-sm text-cream-200/85">
                  Hi <span class="truncate inline-block max-w-[10ch] align-bottom">{{ userInfo.nickname || userInfo.username || '读者' }}</span>，
                  <span v-if="membershipStore.isPermanent">您已是永久会员</span>
                  <span v-else-if="membershipStore.isActive">您的会员到期日：{{ expiresFormatted || '——' }}</span>
                  <span v-else>您还未开通会员，输入激活码立即解锁</span>
                </p>
              </div>
              <MembershipBadge
                size="md"
                :level="membershipStore.level"
                :is-active="membershipStore.isActive"
              />
            </div>

            <div class="mt-4">
              <Countdown
                :level="membershipStore.level"
                :level-label="membershipStore.levelLabel"
                :days-remaining="membershipStore.daysRemaining"
                :is-permanent="membershipStore.isPermanent"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 激活区 -->
      <section class="mt-6" v-if="!membershipStore.isPermanent">
        <h2 class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-2">Activate</h2>
        <div class="rounded-2xl bg-cream-100 dark:bg-night-800 p-5 sm:p-6">
          <h3 class="font-serif text-lg font-semibold mb-1 text-center">输入激活码</h3>
          <p class="text-xs text-ink-500 dark:text-ink-300 mb-4 text-center">
            16 位激活码（自动转大写，支持粘贴）
          </p>
          <ActivateForm channel="profile" @activated="onActivated" />
        </div>
      </section>

      <!-- 三档介绍 -->
      <section class="mt-6">
        <h2 class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-2">Plans</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            v-for="tier in tiers"
            :key="tier.key"
            :class="[
              'rounded-2xl p-4 sm:p-5 border bg-cream-100 dark:bg-night-800',
              tier.highlight
                ? 'border-amber-400 shadow-cream-lg'
                : 'border-cream-200 dark:border-night-700'
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
      </section>

      <!-- 客服 -->
      <section class="mt-6">
        <h2 class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-2">Support</h2>
        <ContactCard />
      </section>

      <RouterLink
        to="/profile"
        class="mt-6 block text-center text-xs text-ink-500 dark:text-ink-300 underline-offset-4 hover:underline"
      >
        ← 返回我的
      </RouterLink>
    </main>

    <p
      v-if="toast"
      class="fixed left-1/2 -translate-x-1/2 bottom-12 z-50 rounded-full bg-night-900 text-cream-50 px-4 py-2 text-sm shadow-cream"
    >
      {{ toast }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import BottomNav from '@/components/v2/layout/BottomNav.vue'
import Icon from '@/components/v2/icons/Icon.vue'
import ThemeToggle from '@/components/v2/ui/ThemeToggle.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const user = computed(() => ({
  name: userStore.userInfo?.username || userStore.userInfo?.nickname || '阮宁',
  handle: '@' + (userStore.userInfo?.username || 'ningning'),
  joinDays: 287,
  avatar: userStore.userInfo?.avatar || '',
  shelf: 32,
  streak: 14,
  hours: 287,
}))

const avatarLetter = computed(() => (user.value.name[0] || '阮').toUpperCase())

// 周阅读柱状图（占位数据）
const weekData = [
  { day: '一', pct: 30 },
  { day: '二', pct: 55 },
  { day: '三', pct: 75 },
  { day: '四', pct: 45 },
  { day: '五', pct: 100, today: true },
  { day: '六', pct: 25 },
  { day: '日', pct: 65 },
]

async function doLogout() {
  await userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2 px-2">
          <span class="w-8 h-8 rounded-full bg-clay-500 grid place-items-center text-cream-50 font-serif font-semibold">境</span>
          <span class="font-serif text-lg font-semibold tracking-tight">文字之境</span>
        </RouterLink>
        <div class="flex items-center gap-1">
          <button class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800" aria-label="通知">
            <Icon name="bell" class="w-5 h-5" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <!-- PC 双栏：左 用户卡 + 快捷功能 + 阅读统计；右 设置列表 -->
      <div class="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <!-- 左栏 -->
        <div class="lg:col-span-2 min-w-0 space-y-5">
          <!-- 用户卡 -->
          <section>
            <div class="rounded-2xl overflow-hidden bg-gradient-to-br from-clay-500 to-clay-700 dark:from-clay-600 dark:to-clay-700 text-cream-50 shadow-cream-lg p-5 sm:p-6 relative">
              <div class="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-cream-50/10 blur-2xl"></div>

              <div class="relative flex items-center gap-4">
                <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cream-50/20 ring-2 ring-cream-50/40 grid place-items-center font-serif text-xl sm:text-2xl font-semibold backdrop-blur overflow-hidden shrink-0">
                  <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
                  <span v-else>{{ avatarLetter }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h1 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight truncate">{{ user.name }}</h1>
                  <p class="text-sm text-cream-200/85 mt-0.5 truncate">{{ user.handle }} · 加入 {{ user.joinDays }} 天</p>
                </div>
                <button class="px-3 py-1.5 rounded-full bg-cream-50/15 backdrop-blur border border-cream-50/25 text-xs shrink-0">编辑</button>
              </div>

              <p class="relative mt-3 text-sm text-cream-200/90 italic font-serif">"读过的书，遇过的人，都会变成你。"</p>

              <div class="relative mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p class="font-serif text-lg sm:text-xl font-semibold">{{ user.shelf }}</p>
                  <p class="text-[10px] tracking-wider uppercase text-cream-200/70 mt-0.5">书架</p>
                </div>
                <div class="border-x border-cream-50/15">
                  <p class="font-serif text-lg sm:text-xl font-semibold">{{ user.streak }}<span class="text-xs ml-0.5">天</span></p>
                  <p class="text-[10px] tracking-wider uppercase text-cream-200/70 mt-0.5">连读</p>
                </div>
                <div>
                  <p class="font-serif text-lg sm:text-xl font-semibold">{{ user.hours }}<span class="text-xs ml-0.5">h</span></p>
                  <p class="text-[10px] tracking-wider uppercase text-cream-200/70 mt-0.5">阅读时长</p>
                </div>
              </div>
            </div>
          </section>

          <!-- 快捷功能 -->
          <section>
            <div class="grid grid-cols-4 gap-2 sm:gap-3">
              <RouterLink to="/bookshelf" class="flex flex-col items-center gap-1 py-3 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 transition">
                <Icon name="shelf" class="w-5 h-5 text-clay-700 dark:text-clay-400" />
                <span class="text-[11px]">书架</span>
              </RouterLink>
              <RouterLink to="/history" class="flex flex-col items-center gap-1 py-3 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 transition">
                <Icon name="clock" class="w-5 h-5 text-clay-700 dark:text-clay-400" />
                <span class="text-[11px]">历史</span>
              </RouterLink>
              <a href="#" class="flex flex-col items-center gap-1 py-3 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 transition">
                <Icon name="heart" class="w-5 h-5 text-clay-700 dark:text-clay-400" />
                <span class="text-[11px]">收藏</span>
              </a>
              <a href="#" class="flex flex-col items-center gap-1 py-3 rounded-xl bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 transition">
                <Icon name="arrowDown" class="w-5 h-5 text-clay-700 dark:text-clay-400" />
                <span class="text-[11px]">下载</span>
              </a>
            </div>
          </section>

          <!-- 阅读统计 -->
          <section>
            <div class="flex items-end justify-between mb-3">
              <div>
                <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Reading Stats</p>
                <h2 class="font-serif text-lg sm:text-xl font-semibold tracking-tight">这周读了什么</h2>
              </div>
            </div>
            <div class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4 sm:p-5">
              <div class="flex items-end justify-between gap-2 h-28 sm:h-32 mb-3">
                <div v-for="(d, i) in weekData" :key="i" class="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    :class="['w-full rounded-t', d.today ? 'bg-clay-500' : 'bg-clay-500/40']"
                    :style="{ height: d.pct + '%' }"
                  ></div>
                  <span :class="['text-[10px]', d.today ? 'text-clay-700 font-medium' : 'text-ink-500']">{{ d.day }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs text-ink-500 dark:text-ink-300 pt-3 border-t border-cream-200 dark:border-night-700">
                <span>共 12.5 小时 · 读完 1 本</span>
                <span class="text-moss-600 dark:text-moss-500 font-medium">↑ 比上周多 28%</span>
              </div>
            </div>
          </section>
        </div>

        <!-- 右栏：设置 -->
        <div class="lg:col-span-1 min-w-0">
          <section>
            <h2 class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-2">通用</h2>
            <div class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
              <a href="#" class="flex items-center gap-3 p-3.5 hover:bg-cream-200/40 dark:hover:bg-night-700/40">
                <Icon name="eye" class="w-5 h-5 text-clay-700 dark:text-clay-400" />
                <span class="flex-1 text-sm">阅读偏好</span>
                <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
              </a>
              <a href="#" class="flex items-center gap-3 p-3.5 hover:bg-cream-200/40 dark:hover:bg-night-700/40">
                <Icon name="bell" class="w-5 h-5 text-clay-700 dark:text-clay-400" />
                <span class="flex-1 text-sm">通知</span>
                <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
              </a>
              <RouterLink to="/security" class="flex items-center gap-3 p-3.5 hover:bg-cream-200/40 dark:hover:bg-night-700/40">
                <Icon name="settings" class="w-5 h-5 text-clay-700 dark:text-clay-400" />
                <span class="flex-1 text-sm">账号安全</span>
                <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
              </RouterLink>
            </div>

            <h2 class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-2 mt-5">关于</h2>
            <div class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
              <a href="#" class="flex items-center gap-3 p-3.5">
                <span class="flex-1 text-sm">帮助与反馈</span>
                <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
              </a>
              <a href="#" class="flex items-center gap-3 p-3.5">
                <span class="flex-1 text-sm">关于文字之境</span>
                <span class="text-xs text-ink-500">v 1.0</span>
              </a>
              <button v-if="userStore.isLogin" @click="doLogout" class="w-full text-left flex items-center gap-3 p-3.5 text-cinnabar-500 hover:bg-cinnabar-500/5">
                <span class="flex-1 text-sm font-medium">退出登录</span>
              </button>
              <RouterLink v-else to="/login" class="w-full text-left flex items-center gap-3 p-3.5 text-clay-700 dark:text-clay-400">
                <span class="flex-1 text-sm font-medium">立即登录</span>
                <Icon name="arrowRight" class="w-4 h-4" />
              </RouterLink>
            </div>
          </section>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>

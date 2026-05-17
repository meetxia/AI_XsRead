<script setup>
/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 29.2: 勋章墙页面
 *
 * - 调 GET /api/user/achievements 拉取后端聚合数据
 * - 已解锁区按 unlockedAt DESC 排序
 * - 未解锁区按完成度（currentValue / threshold）DESC 排序
 * - 各区按 category（reading / bookshelf / habit / milestone）分组渲染
 * - 头部展示 "我的勋章 (N / 总数)" 摘要
 *
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import AchievementCard from '@/components/profile/AchievementCard.vue'
import { getUserAchievements } from '@/api/achievements'

const achievements = ref([])
const summary = ref({ unlocked: 0, total: 0, percentage: 0 })
const loading = ref(true)
const errorMessage = ref('')

// 与后端 service 中 category 取值保持一致：reading / bookshelf / habit / milestone
const CATEGORY_ORDER = ['reading', 'bookshelf', 'habit', 'milestone']
const CATEGORY_LABELS = {
  reading: '阅读章节',
  bookshelf: '书架积累',
  habit: '阅读习惯',
  milestone: '里程碑',
}

function getCategory(item) {
  const raw = item?.category
  if (raw && CATEGORY_LABELS[raw]) return raw
  return 'milestone'
}

function isUnlocked(item) {
  if (typeof item?.unlocked === 'boolean') return item.unlocked
  return Boolean(item?.unlockedAt || item?.unlocked_at)
}

function getUnlockedAt(item) {
  const raw = item?.unlockedAt || item?.unlocked_at
  if (!raw) return 0
  const ts = new Date(raw).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function getProgressRatio(item) {
  const current = Number(item?.currentValue ?? item?.current_value ?? 0)
  const thresholdRaw = Number(item?.threshold ?? item?.target ?? 1)
  const threshold = thresholdRaw > 0 ? thresholdRaw : 1
  const ratio = current / threshold
  if (!Number.isFinite(ratio)) return 0
  return Math.max(0, Math.min(1, ratio))
}

// 已解锁集合：按 unlockedAt DESC 排序
const unlockedItems = computed(() =>
  achievements.value
    .filter(isUnlocked)
    .slice()
    .sort((a, b) => getUnlockedAt(b) - getUnlockedAt(a))
)

// 未解锁集合：按完成度 DESC 排序
const lockedItems = computed(() =>
  achievements.value
    .filter((item) => !isUnlocked(item))
    .slice()
    .sort((a, b) => getProgressRatio(b) - getProgressRatio(a))
)

function groupByCategory(items) {
  const map = new Map()
  for (const cat of CATEGORY_ORDER) map.set(cat, [])
  for (const item of items) {
    const cat = getCategory(item)
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat).push(item)
  }
  // 仅返回非空分组，按 CATEGORY_ORDER 排列。
  return CATEGORY_ORDER
    .map((cat) => ({ category: cat, label: CATEGORY_LABELS[cat], items: map.get(cat) || [] }))
    .filter((group) => group.items.length > 0)
}

const unlockedGroups = computed(() => groupByCategory(unlockedItems.value))
const lockedGroups = computed(() => groupByCategory(lockedItems.value))

const summaryText = computed(() => {
  const total = summary.value?.total || achievements.value.length || 0
  const unlocked = summary.value?.unlocked ?? unlockedItems.value.length
  return `${unlocked} / ${total}`
})

async function loadAchievements() {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await getUserAchievements()
    if (res && res.code === 200) {
      const payload = res.data || {}
      const list = Array.isArray(payload)
        ? payload
        : (payload.achievements || payload.list || [])
      achievements.value = Array.isArray(list) ? list : []
      summary.value = payload.summary || {
        unlocked: achievements.value.filter(isUnlocked).length,
        total: achievements.value.length,
        percentage: 0,
      }
    } else {
      achievements.value = []
      summary.value = { unlocked: 0, total: 0, percentage: 0 }
      errorMessage.value = res?.message || '加载失败'
    }
  } catch (e) {
    achievements.value = []
    summary.value = { unlocked: 0, total: 0, percentage: 0 }
    errorMessage.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadAchievements)

defineExpose({ loadAchievements })
</script>

<template>
  <div
    class="min-h-screen bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 paper-texture"
  >
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-md mx-auto px-4 h-14 flex items-center gap-3">
        <RouterLink
          to="/profile"
          class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800"
          aria-label="返回"
        >
          <Icon name="back" />
        </RouterLink>
        <h1 class="font-serif text-lg font-semibold flex-1 truncate" data-testid="page-title">
          我的勋章 ({{ summaryText }})
        </h1>
      </div>
    </header>

    <main class="max-w-screen-md mx-auto px-4 pb-24">
      <!-- 加载骨架：3 张占位卡 -->
      <section
        v-if="loading"
        data-testid="loading-skeleton"
        class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="rounded-2xl bg-cream-100 dark:bg-night-800 p-4 animate-pulse"
        >
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-2xl bg-cream-200 dark:bg-night-700"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-2/3 bg-cream-200 dark:bg-night-700 rounded"></div>
              <div class="h-3 w-full bg-cream-200/70 dark:bg-night-700/70 rounded"></div>
            </div>
          </div>
          <div class="mt-3 h-1.5 rounded-full bg-cream-200 dark:bg-night-700"></div>
        </div>
      </section>

      <template v-else>
        <p
          v-if="errorMessage"
          data-testid="error-message"
          class="mt-6 rounded-2xl bg-cream-100 dark:bg-night-800 p-5 text-sm text-cinnabar-600"
        >
          {{ errorMessage }}
        </p>

        <!-- 已解锁 -->
        <section data-testid="unlocked-section" class="mt-6">
          <div class="flex items-end justify-between mb-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">
                Unlocked
              </p>
              <h2 class="font-serif text-lg sm:text-xl font-semibold tracking-tight">
                已解锁
                <span class="text-sm text-ink-500 ml-1" data-testid="unlocked-count">
                  ({{ unlockedItems.length }})
                </span>
              </h2>
            </div>
          </div>

          <div
            v-if="!unlockedItems.length"
            data-testid="unlocked-empty"
            class="rounded-2xl bg-cream-100 dark:bg-night-800 p-5 text-sm text-ink-500"
          >
            暂无解锁勋章
          </div>

          <div v-else class="space-y-5">
            <div
              v-for="group in unlockedGroups"
              :key="`unlocked-${group.category}`"
              :data-testid="`unlocked-group-${group.category}`"
            >
              <h3 class="text-xs font-medium text-ink-500 dark:text-ink-300 mb-2">
                {{ group.label }}
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AchievementCard
                  v-for="item in group.items"
                  :key="`unlocked-${item.id || item.code}`"
                  :achievement="item"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- 未解锁 -->
        <section data-testid="locked-section" class="mt-8">
          <div class="flex items-end justify-between mb-3">
            <div>
              <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">
                Locked
              </p>
              <h2 class="font-serif text-lg sm:text-xl font-semibold tracking-tight">
                未解锁
                <span class="text-sm text-ink-500 ml-1" data-testid="locked-count">
                  ({{ lockedItems.length }})
                </span>
              </h2>
            </div>
          </div>

          <div
            v-if="!lockedItems.length"
            data-testid="locked-empty"
            class="rounded-2xl bg-cream-100 dark:bg-night-800 p-5 text-sm text-ink-500"
          >
            暂无可解锁勋章
          </div>

          <div v-else class="space-y-5">
            <div
              v-for="group in lockedGroups"
              :key="`locked-${group.category}`"
              :data-testid="`locked-group-${group.category}`"
            >
              <h3 class="text-xs font-medium text-ink-500 dark:text-ink-300 mb-2">
                {{ group.label }}
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AchievementCard
                  v-for="item in group.items"
                  :key="`locked-${item.id || item.code}`"
                  :achievement="item"
                />
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>

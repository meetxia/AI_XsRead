<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'
import { usePreferencesStore } from '@/stores/preferences'
import { useUserStore } from '@/stores/user'

useSeoMeta({
  title: '阅读偏好',
  description: 'MOMO小说阅读偏好设置：字号、行距、主题、翻页方式、护眼模式。',
  url: `${SEO_DEFAULTS.siteUrl}/profile/preferences`,
  robots: 'noindex,follow',
})

const router = useRouter()
const prefs = usePreferencesStore()
const userStore = useUserStore()

const SAMPLE_TEXT = '夜色像一卷展开的旧绸，轻轻覆上窗台。她合上书页，听见远处巷口传来卖花人的吆喝，灯下纸张泛着柔和的暖光。'

const LINE_HEIGHTS = [1.4, 1.6, 1.8, 2.0, 2.2]

const THEMES = [
  { value: 'cream', label: '米色',   bg: '#f5eedc', text: '#3b2f25', ring: 'ring-[#a07b56]' },
  { value: 'night', label: '夜间',   bg: '#12110f', text: '#ded8ce', ring: 'ring-[#6e6a64]' },
  { value: 'eye',   label: '护眼',   bg: '#e6efe4', text: '#223026', ring: 'ring-[#6b8b76]' },
]

const PAGE_MODES = [
  { value: 'scroll', label: '滚动' },
  { value: 'page',   label: '分页' },
]

// 预览段落动态样式
const previewStyle = computed(() => {
  const theme = THEMES.find((t) => t.value === prefs.theme) || THEMES[0]
  return {
    fontSize: `${prefs.fontSize}px`,
    lineHeight: prefs.lineHeight,
    backgroundColor: theme.bg,
    color: theme.text,
    filter: prefs.eyeProtection ? 'sepia(0.15) brightness(0.95)' : 'none',
  }
})

function handleFontSize(e) {
  const v = Number(e.target.value)
  if (!Number.isFinite(v)) return
  prefs.update({ fontSize: v })
}
function setLineHeight(v) {
  prefs.update({ lineHeight: v })
}
function setTheme(v) {
  prefs.update({ theme: v })
}
function setPageMode(v) {
  prefs.update({ pageMode: v })
}
function toggleEyeProtection() {
  prefs.update({ eyeProtection: !prefs.eyeProtection })
}
function reset() {
  prefs.update({
    fontSize: 16,
    lineHeight: 1.8,
    theme: 'cream',
    pageMode: 'scroll',
    eyeProtection: false,
  })
}

onMounted(() => {
  prefs.fetch()
})

// 登录态变化：登录 → 拉服务端；登出 → 回退到默认
watch(
  () => userStore.isLogin,
  (next, prev) => {
    if (next === prev) return
    if (next) {
      prefs.fetch()
    } else {
      prefs.reset()
      prefs.restore()
    }
  }
)
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-md mx-auto px-3 h-14 flex items-center justify-between">
        <button
          @click="router.back()"
          class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800"
          aria-label="返回"
        >
          <Icon name="back" class="w-5 h-5" />
        </button>
        <h1 class="font-serif text-base font-semibold">阅读偏好</h1>
        <button
          @click="reset"
          class="text-xs text-ink-500 hover:text-ink-900 dark:hover:text-cream-100 px-2 h-10 rounded-full"
          aria-label="恢复默认"
        >恢复默认</button>
      </div>
    </header>

    <main class="max-w-screen-md mx-auto px-4 sm:px-5 pb-12 pt-4 space-y-4">
      <!-- 预览段落（实时） -->
      <section
        class="rounded-2xl shadow-cream-lg p-5 transition-colors duration-200"
        :style="previewStyle"
        aria-label="阅读预览"
      >
        <p class="font-serif" :style="{ fontSize: previewStyle.fontSize, lineHeight: previewStyle.lineHeight }">
          {{ SAMPLE_TEXT }}
        </p>
        <p class="font-serif mt-3 opacity-80" :style="{ fontSize: previewStyle.fontSize, lineHeight: previewStyle.lineHeight }">
          她翻开下一章，故事还在继续，灯火也还在守着深夜的字行。
        </p>
      </section>

      <!-- 字号 -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-serif text-sm font-semibold">字号</h2>
          <span class="text-xs text-ink-500">{{ prefs.fontSize }}px</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-ink-500" aria-hidden="true">A</span>
          <input
            type="range"
            min="12"
            max="24"
            step="1"
            :value="prefs.fontSize"
            @input="handleFontSize"
            class="flex-1 h-2 rounded-full accent-clay-700 cursor-pointer"
            aria-label="字号"
          />
          <span class="text-base text-ink-500" aria-hidden="true">A</span>
        </div>
      </section>

      <!-- 行距 -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5">
        <h2 class="font-serif text-sm font-semibold mb-3">行距</h2>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="lh in LINE_HEIGHTS"
            :key="lh"
            type="button"
            @click="setLineHeight(lh)"
            :class="[
              'h-10 rounded-xl text-sm font-medium border transition',
              Math.abs(prefs.lineHeight - lh) < 0.001
                ? 'border-clay-700 bg-clay-700 text-white'
                : 'border-cream-200 dark:border-night-700 bg-cream-50 dark:bg-night-700 text-ink-700 dark:text-cream-200 hover:border-clay-400'
            ]"
            :aria-pressed="Math.abs(prefs.lineHeight - lh) < 0.001"
          >{{ lh.toFixed(1) }}</button>
        </div>
      </section>

      <!-- 主题 -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5">
        <h2 class="font-serif text-sm font-semibold mb-3">主题</h2>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="t in THEMES"
            :key="t.value"
            type="button"
            @click="setTheme(t.value)"
            :class="[
              'h-20 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition relative',
              prefs.theme === t.value
                ? 'border-clay-700 ring-2 ring-clay-400'
                : 'border-cream-200 dark:border-night-700 hover:border-clay-400'
            ]"
            :style="{ backgroundColor: t.bg, color: t.text }"
            :aria-pressed="prefs.theme === t.value"
          >
            <span class="font-serif text-base font-semibold">阅</span>
            <span class="text-xs">{{ t.label }}</span>
            <span
              v-if="prefs.theme === t.value"
              class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-clay-700 text-white grid place-items-center"
            >
              <Icon name="check" class="w-3 h-3" />
            </span>
          </button>
        </div>
      </section>

      <!-- 翻页方式 -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5">
        <h2 class="font-serif text-sm font-semibold mb-3">翻页方式</h2>
        <div class="inline-flex p-1 rounded-full bg-cream-100 dark:bg-night-700 w-full">
          <button
            v-for="mode in PAGE_MODES"
            :key="mode.value"
            type="button"
            @click="setPageMode(mode.value)"
            :class="[
              'flex-1 h-10 rounded-full text-sm font-medium transition',
              prefs.pageMode === mode.value
                ? 'bg-white dark:bg-night-800 text-clay-700 shadow-sm'
                : 'text-ink-500 hover:text-ink-900 dark:hover:text-cream-100'
            ]"
            :aria-pressed="prefs.pageMode === mode.value"
          >{{ mode.label }}</button>
        </div>
      </section>

      <!-- 护眼模式 -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 grid place-items-center rounded-full bg-cream-100 dark:bg-night-700 text-clay-700 dark:text-clay-400">
              <Icon name="eye" class="w-5 h-5" />
            </span>
            <div>
              <h2 class="font-serif text-sm font-semibold">护眼模式</h2>
              <p class="text-xs text-ink-500 mt-0.5">轻微暖色滤镜，长时间阅读更舒适</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="prefs.eyeProtection"
            @click="toggleEyeProtection"
            :class="[
              'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition',
              prefs.eyeProtection ? 'bg-clay-700' : 'bg-cream-200 dark:bg-night-700'
            ]"
          >
            <span
              :class="[
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                prefs.eyeProtection ? 'translate-x-6' : 'translate-x-1'
              ]"
            />
          </button>
        </div>
      </section>

      <!-- 未登录提示 -->
      <p v-if="!userStore.isLogin" class="text-center text-xs text-ink-500 pt-2">
        当前未登录，偏好仅保存到本机。
        <RouterLink to="/login" class="text-clay-700 dark:text-clay-400 underline">去登录</RouterLink>
      </p>
    </main>
  </div>
</template>

<style scoped>
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, var(--clay-700, #8b6a4d) 0%, var(--clay-700, #8b6a4d) 50%, #e7e2d5 50%, #e7e2d5 100%);
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid #8b6a4d;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}
input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: #fff;
  border: 2px solid #8b6a4d;
  cursor: pointer;
}
</style>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '帮助与反馈',
  description: 'MOMO小说常见问题、联系方式与反馈引导。',
  url: `${SEO_DEFAULTS.siteUrl}/about/help`,
})

const router = useRouter()

const faqs = [
  {
    q: '如何收藏小说到书架？',
    a: '在小说详情页右上角点击「收藏」即可将小说加入书架；阅读页底部工具栏也提供同名按钮。书架内容会跨设备同步。'
  },
  {
    q: '阅读进度是如何同步的？',
    a: '登录后我们会在你切换章节、关闭阅读页时自动上传进度。下次在任何设备登录同一账号，都会自动跳到上次读到的位置。'
  },
  {
    q: '会员到期后已收藏的内容会丢失吗？',
    a: '不会。书架、想法、划线、书签都是免费功能，会员只影响付费章节的解锁。会员到期仅会停止你阅读付费章节的权限。'
  },
  {
    q: '找不到想看的某本书怎么办？',
    a: '可以在首页顶部搜索框尝试不同关键词（书名 / 作者 / 主要人物）；如果确实未收录，欢迎邮件告诉我们书名，我们会评估上架。'
  },
  {
    q: '如何切换阅读主题？',
    a: '进入「我的 - 阅读偏好」可以选择米色、夜间、护眼三种主题，并调节字号和行距。设置会即时生效，登录后还会同步到云端。'
  },
  {
    q: '我的想法 / 划线在哪里查看？',
    a: '「我的 - 我的想法」与「我的 - 我的划线」分别承载这两类内容，按时间倒序排列，点击可跳到原章节定位段落。'
  },
  {
    q: '怎样关注一位作者？',
    a: '在作者主页点击「关注」按钮即可。被关注的作者会出现在「我的 - 关注作者」入口里，他们更新新作品时通知中心也会提醒你。'
  },
  {
    q: '上传的小说审核要多久？',
    a: '正常情况下我们会在 1-3 个工作日内完成审核。审核结果会通过通知中心告知；若长时间未收到结果，欢迎邮件催促。'
  }
]

const copyHint = ref('')
let hintTimer = null

async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
    } else {
      const ta = document.createElement('textarea')
      ta.value = value
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copyHint.value = `已复制：${value}`
  } catch (e) {
    copyHint.value = '复制失败，请手动选择文本'
  }
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => { copyHint.value = '' }, 2000)
}
</script>

<template>
  <div class="bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 min-h-screen paper-texture">
    <header class="sticky top-0 z-40 bg-cream-50/85 dark:bg-night-900/85 backdrop-blur-xl pt-safe">
      <div class="max-w-screen-md mx-auto px-3 h-14 flex items-center justify-between">
        <button
          @click="router.back()"
          class="w-10 h-10 grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800"
          aria-label="返回"
        >
          <Icon name="back" />
        </button>
        <h1 class="font-serif text-base font-semibold">帮助与反馈</h1>
        <span class="w-10"></span>
      </div>
    </header>

    <main class="max-w-screen-md mx-auto px-4 sm:px-6 pt-4 pb-16 space-y-6">
      <!-- 顶部欢迎 -->
      <section class="rounded-2xl bg-gradient-to-br from-clay-500 to-clay-700 dark:from-clay-600 dark:to-clay-700 text-cream-50 shadow-cream-lg p-5 sm:p-6 relative overflow-hidden">
        <div class="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-cream-50/10 blur-2xl" aria-hidden="true"></div>
        <div class="relative">
          <p class="text-[11px] uppercase tracking-[0.2em] text-cream-200/80 mb-2">Help &amp; Support</p>
          <h2 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight">遇到问题？我们在这里</h2>
          <p class="mt-2 text-sm text-cream-200/85 leading-relaxed">
            先看下下面的常见问题；如果没找到答案，欢迎通过邮件或客服微信联系我们。
          </p>
        </div>
      </section>

      <!-- FAQ -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-2 sm:p-3">
        <h2 class="px-3 pt-3 pb-2 text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium">FAQ · 常见问题</h2>
        <div class="divide-y divide-cream-200 dark:divide-night-700">
          <details
            v-for="(item, idx) in faqs"
            :key="idx"
            class="group px-3 py-3"
          >
            <summary class="cursor-pointer list-none flex items-center justify-between gap-3">
              <span class="font-serif text-sm sm:text-base font-medium pr-2">{{ item.q }}</span>
              <span
                class="shrink-0 w-7 h-7 grid place-items-center rounded-full bg-cream-100 dark:bg-night-700 text-clay-700 dark:text-clay-400 transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                <svg viewBox="0 0 20 20" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 4v12M4 10h12" stroke-linecap="round" />
                </svg>
              </span>
            </summary>
            <p class="mt-2 text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{{ item.a }}</p>
          </details>
        </div>
      </section>

      <!-- 联系方式 -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5">
        <h2 class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-3">Contact · 联系方式</h2>
        <ul class="space-y-3">
          <li class="flex items-center gap-3">
            <span class="w-9 h-9 grid place-items-center rounded-full bg-cream-100 dark:bg-night-700 text-clay-700 dark:text-clay-400 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-5 h-5" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-ink-500">客服邮箱</p>
              <p class="text-sm font-medium truncate">1357499128@qq.com</p>
            </div>
            <button
              type="button"
              @click="copyText('support@momo-novel.com')"
              class="shrink-0 px-3 py-1.5 rounded-full bg-cream-100 dark:bg-night-700 hover:bg-cream-200 dark:hover:bg-night-600 text-xs text-clay-700 dark:text-clay-400"
            >复制</button>
          </li>
          <li class="flex items-center gap-3">
            <span class="w-9 h-9 grid place-items-center rounded-full bg-cream-100 dark:bg-night-700 text-clay-700 dark:text-clay-400 shrink-0">
              <Icon name="chat" class="w-5 h-5" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-ink-500">客服微信号</p>
              <p class="text-sm font-medium truncate">mo-x168</p>
            </div>
            <button
              type="button"
              @click="copyText('momo_help')"
              class="shrink-0 px-3 py-1.5 rounded-full bg-cream-100 dark:bg-night-700 hover:bg-cream-200 dark:hover:bg-night-600 text-xs text-clay-700 dark:text-clay-400"
            >复制</button>
          </li>
        </ul>
        <p
          v-if="copyHint"
          class="mt-3 text-xs text-moss-600 dark:text-moss-500"
          role="status"
          aria-live="polite"
        >{{ copyHint }}</p>
      </section>

      <!-- 反馈引导 -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5">
        <h2 class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-3">Feedback · 反馈引导</h2>
        <p class="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
          目前我们尚未开放线上反馈表单，欢迎通过上方邮箱直接联系我们。为帮助我们快速定位问题，建议在邮件中附上：
        </p>
        <ul class="mt-2 list-disc list-inside text-sm text-ink-700 dark:text-ink-300 leading-relaxed space-y-1">
          <li>你的账号（昵称或注册邮箱）</li>
          <li>问题截图或录屏</li>
          <li>触发问题的步骤与设备 / 浏览器型号</li>
        </ul>
        <p class="mt-3 text-xs text-ink-500">
          我们承诺在 3 个工作日内回复每一封邮件。
        </p>
      </section>

      <div class="text-center pt-2">
        <RouterLink to="/profile" class="inline-block text-sm text-clay-700 dark:text-clay-400 underline">
          返回个人中心
        </RouterLink>
      </div>
    </main>
  </div>
</template>

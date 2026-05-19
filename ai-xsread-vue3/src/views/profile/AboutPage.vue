<script setup>
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '关于 MOMO小说',
  description: '关于 MOMO 小说：版本信息、团队介绍、用户协议与隐私政策。',
  url: `${SEO_DEFAULTS.siteUrl}/about`,
})

const router = useRouter()
const APP_VERSION = 'v1.0.0'

function scrollToAnchor(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        <h1 class="font-serif text-base font-semibold">关于 MOMO小说</h1>
        <span class="w-10"></span>
      </div>
    </header>

    <main class="max-w-screen-md mx-auto px-4 sm:px-6 pt-6 pb-16 space-y-6">
      <!-- Hero: logo + slogan + version -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-6 sm:p-8 text-center">
        <img
          src="/logo.svg"
          alt="MOMO小说"
          class="w-20 h-20 mx-auto rounded-2xl shadow-cream"
        />
        <h2 class="mt-4 font-serif text-2xl font-semibold tracking-tight">MOMO小说</h2>
        <p class="mt-2 text-sm text-ink-700 dark:text-ink-300 italic font-serif">
          故事入境，杂念自消
        </p>
        <p class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-100 dark:bg-night-700 text-xs text-clay-700 dark:text-clay-400">
          <span aria-hidden="true">●</span>
          当前版本 {{ APP_VERSION }}
        </p>
      </section>

      <!-- 团队介绍 -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5 sm:p-6">
        <h2 class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-3">Our Team · 团队介绍</h2>
        <p class="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
          我们是一支来自不同城市的小团队，相信「读一本好书」依然是这个时代最温柔的事情。
          MOMO小说想做一个安静、不被打扰的阅读空间——你只管翻页，剩下的我们慢慢打磨。
          每一行字、每一处留白，都希望让你愿意多停一会儿。
        </p>
      </section>

      <!-- 协议入口 -->
      <section class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg overflow-hidden divide-y divide-cream-200 dark:divide-night-700">
        <button
          type="button"
          @click="scrollToAnchor('terms')"
          class="w-full text-left flex items-center gap-3 p-4 hover:bg-cream-100/60 dark:hover:bg-night-700/60"
        >
          <span class="flex-1 text-sm">用户协议</span>
          <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
        </button>
        <button
          type="button"
          @click="scrollToAnchor('privacy')"
          class="w-full text-left flex items-center gap-3 p-4 hover:bg-cream-100/60 dark:hover:bg-night-700/60"
        >
          <span class="flex-1 text-sm">隐私政策</span>
          <Icon name="arrowRight" class="w-4 h-4 text-ink-500" />
        </button>
      </section>

      <!-- 用户协议正文 -->
      <section
        id="terms"
        class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5 sm:p-6 scroll-mt-20"
      >
        <h2 class="font-serif text-lg font-semibold mb-3">用户协议</h2>
        <p class="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
          以下条款为简要说明，正式版本将在 MOMO 小说公开上线前完善并以独立页面发布。
          欢迎你阅读并使用 MOMO 小说提供的阅读服务，注册账号即视为你已知悉并同意我们的基本使用规则：
          请勿上传违反法律法规或侵犯他人版权的内容；请妥善保管账号与密码，因账号转借或泄露造成的问题需由你自行承担；
          我们保留在不影响你既有合法权益的前提下，调整产品功能、内容形态与服务条款的权利。
          后续完整版协议将明确双方权利义务、内容审核标准、付费服务规则等条款细节。
        </p>
      </section>

      <!-- 隐私政策正文 -->
      <section
        id="privacy"
        class="rounded-2xl bg-white dark:bg-night-800 shadow-cream-lg p-5 sm:p-6 scroll-mt-20"
      >
        <h2 class="font-serif text-lg font-semibold mb-3">隐私政策</h2>
        <p class="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">
          以下条款为简要说明，正式版本将于 MOMO 小说公开上线前完善并以独立页面发布。
          MOMO 小说仅在为你提供登录、阅读同步、付费会员等核心功能时，收集必要的账号资料与阅读行为数据。
          我们承诺：不会将你的个人信息出售或用于无关营销；除非取得你的明确授权或法律强制要求，不会向任何第三方共享你的可识别身份。
          你可以随时通过「我的 - 编辑资料」修改账号信息，或通过帮助页提供的邮箱联系我们删除账号数据。
          完整隐私政策将进一步说明数据存储位置、保留期限以及第三方 SDK 使用范围。
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

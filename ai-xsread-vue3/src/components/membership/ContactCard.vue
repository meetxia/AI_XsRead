<script setup>
/**
 * 客服联系卡
 * - 调 membershipStore.loadContact() 拉取
 * - QQ + 复制按钮 / 微信 + 复制按钮 / 二维码图（点击放大）
 * - notice 文案 small text
 * - 数据全空时显示"暂未设置客服联系方式"
 */
import { computed, onMounted, ref } from 'vue'
import Icon from '@/components/v2/icons/Icon.vue'
import { useMembershipStore } from '@/stores/membership'

defineProps({
  variant: { type: String, default: 'default' } // default | wall
})

const store = useMembershipStore()
const lightbox = ref(false)
const copiedKey = ref('')

const contact = computed(() => store.contact)
const isEmpty = computed(() =>
  !contact.value.qq && !contact.value.wechat && !contact.value.qrcodeUrl
)

async function copyText(value, key) {
  if (!value) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
    } else {
      const ta = document.createElement('textarea')
      ta.value = value
      ta.setAttribute('readonly', '')
      ta.style.position = 'absolute'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copiedKey.value = key
    setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = ''
    }, 1500)
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[contact] copy failed', error)
  }
}

onMounted(() => {
  store.loadContact()
})
</script>

<template>
  <section
    :class="[
      'rounded-2xl p-4 sm:p-5',
      variant === 'wall'
        ? 'bg-cream-50/95 dark:bg-night-900/95 backdrop-blur'
        : 'bg-cream-100 dark:bg-night-800'
    ]"
    aria-label="客服联系"
  >
    <div class="flex items-center gap-2 mb-3">
      <span class="w-1 h-4 rounded-full bg-clay-500"></span>
      <h3 class="font-serif text-base font-semibold">客服联系 · 获取激活码</h3>
    </div>

    <p class="text-xs text-ink-500 dark:text-ink-300 mb-4 leading-relaxed">
      购买激活码请联系客服或前往官方发卡平台。激活码激活成功后请务必保存好凭证。
    </p>

    <div v-if="store.contactLoading" class="text-sm text-ink-500 dark:text-ink-300">
      加载中…
    </div>

    <div v-else-if="isEmpty" class="text-sm text-ink-500 dark:text-ink-300">
      暂未设置客服联系方式，请稍后再试。
    </div>

    <div v-else class="space-y-3">
      <div v-if="contact.qq" class="flex items-center justify-between gap-3 rounded-xl bg-cream-50 dark:bg-night-900 p-3">
        <div class="min-w-0">
          <p class="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-300">QQ</p>
          <p class="font-mono text-sm font-medium truncate">{{ contact.qq }}</p>
        </div>
        <button
          type="button"
          class="px-3 h-8 rounded-full bg-clay-500/10 text-clay-700 dark:text-clay-400 text-xs font-medium hover:bg-clay-500/20 transition"
          @click="copyText(contact.qq, 'qq')"
        >
          {{ copiedKey === 'qq' ? '已复制' : '复制 QQ' }}
        </button>
      </div>

      <div v-if="contact.wechat" class="flex items-center justify-between gap-3 rounded-xl bg-cream-50 dark:bg-night-900 p-3">
        <div class="min-w-0">
          <p class="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-300">微信</p>
          <p class="font-mono text-sm font-medium truncate">{{ contact.wechat }}</p>
        </div>
        <button
          type="button"
          class="px-3 h-8 rounded-full bg-moss-500/10 text-moss-600 dark:text-moss-500 text-xs font-medium hover:bg-moss-500/20 transition"
          @click="copyText(contact.wechat, 'wechat')"
        >
          {{ copiedKey === 'wechat' ? '已复制' : '复制微信' }}
        </button>
      </div>

      <div v-if="contact.qrcodeUrl" class="flex items-center gap-3 rounded-xl bg-cream-50 dark:bg-night-900 p-3">
        <button
          type="button"
          class="w-20 h-20 rounded-lg overflow-hidden bg-white shrink-0 hover:opacity-90 transition"
          aria-label="点击放大二维码"
          @click="lightbox = true"
        >
          <img
            :src="contact.qrcodeUrl"
            alt="客服微信二维码"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </button>
        <div class="min-w-0">
          <p class="text-[10px] uppercase tracking-wider text-ink-500 dark:text-ink-300 mb-1">微信扫码</p>
          <p class="text-xs text-ink-700 dark:text-ink-300 leading-relaxed">点击放大保存到相册，再用微信"扫一扫"识别。</p>
        </div>
      </div>
    </div>

    <p v-if="contact.notice" class="mt-4 text-xs text-ink-500 dark:text-ink-300 leading-relaxed">
      {{ contact.notice }}
    </p>

    <!-- 二维码大图 lightbox -->
    <Teleport to="body">
      <div
        v-if="lightbox && contact.qrcodeUrl"
        class="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm grid place-items-center p-6"
        @click="lightbox = false"
      >
        <div class="relative bg-white rounded-2xl p-3 shadow-2xl max-w-[80vw] max-h-[80vh]" @click.stop>
          <button
            type="button"
            class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-night-900 text-cream-50 grid place-items-center"
            aria-label="关闭"
            @click="lightbox = false"
          >
            <Icon name="close" class="w-4 h-4" />
          </button>
          <img
            :src="contact.qrcodeUrl"
            alt="客服微信二维码"
            class="block max-w-[70vw] max-h-[70vh] object-contain"
          />
        </div>
      </div>
    </Teleport>
  </section>
</template>

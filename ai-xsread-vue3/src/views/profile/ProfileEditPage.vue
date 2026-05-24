<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import AvatarUploader from '@/components/profile/AvatarUploader.vue'
import InterestTagPicker from '@/components/profile/InterestTagPicker.vue'
import { useUserStore } from '@/stores/user'
import { getMyInterestTags, saveInterestTags } from '@/api/interestTags'
import { useSeoMeta, SEO_DEFAULTS } from '@/composables/useSeoMeta'

useSeoMeta({
  title: '编辑资料',
  description: 'MOMO小说编辑个人资料：昵称、头像、阅读口味标签。',
  url: `${SEO_DEFAULTS.siteUrl}/profile/edit`,
  robots: 'noindex,follow',
})

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const avatarUrl = ref('')
const nickname = ref('')
const tags = ref([])

// 原始值用于变更检测
const originalNickname = ref('')
const originalTags = ref([])

// 状态标记
const loading = ref(true)
const saving = ref(false)
const avatarUploading = ref(false)
const toastMsg = ref('')
const toastType = ref('info') // info | success | error
let toastTimer = null

const NICKNAME_MAX = 24

// 简易 toast
const showToast = (msg, type = 'info', duration = 2200) => {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, duration)
}

const trimmedNickname = computed(() => (nickname.value || '').trim())
const accountEmail = computed(() => userStore.userInfo?.email || '未绑定')

const tagsChanged = computed(() => {
  const a = [...(tags.value || [])].sort()
  const b = [...(originalTags.value || [])].sort()
  if (a.length !== b.length) return true
  return a.some((v, i) => v !== b[i])
})

const nicknameValid = computed(() => {
  const len = trimmedNickname.value.length
  return len >= 1 && len <= NICKNAME_MAX
})

const nicknameChanged = computed(() => trimmedNickname.value !== (originalNickname.value || '').trim())

// 保存按钮可用条件：
// - 昵称合法
// - 至少一个字段（昵称 / 标签）发生变化
// - 不在保存中、不在头像上传中
const canSave = computed(() => {
  return nicknameValid.value
    && (nicknameChanged.value || tagsChanged.value)
    && !saving.value
    && !avatarUploading.value
})

// 头像上传错误回调
const onAvatarError = (msg) => {
  showToast(msg || '头像上传失败', 'error')
}

// 加载初始数据
const loadInitial = async () => {
  loading.value = true
  try {
    const info = userStore.userInfo || {}
    avatarUrl.value = info.avatar || ''
    nickname.value = info.nickname || info.username || ''
    originalNickname.value = nickname.value

    try {
      const res = await getMyInterestTags()
      const list = Array.isArray(res?.data?.tags)
        ? res.data.tags
        : (Array.isArray(res?.data) ? res.data : [])
      tags.value = list.slice(0, 5)
      originalTags.value = [...tags.value]
    } catch (e) {
      console.warn('获取兴趣标签失败：', e)
      tags.value = []
      originalTags.value = []
    }
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!canSave.value) return
  saving.value = true
  try {
    // 1. 先更新昵称（如有变化）
    if (nicknameChanged.value) {
      await userStore.updateUserInfo({ nickname: trimmedNickname.value })
      originalNickname.value = trimmedNickname.value
    }
    // 2. 再保存兴趣标签（如有变化）
    if (tagsChanged.value) {
      await saveInterestTags(tags.value)
      originalTags.value = [...tags.value]
    }
    showToast('保存成功', 'success', 1200)
    setTimeout(() => {
      router.back()
    }, 600)
  } catch (e) {
    console.error('保存失败：', e)
    showToast((e && e.message) || '保存失败，请稍后重试', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadInitial()
})

const initialLetter = computed(() => {
  const src = (userStore.userInfo?.nickname || userStore.userInfo?.username || 'M')
  return src.charAt(0).toUpperCase()
})

const remainingLen = computed(() => {
  const len = trimmedNickname.value.length
  return Math.max(0, NICKNAME_MAX - len)
})
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
        <h1 class="font-serif text-base font-semibold">编辑资料</h1>
        <span class="w-10"></span>
      </div>
    </header>

    <main class="max-w-md mx-auto px-5 pt-6 pb-32">
      <!-- 加载占位 -->
      <div v-if="loading" class="py-16 text-center text-sm text-ink-500 dark:text-ink-300">
        加载中…
      </div>

      <template v-else>
        <!-- 头像上传 -->
        <section class="flex flex-col items-center pt-2">
          <AvatarUploader
            v-model="avatarUrl"
            :letter="initialLetter"
            :size="96"
            @update:uploading="avatarUploading = $event"
            @error="onAvatarError"
          />
        </section>

        <!-- 昵称 -->
        <section class="mt-8">
          <label class="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-2">
            昵称
          </label>
          <div class="relative">
            <input
              v-model="nickname"
              type="text"
              :maxlength="NICKNAME_MAX"
              class="w-full rounded-xl border border-cream-200 dark:border-night-700 bg-cream-50 dark:bg-night-900 px-3 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-cinnabar-500"
              placeholder="给自己起个昵称"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-500 dark:text-ink-300">
              {{ trimmedNickname.length }}/{{ NICKNAME_MAX }}
            </span>
          </div>
          <p class="mt-1 text-[11px] text-ink-500 dark:text-ink-300">
            <span v-if="!nicknameValid">昵称需 1-{{ NICKNAME_MAX }} 字</span>
            <span v-else>还可输入 {{ remainingLen }} 字</span>
          </p>
        </section>

        <!-- 账号邮箱 -->
        <section class="mt-8">
          <label class="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-2">
            账号邮箱
          </label>
          <div class="rounded-xl border border-cream-200 dark:border-night-700 bg-cream-100 dark:bg-night-800 px-3 py-2.5">
            <p class="text-sm text-ink-800 dark:text-cream-100 break-all">
              {{ accountEmail }}
            </p>
          </div>
          <p class="mt-1 text-[11px] text-ink-500 dark:text-ink-300">
            邮箱用于登录与账号识别，暂不支持修改。
          </p>
        </section>

        <!-- 阅读口味 -->
        <section class="mt-8">
          <label class="block text-xs font-medium text-ink-500 dark:text-ink-300 mb-2">
            阅读口味（最多 5 个）
          </label>
          <InterestTagPicker v-model="tags" :max="5" />
        </section>
      </template>
    </main>

    <!-- 底部固定保存栏 -->
    <div
      v-if="!loading"
      class="fixed bottom-0 inset-x-0 z-30 bg-cream-50/95 dark:bg-night-900/95 backdrop-blur-md border-t border-cream-200 dark:border-night-700 pb-safe"
    >
      <div class="max-w-md mx-auto px-5 py-3">
        <button
          type="button"
          class="w-full h-11 rounded-full font-serif font-semibold transition"
          :class="canSave
            ? 'bg-clay-700 dark:bg-clay-500 text-cream-50 hover:opacity-90 active:scale-[0.99]'
            : 'bg-cream-200 dark:bg-night-700 text-ink-500 dark:text-ink-300 cursor-not-allowed'
          "
          :disabled="!canSave"
          @click="handleSave"
        >
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 简易 Toast -->
    <transition name="fade">
      <div
        v-if="toastMsg"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm shadow-lg max-w-[90%]"
        :class="{
          'bg-emerald-500 text-white': toastType === 'success',
          'bg-cinnabar-500 text-white': toastType === 'error',
          'bg-night-800 dark:bg-cream-100 text-cream-50 dark:text-ink-900': toastType === 'info',
        }"
        role="status"
      >
        {{ toastMsg }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>

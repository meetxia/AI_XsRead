<script setup>
/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 27.3 — 关注作者按钮（共享于 NovelDetailPage / AuthorPage）
 *
 * 包装 useFollowAuthor 的最小 UI：
 *  - loading=true 渲染骨架（未首次加载完成时）
 *  - 切换文案"关注 / 已关注"
 *  - 失败时通过 emit('error') 告知父组件
 */
import { computed, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFollowAuthor } from '@/composables/useFollowAuthor'

const props = defineProps({
  authorId: { type: [String, Number], default: null },
  variant: { type: String, default: 'solid' }, // 'solid' | 'translucent'
})

const emit = defineEmits(['error', 'change'])

const router = useRouter()
const handle = shallowRef(null)
const ready = ref(false)

function isValidId(id) {
  return id !== null && id !== undefined && id !== ''
}

function bindAuthor(id) {
  if (!isValidId(id)) {
    handle.value = null
    ready.value = false
    return
  }
  handle.value = useFollowAuthor(id, { router })
  ready.value = true
  handle.value.loadStatus()
}

watch(
  () => props.authorId,
  (next) => bindAuthor(next),
  { immediate: true }
)

const loading = computed(() => (ready.value && handle.value ? handle.value.loading.value : false))
const following = computed(() => (ready.value && handle.value ? handle.value.following.value : false))
const loaded = computed(() => (ready.value && handle.value ? handle.value.loaded.value : false))

const buttonClass = computed(() => {
  if (props.variant === 'translucent') {
    return following.value
      ? 'bg-cream-50/15 backdrop-blur border border-cream-50/25 text-cream-50'
      : 'bg-cream-50 text-clay-700 hover:bg-cream-100'
  }
  return following.value
    ? 'bg-cream-200 dark:bg-night-700 text-ink-700 dark:text-cream-100'
    : 'bg-clay-700 dark:bg-clay-500 text-cream-50 hover:bg-clay-600'
})

async function onClick() {
  if (!handle.value) return
  try {
    const result = await handle.value.toggle()
    emit('change', { following: handle.value.following.value, redirected: Boolean(result?.redirected) })
  } catch (err) {
    emit('error', err)
  }
}

defineExpose({ following, loading, loaded })
</script>

<template>
  <template v-if="ready">
    <div v-if="loading && !loaded" class="follow-skeleton" data-testid="follow-skeleton" aria-busy="true">
      <span class="block h-7 w-20 rounded-full bg-cream-200/70 dark:bg-night-700 animate-pulse"></span>
    </div>
    <button
      v-else
      type="button"
      :disabled="loading"
      :class="['px-4 py-1.5 rounded-full text-xs font-medium transition shrink-0 disabled:opacity-60 disabled:cursor-wait', buttonClass]"
      :aria-pressed="following"
      data-testid="follow-button"
      @click="onClick"
    >
      {{ following ? '已关注' : '关注' }}
    </button>
  </template>
</template>

<style scoped>
.follow-skeleton {
  display: inline-flex;
  align-items: center;
}
</style>

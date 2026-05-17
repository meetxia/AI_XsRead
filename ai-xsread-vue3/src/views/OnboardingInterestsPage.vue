<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { saveInterestTags, getMyInterestTags } from '@/api/interestTags'

const router = useRouter()
const selected = ref([])
const saving = ref(false)
const ready = ref(false)
const tags = ['古风穿越', '都市言情', '悬疑推理', '治愈系', '奇幻冒险', '校园青春', '职场成长', '甜宠', '慢热', '强剧情']

function toggle(tag) {
  selected.value = selected.value.includes(tag)
    ? selected.value.filter(item => item !== tag)
    : [...selected.value, tag].slice(0, 5)
}

async function submit(skip = false) {
  saving.value = true
  try {
    if (skip) {
      // Requirement 20.5：跳过时本地标记，避免下次再次提示
      try { localStorage.setItem('xs:onboarding-skipped', '1') } catch {}
    } else if (selected.value.length) {
      await saveInterestTags(selected.value)
    }
  } catch (e) {
    // 忽略保存失败，用户仍可进入首页
  } finally {
    saving.value = false
    router.replace('/')
  }
}

// Requirement 20.6：已写入兴趣标签的用户下次进入时直接跳到首页，
// 接口失败则降级渲染当前页面以避免用户被卡住。
onMounted(async () => {
  try {
    const res = await getMyInterestTags()
    const list = Array.isArray(res?.data?.tags)
      ? res.data.tags
      : (Array.isArray(res?.data) ? res.data : [])
    if (list.length > 0) {
      router.replace('/')
      return
    }
  } catch (e) {
    // 接口失败时不阻断，继续渲染页面
  } finally {
    ready.value = true
  }
})
</script>

<template>
  <div v-if="ready" class="min-h-screen bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100 paper-texture">
    <main class="max-w-screen-sm mx-auto px-4 py-10">
      <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-2">Start</p>
      <h1 class="font-serif text-2xl sm:text-3xl font-semibold">先选几个想读的方向</h1>
      <p class="mt-2 text-sm text-ink-500 dark:text-ink-300">至少 1 个，之后会用于首页推荐。</p>

      <div class="mt-6 flex flex-wrap gap-2">
        <button
          v-for="tag in tags"
          :key="tag"
          type="button"
          :class="[
            'px-4 h-10 rounded-full text-sm font-medium transition',
            selected.includes(tag) ? 'bg-clay-700 dark:bg-clay-500 text-cream-50' : 'bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700'
          ]"
          @click="toggle(tag)"
        >
          {{ tag }}
        </button>
      </div>

      <div class="mt-8 flex gap-2">
        <button
          class="flex-1 h-11 rounded-full bg-clay-700 dark:bg-clay-500 text-cream-50 font-serif font-semibold disabled:opacity-50"
          :disabled="saving || !selected.length"
          @click="submit(false)"
        >
          开始阅读
        </button>
        <button class="px-5 h-11 rounded-full bg-cream-100 dark:bg-night-800 text-sm" @click="submit(true)">跳过</button>
      </div>
    </main>
  </div>
</template>

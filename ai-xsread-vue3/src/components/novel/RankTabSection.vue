<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/v2/icons/Icon.vue'
import { getRankList } from '@/api/recommend'

const tabs = [
  { key: 'classic', label: '古言', categoryId: 102 },
  { key: 'modern', label: '现言', categoryId: 101 },
  { key: 'romance', label: '纯爱', categoryId: 106 },
  { key: 'mystery', label: '悬疑', categoryId: 104 },
  { key: 'healing', label: '治愈', categoryId: 105 },
  { key: 'finished', label: '完结', status: 'finished' },
]

const active = ref(tabs[0].key)
const loading = ref(false)
const cache = ref({})
const lists = ref({})

function normalizeList(data) {
  const list = Array.isArray(data) ? data : (data?.list || [])
  return list.slice(0, 10).map((item, index) => ({
    id: item.id || item.novel_id,
    title: item.title || '未命名小说',
    author: item.author || '佚名',
    category: item.category_name || item.category || '',
    rating: Number(item.rating || item.average || 0).toFixed(1),
    views: item.views || item.view_count || 0,
    rank: index + 1,
  }))
}

async function selectTab(tab) {
  active.value = tab.key
  const hit = cache.value[tab.key]
  if (hit && Date.now() - hit.time < 5 * 60 * 1000) {
    lists.value[tab.key] = hit.list
    return
  }

  loading.value = true
  try {
    const params = tab.status === 'finished'
      ? { status: 'finished', pageSize: 10 }
      : { categoryId: tab.categoryId, pageSize: 10 }
    const res = await getRankList(params)
    const list = normalizeList(res?.data)
    cache.value[tab.key] = { time: Date.now(), list }
    lists.value[tab.key] = list
  } catch (error) {
    lists.value[tab.key] = lists.value[tab.key] || []
  } finally {
    loading.value = false
  }
}

function currentTab() {
  return tabs.find(tab => tab.key === active.value) || tabs[0]
}

function fullRankLink() {
  const tab = currentTab()
  const params = new URLSearchParams({ sortBy: 'views' })
  if (tab.categoryId) params.set('categoryId', tab.categoryId)
  if (tab.status) params.set('status', tab.status)
  return `/recommend?${params.toString()}`
}

onMounted(() => selectTab(tabs[0]))
</script>

<template>
  <section>
    <div class="flex items-end justify-between mb-3">
      <div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium mb-1">Rankings</p>
        <h2 class="font-serif text-xl sm:text-2xl font-semibold tracking-tight">分榜速览</h2>
      </div>
      <RouterLink :to="fullRankLink()" class="text-sm text-ink-700 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400 transition">完整榜单</RouterLink>
    </div>

    <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="[
          'shrink-0 px-4 h-8 rounded-full text-sm font-medium transition',
          active === tab.key ? 'bg-clay-700 dark:bg-clay-500 text-cream-50' : 'bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700'
        ]"
        @click="selectTab(tab)"
      >
        {{ tab.label }}
      </button>
    </div>

    <ol class="rounded-2xl bg-cream-100 dark:bg-night-800 divide-y divide-cream-200 dark:divide-night-700 overflow-hidden">
      <li v-if="loading" class="p-4 text-sm text-ink-500">榜单加载中...</li>
      <li v-else-if="!(lists[active] || []).length" class="p-4 text-sm text-ink-500">榜单暂未收录新书</li>
      <li v-for="item in lists[active]" :key="item.id">
        <RouterLink :to="`/novel/${item.id}`" class="flex items-center gap-3 p-3 hover:bg-cream-200/40 dark:hover:bg-night-700/40 transition-colors">
          <span :class="['font-serif text-lg font-semibold w-6 text-center shrink-0', item.rank <= 3 ? 'text-clay-700 dark:text-clay-400' : 'text-ink-500 dark:text-ink-300']">{{ item.rank }}</span>
          <div class="flex-1 min-w-0">
            <h4 class="font-serif font-semibold text-sm truncate">{{ item.title }}</h4>
            <p class="text-xs text-ink-500 dark:text-ink-300 mt-0.5 truncate">{{ item.author }}<span v-if="item.category"> · {{ item.category }}</span></p>
          </div>
          <span class="inline-flex items-center gap-1 text-xs text-clay-600 dark:text-clay-400 font-medium shrink-0">
            <Icon name="starFill" class="w-3 h-3" /> {{ item.rating }}
          </span>
        </RouterLink>
      </li>
    </ol>
  </section>
</template>

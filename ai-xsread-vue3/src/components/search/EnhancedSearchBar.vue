<script setup>
import { ref, watch } from 'vue'
import Icon from '@/components/v2/icons/Icon.vue'
import { getSearchSuggest } from '@/api/search'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '搜书名、作者、标签...' },
})

const emit = defineEmits(['update:modelValue', 'search'])

const keyword = ref(props.modelValue)
const suggestions = ref([])
const open = ref(false)
const loading = ref(false)
const activeIndex = ref(-1)
let timer = null
let requestId = 0

watch(() => props.modelValue, (value) => {
  if (value !== keyword.value) keyword.value = value || ''
})

watch(keyword, (value) => {
  emit('update:modelValue', value)
  scheduleSuggest(value)
})

function scheduleSuggest(value) {
  clearTimeout(timer)
  const q = (value || '').trim()
  activeIndex.value = -1
  if (!q) {
    suggestions.value = []
    open.value = false
    return
  }
  if (loading.value) return
  timer = setTimeout(() => loadSuggestions(q), 200)
}

async function loadSuggestions(q) {
  const current = ++requestId
  loading.value = true
  try {
    const res = await getSearchSuggest(q)
    if (current !== requestId) return
    const list = Array.isArray(res?.data) ? res.data : (res?.data?.list || [])
    suggestions.value = list.slice(0, 8).map((item, index) => ({
      id: item.id || item.novel_id || `${q}-${index}`,
      keyword: item.keyword || item.title || item.name || String(item),
      meta: item.author || item.category_name || item.count || '',
      novelId: item.novel_id || item.id,
    }))
    open.value = suggestions.value.length > 0
  } catch (error) {
    suggestions.value = []
    open.value = false
  } finally {
    loading.value = false
  }
}

function clear() {
  keyword.value = ''
  suggestions.value = []
  open.value = false
}

function submit(value = keyword.value) {
  const q = (value || '').trim()
  if (!q) return
  keyword.value = q
  open.value = false
  emit('search', q)
}

function choose(item) {
  submit(item.keyword)
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    open.value = false
    return
  }
  if (!open.value || suggestions.value.length === 0) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, -1)
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault()
    choose(suggestions.value[activeIndex.value])
  }
}

function highlight(text) {
  const q = keyword.value.trim()
  if (!q) return text
  const index = String(text).toLowerCase().indexOf(q.toLowerCase())
  if (index < 0) return text
  return {
    before: String(text).slice(0, index),
    mark: String(text).slice(index, index + q.length),
    after: String(text).slice(index + q.length),
  }
}
</script>

<template>
  <div class="relative">
    <div class="relative">
      <Icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500 pointer-events-none" />
      <input
        v-model="keyword"
        type="search"
        :placeholder="placeholder"
        class="w-full h-10 pl-10 pr-20 rounded-full bg-cream-100 dark:bg-night-800 border border-transparent focus:border-clay-500 focus:bg-cream-50 dark:focus:bg-night-700 outline-none text-sm transition-colors"
        autocomplete="off"
        @focus="keyword.trim() && suggestions.length && (open = true)"
        @keydown="handleKeydown"
        @keydown.enter.exact="activeIndex < 0 && submit()"
      />
      <button
        v-if="keyword"
        type="button"
        class="absolute right-14 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-full text-ink-500 hover:bg-cream-200 dark:hover:bg-night-700"
        aria-label="清空搜索"
        @click="clear"
      >
        <Icon name="close" class="w-4 h-4" />
      </button>
      <button
        type="button"
        class="absolute right-1 top-1/2 -translate-y-1/2 px-3 h-8 rounded-full text-sm text-clay-700 dark:text-clay-400 font-medium hover:bg-cream-200 dark:hover:bg-night-700 transition"
        @click="submit()"
      >
        搜索
      </button>
    </div>

    <div
      v-if="open"
      class="absolute z-50 mt-2 w-full rounded-2xl bg-cream-50 dark:bg-night-800 border border-cream-200 dark:border-night-700 shadow-cream overflow-hidden"
    >
      <button
        v-for="(item, index) in suggestions"
        :key="item.id"
        type="button"
        :class="[
          'w-full px-3 py-2.5 flex items-center gap-3 text-left text-sm transition',
          activeIndex === index ? 'bg-clay-500/10 text-clay-700 dark:text-clay-400' : 'hover:bg-cream-100 dark:hover:bg-night-700'
        ]"
        @mousedown.prevent="choose(item)"
        @mouseenter="activeIndex = index"
      >
        <Icon name="search" class="w-4 h-4 text-ink-500" />
        <span class="flex-1 min-w-0 truncate">
          <template v-if="typeof highlight(item.keyword) === 'string'">{{ item.keyword }}</template>
          <template v-else>
            {{ highlight(item.keyword).before }}<mark class="bg-transparent text-clay-700 dark:text-clay-400 font-semibold">{{ highlight(item.keyword).mark }}</mark>{{ highlight(item.keyword).after }}
          </template>
        </span>
        <span v-if="item.meta" class="text-[11px] text-ink-500 shrink-0">{{ item.meta }}</span>
      </button>
    </div>
  </div>
</template>

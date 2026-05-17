<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'reset'])

const statuses = [
  { label: '全部状态', value: '' },
  { label: '已完结', value: '1' },
  { label: '连载中', value: '0' },
]

const wordCounts = [
  { label: '全部字数', value: '' },
  { label: '30 万字内', value: '0-300000' },
  { label: '30-80 万字', value: '300000-800000' },
  { label: '80 万字以上', value: '800000-' },
]

const ratings = [
  { label: '全部评分', value: '' },
  { label: '8 分以上', value: '8' },
  { label: '9 分以上', value: '9' },
]

const sorts = [
  { label: '默认排序', value: 'default' },
  { label: '最近更新', value: 'updated_at' },
  { label: '字数最多', value: 'word_count' },
  { label: '人气最高', value: 'views' },
]

function update(key, value) {
  const next = { ...props.modelValue, [key]: value }
  if (key === 'wordCount') {
    const [min, max] = value.split('-')
    next.wordCountMin = min || ''
    next.wordCountMax = max || ''
  }
  emit('update:modelValue', next)
}
</script>

<template>
  <section class="rounded-2xl bg-cream-100 dark:bg-night-800 p-3">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <select
        :value="modelValue.hasFinished || ''"
        class="h-9 rounded-xl bg-cream-50 dark:bg-night-900 px-3 text-xs outline-none border border-cream-200 dark:border-night-700"
        @change="update('hasFinished', $event.target.value)"
      >
        <option v-for="item in statuses" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>

      <select
        :value="modelValue.wordCount || ''"
        class="h-9 rounded-xl bg-cream-50 dark:bg-night-900 px-3 text-xs outline-none border border-cream-200 dark:border-night-700"
        @change="update('wordCount', $event.target.value)"
      >
        <option v-for="item in wordCounts" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>

      <select
        :value="modelValue.ratingMin || ''"
        class="h-9 rounded-xl bg-cream-50 dark:bg-night-900 px-3 text-xs outline-none border border-cream-200 dark:border-night-700"
        @change="update('ratingMin', $event.target.value)"
      >
        <option v-for="item in ratings" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>

      <select
        :value="modelValue.sortBy || 'default'"
        class="h-9 rounded-xl bg-cream-50 dark:bg-night-900 px-3 text-xs outline-none border border-cream-200 dark:border-night-700"
        @change="update('sortBy', $event.target.value)"
      >
        <option v-for="item in sorts" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
    </div>

    <button
      type="button"
      class="mt-2 text-xs text-ink-500 dark:text-ink-300 hover:text-clay-700 dark:hover:text-clay-400"
      @click="emit('reset')"
    >
      重置筛选
    </button>
  </section>
</template>

<script setup>
/**
 * 阅读口味标签选择器
 *
 * Props:
 *   - modelValue: 当前已选标签数组
 *   - max: 最多可选数量，默认 5
 *   - tags: 候选标签集合，默认沿用 onboarding 的 10 个
 *
 * Emits:
 *   - update:modelValue: 选择变化时触发
 */
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 5 },
  tags: {
    type: Array,
    default: () => ['古风穿越', '都市言情', '悬疑推理', '治愈系', '奇幻冒险', '校园青春', '职场成长', '甜宠', '慢热', '强剧情']
  }
})

const emit = defineEmits(['update:modelValue'])

const selected = computed(() => Array.isArray(props.modelValue) ? props.modelValue : [])

const isSelected = (tag) => selected.value.includes(tag)

const reachedMax = computed(() => selected.value.length >= props.max)

const isDisabled = (tag) => !isSelected(tag) && reachedMax.value

const toggle = (tag) => {
  if (isSelected(tag)) {
    emit('update:modelValue', selected.value.filter(item => item !== tag))
  } else {
    if (reachedMax.value) return
    emit('update:modelValue', [...selected.value, tag])
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tag in tags"
        :key="tag"
        type="button"
        :class="[
          'px-4 h-10 rounded-full text-sm font-medium transition select-none',
          isSelected(tag)
            ? 'bg-clay-700 dark:bg-clay-500 text-cream-50 shadow-sm'
            : isDisabled(tag)
              ? 'bg-cream-100 dark:bg-night-800 text-ink-500 dark:text-ink-300 opacity-50 cursor-not-allowed'
              : 'bg-cream-100 dark:bg-night-800 hover:bg-cream-200 dark:hover:bg-night-700 text-ink-700 dark:text-cream-200'
        ]"
        :disabled="isDisabled(tag)"
        :aria-pressed="isSelected(tag)"
        @click="toggle(tag)"
      >
        {{ tag }}
      </button>
    </div>
    <p class="text-xs text-ink-500 dark:text-ink-300">
      已选 {{ selected.length }} / {{ max }}
      <span v-if="reachedMax" class="ml-1 text-clay-700 dark:text-clay-400">已达上限</span>
    </p>
  </div>
</template>

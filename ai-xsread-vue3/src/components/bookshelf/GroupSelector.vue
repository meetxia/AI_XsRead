<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  groups: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <select
    :value="modelValue"
    class="h-9 rounded-full bg-cream-100 dark:bg-night-800 px-3 text-xs outline-none border border-transparent focus:border-clay-500"
    @change="emit('update:modelValue', $event.target.value)"
  >
    <option value="">全部分组</option>
    <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
  </select>
</template>

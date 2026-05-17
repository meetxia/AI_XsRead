<script setup>
import Icon from '@/components/v2/icons/Icon.vue'

defineProps({
  size: { type: String, default: 'w-3 h-3' },
  count: { type: Number, default: 5 },
  rating: { type: [Number, String], default: 0 },
})
</script>

<template>
  <span class="flex gap-0.5 text-clay-500 dark:text-clay-400">
    <Icon v-for="i in count" :key="i" name="starFill" :class="size" />
  </span>
</template>

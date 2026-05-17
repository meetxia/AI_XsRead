<script setup>
import { useTheme } from '@/composables/useTheme'
import Icon from '@/components/v2/icons/Icon.vue'

const { toggleMode } = useTheme()

defineProps({
  size: { type: String, default: 'w-10 h-10' },
})
</script>

<template>
  <button
    :class="[size, 'grid place-items-center rounded-full hover:bg-cream-100 dark:hover:bg-night-800 transition-colors']"
    aria-label="切换主题"
    @click="toggleMode"
  >
    <Icon name="moon" class="w-5 h-5 dark:hidden" />
    <Icon name="sun" class="w-5 h-5 hidden dark:inline-block" />
  </button>
</template>

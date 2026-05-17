<script setup>
defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
})

const emit = defineEmits(['update:active'])
</script>

<template>
  <div class="flex gap-1 bg-cream-100 dark:bg-night-800 p-1 rounded-full overflow-x-auto no-scrollbar">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      :class="[
        'shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition',
        active === tab.key ? 'bg-clay-700 text-cream-50 dark:bg-clay-500' : 'hover:bg-cream-200 dark:hover:bg-night-700'
      ]"
      @click="emit('update:active', tab.key)"
    >
      {{ tab.label }} <span class="ml-1 opacity-75 text-xs">{{ tab.count }}</span>
    </button>
  </div>
</template>

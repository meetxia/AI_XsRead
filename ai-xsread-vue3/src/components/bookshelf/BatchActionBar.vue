<script setup>
const props = defineProps({
  count: { type: Number, default: 0 },
  groups: { type: Array, default: () => [] },
})

const emit = defineEmits(['delete', 'top', 'untop', 'group'])
</script>

<template>
  <div class="fixed left-0 right-0 bottom-16 z-40 px-4 pb-safe">
    <div class="max-w-screen-sm mx-auto rounded-2xl bg-night-900 text-cream-50 shadow-cream-lg px-3 py-3 flex items-center gap-2">
      <span class="text-xs shrink-0">已选 {{ count }} 本</span>
      <select
        class="min-w-0 flex-1 h-9 rounded-xl bg-cream-50/10 px-2 text-xs outline-none"
        @change="$event.target.value && emit('group', $event.target.value)"
      >
        <option value="">移动分组</option>
        <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
        <option value="默认">默认</option>
      </select>
      <button class="px-2 h-9 rounded-xl bg-cream-50/10 text-xs" @click="emit('top')">置顶</button>
      <button class="px-2 h-9 rounded-xl bg-cream-50/10 text-xs" @click="emit('untop')">取消</button>
      <button class="px-2 h-9 rounded-xl bg-cinnabar-500 text-xs" @click="emit('delete')">删除</button>
    </div>
  </div>
</template>

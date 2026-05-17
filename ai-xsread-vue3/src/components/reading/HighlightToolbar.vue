<template>
  <div v-if="visible" class="highlight-toolbar" :style="{ left: `${x}px`, top: `${y}px` }">
    <button @click="$emit('highlight', 'yellow')">黄色</button>
    <button @click="$emit('highlight', 'green')">绿色</button>
    <button @click="$emit('note')">想法</button>
    <button @click="$emit('close')">关闭</button>
  </div>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
})

defineEmits(['highlight', 'note', 'close'])
</script>

<style scoped>
.highlight-toolbar {
  position: fixed;
  z-index: 45;
  display: flex;
  gap: 0.35rem;
  max-width: calc(100vw - 1rem);
  padding: 0.35rem;
  border-radius: 0.65rem;
  background: rgba(41, 37, 36, 0.95);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  transform: translate(-50%, -100%);
}

.highlight-toolbar button {
  min-width: 2.25rem;
  min-height: 2rem;
  padding: 0 0.45rem;
  border-radius: 0.45rem;
  color: #fffaf5;
  font-size: 0.75rem;
  white-space: nowrap;
}

.highlight-toolbar button:hover {
  background: rgba(255, 255, 255, 0.14);
}
</style>

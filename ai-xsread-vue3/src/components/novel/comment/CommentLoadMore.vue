<template>
  <div class="load-more-wrapper">
    <button @click="$emit('load-more')" class="load-more-btn">加载更多评论</button>
  </div>
</template>

<script setup>
defineEmits(['load-more'])
</script>

<style scoped>
.load-more-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.load-more-btn {
  padding: 0.625rem 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover {
  color: #d95468;
  border-color: #d95468;
  background: rgba(217, 84, 104, 0.05);
}
</style>

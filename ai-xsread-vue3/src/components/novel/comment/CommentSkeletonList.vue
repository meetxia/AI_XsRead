<template>
  <div class="comment-list">
    <div v-for="i in 3" :key="i" class="comment-skeleton">
      <div class="skeleton-header">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-info">
          <div class="skeleton-name"></div>
          <div class="skeleton-time"></div>
        </div>
      </div>
      <div class="skeleton-content"></div>
    </div>
  </div>
</template>

<style scoped>
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comment-skeleton {
  padding: 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.skeleton-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-bg-hover);
  border-radius: 50%;
}

.skeleton-info {
  flex: 1;
}

.skeleton-name {
  width: 6rem;
  height: 1rem;
  background: var(--color-bg-hover);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.skeleton-time {
  width: 8rem;
  height: 0.75rem;
  background: var(--color-bg-hover);
  border-radius: 0.25rem;
}

.skeleton-content {
  width: 100%;
  height: 4rem;
  background: var(--color-bg-hover);
  border-radius: 0.25rem;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>

<template>
  <div class="empty-state">
    <div class="empty-icon">
      <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </div>
    <p class="empty-text">暂无评论，快来发表第一条评论吧~</p>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 5rem 0;
  text-align: center;
}

.empty-icon {
  margin-bottom: 1rem;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.empty-icon svg {
  margin: 0 auto;
}

.empty-text {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .empty-state {
    padding: 3rem 0;
  }

  .empty-icon svg {
    width: 4rem;
    height: 4rem;
  }

  .empty-text {
    font-size: 0.875rem;
  }
}
</style>

<template>
  <Transition name="fade">
    <div v-if="visible" class="bookmark-overlay" @click="$emit('close')"></div>
  </Transition>

  <Transition name="slide-up">
    <section v-if="visible" class="bookmark-sheet" aria-label="我的书签">
      <div class="sheet-handle"></div>
      <header class="sheet-header">
        <div>
          <p class="sheet-kicker">当前小说</p>
          <h2>我的书签</h2>
        </div>
        <button class="icon-btn" aria-label="关闭书签列表" @click="$emit('close')">×</button>
      </header>

      <div v-if="loading" class="sheet-state">正在加载书签...</div>
      <div v-else-if="!bookmarks.length" class="sheet-state">还没有书签，短按底栏书签可保存当前位置。</div>

      <div v-else class="bookmark-list">
        <article v-for="item in bookmarks" :key="item.id || `${item.chapter_id}-${item.paragraph_index}`" class="bookmark-item">
          <button class="bookmark-main" @click="$emit('select', item)">
            <strong>{{ item.chapterTitle || item.chapter_title || item.chapterName || '章节位置' }}</strong>
            <span>{{ item.preview || item.note || item.contentPreview || '点击回到这个段落' }}</span>
            <time>{{ formatTime(item.createdAt || item.created_at) }}</time>
          </button>
          <button class="delete-btn" aria-label="删除书签" @click="$emit('delete', item)">删除</button>
        </article>
      </div>
    </section>
  </Transition>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  bookmarks: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

defineEmits(['close', 'select', 'delete'])

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.bookmark-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.45);
}

.bookmark-sheet {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 41;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  padding: 0 1rem calc(1rem + env(safe-area-inset-bottom));
  background: var(--color-bg-card, #fffaf5);
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -12px 32px rgba(31, 23, 18, 0.18);
}

.sheet-handle {
  width: 2.5rem;
  height: 0.25rem;
  margin: 0.75rem auto 0.5rem;
  border-radius: 999px;
  background: rgba(120, 113, 108, 0.35);
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0 1rem;
  border-bottom: 1px solid rgba(120, 113, 108, 0.18);
}

.sheet-kicker {
  margin: 0 0 0.15rem;
  font-size: 0.72rem;
  color: var(--color-text-muted, #78716c);
}

.sheet-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.icon-btn,
.delete-btn {
  min-width: 2rem;
  min-height: 2rem;
  border-radius: 0.5rem;
}

.icon-btn {
  font-size: 1.5rem;
  color: var(--color-text-secondary, #57534e);
}

.sheet-state {
  padding: 2rem 0.5rem;
  text-align: center;
  color: var(--color-text-muted, #78716c);
}

.bookmark-list {
  overflow-y: auto;
  padding: 0.75rem 0 0;
}

.bookmark-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(120, 113, 108, 0.14);
}

.bookmark-main {
  min-width: 0;
  text-align: left;
}

.bookmark-main strong,
.bookmark-main span,
.bookmark-main time {
  display: block;
}

.bookmark-main strong {
  font-size: 0.95rem;
}

.bookmark-main span {
  overflow: hidden;
  margin-top: 0.25rem;
  color: var(--color-text-secondary, #57534e);
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-main time {
  margin-top: 0.25rem;
  color: var(--color-text-muted, #78716c);
  font-size: 0.72rem;
}

.delete-btn {
  padding: 0 0.65rem;
  color: #b45309;
  background: rgba(251, 191, 36, 0.15);
  font-size: 0.78rem;
}

.fade-enter-active,
.fade-leave-active,
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>

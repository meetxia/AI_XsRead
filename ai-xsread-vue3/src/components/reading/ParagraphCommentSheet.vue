<template>
  <Transition name="fade">
    <div v-if="visible" class="comment-overlay" @click="$emit('close')"></div>
  </Transition>

  <Transition name="slide-up">
    <section v-if="visible" class="comment-sheet" aria-label="段评">
      <header>
        <div>
          <p>段落 {{ paragraphIndex + 1 }}</p>
          <h2>段评</h2>
        </div>
        <button aria-label="关闭段评" @click="$emit('close')">×</button>
      </header>

      <p class="anchor-preview">{{ preview }}</p>

      <div class="comment-list">
        <p v-if="loading" class="state">正在加载段评...</p>
        <p v-else-if="!comments.length" class="state">还没有段评，写下第一条吧。</p>
        <article v-for="item in comments" :key="item.id" class="comment-item">
          <strong>{{ item.nickname || item.username || '读者' }}</strong>
          <span>{{ item.content }}</span>
        </article>
      </div>

      <form class="comment-form" @submit.prevent="$emit('submit', draft)">
        <input v-model="draft" maxlength="500" placeholder="写一条段评..." />
        <button :disabled="!draft.trim() || draft.length > 500">发送</button>
      </form>
    </section>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  comments: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  paragraphIndex: { type: Number, default: 0 },
  preview: { type: String, default: '' },
})

defineEmits(['close', 'submit'])

const draft = ref('')

watch(() => props.visible, (visible) => {
  if (!visible) draft.value = ''
})
</script>

<style scoped>
.comment-overlay {
  position: fixed;
  inset: 0;
  z-index: 42;
  background: rgba(0, 0, 0, 0.42);
}

.comment-sheet {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 43;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
  border-radius: 1.25rem 1.25rem 0 0;
  background: var(--color-bg-card, #fffaf5);
}

.comment-sheet header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.comment-sheet header p,
.anchor-preview,
.state {
  color: var(--color-text-muted, #78716c);
}

.comment-sheet h2,
.comment-sheet p {
  margin: 0;
}

.comment-sheet header button {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  font-size: 1.4rem;
}

.anchor-preview {
  margin-top: 0.75rem;
  padding: 0.65rem;
  border-radius: 0.65rem;
  background: rgba(120, 113, 108, 0.1);
  font-size: 0.82rem;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  margin-top: 0.75rem;
}

.comment-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(120, 113, 108, 0.15);
}

.comment-item strong,
.comment-item span {
  display: block;
}

.comment-item span {
  margin-top: 0.25rem;
  font-size: 0.88rem;
}

.comment-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.comment-form input {
  min-height: 2.5rem;
  min-width: 0;
  padding: 0 0.75rem;
  border: 1px solid rgba(120, 113, 108, 0.28);
  border-radius: 0.65rem;
  background: transparent;
}

.comment-form button {
  min-width: 4rem;
  min-height: 2.5rem;
  border-radius: 0.65rem;
  background: #292524;
  color: #fffaf5;
}

.comment-form button:disabled {
  opacity: 0.4;
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

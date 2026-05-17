<script setup>
/**
 * Feature: wechat-jjwxc-parity-upgrade
 * Task 25.1 — NoteSheet.vue 想法 bottomsheet 组件
 *
 * Acceptance:
 * - 原文预览最多 4 行，浅黄高亮，超出省略
 * - ≥ 4 行 textarea，placeholder "写下你的想法..."
 * - 右下角实时显示 "已输入 N / 500"，N > 500 时禁用保存
 * - 底部"取消 / 保存"，保存时 emit submit({ note })
 * - 360px 移动端抽屉占据 70% 屏幕高度
 */
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  originText: { type: String, default: '' },
  initialNote: { type: String, default: '' },
  existingHighlightId: { type: [Number, String, null], default: null },
})

const emit = defineEmits(['close', 'submit'])

const MAX_NOTE_LENGTH = 500
const note = ref('')
const textareaRef = ref(null)

const trimmedLength = computed(() => note.value.length)
const isOverLimit = computed(() => trimmedLength.value > MAX_NOTE_LENGTH)
const canSubmit = computed(() => !isOverLimit.value)
const counterClass = computed(() => (isOverLimit.value ? 'text-cinnabar-500' : 'text-ink-500 dark:text-ink-300'))

watch(
  () => [props.visible, props.initialNote],
  ([nextVisible]) => {
    if (nextVisible) {
      note.value = props.initialNote || ''
      nextTick(() => {
        if (textareaRef.value && typeof textareaRef.value.focus === 'function') {
          textareaRef.value.focus()
        }
      })
    }
  },
  { immediate: true }
)

function handleClose() {
  emit('close')
}

function handleSubmit() {
  if (!canSubmit.value) return
  emit('submit', { note: note.value })
}

function handleOverlayClick() {
  emit('close')
}
</script>

<template>
  <Transition name="note-fade">
    <div v-if="visible" class="note-overlay" data-testid="note-overlay" @click="handleOverlayClick"></div>
  </Transition>

  <Transition name="note-slide">
    <section
      v-if="visible"
      class="note-sheet bg-cream-50 dark:bg-night-900 text-ink-900 dark:text-cream-100"
      role="dialog"
      aria-modal="true"
      aria-label="写下你的想法"
      data-testid="note-sheet"
      @click.stop
    >
      <div class="note-sheet__handle"></div>

      <header class="flex items-center justify-between px-4 pb-3 border-b border-cream-200 dark:border-night-700">
        <div>
          <p class="text-[11px] uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400 font-medium">Note</p>
          <h2 class="font-serif text-base sm:text-lg font-semibold mt-0.5">写下你的想法</h2>
        </div>
        <button
          type="button"
          class="w-9 h-9 grid place-items-center rounded-full text-ink-500 hover:bg-cream-100 dark:hover:bg-night-800"
          aria-label="关闭"
          data-testid="note-close"
          @click="handleClose"
        >×</button>
      </header>

      <div class="px-4 pt-3">
        <p class="text-[11px] uppercase tracking-[0.18em] text-clay-500 dark:text-clay-400 mb-1.5">原文</p>
        <blockquote
          class="origin-text rounded-xl px-3 py-2.5 text-sm leading-relaxed font-serif text-ink-700 dark:text-ink-200"
          data-testid="note-origin"
        >{{ originText || '（无选中原文）' }}</blockquote>
      </div>

      <div class="px-4 pt-3 pb-2 flex-1 min-h-0 flex flex-col">
        <textarea
          ref="textareaRef"
          v-model="note"
          rows="5"
          class="note-textarea bg-cream-100 dark:bg-night-800 text-ink-900 dark:text-cream-100 placeholder-ink-400 dark:placeholder-ink-300/60"
          placeholder="写下你的想法..."
          aria-label="想法内容"
          data-testid="note-textarea"
        ></textarea>
        <div class="flex items-center justify-end mt-2 text-xs" :class="counterClass" data-testid="note-counter">
          已输入 {{ trimmedLength }} / {{ MAX_NOTE_LENGTH }}
        </div>
      </div>

      <footer class="px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center gap-3 border-t border-cream-200 dark:border-night-700">
        <button
          type="button"
          class="flex-1 h-11 rounded-full text-sm font-medium bg-cream-100 dark:bg-night-800 text-ink-700 dark:text-cream-100 hover:bg-cream-200 dark:hover:bg-night-700 transition"
          data-testid="note-cancel"
          @click="handleClose"
        >取消</button>
        <button
          type="button"
          class="flex-1 h-11 rounded-full text-sm font-semibold bg-clay-700 dark:bg-clay-500 text-cream-50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-clay-600 transition shadow-cream"
          :disabled="!canSubmit"
          data-testid="note-submit"
          @click="handleSubmit"
        >保存</button>
      </footer>
    </section>
  </Transition>
</template>

<style scoped>
.note-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.45);
}

.note-sheet {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 61;
  display: flex;
  flex-direction: column;
  height: 70vh;
  max-height: 70vh;
  border-radius: 1.25rem 1.25rem 0 0;
  box-shadow: 0 -16px 36px rgba(31, 23, 18, 0.22);
  overflow: hidden;
}

.note-sheet__handle {
  width: 2.5rem;
  height: 0.25rem;
  margin: 0.75rem auto 0.5rem;
  border-radius: 999px;
  background: rgba(120, 113, 108, 0.35);
  flex-shrink: 0;
}

.origin-text {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  background: rgba(250, 220, 130, 0.22);
  border-left: 3px solid rgba(200, 140, 40, 0.55);
  word-break: break-word;
}

:global(.dark) .origin-text {
  background: rgba(250, 220, 130, 0.14);
  border-left-color: rgba(255, 200, 100, 0.45);
}

.note-textarea {
  width: 100%;
  min-height: 8rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid transparent;
  border-radius: 0.85rem;
  resize: none;
  font-size: 0.95rem;
  line-height: 1.6;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.note-textarea:focus {
  border-color: rgba(200, 140, 40, 0.55);
  box-shadow: 0 0 0 3px rgba(200, 140, 40, 0.18);
}

.note-fade-enter-active,
.note-fade-leave-active,
.note-slide-enter-active,
.note-slide-leave-active {
  transition: all 0.22s ease;
}

.note-fade-enter-from,
.note-fade-leave-to {
  opacity: 0;
}

.note-slide-enter-from,
.note-slide-leave-to {
  transform: translateY(100%);
}

@media (max-width: 360px) {
  .note-sheet {
    height: 70vh;
  }
}
</style>

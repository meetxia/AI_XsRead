<template>
  <div class="comment-input-section">
    <textarea
      :value="modelValue"
      placeholder="说说你的看法..."
      rows="4"
      class="comment-textarea"
      :disabled="submitting"
      @input="$emit('update:modelValue', $event.target.value)"
    ></textarea>

    <div class="comment-input-footer">
      <div class="comment-tools">
        <div class="tool-item">
          <button @click="$emit('toggle-emoji')" class="tool-btn" title="表情">
            😊
          </button>

          <div v-show="showEmojiPicker" class="emoji-picker" @click.stop>
            <div class="emoji-grid">
              <button
                v-for="emoji in emojiList"
                :key="emoji"
                @click="$emit('insert-emoji', emoji)"
                class="emoji-item"
              >
                {{ emoji }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="comment-submit-area">
        <span class="char-count">{{ modelValue.length }}/500</span>
        <button
          @click="$emit('submit')"
          :disabled="!modelValue.trim() || submitting || modelValue.length > 500"
          class="submit-btn"
        >
          {{ submitting ? '发表中...' : '发表评论' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  submitting: {
    type: Boolean,
    default: false
  },
  showEmojiPicker: {
    type: Boolean,
    default: false
  },
  emojiList: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:modelValue', 'toggle-emoji', 'insert-emoji', 'submit'])
</script>

<style scoped>
.comment-input-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}

.comment-textarea {
  width: 100%;
  padding: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  resize: none;
  outline: none;
}

.comment-textarea::placeholder {
  color: var(--color-text-muted);
}

.comment-input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.comment-tools {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tool-item {
  position: relative;
}

.tool-btn {
  padding: 0.375rem 0.5rem;
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.tool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.emoji-picker {
  position: absolute;
  bottom: 3rem;
  left: 0;
  z-index: 50;
  width: 16rem;
  padding: 0.75rem;
  background: white;
  border: 2px solid rgba(217, 84, 104, 0.2);
  border-radius: 0.5rem;
  box-shadow: 0 4px 16px rgba(217, 84, 104, 0.15);
  max-height: 12.5rem;
  overflow-y: auto;
}

.dark .emoji-picker {
  background: #2d2d2d;
  border-color: rgba(217, 84, 104, 0.3);
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.25rem;
}

.emoji-item {
  padding: 0.25rem;
  font-size: 1.5rem;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-item:hover {
  background: var(--color-bg-hover);
}

.comment-submit-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.char-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.submit-btn {
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #d95468 0%, #ed7654 100%);
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c74458 0%, #dc6544 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(217, 84, 104, 0.3);
}

.submit-btn:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .comment-input-section {
    padding: 1rem;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 250, 0.98) 100%);
    border: 2px solid rgba(217, 84, 104, 0.15);
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(217, 84, 104, 0.1);
  }

  .comment-textarea {
    font-size: 0.9375rem;
    min-height: 120px;
    padding: 0.75rem;
    line-height: 1.6;
  }

  .tool-btn {
    font-size: 1.25rem;
    padding: 0.5rem;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .tool-btn:active {
    background: rgba(217, 84, 104, 0.1);
    transform: scale(0.95);
  }

  .submit-btn {
    padding: 0.625rem 1.5rem;
    font-size: 0.9375rem;
    min-height: 44px;
    border-radius: 12px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .char-count {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .comment-input-footer {
    margin-top: 1rem;
    padding-top: 1rem;
  }

  .comment-tools {
    gap: 0.75rem;
  }
}
</style>

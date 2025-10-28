<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div
        v-show="show"
        class="keyboard-help-overlay"
        @click="handleClose"
      >
        <div
          class="keyboard-help-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyboard-help-title"
          @click.stop
        >
          <div class="panel-header">
            <h3 id="keyboard-help-title" class="panel-title">
              ⌨️ 键盘快捷键
            </h3>
            <button
              class="btn-close"
              aria-label="关闭"
              @click="handleClose"
            >
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>
          
          <div class="shortcuts-list">
            <!-- 全局快捷键 -->
            <div class="shortcuts-section">
              <h4 class="section-title">全局</h4>
              <div
                v-for="shortcut in globalShortcuts"
                :key="shortcut.key"
                class="shortcut-item"
              >
                <kbd class="kbd">{{ shortcut.key }}</kbd>
                <span class="shortcut-desc">{{ shortcut.description }}</span>
              </div>
            </div>
            
            <!-- 阅读页快捷键 -->
            <div class="shortcuts-section">
              <h4 class="section-title">阅读页</h4>
              <div
                v-for="shortcut in readingShortcuts"
                :key="shortcut.key"
                class="shortcut-item"
              >
                <kbd class="kbd">{{ shortcut.key }}</kbd>
                <span class="shortcut-desc">{{ shortcut.description }}</span>
              </div>
            </div>
            
            <!-- 导航快捷键 -->
            <div class="shortcuts-section">
              <h4 class="section-title">导航</h4>
              <div
                v-for="shortcut in navigationShortcuts"
                :key="shortcut.key"
                class="shortcut-item"
              >
                <kbd class="kbd">{{ shortcut.key }}</kbd>
                <span class="shortcut-desc">{{ shortcut.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show'])

// 全局快捷键
const globalShortcuts = [
  { key: '?', description: '显示/隐藏快捷键帮助' },
  { key: '/', description: '聚焦搜索框' },
  { key: 'Esc', description: '关闭弹窗/退出全屏' }
]

// 阅读页快捷键
const readingShortcuts = [
  { key: '← / →', description: '上一章/下一章' },
  { key: 'Space', description: '向下滚动' },
  { key: 'Shift + Space', description: '向上滚动' },
  { key: 'F', description: '全屏阅读' },
  { key: 'S', description: '打开设置' },
  { key: 'M', description: '显示/隐藏目录' },
  { key: 'D', description: '切换日/夜间模式' }
]

// 导航快捷键
const navigationShortcuts = [
  { key: 'H', description: '返回首页' },
  { key: 'B', description: '打开书架' },
  { key: 'R', description: '打开推荐' },
  { key: 'P', description: '个人中心' }
]

function handleClose() {
  emit('update:show', false)
}
</script>

<style scoped>
.keyboard-help-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.keyboard-help-panel {
  background: var(--color-bg-elevated, #ffffff);
  border-radius: 16px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}

.panel-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: var(--color-bg-hover, #f3f4f6);
  color: var(--color-text-primary);
}

.btn-close svg {
  width: 100%;
  height: 100%;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.shortcuts-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.5rem;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: var(--color-bg-base, #fafafa);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.shortcut-item:hover {
  background: var(--color-bg-hover, #f3f4f6);
}

.kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 0.375rem 0.625rem;
  background: white;
  border: 1px solid var(--color-border, #e5e7eb);
  border-bottom-width: 2px;
  border-radius: 6px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.shortcut-desc {
  flex: 1;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

/* 模态框淡入动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .keyboard-help-panel,
.modal-fade-leave-active .keyboard-help-panel {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .keyboard-help-panel,
.modal-fade-leave-to .keyboard-help-panel {
  transform: scale(0.95);
}

/* 移动端适配 */
@media (max-width: 640px) {
  .keyboard-help-overlay {
    padding: 1rem;
  }
  
  .keyboard-help-panel {
    padding: 1.5rem;
    max-height: 90vh;
  }
  
  .panel-title {
    font-size: 1.25rem;
  }
  
  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>


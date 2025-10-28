<template>
  <teleport to="body">
    <transition-group name="notification-list" tag="div" class="notification-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div class="notification-icon">
          <span v-if="notification.icon">{{ notification.icon }}</span>
          <svg v-else-if="notification.type === 'success'" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <svg v-else-if="notification.type === 'error'" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <svg v-else fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
        </div>
        
        <div class="notification-content">
          <div v-if="notification.title" class="notification-title">
            {{ notification.title }}
          </div>
          <div class="notification-message">
            {{ notification.message }}
          </div>
          <div v-if="notification.description" class="notification-description">
            {{ notification.description }}
          </div>
        </div>
        
        <div v-if="notification.actions" class="notification-actions">
          <button
            v-for="action in notification.actions"
            :key="action.text"
            class="notification-action-btn"
            @click="handleAction(notification, action)"
          >
            {{ action.text }}
          </button>
        </div>
        
        <button
          class="notification-close"
          aria-label="关闭通知"
          @click="removeNotification(notification.id)"
        >
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    </transition-group>
  </teleport>
</template>

<script setup>
import { ref } from 'vue'

const notifications = ref([])
let notificationId = 0

// 添加通知
function addNotification(options) {
  const {
    type = 'info',
    title = '',
    message = '',
    description = '',
    icon = '',
    duration = 5000,
    actions = null,
    onClose = null
  } = options
  
  const id = ++notificationId
  
  notifications.value.push({
    id,
    type,
    title,
    message,
    description,
    icon,
    actions,
    onClose
  })
  
  // 自动移除
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }
  
  return id
}

// 移除通知
function removeNotification(id) {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    const notification = notifications.value[index]
    if (notification.onClose) {
      notification.onClose()
    }
    notifications.value.splice(index, 1)
  }
}

// 处理操作按钮点击
function handleAction(notification, action) {
  if (action.onClick) {
    action.onClick()
  }
  removeNotification(notification.id)
}

// 清除所有通知
function clearAll() {
  notifications.value = []
}

defineExpose({
  addNotification,
  removeNotification,
  clearAll
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-elevated, #ffffff);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  pointer-events: auto;
}

.notification-success {
  border-left: 4px solid #10b981;
}

.notification-error {
  border-left: 4px solid #ef4444;
}

.notification-warning {
  border-left: 4px solid #f59e0b;
}

.notification-info {
  border-left: 4px solid #3b82f6;
}

.notification-achievement {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-left: none;
}

.notification-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.notification-icon svg {
  width: 100%;
  height: 100%;
}

.notification-success .notification-icon {
  color: #10b981;
}

.notification-error .notification-icon {
  color: #ef4444;
}

.notification-warning .notification-icon {
  color: #f59e0b;
}

.notification-info .notification-icon {
  color: #3b82f6;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.notification-message {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.notification-description {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 0.5rem;
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.notification-action-btn {
  padding: 0.375rem 0.875rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-action-btn:hover {
  background: var(--color-primary-dark);
  transform: scale(1.05);
}

.notification-close {
  width: 24px;
  height: 24px;
  padding: 0;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.notification-close:hover {
  color: var(--color-text-primary);
}

.notification-close svg {
  width: 100%;
  height: 100%;
}

/* 列表动画 */
.notification-list-enter-active {
  animation: slideInRight 0.3s ease;
}

.notification-list-leave-active {
  animation: slideOutRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .notification-container {
    left: 10px;
    right: 10px;
    max-width: none;
  }
  
  .notification {
    padding: 0.875rem 1rem;
  }
}
</style>


<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">编辑资料</h3>
            <button class="close-btn" @click="handleClose">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <!-- 昵称 -->
              <div class="form-group">
                <label class="form-label">昵称</label>
                <input
                  v-model="formData.nickname"
                  type="text"
                  class="form-input"
                  placeholder="请输入昵称"
                  maxlength="20"
                />
              </div>

              <!-- 性别 -->
              <div class="form-group">
                <label class="form-label">性别</label>
                <div class="gender-options">
                  <label class="gender-option" :class="{ active: formData.gender === 0 }">
                    <input type="radio" v-model.number="formData.gender" :value="0" />
                    <span>保密</span>
                  </label>
                  <label class="gender-option" :class="{ active: formData.gender === 1 }">
                    <input type="radio" v-model.number="formData.gender" :value="1" />
                    <span>女</span>
                  </label>
                  <label class="gender-option" :class="{ active: formData.gender === 2 }">
                    <input type="radio" v-model.number="formData.gender" :value="2" />
                    <span>男</span>
                  </label>
                </div>
              </div>

              <!-- 生日 -->
              <div class="form-group">
                <label class="form-label">生日</label>
                <input
                  v-model="formData.birthday"
                  type="date"
                  class="form-input"
                />
              </div>

              <!-- 个人简介 -->
              <div class="form-group">
                <label class="form-label">个人简介</label>
                <textarea
                  v-model="formData.bio"
                  class="form-textarea"
                  placeholder="介绍一下自己吧~"
                  rows="4"
                  maxlength="200"
                ></textarea>
                <div class="char-count">{{ formData.bio?.length || 0 }}/200</div>
              </div>

              <!-- 错误提示 -->
              <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
              </div>

              <!-- 按钮组 -->
              <div class="button-group">
                <button type="button" class="btn btn-cancel" @click="handleClose" :disabled="loading">
                  取消
                </button>
                <button type="submit" class="btn btn-submit" :disabled="loading">
                  <span v-if="loading" class="loading-spinner"></span>
                  <span>{{ loading ? '保存中...' : '保存' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  userInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'success'])

const userStore = useUserStore()

// 表单数据
const formData = ref({
  nickname: '',
  gender: 0,
  birthday: '',
  bio: ''
})

// 加载状态
const loading = ref(false)

// 错误信息
const errorMessage = ref('')

// 监听用户信息变化，初始化表单
watch(() => props.userInfo, (newVal) => {
  if (newVal) {
    formData.value = {
      nickname: newVal.nickname || '',
      gender: newVal.gender ?? 0,
      birthday: newVal.birthday || '',
      bio: newVal.bio || ''
    }
  }
}, { immediate: true })

// 关闭弹窗
const handleClose = () => {
  if (!loading.value) {
    emit('update:visible', false)
    errorMessage.value = ''
  }
}

// 点击遮罩层关闭
const handleOverlayClick = () => {
  handleClose()
}

// 提交表单
const handleSubmit = async () => {
  try {
    loading.value = true
    errorMessage.value = ''

    // 验证昵称
    if (formData.value.nickname && formData.value.nickname.trim().length === 0) {
      errorMessage.value = '昵称不能为空'
      return
    }

    // 调用更新接口
    await userStore.updateUserInfo({
      nickname: formData.value.nickname || undefined,
      gender: formData.value.gender,
      birthday: formData.value.birthday || undefined,
      bio: formData.value.bio || undefined
    })

    // 成功提示
    emit('success')
    handleClose()

  } catch (error) {
    console.error('更新失败:', error)
    errorMessage.value = error.message || '更新失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

/* 弹窗容器 */
.modal-container {
  background: var(--color-bg-card);
  border-radius: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

/* 弹窗头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* 弹窗主体 */
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

/* 表单组 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid rgba(217, 84, 104, 0.15);
  border-radius: 0.75rem;
  background-color: rgba(255, 186, 172, 0.05);
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  transition: all 0.3s ease;
  box-sizing: border-box;
  max-width: 100%;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: rgba(255, 186, 172, 0.08);
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.25rem;
}

/* 性别选项 */
.gender-options {
  display: flex;
  gap: 0.75rem;
}

.gender-option {
  flex: 1;
  padding: 0.75rem;
  border: 1.5px solid rgba(217, 84, 104, 0.15);
  border-radius: 0.75rem;
  background-color: rgba(255, 186, 172, 0.05);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.gender-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.gender-option span {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.gender-option:hover {
  border-color: var(--color-primary);
  background-color: rgba(255, 186, 172, 0.08);
}

.gender-option.active {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
}

.gender-option.active span {
  color: white;
}

/* 错误提示 */
.error-message {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 0.75rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border-radius: 0.875rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--color-border);
}

.btn-submit {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(217, 84, 104, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 弹窗动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}

/* 工具类 */
.w-6 {
  width: 1.5rem;
}

.h-6 {
  height: 1.5rem;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-container {
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.125rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .button-group {
    margin-top: 1.5rem;
  }
}
</style>


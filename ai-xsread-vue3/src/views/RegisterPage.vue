<template>
  <div class="register-page">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <!-- 注册表单 -->
    <div class="register-container">
      <div class="register-card">
        <!-- Logo和标题 -->
        <div class="register-header">
          <svg class="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
          <h1>注册文字之境账号</h1>
          <p>开启你的阅读之旅</p>
        </div>

        <!-- 注册表单 -->
        <form @submit.prevent="handleRegister" class="register-form">
          <!-- 用户名或邮箱 -->
          <div class="form-group">
            <label>用户名或邮箱 <span class="required">*</span></label>
            <input
              v-model="formData.identifier"
              type="text"
              placeholder="请输入用户名或邮箱地址"
              class="form-input"
              required
            />
            <p class="form-hint">用户名需3-20个字符，支持字母数字下划线</p>
            <p v-if="errors.identifier" class="error-message">{{ errors.identifier }}</p>
          </div>

          <!-- 密码 -->
          <div class="form-group">
            <label>密码 <span class="required">*</span></label>
            <div class="password-input">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="6-20个字符，建议包含字母和数字"
                class="form-input"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="toggle-password"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
              </button>
            </div>
            <!-- 密码强度 -->
            <div v-if="formData.password" class="password-strength">
              <div class="strength-bar">
                <div
                  :class="['strength-fill', passwordStrength.level]"
                  :style="{ width: passwordStrength.percent + '%' }"
                ></div>
              </div>
              <span :class="['strength-text', passwordStrength.level]">
                {{ passwordStrength.text }}
              </span>
            </div>
            <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
          </div>

          <!-- 用户协议 -->
          <div class="form-group">
            <label class="agreement">
              <input v-model="agreeTerms" type="checkbox" required />
              <span>
                我已阅读并同意
                <a href="/terms" target="_blank">《用户协议》</a>
                和
                <a href="/privacy" target="_blank">《隐私政策》</a>
              </span>
            </label>
            <p v-if="errors.agreement" class="error-message">{{ errors.agreement }}</p>
          </div>

          <!-- 注册按钮 */
          <button type="submit" :disabled="loading || !agreeTerms" class="register-btn">
            <span v-if="!loading">立即注册</span>
            <span v-else class="loading-text">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              注册中...
            </span>
          </button>

          <!-- 登录链接 -->
          <div class="login-link">
            已有账号？<router-link to="/login">立即登录</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/common/AppHeader.vue'

const router = useRouter()
const userStore = useUserStore()

// 表单数据
const formData = reactive({
  identifier: '', // 用户名或邮箱
  password: ''
})

// 错误信息
const errors = reactive({
  identifier: '',
  password: '',
  agreement: ''
})

// 状态
const loading = ref(false)
const showPassword = ref(false)
const agreeTerms = ref(false)

/**
 * 密码强度检测
 */
const passwordStrength = computed(() => {
  const pwd = formData.password
  if (!pwd) return { level: 'weak', percent: 0, text: '' }

  let score = 0
  
  // 长度
  if (pwd.length >= 6) score += 20
  if (pwd.length >= 10) score += 20
  
  // 包含小写字母
  if (/[a-z]/.test(pwd)) score += 20
  
  // 包含大写字母
  if (/[A-Z]/.test(pwd)) score += 20
  
  // 包含数字
  if (/\d/.test(pwd)) score += 10
  
  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 10

  if (score < 40) {
    return { level: 'weak', percent: score, text: '弱' }
  } else if (score < 70) {
    return { level: 'medium', percent: score, text: '中' }
  } else {
    return { level: 'strong', percent: score, text: '强' }
  }
})

/**
 * 判断输入的是用户名还是邮箱
 */
const isEmail = (str) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)
}

/**
 * 表单验证
 */
const validateForm = () => {
  errors.identifier = ''
  errors.password = ''
  errors.agreement = ''

  // 验证用户名或邮箱
  if (!formData.identifier) {
    errors.identifier = '请输入用户名或邮箱'
    return false
  }

  const identifier = formData.identifier.trim()
  
  // 如果是邮箱格式，验证邮箱
  if (isEmail(identifier)) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      errors.identifier = '请输入正确的邮箱格式'
      return false
    }
  } else {
    // 否则按用户名验证
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(identifier)) {
      errors.identifier = '用户名需3-20个字符，只能包含字母、数字和下划线'
      return false
    }
  }

  // 验证密码
  if (!formData.password) {
    errors.password = '请输入密码'
    return false
  }
  if (formData.password.length < 6 || formData.password.length > 20) {
    errors.password = '密码长度为6-20个字符'
    return false
  }

  // 验证协议
  if (!agreeTerms.value) {
    errors.agreement = '请阅读并同意用户协议和隐私政策'
    return false
  }

  return true
}

/**
 * 处理注册
 */
const handleRegister = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const identifier = formData.identifier.trim()
    
    // 构建注册数据，根据输入判断是用户名还是邮箱
    const registerData = {
      password: formData.password
    }

    if (isEmail(identifier)) {
      registerData.email = identifier
    } else {
      registerData.username = identifier
    }

    await userStore.register(registerData)

    // 注册成功，跳转到首页
    router.push('/')

  } catch (error) {
    console.error('注册失败:', error)
    if (error.field) {
      errors[error.field] = error.message
    } else {
      errors.identifier = error.message || '注册失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ===== 页面容器 - 禁用滚动，固定高度 ===== */
.register-page {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ===== 注册容器 - 居中对齐，对称边距 ===== */
.register-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow-y: auto;
}

/* ===== 注册卡片 - 优化阴影和圆角 ===== */
.register-card {
  width: 100%;
  max-width: 500px;
  background-color: var(--color-bg-card);
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(217, 84, 104, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  margin: auto;
  box-sizing: border-box;
}

/* ===== 头部 ===== */
.register-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.logo-icon {
  width: 3.5rem;
  height: 3.5rem;
  color: var(--color-primary);
  margin: 0 auto 1rem;
  filter: drop-shadow(0 2px 4px rgba(217, 84, 104, 0.15));
}

.register-header h1 {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
  letter-spacing: 0.02em;
}

.register-header p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  letter-spacing: 0.01em;
}

/* ===== 表单 ===== */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  padding-left: 0.25rem;
}

.required {
  color: #ef4444;
}

/* ===== 输入框 - 移除黑色边框，使用柔和样式，修复超出边界 ===== */
.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1.5px solid rgba(217, 84, 104, 0.15);
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  background-color: rgba(255, 186, 172, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  max-width: 100%;
}

.form-input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.6;
}

.form-input:hover {
  border-color: rgba(217, 84, 104, 0.25);
  background-color: rgba(255, 186, 172, 0.08);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: white;
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1), 0 1px 2px rgba(0, 0, 0, 0.05);
}

.form-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  padding-left: 0.25rem;
}

.error-message {
  font-size: 0.8125rem;
  color: #ef4444;
  padding-left: 0.25rem;
}

/* ===== 密码输入 ===== */
.password-input {
  position: relative;
  width: 100%;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: var(--color-primary);
}

/* ===== 密码强度 ===== */
.password-strength {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background-color: rgba(217, 84, 104, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.strength-fill.weak {
  background-color: #ef4444;
}

.strength-fill.medium {
  background-color: #f59e0b;
}

.strength-fill.strong {
  background-color: #10b981;
}

.strength-text {
  font-size: 0.8125rem;
  font-weight: 500;
  min-width: 1.5rem;
}

.strength-text.weak {
  color: #ef4444;
}

.strength-text.medium {
  color: #f59e0b;
}

.strength-text.strong {
  color: #10b981;
}

/* ===== 协议 ===== */
.agreement {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
}

.agreement input[type="checkbox"] {
  margin-top: 0.25rem;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1.5px solid rgba(217, 84, 104, 0.3);
  cursor: pointer;
  accent-color: var(--color-primary);
}

.agreement a {
  color: var(--color-primary);
  font-weight: 500;
  transition: color 0.2s;
}

.agreement a:hover {
  color: var(--color-secondary);
  text-decoration: underline;
}

/* ===== 注册按钮 - 优化渐变和阴影 ===== */
.register-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(217, 84, 104, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 0.5rem;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(217, 84, 104, 0.35);
}

.register-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(217, 84, 104, 0.25);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== 登录链接 ===== */
.login-link {
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  padding-top: 0.5rem;
}

.login-link a {
  color: var(--color-primary);
  font-weight: 500;
  margin-left: 0.25rem;
  transition: color 0.2s;
}

.login-link a:hover {
  color: var(--color-secondary);
  text-decoration: underline;
}

/* ===== 移动端优化 - 减少上下边距 ===== */
@media (max-width: 640px) {
  .register-container {
    padding: 1rem;
  }

  .register-card {
    padding: 1.75rem 1.25rem;
    border-radius: 1.25rem;
  }

  .register-header {
    margin-bottom: 1.25rem;
  }

  .logo-icon {
    width: 3rem;
    height: 3rem;
    margin-bottom: 0.75rem;
  }

  .register-header h1 {
    font-size: 1.375rem;
  }

  .register-header p {
    font-size: 0.8125rem;
  }

  .register-form {
    gap: 1rem;
  }

  .form-input {
    padding: 0.75rem 0.875rem;
    font-size: 0.875rem;
  }

  .register-btn {
    padding: 0.875rem;
    font-size: 0.9375rem;
  }

  .login-link {
    font-size: 0.8125rem;
    padding-top: 0.25rem;
  }
}

/* ===== 超小屏幕优化 ===== */
@media (max-width: 375px) {
  .register-container {
    padding: 0.75rem;
  }

  .register-card {
    padding: 1.5rem 1rem;
  }

  .register-header h1 {
    font-size: 1.25rem;
  }
}
</style>


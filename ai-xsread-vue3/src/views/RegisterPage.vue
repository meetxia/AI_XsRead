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
          <!-- 用户名 -->
          <div class="form-group">
            <label>用户名 <span class="required">*</span></label>
            <input
              v-model="formData.username"
              type="text"
              placeholder="3-20个字符，支持字母数字下划线"
              class="form-input"
              required
            />
            <p v-if="errors.username" class="error-message">{{ errors.username }}</p>
          </div>

          <!-- 手机号/邮箱 -->
          <div class="form-group">
            <div class="method-tabs">
              <button
                type="button"
                @click="registerMethod = 'phone'"
                :class="['method-btn', { active: registerMethod === 'phone' }]"
              >
                手机号
              </button>
              <button
                type="button"
                @click="registerMethod = 'email'"
                :class="['method-btn', { active: registerMethod === 'email' }]"
              >
                邮箱
              </button>
            </div>
            
            <input
              v-if="registerMethod === 'phone'"
              v-model="formData.phone"
              type="tel"
              placeholder="请输入手机号"
              class="form-input"
              required
            />
            <input
              v-else
              v-model="formData.email"
              type="email"
              placeholder="请输入邮箱地址"
              class="form-input"
              required
            />
            <p v-if="errors.contact" class="error-message">{{ errors.contact }}</p>
          </div>

          <!-- 验证码 -->
          <div class="form-group">
            <label>验证码 <span class="required">*</span></label>
            <div class="code-input">
              <input
                v-model="formData.code"
                type="text"
                placeholder="请输入6位验证码"
                maxlength="6"
                class="form-input"
                required
              />
              <button
                type="button"
                @click="sendCode"
                :disabled="countdown > 0"
                class="send-code-btn"
              >
                {{ countdown > 0 ? `${countdown}秒` : '发送验证码' }}
              </button>
            </div>
            <p v-if="errors.code" class="error-message">{{ errors.code }}</p>
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

          <!-- 确认密码 -->
          <div class="form-group">
            <label>确认密码 <span class="required">*</span></label>
            <input
              v-model="formData.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              class="form-input"
              required
            />
            <p v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</p>
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

// 注册方式
const registerMethod = ref('phone')

// 表单数据
const formData = reactive({
  username: '',
  phone: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: ''
})

// 错误信息
const errors = reactive({
  username: '',
  contact: '',
  code: '',
  password: '',
  confirmPassword: '',
  agreement: ''
})

// 状态
const loading = ref(false)
const showPassword = ref(false)
const agreeTerms = ref(false)
const countdown = ref(0)

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
 * 表单验证
 */
const validateForm = () => {
  errors.username = ''
  errors.contact = ''
  errors.code = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.agreement = ''

  // 验证用户名
  if (!formData.username) {
    errors.username = '请输入用户名'
    return false
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
    errors.username = '用户名为3-20个字符，只能包含字母数字下划线'
    return false
  }

  // 验证手机号或邮箱
  if (registerMethod.value === 'phone') {
    if (!formData.phone) {
      errors.contact = '请输入手机号'
      return false
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      errors.contact = '请输入正确的手机号'
      return false
    }
  } else {
    if (!formData.email) {
      errors.contact = '请输入邮箱'
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.contact = '请输入正确的邮箱格式'
      return false
    }
  }

  // 验证验证码
  if (!formData.code || formData.code.length !== 6) {
    errors.code = '请输入6位验证码'
    return false
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

  // 验证确认密码
  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
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
    const registerData = {
      username: formData.username,
      password: formData.password,
      code: formData.code,
      ...(registerMethod.value === 'phone' 
        ? { phone: formData.phone }
        : { email: formData.email }
      )
    }

    await userStore.register(registerData)

    // 注册成功，跳转到首页
    router.push('/')

  } catch (error) {
    console.error('注册失败:', error)
    if (error.field) {
      errors[error.field] = error.message
    } else {
      errors.username = error.message || '注册失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

/**
 * 发送验证码
 */
const sendCode = async () => {
  const contact = registerMethod.value === 'phone' ? formData.phone : formData.email

  if (!contact) {
    errors.contact = registerMethod.value === 'phone' ? '请输入手机号' : '请输入邮箱'
    return
  }

  if (registerMethod.value === 'phone' && !/^1[3-9]\d{9}$/.test(contact)) {
    errors.contact = '请输入正确的手机号'
    return
  }

  if (registerMethod.value === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    errors.contact = '请输入正确的邮箱格式'
    return
  }

  try {
    // TODO: 调用发送验证码API
    // await sendVerificationCode({ contact, type: registerMethod.value })
    
    console.log('发送验证码到:', contact)

    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)

  } catch (error) {
    console.error('发送验证码失败:', error)
    errors.code = '发送失败，请稍后重试'
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  padding-top: 4rem;
}

.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 4rem);
  padding: 2rem 1rem;
}

.register-card {
  width: 100%;
  max-width: 500px;
  background-color: var(--color-bg-card);
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 10px 40px var(--color-shadow);
}

/* 头部 */
.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-icon {
  width: 4rem;
  height: 4rem;
  color: var(--color-primary);
  margin: 0 auto 1rem;
}

.register-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.register-header p {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

/* 表单 */
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
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  background-color: transparent;
  transition: all 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(217, 84, 104, 0.1);
}

.error-message {
  font-size: 0.8125rem;
  color: #ef4444;
}

/* 方式切换 */
.method-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.method-btn {
  flex: 1;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  background-color: transparent;
  transition: all 0.3s;
}

.method-btn.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* 密码输入 */
.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}

/* 密码强度 */
.password-strength {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background-color: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s;
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

/* 验证码输入 */
.code-input {
  display: flex;
  gap: 0.75rem;
}

.send-code-btn {
  flex-shrink: 0;
  padding: 0.875rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  background-color: transparent;
  white-space: nowrap;
  transition: all 0.3s;
}

.send-code-btn:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
}

.send-code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 协议 */
.agreement {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.agreement input {
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.agreement a {
  color: var(--color-primary);
}

.agreement a:hover {
  text-decoration: underline;
}

/* 注册按钮 */
.register-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: var(--color-primary);
  transition: all 0.3s;
  margin-top: 0.5rem;
}

.register-btn:hover:not(:disabled) {
  background-color: var(--color-secondary);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(217, 84, 104, 0.3);
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

/* 登录链接 */
.login-link {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.login-link a {
  color: var(--color-primary);
  font-weight: 500;
  margin-left: 0.25rem;
}

.login-link a:hover {
  text-decoration: underline;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .register-card {
    padding: 2rem 1.5rem;
  }

  .register-header h1 {
    font-size: 1.5rem;
  }
}
</style>


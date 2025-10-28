<template>
  <div class="login-page">
    <!-- 顶部导航 -->
    <AppHeader />
    
    <!-- 登录表单 -->
    <div class="login-container">
      <div class="login-card">
        <!-- Logo和标题 -->
        <div class="login-header">
          <svg class="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
          <h1>欢迎回到文字之境</h1>
          <p>登录即可开启阅读之旅</p>
        </div>

        <!-- 标签切换 -->
        <div class="login-tabs">
          <button
            @click="loginMethod = 'password'"
            :class="['tab-btn', { active: loginMethod === 'password' }]"
          >
            密码登录
          </button>
          <button
            @click="loginMethod = 'code'"
            :class="['tab-btn', { active: loginMethod === 'code' }]"
          >
            验证码登录
          </button>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- 用户名/手机号/邮箱 -->
          <div class="form-group">
            <label>{{ loginMethod === 'code' ? '手机号' : '用户名/手机号/邮箱' }}</label>
            <input
              v-model="formData.account"
              :type="loginMethod === 'code' ? 'tel' : 'text'"
              :placeholder="loginMethod === 'code' ? '请输入手机号' : '请输入用户名/手机号/邮箱'"
              class="form-input"
              required
            />
            <p v-if="errors.account" class="error-message">{{ errors.account }}</p>
          </div>

          <!-- 密码 -->
          <div v-if="loginMethod === 'password'" class="form-group">
            <label>密码</label>
            <div class="password-input">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
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
            <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
          </div>

          <!-- 验证码 -->
          <div v-if="loginMethod === 'code'" class="form-group">
            <label>验证码</label>
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
                {{ countdown > 0 ? `${countdown}秒后重试` : '发送验证码' }}
              </button>
            </div>
            <p v-if="errors.code" class="error-message">{{ errors.code }}</p>
          </div>

          <!-- 记住密码和忘记密码 -->
          <div class="form-options">
            <label class="remember-me">
              <input v-model="rememberMe" type="checkbox" />
              <span>记住我</span>
            </label>
            <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
          </div>

          <!-- 登录按钮 -->
          <button type="submit" :disabled="loading" class="login-btn">
            <span v-if="!loading">登录</span>
            <span v-else class="loading-text">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              登录中...
            </span>
          </button>

          <!-- 注册链接 -->
          <div class="register-link">
            还没有账号？<router-link to="/register">立即注册</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import AppHeader from '@/components/common/AppHeader.vue'

const router = useRouter()
const userStore = useUserStore()

// 登录方式
const loginMethod = ref('password')

// 表单数据
const formData = reactive({
  account: '',
  password: '',
  code: ''
})

// 错误信息
const errors = reactive({
  account: '',
  password: '',
  code: ''
})

// 状态
const loading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)
const countdown = ref(0)

/**
 * 表单验证
 */
const validateForm = () => {
  errors.account = ''
  errors.password = ''
  errors.code = ''

  // 验证账号
  if (!formData.account) {
    errors.account = '请输入账号'
    return false
  }

  if (loginMethod.value === 'code') {
    // 验证手机号
    if (!/^1[3-9]\d{9}$/.test(formData.account)) {
      errors.account = '请输入正确的手机号'
      return false
    }
    // 验证验证码
    if (!formData.code || formData.code.length !== 6) {
      errors.code = '请输入6位验证码'
      return false
    }
  } else {
    // 验证密码
    if (!formData.password) {
      errors.password = '请输入密码'
      return false
    }
    if (formData.password.length < 6 || formData.password.length > 20) {
      errors.password = '密码长度为6-20个字符'
      return false
    }
  }

  return true
}

/**
 * 处理登录
 */
const handleLogin = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const loginData = {
      account: formData.account,
      ...(loginMethod.value === 'password' 
        ? { password: formData.password }
        : { code: formData.code }
      ),
      rememberMe: rememberMe.value
    }

    await userStore.login(loginData)

    // 登录成功，跳转到首页或之前的页面
    const redirect = router.currentRoute.value.query.redirect || '/'
    router.push(redirect)

  } catch (error) {
    console.error('登录失败:', error)
    errors.account = error.message || '登录失败，请检查账号和密码'
  } finally {
    loading.value = false
  }
}

/**
 * 发送验证码
 */
const sendCode = async () => {
  if (!formData.account) {
    errors.account = '请输入手机号'
    return
  }

  if (!/^1[3-9]\d{9}$/.test(formData.account)) {
    errors.account = '请输入正确的手机号'
    return
  }

  try {
    // TODO: 调用发送验证码API
    // await sendVerificationCode(formData.account)
    
    // 模拟发送成功
    console.log('发送验证码到:', formData.account)

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
.login-page {
  min-height: 100vh;
  padding-top: 4rem;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 4rem);
  padding: 2rem 1rem;
}

.login-card {
  width: 100%;
  max-width: 450px;
  background-color: var(--color-bg-card);
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 10px 40px var(--color-shadow);
}

/* 头部 */
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-icon {
  width: 4rem;
  height: 4rem;
  color: var(--color-primary);
  margin: 0 auto 1rem;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.login-header p {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

/* 标签切换 */
.login-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background-color: var(--color-accent);
  border-radius: 0.75rem;
  padding: 0.25rem;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background-color: transparent;
  transition: all 0.3s;
}

.tab-btn.active {
  background-color: var(--color-primary);
  color: white;
}

/* 表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

/* 选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.forgot-link {
  font-size: 0.875rem;
  color: var(--color-primary);
}

.forgot-link:hover {
  text-decoration: underline;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: var(--color-primary);
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  background-color: var(--color-secondary);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(217, 84, 104, 0.3);
}

.login-btn:disabled {
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

/* 注册链接 */
.register-link {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.register-link a {
  color: var(--color-primary);
  font-weight: 500;
  margin-left: 0.25rem;
}

.register-link a:hover {
  text-decoration: underline;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-header h1 {
    font-size: 1.5rem;
  }

  .social-login {
    gap: 1rem;
  }
}
</style>


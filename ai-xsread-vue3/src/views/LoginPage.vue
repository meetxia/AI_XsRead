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

          <!-- 第三方登录 -->
          <div class="third-party">
            <div class="divider">
              <span>或使用第三方登录</span>
            </div>
            <div class="social-login">
              <button type="button" @click="thirdPartyLogin('wechat')" class="social-btn wechat">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 2.711-6.632 1.755-1.14 3.963-1.768 6.226-1.768.28 0 .553.027.827.042C17.557 5.29 13.523 2.188 8.691 2.188zm-2.276 5.691c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zm4.276 0c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5z"></path>
                  <path d="M23.759 15.534c0-3.41-3.202-6.172-7.146-6.172-3.944 0-7.146 2.762-7.146 6.172 0 3.41 3.202 6.172 7.146 6.172.276 0 .551-.027.827-.042l1.394.782a.355.355 0 0 0 .195.066c.167 0 .302-.135.302-.302 0-.066-.027-.13-.066-.188l-.302-1.076a.644.644 0 0 1 .213-.665c1.488-1.114 2.483-2.762 2.483-4.747zm-9.138-1.114c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm4.276 0c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5z"></path>
                </svg>
                <span>微信</span>
              </button>
              <button type="button" @click="thirdPartyLogin('qq')" class="social-btn qq">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.395 15.035a39.548 39.548 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a38.97 38.97 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 1.514-2.114 1.514-2.114 0 .718.005.012.005 1.011 0 3.076 2.888 6.394 7.313 6.394s7.313-3.319 7.313-6.394c0-.999.005-.293.005-1.011 0 0 .974 2.179 1.514 2.114.253-.03.583-1.39-.437-4.673z"></path>
                </svg>
                <span>QQ</span>
              </button>
              <button type="button" @click="thirdPartyLogin('weibo')" class="social-btn weibo">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.779 13.538c-.316.232-.764.389-1.211.389-1.316 0-2.421-1.158-2.421-2.526 0-.631.316-1.105.737-1.421.316-.232.763-.389 1.21-.389 1.317 0 2.422 1.158 2.422 2.526 0 .631-.316 1.105-.737 1.421zm4.211-3.789c-.421-.842-1.579-1.316-2.737-1.158-.421.079-.763.237-1.052.474.421-.158.842-.316 1.263-.316 1.105 0 2.053.632 2.526 1.579.421.947.158 1.895-.474 2.526a3.96 3.96 0 0 0 .947-.947c.316-.474.421-1.105.158-1.737.079-.158.079-.316-.079-.421h.448zm9.01-1.263c0 5.053-4.211 9.264-9.263 9.264-5.053 0-9.264-4.211-9.264-9.264C4.473 3.433 8.684-.778 13.737-.778c5.052 0 9.263 4.211 9.263 9.263z"></path>
                </svg>
                <span>微博</span>
              </button>
            </div>
          </div>

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

/**
 * 第三方登录
 */
const thirdPartyLogin = (platform) => {
  console.log('第三方登录:', platform)
  // TODO: 实现第三方登录逻辑
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

/* 第三方登录 */
.third-party {
  margin-top: 1.5rem;
}

.divider {
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background-color: var(--color-border);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  background-color: var(--color-bg-card);
  padding: 0 1rem;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.social-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  transition: all 0.3s;
}

.social-btn.wechat {
  color: #07c160;
  background-color: rgba(7, 193, 96, 0.1);
}

.social-btn.qq {
  color: #12b7f5;
  background-color: rgba(18, 183, 245, 0.1);
}

.social-btn.weibo {
  color: #e6162d;
  background-color: rgba(230, 22, 45, 0.1);
}

.social-btn:hover {
  transform: translateY(-2px);
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


import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/index.css'
import { initTheme } from './composables/useTheme'
import { registerFeedbackDirective } from './directives/feedback'
import { debugAuth, testAuthAPI } from './utils/auth-debug'

// 初始化主题系统
initTheme()

const app = createApp(App)
const pinia = createPinia()

// 注册全局指令
registerFeedbackDirective(app)

app.use(pinia)
app.use(router)
app.mount('#app')

console.log('✨ 文字之境 Vue3 应用已启动')
console.log('📍 当前环境:', import.meta.env.MODE)
console.log('🔗 API地址:', import.meta.env.VITE_APP_BASE_API)

// 开发环境下暴露调试函数
if (import.meta.env.MODE === 'development') {
  window.debugAuth = debugAuth
  window.testAuthAPI = testAuthAPI
  console.log('💡 提示: 可在控制台使用 debugAuth() 检查认证状态')
  console.log('💡 提示: 可在控制台使用 testAuthAPI() 测试API认证')
}

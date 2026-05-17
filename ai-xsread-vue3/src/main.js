import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/index.css'
import { initTheme } from './composables/useTheme'

// 启动时同步浅深模式
initTheme()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

console.log('✨ MOMO小说 V1.0 启动')
console.log('📍 当前环境:', import.meta.env.MODE)

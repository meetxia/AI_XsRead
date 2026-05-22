import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 接受 200-299 区间为成功；code 缺失也视为成功（部分接口不带 code 字段）
    const isSuccess = res.code === undefined || (res.code >= 200 && res.code < 300)
    if (!isSuccess) {
      ElMessage.error(res.message || '请求失败')
      
      // 401: Token过期或未授权
      if (res.code === 401) {
        ElMessage.error('登录已过期，请重新登录')
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        router.push('/login')
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res
  },
  error => {
    console.error('响应错误:', error)
    
    let message = '网络请求失败'
    
    if (error.response) {
      const serverMessage = error.response.data?.message
      switch (error.response.status) {
        case 401:
          message = serverMessage || '未授权，请重新登录'
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
          router.push('/login')
          break
        case 403:
          message = serverMessage || '拒绝访问'
          break
        case 404:
          message = serverMessage || '请求的资源不存在'
          break
        case 500:
          message = serverMessage || '服务器内部错误'
          break
        default:
          message = serverMessage || '请求失败'
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service


import { defineStore } from 'pinia'
import { login, logout, getProfile } from '@/api/auth'
import { getToken, setToken, removeToken, setUser, removeUser } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: null,
    permissions: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username || '',
    avatar: (state) => state.userInfo?.avatar || '',
    role: (state) => state.userInfo?.role || 'admin'
  },

  actions: {
    // 登录
    async login(loginForm) {
      const { username, password } = loginForm
      const res = await login({ username, password })
      
      const { accessToken, user } = res.data
      
      this.token = accessToken
      this.userInfo = user
      
      setToken(accessToken)
      setUser(user)
      
      return res
    },

    // 获取用户信息
    async getUserInfo() {
      const res = await getProfile()
      this.userInfo = res.data
      setUser(res.data)
      return res
    },

    // 退出登录
    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('退出登录失败:', error)
      }
      
      this.token = ''
      this.userInfo = null
      this.permissions = []
      
      removeToken()
      removeUser()
    },

    // 重置状态
    resetState() {
      this.token = ''
      this.userInfo = null
      this.permissions = []
    }
  }
})


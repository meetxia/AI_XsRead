import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, logout as logoutApi } from '@/api/auth'
import { uploadAvatarApi } from '@/api/user'

/**
 * 用户状态管理 Store
 */
export const useUserStore = defineStore('user', () => {
  // 用户信息
  const userInfo = ref(null)
  
  // Token
  const token = ref(localStorage.getItem('token') || '')
  
  // 刷新Token
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')
  
  // 登录状态
  const isLogin = computed(() => !!token.value && !!userInfo.value)
  
  /**
   * 登录
   * @param {Object} loginData - 登录数据
   */
  const login = async (loginData) => {
    try {
      // 调用登录API
      const response = await loginApi({
        username: loginData.account,
        password: loginData.password
      })
      
      if (response.code === 200) {
        // 保存Token（后端返回的是 accessToken）
        token.value = response.data.accessToken
        
        // 保存用户信息
        userInfo.value = response.data.user
        
        // 存储到localStorage
        localStorage.setItem('token', response.data.accessToken)
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))
        
        // 记住我
        if (loginData.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        }
        
        console.log('登录成功:', response.data.user)
      } else {
        throw new Error(response.message || '登录失败')
      }
      
    } catch (error) {
      console.error('登录失败:', error)
      throw new Error(error.message || '登录失败，请检查账号和密码')
    }
  }
  
  /**
   * 注册
   * @param {Object} registerData - 注册数据
   */
  const register = async (registerData) => {
    try {
      // 调用注册API
      const response = await registerApi({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password
      })
      
      // 注册成功返回201或200
      if (response.code === 201 || response.code === 200) {
        // 保存Token（后端返回的是 accessToken）
        token.value = response.data.accessToken
        refreshToken.value = response.data.refreshToken
        
        // 保存用户信息
        userInfo.value = response.data.user
        
        // 存储到localStorage
        localStorage.setItem('token', response.data.accessToken)
        localStorage.setItem('refreshToken', response.data.refreshToken)
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))
        
        console.log('注册成功:', response.data.user)
      } else {
        throw new Error(response.message || '注册失败')
      }
      
    } catch (error) {
      console.error('注册失败:', error)
      throw new Error(error.message || '注册失败，请稍后重试')
    }
  }
  
  /**
   * 退出登录
   */
  const logout = async () => {
    try {
      // 调用退出API（可选）
      if (token.value) {
        await logoutApi().catch(err => {
          console.warn('退出登录API调用失败:', err)
        })
      }
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      // 清空状态
      userInfo.value = null
      token.value = ''
      refreshToken.value = ''
      
      // 清空localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('rememberMe')
      
      console.log('已退出登录')
    }
  }
  
  /**
   * 刷新Token
   */
  const refreshAccessToken = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('没有刷新Token')
      }
      
      // TODO: 调用刷新Token API
      // const response = await refreshTokenApi({ refreshToken: refreshToken.value })
      
      // 模拟刷新成功
      const newToken = 'mock_token_' + Date.now()
      
      token.value = newToken
      localStorage.setItem('token', newToken)
      
      console.log('Token已刷新')
      
      return newToken
      
    } catch (error) {
      console.error('刷新Token失败:', error)
      // Token刷新失败，退出登录
      logout()
      throw error
    }
  }
  
  /**
   * 更新用户信息
   * @param {Object} data - 用户信息
   */
  const updateUserInfo = async (data) => {
    try {
      // TODO: 调用更新用户信息API
      // const response = await updateUserInfoApi(data)
      
      // 模拟更新成功
      userInfo.value = {
        ...userInfo.value,
        ...data
      }
      
      // 更新localStorage
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      
      console.log('用户信息已更新:', userInfo.value)
      
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    }
  }
  
  /**
   * 上传头像
   * @param {File} file - 图片文件
   */
  const uploadAvatar = async (file, onProgress) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await uploadAvatarApi(formData, onProgress)
      if (res.code === 200) {
        const avatarUrl = res.data.avatar
        userInfo.value = {
          ...userInfo.value,
          avatar: avatarUrl
        }
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        console.log('头像已上传:', avatarUrl)
        return avatarUrl
      } else {
        throw new Error(res.message || '上传失败')
      }
      
    } catch (error) {
      console.error('上传头像失败:', error)
      throw error
    }
  }
  
  /**
   * 修改密码
   * @param {Object} data - 密码数据
   */
  const changePassword = async (data) => {
    try {
      // TODO: 调用修改密码API
      // await changePasswordApi(data)
      
      console.log('密码已修改')
      
    } catch (error) {
      console.error('修改密码失败:', error)
      throw error
    }
  }
  
  /**
   * 从localStorage恢复登录状态
   */
  const restoreLoginState = () => {
    const savedToken = localStorage.getItem('token')
    const savedUserInfo = localStorage.getItem('userInfo')
    
    if (savedToken && savedUserInfo) {
      try {
        token.value = savedToken
        userInfo.value = JSON.parse(savedUserInfo)
        console.log('登录状态已恢复:', userInfo.value)
      } catch (error) {
        console.error('恢复登录状态失败:', error)
        logout()
      }
    }
  }
  
  // 初始化时恢复登录状态
  restoreLoginState()
  
  return {
    // 状态
    userInfo,
    token,
    refreshToken,
    isLogin,
    
    // 方法
    login,
    register,
    logout,
    refreshAccessToken,
    updateUserInfo,
    uploadAvatar,
    changePassword,
    restoreLoginState
  }
})


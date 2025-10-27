import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
      // TODO: 调用登录API
      // const response = await loginApi(loginData)
      
      // 模拟登录成功
      const mockResponse = {
        token: 'mock_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
        user: {
          id: 1,
          username: loginData.account,
          nickname: loginData.account === 'admin' ? '管理员' : '新用户',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + loginData.account,
          email: loginData.account.includes('@') ? loginData.account : '',
          phone: /^1[3-9]\d{9}$/.test(loginData.account) ? loginData.account : '',
          gender: null,
          birthday: null,
          bio: '',
          role: loginData.account === 'admin' ? 'admin' : 'user', // 添加角色字段
          createdAt: Date.now()
        }
      }
      
      // 保存Token
      token.value = mockResponse.token
      refreshToken.value = mockResponse.refreshToken
      
      // 保存用户信息
      userInfo.value = mockResponse.user
      
      // 存储到localStorage
      localStorage.setItem('token', mockResponse.token)
      localStorage.setItem('refreshToken', mockResponse.refreshToken)
      localStorage.setItem('userInfo', JSON.stringify(mockResponse.user))
      
      // 记住我
      if (loginData.rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      
      console.log('登录成功:', mockResponse.user)
      
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
      // TODO: 调用注册API
      // const response = await registerApi(registerData)
      
      // 模拟注册成功
      const mockResponse = {
        token: 'mock_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
        user: {
          id: Date.now(),
          username: registerData.username,
          nickname: registerData.username,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + registerData.username,
          email: registerData.email || '',
          phone: registerData.phone || '',
          gender: null,
          birthday: null,
          bio: '',
          createdAt: Date.now()
        }
      }
      
      // 保存Token
      token.value = mockResponse.token
      refreshToken.value = mockResponse.refreshToken
      
      // 保存用户信息
      userInfo.value = mockResponse.user
      
      // 存储到localStorage
      localStorage.setItem('token', mockResponse.token)
      localStorage.setItem('refreshToken', mockResponse.refreshToken)
      localStorage.setItem('userInfo', JSON.stringify(mockResponse.user))
      
      console.log('注册成功:', mockResponse.user)
      
    } catch (error) {
      console.error('注册失败:', error)
      throw new Error(error.message || '注册失败，请稍后重试')
    }
  }
  
  /**
   * 退出登录
   */
  const logout = () => {
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
  const uploadAvatar = async (file) => {
    try {
      // TODO: 调用上传头像API
      // const formData = new FormData()
      // formData.append('avatar', file)
      // const response = await uploadAvatarApi(formData)
      
      // 模拟上传成功
      const avatarUrl = URL.createObjectURL(file)
      
      userInfo.value.avatar = avatarUrl
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      
      console.log('头像已上传:', avatarUrl)
      
      return avatarUrl
      
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


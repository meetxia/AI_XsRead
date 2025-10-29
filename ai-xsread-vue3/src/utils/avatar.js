/**
 * 头像相关工具函数
 */

// 默认头像路径
export const DEFAULT_AVATAR = '/default-avatar.svg'

/**
 * 获取用户头像URL
 * @param {Object} user - 用户信息对象
 * @returns {string} 头像URL
 */
export const getUserAvatarUrl = (user) => {
  const avatar = user?.avatar
  
  // 如果没有头像，返回默认头像
  if (!avatar) {
    return DEFAULT_AVATAR
  }
  
  // 如果是完整URL（http/https开头），直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  
  // 如果是相对路径，拼接API基础路径
  if (avatar.startsWith('/uploads/')) {
    const baseAPI = import.meta.env.VITE_APP_BASE_API || 'http://localhost:3000'
    return `${baseAPI}${avatar}`
  }
  
  // 其他情况直接返回
  return avatar
}

/**
 * 头像加载失败时的处理函数
 * @param {Event} event - 图片加载错误事件
 */
export const handleAvatarError = (event) => {
  console.warn('头像加载失败，使用默认头像', event.target.src)
  // 防止无限循环
  if (!event.target.src.includes('default-avatar.svg')) {
    event.target.src = DEFAULT_AVATAR
  }
}

/**
 * 验证头像文件
 * @param {File} file - 文件对象
 * @returns {Object} 验证结果 { valid: boolean, message: string }
 */
export const validateAvatarFile = (file) => {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: '仅支持 JPG、PNG、GIF、WebP 格式的图片'
    }
  }
  
  // 检查文件大小（限制为5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      message: '图片大小不能超过 5MB'
    }
  }
  
  return {
    valid: true,
    message: '验证通过'
  }
}

/**
 * 生成头像预览URL
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 预览URL
 */
export const generateAvatarPreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


/**
 * 认证调试工具
 */

export function debugAuth() {
  const token = localStorage.getItem('token')
  const userInfo = localStorage.getItem('userInfo')
  
  console.group('🔍 认证状态检查')
  
  // 检查token
  if (!token) {
    console.error('❌ Token不存在')
  } else {
    console.log('✅ Token存在:', token.substring(0, 30) + '...')
    
    // 解析JWT token
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        console.log('📦 Token payload:', payload)
        
        // 检查过期时间
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000)
          const now = new Date()
          const isExpired = expDate < now
          
          console.log('⏰ Token过期时间:', expDate.toLocaleString())
          console.log('🕐 当前时间:', now.toLocaleString())
          
          if (isExpired) {
            console.error('❌ Token已过期！')
          } else {
            const remaining = Math.floor((expDate - now) / 1000 / 60)
            console.log(`✅ Token有效 (剩余 ${remaining} 分钟)`)
          }
        }
      }
    } catch (e) {
      console.error('❌ Token解析失败:', e.message)
    }
  }
  
  // 检查用户信息
  if (!userInfo) {
    console.error('❌ 用户信息不存在')
  } else {
    try {
      const user = JSON.parse(userInfo)
      console.log('✅ 用户信息:', user)
    } catch (e) {
      console.error('❌ 用户信息解析失败:', e.message)
    }
  }
  
  console.groupEnd()
}

// 测试API请求
export async function testAuthAPI() {
  const token = localStorage.getItem('token')
  
  if (!token) {
    console.error('❌ 无法测试：Token不存在')
    return
  }
  
  console.group('🧪 测试认证API')
  
  try {
    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('📊 响应状态:', response.status)
    
    const data = await response.json()
    console.log('📦 响应数据:', data)
    
    if (response.status === 401) {
      console.error('❌ 认证失败 - Token可能无效或已过期')
    } else if (response.ok) {
      console.log('✅ 认证成功')
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message)
  }
  
  console.groupEnd()
}

// 自动在控制台暴露调试函数
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth
  window.testAuthAPI = testAuthAPI
}


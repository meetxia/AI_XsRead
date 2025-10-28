/**
 * 路由守卫
 * 处理登录拦截、权限验证、Token过期等
 */

import { useUserStore } from '@/stores/user'

/**
 * 需要登录的路由路径
 * 注意：阅读页不需要登录，让游客也能试读
 */
const AUTH_REQUIRED_ROUTES = [
  '/bookshelf',
  // '/reading',  // 移除：阅读页允许游客访问
  '/user',
  '/profile',
  '/settings'
]

/**
 * 检查路由是否需要登录
 * @param {string} path - 路由路径
 */
const requiresAuth = (path) => {
  return AUTH_REQUIRED_ROUTES.some(route => path.startsWith(route))
}

/**
 * 设置路由守卫
 * @param {Router} router - Vue Router实例
 */
export const setupRouterGuards = (router) => {
  
  /**
   * 全局前置守卫
   */
  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()
    
    // 检查是否需要登录
    if (requiresAuth(to.path)) {
      if (!userStore.isLogin) {
        // 未登录，跳转到登录页
        console.log('需要登录，跳转到登录页')
        next({
          path: '/login',
          query: { redirect: to.fullPath } // 记录原始目标路径
        })
        return
      }
      
      // 检查Token是否过期
      if (userStore.token) {
        try {
          // TODO: 验证Token是否有效
          // await validateToken()
          
          // Token有效，继续导航
          next()
        } catch (error) {
          console.error('Token验证失败:', error)
          
          // 尝试刷新Token
          try {
            await userStore.refreshAccessToken()
            next()
          } catch (refreshError) {
            console.error('Token刷新失败:', refreshError)
            
            // Token无法刷新，退出登录
            userStore.logout()
            next({
              path: '/login',
              query: { redirect: to.fullPath }
            })
          }
        }
      } else {
        // 没有Token，跳转到登录页
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      }
    } else {
      // 不需要登录的页面，直接放行
      
      // 如果已登录且访问登录/注册页，重定向到首页
      if ((to.path === '/login' || to.path === '/register') && userStore.isLogin) {
        console.log('已登录，重定向到首页')
        next('/')
        return
      }
      
      next()
    }
  })
  
  /**
   * 全局后置钩子
   */
  router.afterEach((to, from) => {
    // 页面标题
    document.title = to.meta.title ? `${to.meta.title} - 文字之境` : '文字之境 - 故事入境，杂念自消'
    
    // 滚动到顶部
    if (to.path !== from.path) {
      window.scrollTo(0, 0)
    }
  })
  
  /**
   * 全局解析守卫
   */
  router.beforeResolve(async (to) => {
    // 在导航被确认之前，同时在所有组件内守卫和异步路由组件被解析之后调用
    
    // 可以在这里做一些最后的检查
    console.log('导航解析:', to.path)
  })
}

/**
 * 权限检查
 * @param {Array} permissions - 需要的权限列表
 */
export const checkPermission = (permissions) => {
  const userStore = useUserStore()
  
  if (!userStore.isLogin) {
    return false
  }
  
  // TODO: 实现权限检查逻辑
  // const userPermissions = userStore.userInfo.permissions || []
  // return permissions.every(p => userPermissions.includes(p))
  
  // 暂时返回true
  return true
}

/**
 * 角色检查
 * @param {Array} roles - 需要的角色列表
 */
export const checkRole = (roles) => {
  const userStore = useUserStore()
  
  if (!userStore.isLogin) {
    return false
  }
  
  // TODO: 实现角色检查逻辑
  // const userRole = userStore.userInfo.role
  // return roles.includes(userRole)
  
  // 暂时返回true
  return true
}

/**
 * 导航失败处理
 */
export const handleNavigationFailure = (failure) => {
  console.error('导航失败:', failure)
  
  // 可以在这里添加错误上报或用户提示
}

export default setupRouterGuards


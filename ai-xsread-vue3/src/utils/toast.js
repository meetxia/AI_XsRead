/**
 * Toast 消息提示工具
 * 情感化的提示消息
 */
import { createApp, h } from 'vue'
import Toast from '@/components/common/Toast.vue'

// 情感化的消息模板
const messageTemplates = {
  success: {
    addToBookshelf: '已加入书架，开始温柔的阅读旅程吧 ✨',
    like: '感谢你的喜欢 ❤️',
    comment: '评论发表成功，期待更多交流 💬',
    collect: '收藏成功，可以在书架找到它哦 📚',
    login: '欢迎回来 👋',
    register: '注册成功，开启阅读之旅吧 🎉',
    update: '更新成功 ✓',
    delete: '删除成功',
    save: '保存成功 💾'
  },
  error: {
    network: '网络似乎开了小差，请稍后再试 😊',
    notFound: '抱歉，这本书找不到了 😢',
    forbidden: '需要登录才能继续哦 🔐',
    server: '服务器君累了，请稍后再试 😴',
    timeout: '请求超时了，请检查网络 ⏱️',
    validation: '请检查输入的信息 📝',
    loginFailed: '用户名或密码错误 🔒'
  },
  warning: {
    unsaved: '有未保存的更改，确定要离开吗？ ⚠️',
    duplicated: '这本书已经在书架里了 📚',
    limit: '已达到上限 ⚡'
  },
  info: {
    loading: '正在加载中... ⏳',
    processing: '处理中，请稍候... ⚙️',
    syncing: '正在同步数据... 🔄'
  }
}

// Toast 容器
let toastContainer = null
let toastQueue = []
let currentToasts = []
const maxToasts = 3 // 最多同时显示3个Toast

/**
 * 显示 Toast
 * @param {Object} options 配置选项
 */
function showToast(options) {
  const {
    type = 'info',
    message = '',
    title = '',
    duration = 3000,
    position = 'top-center',
    closable = true,
    onClose = null
  } = options

  // 创建Toast实例
  const toastInstance = createApp({
    render() {
      return h(Toast, {
        type,
        message,
        title,
        duration,
        position,
        closable,
        onClose: () => {
          removeToast(toastInstance)
          if (onClose) onClose()
        }
      })
    }
  })

  // 如果超过最大数量，移除最旧的Toast
  if (currentToasts.length >= maxToasts) {
    const oldestToast = currentToasts.shift()
    if (oldestToast && oldestToast.unmount) {
      oldestToast.unmount()
    }
  }

  // 创建容器
  const wrapper = document.createElement('div')
  document.body.appendChild(wrapper)

  // 挂载Toast
  toastInstance.mount(wrapper)
  currentToasts.push(toastInstance)

  return toastInstance
}

/**
 * 移除 Toast
 */
function removeToast(toastInstance) {
  const index = currentToasts.indexOf(toastInstance)
  if (index > -1) {
    currentToasts.splice(index, 1)
  }
}

/**
 * 成功提示
 * @param {string} message 消息内容或模板键
 * @param {Object} options 额外选项
 */
export function success(message, options = {}) {
  const msg = messageTemplates.success[message] || message
  return showToast({
    type: 'success',
    message: msg,
    ...options
  })
}

/**
 * 错误提示
 * @param {string} message 消息内容或模板键
 * @param {Object} options 额外选项
 */
export function error(message, options = {}) {
  const msg = messageTemplates.error[message] || message
  return showToast({
    type: 'error',
    message: msg,
    duration: 4000, // 错误提示显示更久
    ...options
  })
}

/**
 * 警告提示
 * @param {string} message 消息内容或模板键
 * @param {Object} options 额外选项
 */
export function warning(message, options = {}) {
  const msg = messageTemplates.warning[message] || message
  return showToast({
    type: 'warning',
    message: msg,
    ...options
  })
}

/**
 * 信息提示
 * @param {string} message 消息内容或模板键
 * @param {Object} options 额外选项
 */
export function info(message, options = {}) {
  const msg = messageTemplates.info[message] || message
  return showToast({
    type: 'info',
    message: msg,
    ...options
  })
}

/**
 * 清除所有 Toast
 */
export function clearAll() {
  currentToasts.forEach(toast => {
    if (toast && toast.unmount) {
      toast.unmount()
    }
  })
  currentToasts = []
}

// 默认导出
export default {
  show: showToast,
  success,
  error,
  warning,
  info,
  clearAll
}


/**
 * 简单的消息提示工具
 */

let messageContainer = null

// 创建消息容器
function createMessageContainer() {
  if (!messageContainer) {
    messageContainer = document.createElement('div')
    messageContainer.className = 'message-container'
    messageContainer.style.cssText = `
      position: fixed;
      top: 5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      pointer-events: none;
    `
    document.body.appendChild(messageContainer)
  }
  return messageContainer
}

// 显示消息
function showMessage(text, type = 'info', duration = 3000) {
  const container = createMessageContainer()
  
  const messageEl = document.createElement('div')
  messageEl.className = `message message-${type}`
  
  // 根据类型设置样式
  const colors = {
    success: {
      bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      icon: '✓'
    },
    error: {
      bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      icon: '✕'
    },
    warning: {
      bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: '⚠'
    },
    info: {
      bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: 'ℹ'
    }
  }
  
  const color = colors[type] || colors.info
  
  messageEl.innerHTML = `
    <div style="
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem;
      background: ${color.bg};
      color: white;
      border-radius: 9999px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      font-size: 0.9375rem;
      font-weight: 500;
      pointer-events: auto;
      animation: messageSlideIn 0.3s ease-out;
    ">
      <span style="font-size: 1.25rem;">${color.icon}</span>
      <span>${text}</span>
    </div>
  `
  
  // 添加动画样式
  if (!document.getElementById('message-animations')) {
    const style = document.createElement('style')
    style.id = 'message-animations'
    style.textContent = `
      @keyframes messageSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes messageSlideOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(-20px);
        }
      }
    `
    document.head.appendChild(style)
  }
  
  container.appendChild(messageEl)
  
  // 自动移除
  setTimeout(() => {
    messageEl.style.animation = 'messageSlideOut 0.3s ease-out'
    setTimeout(() => {
      container.removeChild(messageEl)
    }, 300)
  }, duration)
}

// 导出快捷方法
export const message = {
  success: (text, duration) => showMessage(text, 'success', duration),
  error: (text, duration) => showMessage(text, 'error', duration),
  warning: (text, duration) => showMessage(text, 'warning', duration),
  info: (text, duration) => showMessage(text, 'info', duration)
}

// 同时导出 showMessage 函数供直接使用
export { showMessage }

export default message


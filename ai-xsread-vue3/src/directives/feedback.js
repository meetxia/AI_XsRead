/**
 * 触觉反馈指令
 * v-feedback
 * 
 * 用法：
 * <button v-feedback>点击我</button>
 * <button v-feedback="{ haptic: true, ripple: true, sound: 'click.mp3' }">点击我</button>
 */

// 默认配置
const DEFAULT_OPTIONS = {
  haptic: true,      // 触觉反馈
  ripple: true,      // 涟漪效果
  sound: null,       // 音效文件
  scale: true,       // 缩放效果
  duration: 150      // 动画时长
}

/**
 * 触觉反馈
 */
function triggerHaptic(intensity = 10) {
  if ('vibrate' in navigator) {
    navigator.vibrate(intensity)
  }
}

/**
 * 创建涟漪效果
 */
function createRipple(element, event, color = 'rgba(217, 84, 104, 0.3)') {
  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const size = Math.max(rect.width, rect.height) * 2

  const ripple = document.createElement('span')
  ripple.className = 'feedback-ripple'
  ripple.style.cssText = `
    position: absolute;
    left: ${x - size / 2}px;
    top: ${y - size / 2}px;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color};
    transform: scale(0);
    opacity: 1;
    pointer-events: none;
    z-index: 1000;
    animation: feedbackRipple 600ms ease-out;
  `

  element.appendChild(ripple)

  setTimeout(() => {
    ripple.remove()
  }, 600)
}

/**
 * 缩放效果
 */
function applyScaleEffect(element, duration = 150) {
  element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`
  element.style.transform = 'scale(0.95)'

  setTimeout(() => {
    element.style.transform = 'scale(1)'
  }, duration)
}

/**
 * 播放音效
 */
function playSound(soundFile) {
  if (!soundFile) return

  try {
    const audio = new Audio(soundFile)
    audio.volume = 0.3
    audio.play().catch(err => {
      console.warn('音效播放失败:', err)
    })
  } catch (error) {
    console.warn('音效加载失败:', error)
  }
}

/**
 * 处理点击事件
 */
function handleClick(event, options) {
  const element = event.currentTarget

  // 触觉反馈
  if (options.haptic) {
    triggerHaptic()
  }

  // 涟漪效果
  if (options.ripple) {
    createRipple(element, event, options.rippleColor)
  }

  // 缩放效果
  if (options.scale) {
    applyScaleEffect(element, options.duration)
  }

  // 音效
  if (options.sound) {
    playSound(options.sound)
  }
}

/**
 * 添加必要的样式
 */
function addStyles(element) {
  if (!element.style.position || element.style.position === 'static') {
    element.style.position = 'relative'
  }
  element.style.overflow = 'hidden'
  element.style.isolation = 'isolate'
}

/**
 * 指令定义
 */
export default {
  mounted(el, binding) {
    // 合并配置
    const options = {
      ...DEFAULT_OPTIONS,
      ...(typeof binding.value === 'object' ? binding.value : {})
    }

    // 添加样式
    if (options.ripple) {
      addStyles(el)
    }

    // 保存选项到元素上
    el._feedbackOptions = options

    // 绑定点击事件
    el._feedbackHandler = (event) => handleClick(event, options)
    el.addEventListener('click', el._feedbackHandler)

    // 添加涟漪动画样式（如果还没有）
    if (!document.getElementById('feedback-ripple-styles')) {
      const style = document.createElement('style')
      style.id = 'feedback-ripple-styles'
      style.textContent = `
        @keyframes feedbackRipple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }
  },

  updated(el, binding) {
    // 更新选项
    const options = {
      ...DEFAULT_OPTIONS,
      ...(typeof binding.value === 'object' ? binding.value : {})
    }
    el._feedbackOptions = options
  },

  unmounted(el) {
    // 清理事件监听
    if (el._feedbackHandler) {
      el.removeEventListener('click', el._feedbackHandler)
      delete el._feedbackHandler
    }
    delete el._feedbackOptions
  }
}

/**
 * 注册指令的辅助函数
 */
export function registerFeedbackDirective(app) {
  app.directive('feedback', {
    mounted(el, binding) {
      const options = {
        ...DEFAULT_OPTIONS,
        ...(typeof binding.value === 'object' ? binding.value : {})
      }

      if (options.ripple) {
        addStyles(el)
      }

      el._feedbackOptions = options
      el._feedbackHandler = (event) => handleClick(event, options)
      el.addEventListener('click', el._feedbackHandler)

      if (!document.getElementById('feedback-ripple-styles')) {
        const style = document.createElement('style')
        style.id = 'feedback-ripple-styles'
        style.textContent = `
          @keyframes feedbackRipple {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }
        `
        document.head.appendChild(style)
      }
    },

    updated(el, binding) {
      const options = {
        ...DEFAULT_OPTIONS,
        ...(typeof binding.value === 'object' ? binding.value : {})
      }
      el._feedbackOptions = options
    },

    unmounted(el) {
      if (el._feedbackHandler) {
        el.removeEventListener('click', el._feedbackHandler)
        delete el._feedbackHandler
      }
      delete el._feedbackOptions
    }
  })
}


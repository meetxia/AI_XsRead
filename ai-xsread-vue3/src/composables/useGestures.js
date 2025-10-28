/**
 * 手势交互 Composable
 * 支持滑动、双击、长按、捏合等手势
 */
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 手势配置选项
 */
const DEFAULT_OPTIONS = {
  // 滑动
  swipeThreshold: 50, // 最小滑动距离
  swipeTimeout: 300, // 最大滑动时间
  
  // 双击
  doubleTapDelay: 300, // 双击间隔时间
  
  // 长按
  longPressDelay: 500, // 长按时间
  
  // 捏合
  pinchThreshold: 0.1, // 捏合缩放阈值
  
  // 是否阻止默认行为
  preventDefault: true
}

/**
 * 手势状态
 */
const GestureState = {
  IDLE: 'idle',
  PENDING: 'pending',
  RECOGNIZED: 'recognized',
  FAILED: 'failed'
}

/**
 * 使用手势交互
 * @param {Ref} targetRef 目标元素引用
 * @param {Object} handlers 手势处理函数
 * @param {Object} options 配置选项
 */
export function useGestures(targetRef, handlers = {}, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  // 手势状态
  const state = ref(GestureState.IDLE)
  
  // 触摸点信息
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTime = 0
  let lastTapTime = 0
  let longPressTimer = null
  let initialDistance = 0
  
  /**
   * 触摸开始
   */
  function handleTouchStart(event) {
    const touch = event.touches[0]
    
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    touchStartTime = Date.now()
    
    // 双击检测
    const now = Date.now()
    if (now - lastTapTime < opts.doubleTapDelay) {
      // 双击
      if (handlers.doubleTap) {
        handlers.doubleTap(event)
        state.value = GestureState.RECOGNIZED
      }
      lastTapTime = 0
    } else {
      lastTapTime = now
    }
    
    // 长按检测
    if (handlers.longPress) {
      longPressTimer = setTimeout(() => {
        handlers.longPress(event)
        state.value = GestureState.RECOGNIZED
      }, opts.longPressDelay)
    }
    
    // 捏合检测（双指）
    if (event.touches.length === 2 && handlers.pinch) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      initialDistance = getDistance(touch1, touch2)
    }
    
    state.value = GestureState.PENDING
  }
  
  /**
   * 触摸移动
   */
  function handleTouchMove(event) {
    if (opts.preventDefault) {
      event.preventDefault()
    }
    
    // 取消长按
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    
    // 捏合手势
    if (event.touches.length === 2 && handlers.pinch) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      const currentDistance = getDistance(touch1, touch2)
      const scale = currentDistance / initialDistance
      
      if (Math.abs(scale - 1) > opts.pinchThreshold) {
        handlers.pinch({ scale, event })
        state.value = GestureState.RECOGNIZED
      }
    }
    
    // 滑动手势
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const deltaX = touch.clientX - touchStartX
      const deltaY = touch.clientY - touchStartY
      
      // 调用滑动中回调
      if (handlers.swipeMove) {
        handlers.swipeMove({ deltaX, deltaY, event })
      }
    }
  }
  
  /**
   * 触摸结束
   */
  function handleTouchEnd(event) {
    // 清除长按计时器
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    
    if (state.value === GestureState.PENDING) {
      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - touchStartX
      const deltaY = touch.clientY - touchStartY
      const deltaTime = Date.now() - touchStartTime
      
      // 判断是否为滑动
      if (
        deltaTime < opts.swipeTimeout &&
        (Math.abs(deltaX) > opts.swipeThreshold || Math.abs(deltaY) > opts.swipeThreshold)
      ) {
        // 确定滑动方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // 水平滑动
          if (deltaX > 0) {
            if (handlers.swipeRight) {
              handlers.swipeRight({ deltaX, deltaY, event })
            }
          } else {
            if (handlers.swipeLeft) {
              handlers.swipeLeft({ deltaX, deltaY, event })
            }
          }
        } else {
          // 垂直滑动
          if (deltaY > 0) {
            if (handlers.swipeDown) {
              handlers.swipeDown({ deltaX, deltaY, event })
            }
          } else {
            if (handlers.swipeUp) {
              handlers.swipeUp({ deltaX, deltaY, event })
            }
          }
        }
        
        state.value = GestureState.RECOGNIZED
      } else {
        // 点击
        if (handlers.tap && deltaTime < opts.swipeTimeout) {
          handlers.tap(event)
        }
      }
    }
    
    state.value = GestureState.IDLE
  }
  
  /**
   * 计算两点间距离
   */
  function getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX
    const dy = touch2.clientY - touch1.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  /**
   * 添加事件监听
   */
  function addListeners() {
    const element = targetRef.value
    if (!element) return
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
  }
  
  /**
   * 移除事件监听
   */
  function removeListeners() {
    const element = targetRef.value
    if (!element) return
    
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
  }
  
  // 生命周期
  onMounted(() => {
    addListeners()
  })
  
  onUnmounted(() => {
    removeListeners()
    if (longPressTimer) {
      clearTimeout(longPressTimer)
    }
  })
  
  return {
    state,
    addListeners,
    removeListeners
  }
}

/**
 * 使用滑动手势（简化版）
 * @param {Ref} targetRef 目标元素引用
 * @param {Object} handlers 处理函数 { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown }
 */
export function useSwipe(targetRef, handlers) {
  return useGestures(targetRef, {
    swipeLeft: handlers.onSwipeLeft,
    swipeRight: handlers.onSwipeRight,
    swipeUp: handlers.onSwipeUp,
    swipeDown: handlers.onSwipeDown
  })
}

/**
 * 使用双击手势
 * @param {Ref} targetRef 目标元素引用
 * @param {Function} onDoubleTap 双击回调
 */
export function useDoubleTap(targetRef, onDoubleTap) {
  return useGestures(targetRef, {
    doubleTap: onDoubleTap
  })
}

/**
 * 使用长按手势
 * @param {Ref} targetRef 目标元素引用
 * @param {Function} onLongPress 长按回调
 * @param {Number} delay 长按时长
 */
export function useLongPress(targetRef, onLongPress, delay = 500) {
  return useGestures(targetRef, {
    longPress: onLongPress
  }, {
    longPressDelay: delay
  })
}

/**
 * 使用捏合缩放手势
 * @param {Ref} targetRef 目标元素引用
 * @param {Function} onPinch 捏合回调
 */
export function usePinch(targetRef, onPinch) {
  return useGestures(targetRef, {
    pinch: onPinch
  })
}

export default useGestures


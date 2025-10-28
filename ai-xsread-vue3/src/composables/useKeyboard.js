/**
 * 键盘快捷键 Composable
 * 实现全键盘操作支持
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

export function useKeyboard() {
  const router = useRouter()
  const showKeyboardHelp = ref(false)
  
  // 全局按键处理
  function handleGlobalKeydown(e) {
    // 忽略输入框中的按键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return
    }
    
    // 忽略有修饰键的情况（除了指定的组合键）
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return
    }
    
    switch(e.key) {
      case '?':
        // 显示/隐藏快捷键帮助
        showKeyboardHelp.value = !showKeyboardHelp.value
        e.preventDefault()
        break
        
      case '/':
        // 聚焦搜索框
        focusSearchBox()
        e.preventDefault()
        break
        
      case 'h':
      case 'H':
        // 返回首页
        router.push('/')
        break
        
      case 'b':
      case 'B':
        // 打开书架
        router.push('/bookshelf')
        break
        
      case 'r':
      case 'R':
        // 打开推荐
        router.push('/recommend')
        break
        
      case 'p':
      case 'P':
        // 个人中心
        router.push('/profile')
        break
        
      case 'Escape':
        // 关闭弹窗/退出全屏
        closeModals()
        if (document.fullscreenElement) {
          document.exitFullscreen()
        }
        break
    }
  }
  
  // 聚焦搜索框
  function focusSearchBox() {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="搜索"]')
    if (searchInput) {
      searchInput.focus()
    }
  }
  
  // 关闭所有模态框
  function closeModals() {
    // 触发关闭事件
    document.dispatchEvent(new CustomEvent('close-modals'))
  }
  
  onMounted(() => {
    document.addEventListener('keydown', handleGlobalKeydown)
  })
  
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleGlobalKeydown)
  })
  
  return {
    showKeyboardHelp
  }
}

/**
 * 阅读页键盘快捷键
 */
export function useReadingKeyboard(options = {}) {
  const {
    onPrevChapter = () => {},
    onNextChapter = () => {},
    onToggleFullscreen = () => {},
    onToggleSettings = () => {},
    onToggleMenu = () => {},
    onToggleTheme = () => {}
  } = options
  
  function handleReadingKeydown(e) {
    // 忽略输入框
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return
    }
    
    switch(e.key) {
      case 'ArrowLeft':
        // 上一章
        onPrevChapter()
        e.preventDefault()
        break
        
      case 'ArrowRight':
        // 下一章
        onNextChapter()
        e.preventDefault()
        break
        
      case ' ':
        // 空格键滚动
        if (e.shiftKey) {
          // Shift + Space: 向上滚动
          window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' })
        } else {
          // Space: 向下滚动
          window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
        }
        e.preventDefault()
        break
        
      case 'f':
      case 'F':
        // 全屏
        onToggleFullscreen()
        e.preventDefault()
        break
        
      case 's':
      case 'S':
        // 设置
        onToggleSettings()
        e.preventDefault()
        break
        
      case 'm':
      case 'M':
        // 目录
        onToggleMenu()
        e.preventDefault()
        break
        
      case 'd':
      case 'D':
        // 切换主题
        onToggleTheme()
        e.preventDefault()
        break
    }
  }
  
  onMounted(() => {
    document.addEventListener('keydown', handleReadingKeydown)
  })
  
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleReadingKeydown)
  })
  
  return {
    handleReadingKeydown
  }
}

/**
 * 焦点陷阱（模态框）
 */
export function useFocusTrap(containerRef) {
  let previousFocusedElement = null
  const firstFocusable = ref(null)
  const lastFocusable = ref(null)
  
  // 获取可聚焦元素
  function getFocusableElements() {
    if (!containerRef.value) return []
    
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    return Array.from(containerRef.value.querySelectorAll(selector))
      .filter(el => !el.hasAttribute('disabled'))
  }
  
  // 激活焦点陷阱
  function activate() {
    previousFocusedElement = document.activeElement
    
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      firstFocusable.value = focusableElements[0]
      lastFocusable.value = focusableElements[focusableElements.length - 1]
      
      // 聚焦第一个元素
      setTimeout(() => {
        firstFocusable.value?.focus()
      }, 100)
    }
  }
  
  // 停用焦点陷阱
  function deactivate() {
    previousFocusedElement?.focus()
  }
  
  // Tab键处理
  function handleTab(e) {
    if (e.key !== 'Tab') return
    
    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }
  
  return {
    activate,
    deactivate,
    handleTab
  }
}


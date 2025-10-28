/**
 * 事件监听器 Composable
 * 自动清理事件监听器，防止内存泄漏
 */
import { onBeforeUnmount, onUnmounted } from 'vue'

/**
 * 使用事件监听器（自动清理）
 * @param {EventTarget} target 目标元素
 * @param {string} event 事件名称
 * @param {Function} handler 事件处理函数
 * @param {Object} options 事件选项
 */
export function useEventListener(target, event, handler, options = {}) {
  // 添加事件监听
  target.addEventListener(event, handler, options)
  
  // 组件卸载时自动清理
  onBeforeUnmount(() => {
    target.removeEventListener(event, handler, options)
  })
  
  // 返回清理函数（可选手动清理）
  return () => {
    target.removeEventListener(event, handler, options)
  }
}

/**
 * 使用窗口事件监听器
 * @param {string} event 事件名称
 * @param {Function} handler 事件处理函数
 * @param {Object} options 事件选项
 */
export function useWindowListener(event, handler, options = {}) {
  return useEventListener(window, event, handler, options)
}

/**
 * 使用文档事件监听器
 * @param {string} event 事件名称
 * @param {Function} handler 事件处理函数
 * @param {Object} options 事件选项
 */
export function useDocumentListener(event, handler, options = {}) {
  return useEventListener(document, event, handler, options)
}


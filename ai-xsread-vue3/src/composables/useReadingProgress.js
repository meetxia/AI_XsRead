/**
 * 阅读进度管理 Composable
 * 记录和同步阅读进度、书签等信息
 */

import { ref, onMounted } from 'vue'
import { throttle } from 'lodash-es'
import {
  getReadingProgress,
  updateReadingProgress
} from '@/api/readingProgress'

// 存储键前缀
const STORAGE_KEY_PREFIX = 'reading-progress-'
const BOOKMARKS_KEY_PREFIX = 'bookmarks-'

/**
 * 纯函数：根据 updatedAt 选择 local / server 中较新的一份进度。
 * 若两侧 updatedAt 相等（包括都为 0 / undefined），优先 local；
 * 若一侧为 null/undefined，返回另一侧；都为空返回 null。
 *
 * @param {Object|null} local
 * @param {Object|null} server
 * @returns {Object|null}
 */
export function mergeProgress(local, server) {
  if (!local && !server) return null
  if (!local) return server
  if (!server) return local
  const localTs = Number(local.updatedAt) || 0
  const serverTs = Number(server.updatedAt) || 0
  if (serverTs > localTs) return server
  // server <= local → prefer local（包括等值情况）
  return local
}

/**
 * 阅读进度 Hook
 * @param {string|number} novelId - 小说ID
 */
export const useReadingProgress = (novelId) => {
  const progress = ref(null)
  const bookmarks = ref([])
  
  // 构造存储键
  const progressKey = `${STORAGE_KEY_PREFIX}${novelId}`
  const bookmarksKey = `${BOOKMARKS_KEY_PREFIX}${novelId}`
  
  /**
   * 加载进度
   */
  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(progressKey)
      if (saved) {
        progress.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载阅读进度失败:', error)
    }
  }
  
  /**
   * 同步到服务器（受 throttle 保护，1500ms 内多次调用合并为一次请求）
   * 失败不影响本地存储；只在 console.warn 提示。
   */
  const syncProgressToServer = async (id, data) => {
    try {
      await updateReadingProgress({ novelId: id, ...data })
    } catch (error) {
      console.warn('同步阅读进度失败（本地已保存，将在下次成功时覆盖）:', error?.message || error)
    }
  }

  // 1500ms 节流，避免每次翻页都打后端
  const throttledSyncProgress = throttle(syncProgressToServer, 1500, {
    leading: false,
    trailing: true
  })

  /**
   * 保存进度（本地立即保存 + 服务器节流同步）
   * @param {Object} progressData - 进度数据
   */
  const saveProgress = (progressData) => {
    try {
      const data = {
        ...progressData,
        updatedAt: Date.now()
      }

      progress.value = data

      // 保存到本地（立即生效，离线可读）
      localStorage.setItem(progressKey, JSON.stringify(data))

      // 节流同步到服务器（失败不影响本地）
      throttledSyncProgress(novelId, data)

    } catch (error) {
      console.error('保存阅读进度失败:', error)
    }
  }

  /**
   * 获取进度
   */
  const getProgress = () => {
    return progress.value
  }

  /**
   * 计算阅读百分比
   * @param {number} currentChapter - 当前章节
   * @param {number} totalChapters - 总章节数
   */
  const calculateProgress = (currentChapter, totalChapters) => {
    if (!totalChapters) return 0
    return Math.round((currentChapter / totalChapters) * 100)
  }

  /**
   * 从服务器获取进度
   * 失败不影响本地（返回 null 走本地兜底）
   */
  const fetchProgressFromServer = async (id) => {
    try {
      const response = await getReadingProgress(id)
      return response?.data ?? null
    } catch (error) {
      console.warn('获取服务器进度失败（使用本地兜底）:', error?.message || error)
      return null
    }
  }
  
  /**
   * 合并本地和服务器进度
   */
  const mergeProgress = async () => {
    const serverProgress = await fetchProgressFromServer(novelId)
    
    if (!serverProgress) {
      return
    }
    
    // 使用最新的进度
    const localTime = progress.value?.updatedAt || 0
    const serverTime = serverProgress.updatedAt || 0
    
    if (serverTime > localTime) {
      progress.value = serverProgress
      localStorage.setItem(progressKey, JSON.stringify(serverProgress))
    }
  }
  
  /**
   * 加载书签列表
   */
  const loadBookmarks = () => {
    try {
      const saved = localStorage.getItem(bookmarksKey)
      if (saved) {
        bookmarks.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载书签失败:', error)
    }
  }
  
  /**
   * 添加书签
   * @param {Object} bookmark - 书签数据
   */
  const addBookmark = (bookmark) => {
    try {
      const newBookmark = {
        id: Date.now(),
        ...bookmark,
        createdAt: Date.now()
      }

      bookmarks.value.unshift(newBookmark)

      // 保存到本地
      localStorage.setItem(bookmarksKey, JSON.stringify(bookmarks.value))

      // 注意：书签云端同步走 api/bookmarks.js，不在本 Track A 范围内，
      // 留给"书签同步"专项 Track 处理；当前仅保留本地存储。

      return newBookmark
    } catch (error) {
      console.error('添加书签失败:', error)
      return null
    }
  }

  /**
   * 删除书签
   * @param {number|string} bookmarkId - 书签ID
   */
  const removeBookmark = (bookmarkId) => {
    try {
      bookmarks.value = bookmarks.value.filter(b => b.id !== bookmarkId)

      // 保存到本地
      localStorage.setItem(bookmarksKey, JSON.stringify(bookmarks.value))

      // 注意：书签云端同步走 api/bookmarks.js，不在本 Track A 范围内，
      // 留给"书签同步"专项 Track 处理；当前仅保留本地存储。

    } catch (error) {
      console.error('删除书签失败:', error)
    }
  }
  
  /**
   * 检查是否已添加书签
   * @param {number|string} chapterId - 章节ID
   * @param {number} position - 位置
   */
  const hasBookmark = (chapterId, position) => {
    return bookmarks.value.some(
      b => b.chapterId === chapterId && Math.abs(b.position - position) < 10
    )
  }
  
  /**
   * 获取章节的书签列表
   * @param {number|string} chapterId - 章节ID
   */
  const getChapterBookmarks = (chapterId) => {
    return bookmarks.value.filter(b => b.chapterId === chapterId)
  }
  
  // 组件挂载时加载数据
  onMounted(() => {
    loadProgress()
    loadBookmarks()
    mergeProgress()
  })
  
  return {
    // 进度相关
    progress,
    saveProgress,
    getProgress,
    calculateProgress,
    
    // 书签相关
    bookmarks,
    addBookmark,
    removeBookmark,
    hasBookmark,
    getChapterBookmarks
  }
}

/**
 * 阅读历史记录 Hook
 */
export const useReadingHistory = () => {
  const HISTORY_KEY = 'reading-history'
  const MAX_HISTORY = 50
  
  const history = ref([])
  
  /**
   * 加载阅读历史
   */
  const loadHistory = () => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        history.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载阅读历史失败:', error)
    }
  }
  
  /**
   * 添加阅读记录
   * @param {Object} novel - 小说信息
   */
  const addHistory = (novel) => {
    try {
      // 移除旧记录
      history.value = history.value.filter(h => h.id !== novel.id)
      
      // 添加新记录到开头
      history.value.unshift({
        ...novel,
        lastReadAt: Date.now()
      })
      
      // 限制历史记录数量
      if (history.value.length > MAX_HISTORY) {
        history.value = history.value.slice(0, MAX_HISTORY)
      }
      
      // 保存
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
      
    } catch (error) {
      console.error('添加阅读历史失败:', error)
    }
  }
  
  /**
   * 清空阅读历史
   */
  const clearHistory = () => {
    history.value = []
    localStorage.removeItem(HISTORY_KEY)
  }
  
  /**
   * 删除单条历史记录
   * @param {number|string} novelId - 小说ID
   */
  const removeHistory = (novelId) => {
    history.value = history.value.filter(h => h.id !== novelId)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  }
  
  onMounted(() => {
    loadHistory()
  })
  
  return {
    history,
    addHistory,
    clearHistory,
    removeHistory
  }
}

export default useReadingProgress


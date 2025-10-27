/**
 * 阅读进度管理 Composable
 * 记录和同步阅读进度、书签等信息
 */

import { ref, onMounted } from 'vue'

// 存储键前缀
const STORAGE_KEY_PREFIX = 'reading-progress-'
const BOOKMARKS_KEY_PREFIX = 'bookmarks-'

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
   * 保存进度
   * @param {Object} progressData - 进度数据
   */
  const saveProgress = (progressData) => {
    try {
      const data = {
        ...progressData,
        updatedAt: Date.now()
      }
      
      progress.value = data
      
      // 保存到本地
      localStorage.setItem(progressKey, JSON.stringify(data))
      
      // TODO: 同步到服务器
      syncProgressToServer(novelId, data)
      
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
   * 同步到服务器
   */
  const syncProgressToServer = async (novelId, data) => {
    try {
      // TODO: 调用API同步进度
      // await saveReadingProgress(novelId, data)
      console.log('同步进度到服务器:', novelId, data)
    } catch (error) {
      console.error('同步进度失败:', error)
    }
  }
  
  /**
   * 从服务器获取进度
   */
  const fetchProgressFromServer = async (novelId) => {
    try {
      // TODO: 调用API获取进度
      // const response = await getReadingProgress(novelId)
      // return response.data
      return null
    } catch (error) {
      console.error('获取服务器进度失败:', error)
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
      
      // TODO: 同步到服务器
      
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
      
      // TODO: 同步到服务器
      
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


import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getBookshelf, 
  addToBookshelf, 
  updateBookshelf, 
  removeFromBookshelf,
  batchDeleteBookshelf,
  checkInBookshelf
} from '@/api/bookshelf'

export const useBookshelfStore = defineStore('bookshelf', () => {
  // 状态
  const reading = ref([]) // 正在读
  const finished = ref([]) // 已读完
  const collected = ref([]) // 收藏
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const totalCount = computed(() => {
    return reading.value.length + finished.value.length + collected.value.length
  })

  const readingCount = computed(() => reading.value.length)
  const finishedCount = computed(() => finished.value.length)
  const collectedCount = computed(() => collected.value.length)

  // 获取书架数据
  async function fetchBookshelf() {
    loading.value = true
    error.value = null
    try {
      // 优先从本地获取
      const localData = loadFromLocal()
      if (localData) {
        reading.value = localData.reading || []
        finished.value = localData.finished || []
        collected.value = localData.collected || []
      }

      // 从服务器同步
      const res = await getBookshelf()
      if (res.code === 200) {
        const data = res.data
        reading.value = data.reading || []
        finished.value = data.finished || []
        collected.value = data.collected || []
        
        // 保存到本地
        saveToLocal()
      }
    } catch (err) {
      error.value = err.message
      console.error('获取书架失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 添加到书架
  async function addBook(novel, type = 'reading') {
    try {
      // 检查是否已存在
      if (isInBookshelf(novel.id)) {
        throw new Error('该书已在书架中')
      }

      // 添加到本地
      const bookItem = {
        ...novel,
        addTime: Date.now(),
        lastReadTime: Date.now(),
        readProgress: 0,
        currentChapter: 0
      }

      if (type === 'reading') {
        reading.value.unshift(bookItem)
      } else if (type === 'finished') {
        finished.value.unshift(bookItem)
      } else if (type === 'collected') {
        collected.value.unshift(bookItem)
      }

      saveToLocal()

      // 同步到服务器
      await addToBookshelf({
        novelId: novel.id,
        type,
        ...bookItem
      })

      return true
    } catch (err) {
      error.value = err.message
      console.error('添加到书架失败:', err)
      return false
    }
  }

  // 移除书籍
  async function removeBook(id, type) {
    try {
      let targetArray
      if (type === 'reading') {
        targetArray = reading
      } else if (type === 'finished') {
        targetArray = finished
      } else if (type === 'collected') {
        targetArray = collected
      }

      const index = targetArray.value.findIndex(book => book.id === id)
      if (index > -1) {
        targetArray.value.splice(index, 1)
        saveToLocal()
      }

      // 同步到服务器
      await removeFromBookshelf(id)
      return true
    } catch (err) {
      error.value = err.message
      console.error('移除书籍失败:', err)
      return false
    }
  }

  // 更新阅读状态
  async function updateReadingStatus(id, updates) {
    try {
      // 在所有分类中查找并更新
      const allBooks = [
        ...reading.value,
        ...finished.value,
        ...collected.value
      ]
      
      const book = allBooks.find(b => b.id === id)
      if (book) {
        Object.assign(book, updates)
        saveToLocal()

        // 同步到服务器
        await updateBookshelf(id, updates)
      }
      return true
    } catch (err) {
      error.value = err.message
      console.error('更新状态失败:', err)
      return false
    }
  }

  // 移动书籍到不同分类
  async function moveBook(id, fromType, toType) {
    try {
      let fromArray, toArray
      
      if (fromType === 'reading') fromArray = reading
      else if (fromType === 'finished') fromArray = finished
      else if (fromType === 'collected') fromArray = collected

      if (toType === 'reading') toArray = reading
      else if (toType === 'finished') toArray = finished
      else if (toType === 'collected') toArray = collected

      const index = fromArray.value.findIndex(book => book.id === id)
      if (index > -1) {
        const book = fromArray.value.splice(index, 1)[0]
        book.type = toType
        book.updateTime = Date.now()
        toArray.value.unshift(book)
        saveToLocal()

        // 同步到服务器
        await updateBookshelf(id, { type: toType })
      }
      return true
    } catch (err) {
      error.value = err.message
      console.error('移动书籍失败:', err)
      return false
    }
  }

  // 批量删除
  async function batchDelete(ids) {
    try {
      reading.value = reading.value.filter(book => !ids.includes(book.id))
      finished.value = finished.value.filter(book => !ids.includes(book.id))
      collected.value = collected.value.filter(book => !ids.includes(book.id))
      
      saveToLocal()

      // 同步到服务器
      await batchDeleteBookshelf(ids)
      return true
    } catch (err) {
      error.value = err.message
      console.error('批量删除失败:', err)
      return false
    }
  }

  // 排序书架
  function sortBookshelf(type, sortBy) {
    let targetArray
    if (type === 'reading') targetArray = reading
    else if (type === 'finished') targetArray = finished
    else if (type === 'collected') targetArray = collected

    if (!targetArray) return

    switch (sortBy) {
      case 'lastRead':
        targetArray.value.sort((a, b) => b.lastReadTime - a.lastReadTime)
        break
      case 'addTime':
        targetArray.value.sort((a, b) => b.addTime - a.addTime)
        break
      case 'updateTime':
        targetArray.value.sort((a, b) => b.updateTime - a.updateTime)
        break
      case 'title':
        targetArray.value.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        break
    }

    saveToLocal()
  }

  // 搜索书架
  function searchBookshelf(keyword) {
    const allBooks = [
      ...reading.value,
      ...finished.value,
      ...collected.value
    ]
    
    if (!keyword) return allBooks

    const lowerKeyword = keyword.toLowerCase()
    return allBooks.filter(book => 
      book.title.toLowerCase().includes(lowerKeyword) ||
      book.author.toLowerCase().includes(lowerKeyword)
    )
  }

  // 检查是否在书架中
  function isInBookshelf(novelId) {
    const allBooks = [
      ...reading.value,
      ...finished.value,
      ...collected.value
    ]
    return allBooks.some(book => book.id === novelId)
  }

  // 获取书籍详情
  function getBookById(id) {
    const allBooks = [
      ...reading.value,
      ...finished.value,
      ...collected.value
    ]
    return allBooks.find(book => book.id === id)
  }

  // 保存到本地存储
  function saveToLocal() {
    const data = {
      reading: reading.value,
      finished: finished.value,
      collected: collected.value,
      timestamp: Date.now()
    }
    localStorage.setItem('bookshelf', JSON.stringify(data))
  }

  // 从本地存储加载
  function loadFromLocal() {
    try {
      const data = localStorage.getItem('bookshelf')
      if (data) {
        return JSON.parse(data)
      }
    } catch (err) {
      console.error('加载本地书架失败:', err)
    }
    return null
  }

  // 清空书架
  function clearBookshelf() {
    reading.value = []
    finished.value = []
    collected.value = []
    localStorage.removeItem('bookshelf')
  }

  return {
    // 状态
    reading,
    finished,
    collected,
    loading,
    error,
    
    // 计算属性
    totalCount,
    readingCount,
    finishedCount,
    collectedCount,
    
    // 方法
    fetchBookshelf,
    addBook,
    removeBook,
    updateReadingStatus,
    moveBook,
    batchDelete,
    sortBookshelf,
    searchBookshelf,
    isInBookshelf,
    getBookById,
    clearBookshelf
  }
})

# UI 组件快速参考卡

> 快速查找和使用文字之境 UI 组件

---

## 🎯 组件速查表

| 组件名 | 位置 | 用途 | 导入 |
|-------|------|------|------|
| **LazyImage** | `common/LazyImage.vue` | 图片懒加载 | `import LazyImage from '@/components/common/LazyImage.vue'` |
| **SkeletonScreen** | `common/SkeletonScreen.vue` | 骨架屏 | `import SkeletonScreen from '@/components/common/SkeletonScreen.vue'` |
| **EmptyState** | `common/EmptyState.vue` | 空状态 | `import EmptyState from '@/components/common/EmptyState.vue'` |
| **Loading** | `common/Loading.vue` | 加载动画 | `import Loading from '@/components/common/Loading.vue'` |
| **Toast** | `common/Toast.vue` | 消息提示 | `import toast from '@/utils/toast'` |
| **Notification** | `common/Notification.vue` | 通知系统 | `import Notification from '@/components/common/Notification.vue'` |
| **Breadcrumb** | `common/Breadcrumb.vue` | 面包屑 | `import Breadcrumb from '@/components/common/Breadcrumb.vue'` |
| **BackToTop** | `common/BackToTop.vue` | 返回顶部 | `import BackToTop from '@/components/common/BackToTop.vue'` |
| **LikeButton** | `common/LikeButton.vue` | 点赞按钮 | `import LikeButton from '@/components/common/LikeButton.vue'` |
| **KeyboardHelp** | `common/KeyboardHelp.vue` | 键盘帮助 | `import KeyboardHelp from '@/components/common/KeyboardHelp.vue'` |
| **NovelCardEnhanced** | `novel/NovelCardEnhanced.vue` | 增强卡片 | `import NovelCardEnhanced from '@/components/novel/NovelCardEnhanced.vue'` |
| **FilterPanel** | `novel/FilterPanel.vue` | 筛选面板 | `import FilterPanel from '@/components/novel/FilterPanel.vue'` |
| **SearchSuggestions** | `search/SearchSuggestions.vue` | 搜索建议 | `import SearchSuggestions from '@/components/search/SearchSuggestions.vue'` |
| **ReadingProgress** | `reading/ReadingProgress.vue` | 阅读进度 | `import ReadingProgress from '@/components/reading/ReadingProgress.vue'` |
| **EyeCareMode** | `reading/EyeCareMode.vue` | 护眼模式 | `import EyeCareMode from '@/components/reading/EyeCareMode.vue'` |
| **ReadingPresets** | `reading/ReadingPresets.vue` | 阅读预设 | `import ReadingPresets from '@/components/reading/ReadingPresets.vue'` |

---

## ⚡ 一行代码示例

### 基础组件

```vue
<!-- 图片懒加载 -->
<LazyImage :src="url" alt="描述" />

<!-- 骨架屏 -->
<SkeletonScreen type="novel-card" :count="6" />

<!-- 空状态 -->
<EmptyState type="bookshelf-empty" @action="goHome" />

<!-- 加载动画 -->
<Loading variant="book" text="加载中..." />

<!-- 面包屑 -->
<Breadcrumb />

<!-- 返回顶部 -->
<BackToTop />

<!-- 点赞按钮 -->
<LikeButton :liked="isLiked" :count="likes" @like="handleLike" />
```

### JS 调用

```javascript
// Toast 提示
toast.success('addToBookshelf')
toast.error('network')
toast.warning('unsaved')
toast.info('loading')

// 键盘快捷键
import { useKeyboard } from '@/composables/useKeyboard'
const { showKeyboardHelp } = useKeyboard()
```

---

## 🎨 常用场景

### 场景 1: 列表加载

```vue
<SkeletonScreen v-if="loading" type="novel-card" :count="12" />
<div v-else-if="list.length">
  <!-- 列表内容 -->
</div>
<EmptyState v-else type="no-data" />
```

### 场景 2: 表单提交

```javascript
async function handleSubmit() {
  try {
    await submitForm()
    toast.success('保存成功 ✓')
  } catch (error) {
    toast.error('保存失败，请重试')
  }
}
```

### 场景 3: 图片展示

```vue
<LazyImage
  :src="novel.cover"
  :alt="novel.title"
  placeholder="/placeholder.jpg"
  error-image="/error.jpg"
  @load="handleImageLoad"
/>
```

---

## 📦 完整组件列表

### 通用组件 (10个)

- ✅ LazyImage - 图片懒加载
- ✅ SkeletonScreen - 骨架屏
- ✅ EmptyState - 空状态
- ✅ Loading - 加载动画
- ✅ Toast - 消息提示
- ✅ Notification - 通知系统
- ✅ Breadcrumb - 面包屑导航
- ✅ BackToTop - 返回顶部
- ✅ LikeButton - 点赞按钮
- ✅ KeyboardHelp - 键盘帮助

### 业务组件 (6个)

- ✅ NovelCardEnhanced - 增强小说卡片
- ✅ FilterPanel - 筛选面板
- ✅ SearchSuggestions - 搜索建议
- ✅ ReadingProgress - 阅读进度
- ✅ EyeCareMode - 护眼模式
- ✅ ReadingPresets - 阅读预设

### 工具函数 (2个)

- ✅ toast.js - Toast 工具
- ✅ useKeyboard.js - 键盘快捷键

---

## 🎯 快速复制

### Toast

```javascript
import toast from '@/utils/toast'
toast.success('操作成功')
```

### Loading

```vue
<Loading variant="book" :fullscreen="true" />
```

### Empty

```vue
<EmptyState type="bookshelf-empty" @action="action" />
```

### Skeleton

```vue
<SkeletonScreen type="novel-card" :count="6" />
```

---

**文档版本**: 1.0.0  
**更新日期**: 2025-10-28


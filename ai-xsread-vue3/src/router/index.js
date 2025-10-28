import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "home" */ '@/views/HomePage.vue'),
      meta: { 
        title: '首页',
        keepAlive: true // 缓存页面
      }
    },
    {
      path: '/recommend',
      name: 'recommend',
      component: () => import(/* webpackChunkName: "recommend" */ '@/views/RecommendPage.vue'),
      meta: { 
        title: '推荐',
        keepAlive: false
      }
    },
    {
      path: '/bookshelf',
      name: 'bookshelf',
      component: () => import(/* webpackChunkName: "bookshelf" */ '@/views/BookshelfPage.vue'),
      meta: { 
        title: '书架',
        keepAlive: true,
        requiresAuth: true // 需要登录
      }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import(/* webpackChunkName: "profile" */ '@/views/ProfilePage.vue'),
      meta: { 
        title: '我的',
        keepAlive: true,
        requiresAuth: true
      }
    },
    {
      path: '/security',
      name: 'security',
      component: () => import(/* webpackChunkName: "security" */ '@/views/SecurityPage.vue'),
      meta: { 
        title: '账号安全',
        keepAlive: false,
        requiresAuth: true
      }
    },
    {
      path: '/reading/:id',
      name: 'reading',
      component: () => import(/* webpackChunkName: "reading" */ '@/views/ReadingPage.vue'),
      meta: { 
        title: '阅读',
        keepAlive: false // 阅读页不缓存
      }
    },
    {
      path: '/read/:id/:chapter?',
      name: 'read',
      component: () => import(/* webpackChunkName: "reading" */ '@/views/ReadingPage.vue'),
      meta: { 
        title: '阅读',
        keepAlive: false
      }
    },
    {
      path: '/search',
      name: 'search',
      component: () => import(/* webpackChunkName: "search" */ '@/views/SearchPage.vue'),
      meta: { 
        title: '搜索',
        keepAlive: false
      }
    },
    {
      path: '/novel/:id',
      name: 'novel-detail',
      component: () => import(/* webpackChunkName: "novel-detail" */ '@/views/NovelDetailPage.vue'),
      meta: { 
        title: '小说详情',
        keepAlive: false
      }
    },
    {
      path: '/author/:id',
      name: 'author',
      component: () => import(/* webpackChunkName: "author" */ '@/views/AuthorPage.vue'),
      meta: { 
        title: '作者',
        keepAlive: false
      }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import(/* webpackChunkName: "auth" */ '@/views/LoginPage.vue'),
      meta: { 
        title: '登录',
        keepAlive: false
      }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import(/* webpackChunkName: "auth" */ '@/views/RegisterPage.vue'),
      meta: { 
        title: '注册',
        keepAlive: false
      }
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import(/* webpackChunkName: "upload" */ '@/views/UploadNovelPage.vue'),
      meta: { 
        title: '上传小说',
        keepAlive: false,
        requiresAuth: true
      }
    }
  ],
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 设置页面标题
router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 文字之境`
  }
})

export default router


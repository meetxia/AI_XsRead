import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',           name: 'home',         component: () => import('@/views/HomePage.vue'),         meta: { title: '首页',     keepAlive: true } },
    { path: '/recommend',  name: 'recommend',    component: () => import('@/views/RecommendPage.vue'),    meta: { title: '发现',     keepAlive: true } },
    { path: '/discover',   redirect: '/recommend' },
    { path: '/bookshelf',  name: 'bookshelf',    component: () => import('@/views/BookshelfPage.vue'),    meta: { title: '我的书架', keepAlive: true, requiresAuth: false } },
    { path: '/history',    name: 'history',      component: () => import('@/views/HistoryPage.vue'),      meta: { title: '浏览记录', keepAlive: true, requiresAuth: false } },
    { path: '/profile',    name: 'profile',      component: () => import('@/views/ProfilePage.vue'),      meta: { title: '我的',     keepAlive: true } },
    { path: '/security',   name: 'security',     component: () => import('@/views/SecurityPage.vue'),     meta: { title: '账号安全', requiresAuth: true } },

    // 阅读
    { path: '/reading/:id',         name: 'reading',  component: () => import('@/views/ReadingPage.vue'), meta: { title: '阅读', keepAlive: false } },
    { path: '/read/:id/:chapter?',  name: 'read',     component: () => import('@/views/ReadingPage.vue'), meta: { title: '阅读', keepAlive: false } },

    // 详情/搜索/作者
    { path: '/search',         name: 'search',       component: () => import('@/views/SearchPage.vue'),     meta: { title: '搜索' } },
    { path: '/novel/:id',      name: 'novel-detail', component: () => import('@/views/NovelDetailPage.vue'),meta: { title: '小说详情' } },
    { path: '/author/:id',     name: 'author',       component: () => import('@/views/AuthorPage.vue'),     meta: { title: '作者' } },

    // 鉴权
    { path: '/login',     name: 'login',     component: () => import('@/views/LoginPage.vue'),     meta: { title: '登录' } },
    { path: '/register',  name: 'register',  component: () => import('@/views/RegisterPage.vue'),  meta: { title: '注册' } },

    // 其它
    { path: '/upload',    name: 'upload',    component: () => import('@/views/UploadNovelPage.vue'), meta: { title: '上传小说', requiresAuth: true } },

    // 兜底
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

router.afterEach((to) => {
  if (to.meta?.title) document.title = `${to.meta.title} - 文字之境`
})

export default router

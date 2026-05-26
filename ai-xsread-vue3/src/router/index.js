import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',           name: 'home',         component: () => import('@/views/HomePage.vue'),         meta: { title: '首页',     keepAlive: true } },
    { path: '/recommend',  name: 'recommend',    component: () => import('@/views/RecommendPage.vue'),    meta: { title: '分类',     keepAlive: true } },
    { path: '/discover',   redirect: '/recommend' },
    { path: '/bookshelf',  name: 'bookshelf',    component: () => import('@/views/BookshelfPage.vue'),    meta: { title: '我的书架', keepAlive: true, requiresAuth: true } },
    { path: '/history',    name: 'history',      component: () => import('@/views/HistoryPage.vue'),      meta: { title: '浏览记录', keepAlive: true, requiresAuth: false } },
    { path: '/profile',    name: 'profile',      component: () => import('@/views/ProfilePage.vue'),      meta: { title: '我的',     keepAlive: true } },
    { path: '/profile/achievements', name: 'achievements', component: () => import('@/views/AchievementsPage.vue'), meta: { title: '我的勋章', requiresAuth: true } },
    { path: '/profile/bookmarks', name: 'profile-bookmarks', component: () => import('@/views/ProfileListPage.vue'), meta: { title: '我的书签', requiresAuth: true, kind: 'bookmarks' } },
    { path: '/profile/highlights', name: 'profile-highlights', component: () => import('@/views/ProfileListPage.vue'), meta: { title: '我的划线', requiresAuth: true, kind: 'highlights' } },
    { path: '/profile/notes', name: 'profile-notes', component: () => import('@/views/ProfileListPage.vue'), meta: { title: '我的想法', requiresAuth: true, kind: 'notes' } },
    { path: '/profile/following-authors', name: 'profile-following-authors', component: () => import('@/views/FollowingAuthorsPage.vue'), meta: { title: '关注作者', requiresAuth: true } },
    { path: '/profile/membership', name: 'profile-membership', component: () => import('@/views/MembershipPage.vue'), meta: { title: '会员中心', requiresAuth: true } },
    { path: '/profile/edit', name: 'profile-edit', component: () => import('@/views/profile/ProfileEditPage.vue'), meta: { title: '编辑资料', requiresAuth: true } },
    { path: '/profile/preferences', name: 'profile-prefs', component: () => import('@/views/profile/PreferencesPage.vue'), meta: { title: '阅读偏好', requiresAuth: true } },
    { path: '/profile/notifications', name: 'notifications', component: () => import('@/views/profile/NotificationsPage.vue'), meta: { title: '通知中心', requiresAuth: true } },
    { path: '/about/help', name: 'help', component: () => import('@/views/profile/HelpPage.vue'), meta: { title: '帮助与反馈' } },
    { path: '/about', name: 'about', component: () => import('@/views/profile/AboutPage.vue'), meta: { title: '关于 MOMO小说' } },
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
    { path: '/forgot-password', name: 'forgot-password', component: () => import('@/views/ForgotPasswordPage.vue'), meta: { title: '忘记密码', requiresAuth: false } },
    { path: '/reset-password',  name: 'reset-password',  component: () => import('@/views/ResetPasswordPage.vue'),  meta: { title: '重置密码', requiresAuth: false } },
    { path: '/onboarding/interests', name: 'onboarding-interests', component: () => import('@/views/OnboardingInterestsPage.vue'), meta: { title: '选择兴趣', requiresAuth: true } },

    // 兜底
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

router.afterEach((to) => {
  if (to.meta?.title) document.title = `${to.meta.title} - MOMO小说`
  else document.title = 'MOMO小说 - 故事入境，杂念自消'
})

export default router

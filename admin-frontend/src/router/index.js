import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/Layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '数据看板', icon: 'Odometer' }
      },
      {
        path: 'novels',
        name: 'Novels',
        component: () => import('@/views/Content/NovelList.vue'),
        meta: { title: '小说管理', icon: 'Reading' }
      },
      {
        path: 'novels/create',
        name: 'NovelCreate',
        component: () => import('@/views/Content/NovelEdit.vue'),
        meta: { title: '创建小说', hidden: true }
      },
      {
        path: 'novels/edit/:id',
        name: 'NovelEdit',
        component: () => import('@/views/Content/NovelEdit.vue'),
        meta: { title: '编辑小说', hidden: true }
      },
      {
        path: 'chapters',
        name: 'Chapters',
        component: () => import('@/views/Content/ChapterList.vue'),
        meta: { title: '章节管理', icon: 'Document' }
      },
      {
        path: 'chapters/create',
        name: 'ChapterCreate',
        component: () => import('@/views/Content/ChapterEdit.vue'),
        meta: { title: '创建章节', hidden: true }
      },
      {
        path: 'chapters/edit/:id',
        name: 'ChapterEdit',
        component: () => import('@/views/Content/ChapterEdit.vue'),
        meta: { title: '编辑章节', hidden: true }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users/UserList.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('@/views/Users/UserDetail.vue'),
        meta: { title: '用户详情', hidden: true }
      },
      {
        path: 'comments',
        name: 'Comments',
        component: () => import('@/views/Comments/CommentList.vue'),
        meta: { title: '评论管理', icon: 'ChatDotRound' }
      },
      {
        path: 'codes',
        name: 'Codes',
        component: () => import('@/views/Codes/BatchList.vue'),
        meta: { title: '激活码', icon: 'Ticket' }
      },
      {
        path: 'codes/redemptions',
        name: 'CodeRedemptions',
        component: () => import('@/views/Codes/RedemptionList.vue'),
        meta: { title: '激活记录', icon: 'Histogram' }
      },
      {
        path: 'codes/:id(\\d+)',
        name: 'CodeBatchDetail',
        component: () => import('@/views/Codes/BatchDetail.vue'),
        meta: { title: '批次详情', hidden: true }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { title: '数据统计', icon: 'DataAnalysis' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings/index.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = getToken()
  
  if (to.meta.requiresAuth !== false) {
    if (!token) {
      next('/login')
    } else {
      next()
    }
  } else {
    if (token && to.path === '/login') {
      next('/')
    } else {
      next()
    }
  }
})

export default router

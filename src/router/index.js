import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },

  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [{
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/index'),
      meta: { title: '资源仪表盘', icon: 'dashboard' }
    }]
  }
]

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */
export const asyncRoutes = [
  {
    path: '/deployment',
    name: 'Deployment',
    component: Layout,
    meta: {
      title: '应用管理',
      icon: 'component'
    },
    redirect: '/deployment/custom',
    children: [
      {
        path: 'custom',
        name: 'Custom',
        component: () => import('@/views/deployment/custom/index'),
        meta: { title: '自建应用', icon: 'custom' }
      },
      {
        path: 'experiment',
        name: 'Experiment',
        component: () => import('@/views/deployment/experiment/index'),
        meta: { title: '实验任务', icon: 'lab' }
      },
      {
        path: 'template',
        name: 'Template',
        component: () => import('@/views/deployment/template/index'),
        meta: {
          roles: ['SYS_ADMIN', 'ORG_ADMIN'],
          title: '实验模板',
          icon: 'template'
        }
      }
    ]
  },

  {
    path: '/user',
    component: Layout,
    name: 'User',
    meta: { roles: ['SYS_ADMIN', 'ORG_ADMIN'] },
    children: [
      {
        path: 'index',
        component: () => import('@/views/user/index'),
        name: 'user',
        meta: {
          roles: ['SYS_ADMIN', 'ORG_ADMIN'],
          title: '用户管理',
          icon: 'peoples'
        }
      }
    ]
  },

  {
    path: '/resource',
    component: Layout,
    meta: {
      title: '资源配额',
      icon: 'cpu'
    },
    redirect: '/resource/application',
    children: [
      {
        path: 'application',
        name: 'Application',
        component: () => import('@/views/resource/application/index'),
        meta: {
          title: '配额申请',
          icon: 'form'
        }
      },
      {
        path: 'approve',
        name: 'Approve',
        component: () => import('@/views/resource/approve/index'),
        meta: {
          roles: ['SYS_ADMIN', 'ORG_ADMIN'],
          title: '配额审批',
          icon: 'form'
        }
      }
    ]
  },

  {
    path: '/image',
    component: Layout,
    redirect: '/image/index',
    meta: { roles: ['SYS_ADMIN', 'ORG_ADMIN'], title: '镜像管理', icon: 'docker' },
    children: [
      {
        path: 'index',
        component: () => import('@/views/image/index'),
        name: 'Image',
        meta: {
          roles: ['SYS_ADMIN', 'ORG_ADMIN'],
          title: '镜像管理',
          icon: 'docker'
        }
      },
      {
        path: 'table',
        name: 'Table',
        component: () => import('@/views/table/index'),
        meta: { roles: ['DEV'], title: 'Table', icon: 'table' }
      },
      {
        path: 'tree',
        name: 'Tree',
        component: () => import('@/views/tree/index'),
        meta: { roles: ['DEV'], title: 'Tree', icon: 'tree' }
      }
    ]
  },

  {
    path: '/nested',
    component: Layout,
    redirect: '/nested/menu1',
    name: 'Nested',
    meta: {
      roles: ['DEV'],
      title: '文件管理',
      icon: 'nested'
    },
    children: [
      {
        path: 'menu1',
        component: () => import('@/views/nested/menu1/index'), // Parent router-view
        name: 'Menu1',
        meta: { title: 'Menu1' },
        children: [
          {
            path: 'menu1-1',
            component: () => import('@/views/nested/menu1/menu1-1'),
            name: 'Menu1-1',
            meta: { title: 'Menu1-1' }
          },
          {
            path: 'menu1-2',
            component: () => import('@/views/nested/menu1/menu1-2'),
            name: 'Menu1-2',
            meta: { title: 'Menu1-2' },
            children: [
              {
                path: 'menu1-2-1',
                component: () => import('@/views/nested/menu1/menu1-2/menu1-2-1'),
                name: 'Menu1-2-1',
                meta: { title: 'Menu1-2-1' }
              },
              {
                path: 'menu1-2-2',
                component: () => import('@/views/nested/menu1/menu1-2/menu1-2-2'),
                name: 'Menu1-2-2',
                meta: { title: 'Menu1-2-2' }
              }
            ]
          },
          {
            path: 'menu1-3',
            component: () => import('@/views/nested/menu1/menu1-3'),
            name: 'Menu1-3',
            meta: { title: 'Menu1-3' }
          }
        ]
      },
      {
        path: 'menu2',
        component: () => import('@/views/nested/menu2/index'),
        meta: { title: 'menu2' }
      }
    ]
  },

  {
    path: '/currency',
    component: Layout,
    children: [{
      path: 'index',
      name: 'Currency',
      component: () => import('@/views/currency/index'),
      meta: {
        title: '通用查询',
        roles: ['DEV'],
        icon: 'table',
        config: '/api/currency/config/LIST_USER',
        data: '/api/currency/data/LIST_USER',
        dataMethod: 'post'
      }
    }]
  },

  {
    path: 'external-link',
    component: Layout,
    children: [
      {
        path: 'https://master160:30001/',
        meta: { roles: ['SYS_ADMIN'], title: 'Kubernetes 仪表盘', icon: 'link' }
      }
    ]
  },

  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router

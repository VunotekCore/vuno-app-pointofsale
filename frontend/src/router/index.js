import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store.js'
import { usePlatformAuthStore } from '../stores/platform-auth.store.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { public: true }
  },
  {
    path: '/platform/login',
    name: 'PlatformLogin',
    component: () => import('../pages/PlatformLoginPage.vue'),
    meta: { public: true }
  },
  {
    path: '/display',
    name: 'CustomerDisplay',
    component: () => import('../pages/sales/CustomerDisplay.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../pages/DashboardPage.vue'),
        meta: { permission: 'menu.dashboard' }
      },
      {
        path: 'dashboard/admin',
        name: 'AdminDashboard',
        component: () => import('../pages/dashboard/AdminDashboardPage.vue'),
        meta: { permission: 'menu.dashboard', roles: ['admin'] }
      },
      {
        path: 'dashboard/manager',
        name: 'ManagerDashboard',
        component: () => import('../pages/dashboard/ManagerDashboardPage.vue'),
        meta: { permission: 'menu.dashboard', roles: ['manager', 'admin'] }
      },
      {
        path: 'dashboard/cashier',
        name: 'CashierDashboard',
        component: () => import('../pages/dashboard/CashierDashboardPage.vue'),
        meta: { permission: 'menu.dashboard', roles: ['cashier', 'manager', 'admin'] }
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('../pages/settings/UsersPage.vue'),
        meta: { permission: 'menu.users' }
      },
      {
        path: 'empresa',
        name: 'Empresa',
        component: () => import('../pages/settings/CompanyPage.vue'),
        meta: { permission: 'menu.company' }
      },
      {
        path: 'moneda',
        name: 'Moneda',
        component: () => import('../pages/settings/CurrencyPage.vue'),
        meta: { permission: 'menu.currency' }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('../pages/settings/RolesPage.vue'),
        meta: { permission: 'menu.roles' }
      },
      {
        path: 'permisos',
        name: 'Permisos',
        component: () => import('../pages/settings/PermissionsPage.vue'),
        meta: { permission: 'menu.permissions' }
      },
      {
        path: 'turnos',
        name: 'Turnos',
        component: () => import('../pages/settings/ShiftsPage.vue'),
        meta: { permission: 'menu.shifts' }
      },
      {
        path: 'ubicaciones',
        name: 'Ubicaciones',
        component: () => import('../pages/inventory/LocationsPage.vue'),
        meta: { permission: 'menu.locations' }
      },
      {
        path: 'categorias',
        name: 'Categorías',
        component: () => import('../pages/inventory/CategoriesPage.vue'),
        meta: { permission: 'menu.categories' }
      },
      {
        path: 'productos',
        name: 'Productos',
        component: () => import('../pages/inventory/ItemsPage.vue'),
        meta: { permission: 'menu.products' }
      },
      {
        path: 'stock',
        name: 'Stock',
        component: () => import('../pages/inventory/StockPage.vue'),
        meta: { permission: 'menu.stock' }
      },
      {
        path: 'proveedores',
        name: 'Proveedores',
        component: () => import('../pages/purchases/SuppliersPage.vue'),
        meta: { permission: 'menu.suppliers' }
      },
      {
        path: 'ordenes-compra',
        name: 'Órdenes de Compra',
        component: () => import('../pages/purchases/PurchaseOrdersPage.vue'),
        meta: { permission: 'menu.purchase_orders' }
      },
      {
        path: 'recepciones',
        name: 'Recepciones',
        component: () => import('../pages/purchases/ReceivingsPage.vue'),
        meta: { permission: 'menu.receivings' }
      },
      {
        path: 'transferencias',
        name: 'Transferencias',
        component: () => import('../pages/inventory/TransfersPage.vue'),
        meta: { permission: 'menu.transfers' }
      },
      {
        path: 'pos',
        name: 'Punto de Venta',
        component: () => import('../pages/sales/PosPage.vue'),
        meta: { permission: 'menu.pos' }
      },
      {
        path: 'caja',
        name: 'Caja',
        component: () => import('../pages/cashier/CashDrawerPage.vue'),
        meta: { permission: 'menu.cash_drawer' }
      },
      {
        path: 'cierres',
        name: 'Cierres',
        component: () => import('../pages/cashier/DrawerClosuresPage.vue'),
        meta: { permission: 'menu.drawer_closures' }
      },
      {
        path: 'ajustes',
        name: 'Ajustes',
        component: () => import('../pages/cashier/DrawerAdjustmentsPage.vue'),
        meta: { permission: 'menu.adjustments' }
      },
      {
        path: 'cuentas-cobrar',
        name: 'Cuentas por Cobrar',
        component: () => import('../pages/cashier/AccountsReceivablePage.vue'),
        meta: { permission: 'menu.accounts_receivable' }
      },
      {
        path: 'ventas',
        name: 'Ventas',
        component: () => import('../pages/sales/SalesPage.vue'),
        meta: { permission: 'menu.sales' }
      },
      {
        path: 'reportes',
        name: 'Reportes',
        component: () => import('../pages/reports/ReportsPage.vue'),
        meta: { permission: 'menu.reports' }
      },
      {
        path: 'devoluciones',
        name: 'Devoluciones',
        component: () => import('../pages/sales/ReturnsPage.vue'),
        meta: { permission: 'menu.returns' }
      },
      {
        path: 'clientes',
        name: 'Clientes',
        component: () => import('../pages/sales/CustomersPage.vue'),
        meta: { permission: 'menu.customers' }
      },
      {
        path: 'docs',
        name: 'Documentación',
        component: () => import('../pages/WikiPage.vue')
      }
    ]
  },
  {
    path: '/settings',
    component: () => import('../layouts/PlatformLayout.vue'),
    children: [
      {
        path: 'companies',
        name: 'PlatformCompanies',
        component: () => import('../pages/settings/CompaniesPage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const platformAuth = usePlatformAuthStore()

  if (to.meta.public) {
    return next()
  }

  if (to.path.startsWith('/settings')) {
    platformAuth.initialize()
    if (!platformAuth.token || !platformAuth.isSuperAdmin) {
      return next('/platform/login')
    }
    return next()
  }

  authStore.initialize()
  platformAuth.initialize()

  if (!authStore.token) {
    return next('/login')
  }

  const isAdmin = authStore.user?.is_admin == 1 || authStore.user?.role_name === 'admin'
  if (isAdmin) {
    return next()
  }

  if (to.meta.roles && to.meta.roles.length > 0) {
    const userRole = authStore.user?.role_name?.toLowerCase() || ''
    if (to.meta.roles.some(r => userRole.includes(r.toLowerCase()))) {
      return next()
    }
    return next('/')
  }

  if (to.path !== '/' && to.meta.permission) {
    if (!authStore.hasPermission(to.meta.permission)) {
      return next('/')
    }
  }

  next()
})

export default router

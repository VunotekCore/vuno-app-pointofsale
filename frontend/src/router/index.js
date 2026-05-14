import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store.js'
import { usePlatformAuthStore } from '../stores/platform-auth.store.js'

let permissionsReady = false
export const setPermissionsReady = () => { permissionsReady = true }

const waitForPermissions = () => {
  return new Promise((resolve) => {
    if (permissionsReady) return resolve(true)
    let attempts = 0
    const maxAttempts = 100
    const interval = setInterval(() => {
      attempts++
      if (permissionsReady || attempts >= maxAttempts) {
        clearInterval(interval)
        resolve(permissionsReady)
      }
    }, 50)
  })
}

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
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('../pages/ForbiddenPage.vue'),
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
        meta: { permission: 'view.dashboard' }
      },
      {
        path: 'dashboard/admin',
        name: 'AdminDashboard',
        component: () => import('../pages/dashboard/AdminDashboardPage.vue'),
        meta: { permission: 'view.dashboard', roles: ['admin'] }
      },
      {
        path: 'dashboard/manager',
        name: 'ManagerDashboard',
        component: () => import('../pages/dashboard/ManagerDashboardPage.vue'),
        meta: { permission: 'view.dashboard', roles: ['manager', 'admin'] }
      },
      {
        path: 'dashboard/cashier',
        name: 'CashierDashboard',
        component: () => import('../pages/dashboard/CashierDashboardPage.vue'),
        meta: { permission: 'view.dashboard', roles: ['cashier', 'manager', 'admin'] }
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('../pages/settings/UsersPage.vue'),
        meta: { permission: 'view.usuarios' }
      },
      {
        path: 'empresa',
        name: 'Empresa',
        component: () => import('../pages/settings/CompanyPage.vue'),
        meta: { permission: 'view.empresa' }
      },
      {
        path: 'moneda',
        name: 'Moneda',
        component: () => import('../pages/settings/CurrencyPage.vue'),
        meta: { permission: 'view.moneda' }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('../pages/settings/RolesPage.vue'),
        meta: { permission: 'view.roles' }
      },
      {
        path: 'permisos',
        name: 'Permisos',
        component: () => import('../views/permissions/PermissionsView.vue'),
        meta: { permission: 'view.permisos' }
      },
      {
        path: 'turnos',
        name: 'Turnos',
        component: () => import('../pages/settings/ShiftsPage.vue'),
        meta: { permission: 'view.turnos' }
      },
      {
        path: 'ubicaciones',
        name: 'Ubicaciones',
        component: () => import('../pages/inventory/LocationsPage.vue'),
        meta: { permission: 'view.ubicaciones' }
      },
      {
        path: 'categorias',
        name: 'Categorías',
        component: () => import('../pages/inventory/CategoriesPage.vue'),
        meta: { permission: 'view.categorias' }
      },
      {
        path: 'productos',
        name: 'Productos',
        component: () => import('../pages/inventory/ItemsPage.vue'),
        meta: { permission: 'view.productos' }
      },
      {
        path: 'stock',
        name: 'Stock',
        component: () => import('../pages/inventory/StockPage.vue'),
        meta: { permission: 'view.stock' }
      },
      {
        path: 'proveedores',
        name: 'Proveedores',
        component: () => import('../pages/purchases/SuppliersPage.vue'),
        meta: { permission: 'view.proveedores' }
      },
      {
        path: 'ordenes-compra',
        name: 'Órdenes de Compra',
        component: () => import('../pages/purchases/PurchaseOrdersPage.vue'),
        meta: { permission: 'view.ordenes_compra' }
      },
      {
        path: 'recepciones',
        name: 'Recepciones',
        component: () => import('../pages/purchases/ReceivingsPage.vue'),
        meta: { permission: 'view.recepciones' }
      },
      {
        path: 'transferencias',
        name: 'Transferencias',
        component: () => import('../pages/inventory/TransfersPage.vue'),
        meta: { permission: 'view.transferencias' }
      },
      {
        path: 'pos',
        name: 'Punto de Venta',
        component: () => import('../pages/sales/PosPage.vue'),
        meta: { permission: 'view.pos' }
      },
      {
        path: 'caja',
        name: 'Caja',
        component: () => import('../pages/cashier/CashDrawerPage.vue'),
        meta: { permission: 'view.caja' }
      },
      {
        path: 'cierres',
        name: 'Cierres',
        component: () => import('../pages/cashier/DrawerClosuresPage.vue'),
        meta: { permission: 'view.cierres' }
      },
      {
        path: 'ajustes',
        name: 'Ajustes',
        component: () => import('../pages/cashier/DrawerAdjustmentsPage.vue'),
        meta: { permission: 'view.ajustes' }
      },
      {
        path: 'cuentas-cobrar',
        name: 'Cuentas por Cobrar',
        component: () => import('../pages/cashier/AccountsReceivablePage.vue'),
        meta: { permission: 'view.cuentas_cobrar' }
      },
      {
        path: 'ventas',
        name: 'Ventas',
        component: () => import('../pages/sales/SalesPage.vue'),
        meta: { permission: 'view.ventas' }
      },
      {
        path: 'reportes',
        name: 'Reportes',
        component: () => import('../pages/reports/ReportsPage.vue'),
        meta: { permission: 'view.reportes' }
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

// En Electron usamos hash history porque el protocolo file:// no soporta
// HTML5 pushState. Con createWebHistory() el router redirige a file:///login
// (un archivo que no existe) causando pantalla en blanco.
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

const router = createRouter({
  history: isElectron ? createWebHashHistory() : createWebHistory(),
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

  if (!authStore.token) {
    return next('/login')
  }

  await waitForPermissions()

  if (authStore.user?.is_admin == 1) {
    return next()
  }

  if (to.meta.roles && to.meta.roles.length > 0) {
    const userRole = authStore.user?.role_name?.toLowerCase() || ''
    if (to.meta.roles.some(r => userRole.includes(r.toLowerCase()))) {
      return next()
    }
    return next('/forbidden')
  }

  if (to.path !== '/' && to.meta.permission) {
    if (!authStore.hasPermission(to.meta.permission)) {
      return next('/forbidden')
    }
  }

  next()
})

export default router

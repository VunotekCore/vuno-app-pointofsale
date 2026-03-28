import {
  LayoutDashboard, Warehouse, Package, ArrowRightLeft, MapPin, Tag,
  Truck, ShoppingCart, Wallet, Clock, User, CreditCard, TrendingUp,
  Building2, Shield, DollarSign, Settings, Boxes, ClipboardList, Receipt,
  Key, FileText
} from 'lucide-vue-next'

export const MENU_SECTIONS = [
  { key: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
  { key: 'inventory', name: 'Inventario', icon: 'Package', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  { key: 'purchases', name: 'Compras', icon: 'Truck', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  { key: 'sales', name: 'Ventas', icon: 'ShoppingCart', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { key: 'cashier', name: 'Cajero', icon: 'Wallet', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' },
  { key: 'settings', name: 'Configuración', icon: 'Settings', color: 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400' }
]

export const MENU_ITEMS = [
  { key: 'dashboard', name: 'Dashboard', path: '/', icon: 'LayoutDashboard', section: 'dashboard', permission: 'menu.dashboard' },
  { key: 'reports', name: 'Reportes', path: '/reportes', icon: 'FileText', section: 'dashboard', permission: 'menu.reports' },

  { key: 'inventory', name: 'Inventario', path: '/inventario', icon: 'Package', section: 'inventory', permission: 'menu.inventory' },
  { key: 'stock', name: 'Stock', path: '/stock', icon: 'Warehouse', section: 'inventory', permission: 'menu.stock' },
  { key: 'products', name: 'Productos', path: '/productos', icon: 'Package', section: 'inventory', permission: 'menu.products' },
  { key: 'transfers', name: 'Transferencias', path: '/transferencias', icon: 'ArrowRightLeft', section: 'inventory', permission: 'menu.transfers' },
  { key: 'locations', name: 'Ubicaciones', path: '/ubicaciones', icon: 'MapPin', section: 'inventory', permission: 'menu.locations' },
  { key: 'categories', name: 'Categorías', path: '/categorias', icon: 'Tag', section: 'inventory', permission: 'menu.categories' },

  { key: 'suppliers', name: 'Proveedores', path: '/proveedores', icon: 'Truck', section: 'purchases', permission: 'menu.suppliers' },
  { key: 'purchase_orders', name: 'Órdenes de Compra', path: '/ordenes-compra', icon: 'ClipboardList', section: 'purchases', permission: 'menu.purchase_orders' },
  { key: 'receivings', name: 'Recepciones', path: '/recepciones', icon: 'Boxes', section: 'purchases', permission: 'menu.receivings' },

  { key: 'pos', name: 'Punto de Venta', path: '/pos', icon: 'ShoppingCart', section: 'sales', permission: 'menu.pos' },
  { key: 'sales_list', name: 'Lista de Ventas', path: '/ventas', icon: 'Receipt', section: 'sales', permission: 'menu.sales_list' },
  { key: 'sales', name: 'Ventas', path: '/ventas', icon: 'Receipt', section: 'sales', permission: 'menu.sales' },
  { key: 'returns', name: 'Devoluciones', path: '/devoluciones', icon: 'RefreshCw', section: 'sales', permission: 'menu.returns' },
  { key: 'customers', name: 'Clientes', path: '/clientes', icon: 'User', section: 'sales', permission: 'menu.customers' },

  { key: 'cash_drawer', name: 'Gestión de Caja', path: '/caja', icon: 'Wallet', section: 'cashier', permission: 'menu.cash_drawer' },
  { key: 'drawer', name: 'Caja', path: '/caja', icon: 'Wallet', section: 'cashier', permission: 'menu.drawer' },
  { key: 'drawer_closures', name: 'Historial de Cierres', path: '/cierres', icon: 'Clock', section: 'cashier', permission: 'menu.drawer_closures' },
  { key: 'adjustments', name: 'Faltantes/Sobrantes', path: '/ajustes', icon: 'TrendingUp', section: 'cashier', permission: 'menu.adjustments' },
  { key: 'accounts_receivable', name: 'Cuentas por Cobrar', path: '/cuentas-cobrar', icon: 'CreditCard', section: 'cashier', permission: 'menu.accounts_receivable' },

  { key: 'settings', name: 'Configuración', path: '/empresa', icon: 'Settings', section: 'settings', permission: 'menu.settings' },
  { key: 'company', name: 'Datos de Empresa', path: '/empresa', icon: 'Building2', section: 'settings', permission: 'menu.company' },
  { key: 'shifts', name: 'Turnos', path: '/turnos', icon: 'Clock', section: 'settings', permission: 'menu.shifts' },
  { key: 'users', name: 'Usuarios', path: '/usuarios', icon: 'Users', section: 'settings', permission: 'menu.users' },
  { key: 'currency', name: 'Moneda', path: '/moneda', icon: 'DollarSign', section: 'settings', permission: 'menu.currency' },
  { key: 'roles', name: 'Roles', path: '/roles', icon: 'Shield', section: 'settings', permission: 'menu.roles' },
  { key: 'permissions', name: 'Permisos', path: '/permisos', icon: 'Key', section: 'settings', permission: 'menu.permissions' }
]

export const MENU_ICONS = {
  LayoutDashboard, Warehouse, Package, ArrowRightLeft, MapPin, Tag,
  Truck, ShoppingCart, Wallet, Clock, User, CreditCard, TrendingUp,
  Building2, Shield, DollarSign, Settings, Boxes, ClipboardList, Receipt,
  Key, FileText
}
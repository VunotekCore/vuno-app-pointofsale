<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store.js'
import { useCurrencyStore } from '../stores/currency.store.js'
import api from '../services/api.service.js'
import ToastNotification from '../components/ToastNotification.vue'
import {
  Menu,
  X,
  Settings,
  ChevronDown,
  Users,
  LogOut,
  LayoutDashboard,
  Shield,
  Building2,
  MapPin,
  Tag,
  Package,
  Warehouse,
  Truck,
  Boxes,
  BookOpen,
  Bell,
  DollarSign,
  ArrowRightLeft,
  ShoppingCart,
  User,
  RefreshCw,
  Clock,
  Wallet,
  TrendingUp,
  CreditCard,
  Key,
  ClipboardList,
  Receipt,
  FileText
} from 'lucide-vue-next'

const authStore = useAuthStore()
const currencyStore = useCurrencyStore()
const route = useRoute()
const router = useRouter()

const companyData = ref({
  name: 'PointOfSale',
  logo_url: ''
})

const loadCompanyData = async () => {
  try {
    const response = await api.get('/companies')
    if (response.data.data) {
      companyData.value = {
        name: response.data.data.name || 'PointOfSale',
        logo_url: response.data.data.logo_url || ''
      }
    }
  } catch (error) {
    console.error('Error loading company data:', error)
  }
}

onMounted(() => {
  loadCompanyData()
  currencyStore.loadConfig()
})

const isSidebarOpen = ref(true)
const isMobileMenuOpen = ref(false)
const isConfigOpen = ref(false)
const isInventoryOpen = ref(false)
const isSalesOpen = ref(true)
const isPurchasesOpen = ref(false)
const isCashierOpen = ref(false)
const isUserMenuOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})

const closeAllMenus = () => {
  isConfigOpen.value = false
  isInventoryOpen.value = false
  isSalesOpen.value = false
  isPurchasesOpen.value = false
  isCashierOpen.value = false
}

const toggleConfig = () => {
  if (isConfigOpen.value) {
    isConfigOpen.value = false
  } else {
    closeAllMenus()
    isConfigOpen.value = true
  }
}

const toggleCashier = () => {
  if (isCashierOpen.value) {
    isCashierOpen.value = false
  } else {
    closeAllMenus()
    isCashierOpen.value = true
  }
}

const toggleInventory = () => {
  if (isInventoryOpen.value) {
    isInventoryOpen.value = false
  } else {
    closeAllMenus()
    isInventoryOpen.value = true
  }
}

const togglePurchases = () => {
  if (isPurchasesOpen.value) {
    isPurchasesOpen.value = false
  } else {
    closeAllMenus()
    isPurchasesOpen.value = true
  }
}

const toggleSales = () => {
  if (isSalesOpen.value) {
    isSalesOpen.value = false
  } else {
    closeAllMenus()
    isSalesOpen.value = true
  }
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, permission: 'menu.dashboard' },
  { name: 'Reportes', path: '/reportes', icon: FileText, permission: 'menu.reports' }
]

const inventoryItems = [
  { name: 'Stock', path: '/stock', icon: Warehouse, permission: 'menu.stock' },
  { name: 'Productos', path: '/productos', icon: Package, permission: 'menu.products' },
  { name: 'Transferencias', path: '/transferencias', icon: ArrowRightLeft, permission: 'menu.transfers' },
  { name: 'Ubicaciones', path: '/ubicaciones', icon: MapPin, permission: 'menu.locations' },
  { name: 'Categorías', path: '/categorias', icon: Tag, permission: 'menu.categories' }
]

const purchaseItems = [
  { name: 'Proveedores', path: '/proveedores', icon: Truck, permission: 'menu.suppliers' },
  { name: 'Órdenes de Compra', path: '/ordenes-compra', icon: ClipboardList, permission: 'menu.purchase_orders' },
  { name: 'Recepciones', path: '/recepciones', icon: Boxes, permission: 'menu.receivings' }
]

const salesItems = [
  { name: 'Punto de Venta', path: '/pos', icon: ShoppingCart, permission: 'menu.pos' },
  { name: 'Lista de Ventas', path: '/ventas', icon: Receipt, permission: 'menu.sales' },
  { name: 'Devoluciones', path: '/devoluciones', icon: RefreshCw, permission: 'menu.returns' },
  { name: 'Clientes', path: '/clientes', icon: User, permission: 'menu.customers' }
]

const cashierItems = [
  { name: 'Gestión de Caja', path: '/caja', icon: Wallet, permission: 'menu.cash_drawer' },
  { name: 'Historial de Cierres', path: '/cierres', icon: Clock, permission: 'menu.drawer_closures' },
  { name: 'Faltantes/Sobrantes', path: '/ajustes', icon: TrendingUp, permission: 'menu.adjustments' },
  { name: 'Cuentas por Cobrar', path: '/cuentas-cobrar', icon: CreditCard, permission: 'menu.accounts_receivable' }
]

const configItems = [
  { name: 'Datos de Empresa', path: '/empresa', icon: Building2, permission: 'menu.company' },
  { name: 'Turnos', path: '/turnos', icon: Clock, permission: 'menu.shifts' },
  { name: 'Usuarios', path: '/usuarios', icon: Users, permission: 'menu.users' },
  { name: 'Moneda', path: '/moneda', icon: DollarSign, permission: 'menu.currency' },
  { name: 'Roles', path: '/roles', icon: Shield, permission: 'menu.roles' },
  { name: 'Permisos', path: '/permisos', icon: Key, permission: 'menu.permissions' }
]

const filteredNavigation = computed(() => {
  return navigation.filter(item => {
    if (item.permission && !authStore.hasPermission(item.permission)) {
      return false
    }
    return true
  })
})

const filteredInventoryItems = computed(() => {
  return inventoryItems.filter(item => {
    if (item.permission && !authStore.hasPermission(item.permission)) {
      return false
    }
    return true
  })
})

const filteredPurchaseItems = computed(() => {
  return purchaseItems.filter(item => {
    if (item.permission && !authStore.hasPermission(item.permission)) {
      return false
    }
    return true
  })
})

const filteredSalesItems = computed(() => {
  return salesItems.filter(item => {
    if (item.permission && !authStore.hasPermission(item.permission)) {
      return false
    }
    return true
  })
})

const filteredCashierItems = computed(() => {
  return cashierItems.filter(item => {
    if (item.permission && !authStore.hasPermission(item.permission)) {
      return false
    }
    return true
  })
})

const filteredConfigItems = computed(() => {
  return configItems.filter(item => {
    if (item.permission && !authStore.hasPermission(item.permission)) {
      return false
    }
    return true
  })
})

const showInventory = computed(() => filteredInventoryItems.value.length > 0)
const showPurchases = computed(() => filteredPurchaseItems.value.length > 0)
const showSales = computed(() => {
  return filteredSalesItems.value.length > 0 || navigation.some(n => n.name === 'Ventas')
})
const showCashier = computed(() => filteredCashierItems.value.length > 0)
const showConfig = computed(() => filteredConfigItems.value.length > 0)

const currentPageTitle = computed(() => {
  const allItems = [
    ...filteredNavigation.value,
    ...filteredSalesItems.value,
    ...filteredInventoryItems.value,
    ...filteredPurchaseItems.value,
    ...filteredCashierItems.value,
    ...filteredConfigItems.value
  ]
  const item = allItems.find(n => route.path === n.path || (n.path !== '/' && route.path.startsWith(n.path)))
  return item?.name || 'Dashboard'
})

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  const [basePath, queryStr] = path.split('?')
  const currentPath = route.path
  
  if (!currentPath.startsWith(basePath)) return false
  
  if (queryStr) {
    const requiredTab = queryStr.split('tab=')[1]
    return route.query.tab === requiredTab
  }
  
  return Object.keys(route.query).length === 0
}

const isInventoryActive = computed(() =>
  filteredInventoryItems.value.some(item => isActive(item.path))
)

const isSalesActive = computed(() =>
  [...filteredSalesItems.value].some(item => isActive(item.path)) ||
  navigation.some(n => n.name === 'Ventas' && isActive(n.path))
)

const isPurchasesActive = computed(() =>
  filteredPurchaseItems.value.some(item => isActive(item.path))
)

const isConfigActive = computed(() =>
  filteredConfigItems.value.some(item => isActive(item.path))
)

const isCashierActive = computed(() =>
  filteredCashierItems.value.some(item => isActive(item.path))
)

const logout = () => {
  closeUserMenu()
  authStore.logout()
  router.push('/login')
}

const openWiki = () => {
  router.push({ path: '/docs', query: { path: 'USER.md' } })
}

const backToPlatform = () => {
  authStore.logout()
  authStore.clearImpersonating()
  router.push('/settings/companies')
}
</script>

<template>
  <ToastNotification />
  <div class="h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden" @click="closeUserMenu">
    <!-- Mobile Overlay -->
    <div 
      v-if="isMobileMenuOpen" 
      class="fixed inset-0 z-40 bg-black/50 md:hidden"
      @click="closeMobileMenu"
    ></div>

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-y-auto overflow-x-visible"
      :class="[
        isSidebarOpen ? 'w-72' : 'w-20',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
      @click.stop
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 flex-shrink-0 px-2">
        <div class="flex items-center gap-3 transition-all duration-300" :class="{ 'px-2': !isSidebarOpen }">
          <template v-if="companyData.logo_url">
            <img :src="companyData.logo_url" alt="Logo" class="w-9 h-9 rounded-xl object-cover" />
          </template>
          <template v-else>
            <div class="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30">
              POS
            </div>
          </template>
          <span v-if="isSidebarOpen" class="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            {{ companyData.name }}<span class="text-brand-500">.</span>
          </span>
        </div>
        <button 
          @click="closeMobileMenu" 
          class="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <template v-for="(item, index) in filteredNavigation" :key="index">
          <RouterLink
            :to="item.path"
            class="group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative"
            :class="[
              isActive(item.path)
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <div v-if="isActive(item.path) && isSidebarOpen" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full"></div>
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span v-if="isSidebarOpen" class="ml-3 text-sm truncate">{{ item.name }}</span>
            <div v-if="!isSidebarOpen" class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
              {{ item.name }}
            </div>
          </RouterLink>
        </template>

        <!-- Sales collapsible -->
        <div v-if="showSales">
          <button
            @click="toggleSales"
            class="group w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative"
            :class="[
              isSalesActive || isSalesOpen
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <ShoppingCart class="w-5 h-5 flex-shrink-0" />
            <span v-if="isSidebarOpen" class="ml-3 text-sm truncate flex-1 text-left">Ventas</span>
            <ChevronDown v-if="isSidebarOpen" class="w-4 h-4 transition-transform duration-200" :class="isSalesOpen ? 'rotate-180' : ''" />
            <div v-if="!isSidebarOpen" class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
              Ventas
            </div>
          </button>
          <div v-if="isSidebarOpen" class="overflow-hidden transition-all duration-200" :class="isSalesOpen ? 'max-h-60 mt-1' : 'max-h-0'">
            <div class="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-1">
              <RouterLink v-for="item in filteredSalesItems" :key="item.path" :to="item.path" class="flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200" :class="isActive(item.path) ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'">
                {{ item.name }}
              </RouterLink>
            </div>
          </div>

          <!-- Collapsed: show sub-items as separate icon-less tooltips -->
          <div v-if="!isSidebarOpen && isSalesOpen" class="mt-1 space-y-1 px-1">
            <RouterLink
              v-for="item in filteredSalesItems"
              :key="item.path"
              :to="item.path"
              class="group flex items-center justify-center px-3 py-2 rounded-xl text-xs transition-all duration-200 relative"
              :class="[
                isActive(item.path)
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
              <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                {{ item.name }}
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Inventory collapsible -->
        <div v-if="showInventory">
          <button
            @click="toggleInventory"
            class="group w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative"
            :class="[
              isInventoryActive || isInventoryOpen
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <div v-if="isInventoryActive && isSidebarOpen" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full"></div>
            <Boxes class="w-5 h-5 flex-shrink-0" />
            <span v-if="isSidebarOpen" class="ml-3 text-sm truncate flex-1 text-left">Inventario</span>
            <ChevronDown v-if="isSidebarOpen" class="w-4 h-4 transition-transform duration-200" :class="isInventoryOpen ? 'rotate-180' : ''" />
            <div v-if="!isSidebarOpen" class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
              Inventario
            </div>
          </button>
          <div v-if="isSidebarOpen" class="overflow-hidden transition-all duration-200" :class="isInventoryOpen ? 'max-h-60 mt-1' : 'max-h-0'">
            <div class="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-1">
              <RouterLink v-for="item in filteredInventoryItems" :key="item.path" :to="item.path" class="flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200" :class="isActive(item.path) ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'">
                {{ item.name }}
              </RouterLink>
            </div>
          </div>

          <!-- Collapsed: show sub-items as separate icon-less tooltips -->
          <div v-if="!isSidebarOpen && isInventoryOpen" class="mt-1 space-y-1 px-1">
            <RouterLink
              v-for="item in filteredInventoryItems"
              :key="item.path"
              :to="item.path"
              class="group flex items-center justify-center px-3 py-2 rounded-xl text-xs transition-all duration-200 relative"
              :class="[
                isActive(item.path)
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
              <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                {{ item.name }}
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Purchases collapsible: Proveedores & Órdenes de Compra -->
        <div v-if="showPurchases">
          <button
            @click="togglePurchases"
            class="group w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative"
            :class="[
              isPurchasesActive || isPurchasesOpen
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <div v-if="isPurchasesActive && isSidebarOpen" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full"></div>
            <Truck class="w-5 h-5 flex-shrink-0" />
            <span v-if="isSidebarOpen" class="ml-3 text-sm truncate flex-1 text-left">Compras</span>
            <ChevronDown v-if="isSidebarOpen" class="w-4 h-4 transition-transform duration-200" :class="isPurchasesOpen ? 'rotate-180' : ''" />
            <div v-if="!isSidebarOpen" class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
              Compras
            </div>
          </button>
          <div v-if="isSidebarOpen" class="overflow-hidden transition-all duration-200" :class="isPurchasesOpen ? 'max-h-48 mt-1' : 'max-h-0'">
            <div class="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-1">
              <RouterLink v-for="item in filteredPurchaseItems" :key="item.path" :to="item.path" class="flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200" :class="isActive(item.path) ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'">
                {{ item.name }}
              </RouterLink>
            </div>
          </div>

          <!-- Collapsed: show sub-items as separate icon-less tooltips -->
          <div v-if="!isSidebarOpen && isPurchasesOpen" class="mt-1 space-y-1 px-1">
            <RouterLink
              v-for="item in filteredPurchaseItems"
              :key="item.path"
              :to="item.path"
              class="group flex items-center justify-center px-3 py-2 rounded-xl text-xs transition-all duration-200 relative"
              :class="[
                isActive(item.path)
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
              <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                {{ item.name }}
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Cajero collapsible -->
        <div v-if="showCashier">
          <button
            @click="toggleCashier"
            class="group w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative"
            :class="[
              isCashierActive || isCashierOpen
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <div v-if="isCashierActive && isSidebarOpen" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full"></div>
            <Wallet class="w-5 h-5 flex-shrink-0" />
            <span v-if="isSidebarOpen" class="ml-3 text-sm truncate flex-1 text-left">Caja</span>
            <ChevronDown
              v-if="isSidebarOpen"
              class="w-4 h-4 transition-transform duration-200"
              :class="isCashierOpen ? 'rotate-180' : ''"
            />
            <div v-if="!isSidebarOpen" class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
              Caja
            </div>
          </button>

          <div
            v-if="isSidebarOpen"
            class="overflow-hidden transition-all duration-200"
            :class="isCashierOpen ? 'max-h-60 mt-1' : 'max-h-0'"
          >
            <div class="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-1">
              <RouterLink
                v-for="item in filteredCashierItems"
                :key="item.path"
                :to="item.path"
                class="flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200"
                :class="isActive(item.path) ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'"
              >
                {{ item.name }}
              </RouterLink>
            </div>
          </div>

          <!-- Collapsed: show sub-items as separate icon-less tooltips -->
          <div v-if="!isSidebarOpen && isCashierOpen" class="mt-1 space-y-1 px-1">
            <RouterLink
              v-for="item in filteredCashierItems"
              :key="item.path"
              :to="item.path"
              class="group flex items-center justify-center px-3 py-2 rounded-xl text-xs transition-all duration-200 relative"
              :class="[
                isActive(item.path)
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
              <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                {{ item.name }}
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Configuración collapsible -->
        <div v-if="showConfig">
          <button
            @click="toggleConfig"
            class="group w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative"
            :class="[
              isConfigActive
                ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            <div v-if="isConfigActive && isSidebarOpen" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full"></div>
            <Settings class="w-5 h-5 flex-shrink-0" />
            <span v-if="isSidebarOpen" class="ml-3 text-sm truncate flex-1 text-left">Configuración</span>
            <ChevronDown
              v-if="isSidebarOpen"
              class="w-4 h-4 transition-transform duration-200"
              :class="isConfigOpen ? 'rotate-180' : ''"
            />
            <div v-if="!isSidebarOpen" class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
              Configuración
            </div>
          </button>

          <!-- Submenu items -->
          <div
            v-if="isSidebarOpen"
            class="overflow-hidden transition-all duration-200"
            :class="isConfigOpen ? 'max-h-96 mt-1' : 'max-h-0'"
          >
            <div class="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-1">
              <RouterLink
                v-for="item in filteredConfigItems"
                :key="item.path"
                :to="item.path"
                class="flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200"
                :class="[
                  isActive(item.path)
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white'
                ]"
              >
                {{ item.name }}
              </RouterLink>
            </div>
          </div>

          <!-- Collapsed: show sub-items as separate icon-less tooltips -->
          <div v-if="!isSidebarOpen && isConfigOpen" class="mt-1 space-y-1 px-1">
            <RouterLink
              v-for="item in filteredConfigItems"
              :key="item.path"
              :to="item.path"
              class="group flex items-center justify-center px-3 py-2 rounded-xl text-xs transition-all duration-200 relative"
              :class="[
                isActive(item.path)
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600'
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              ]"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
              <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                {{ item.name }}
              </div>
            </RouterLink>
          </div>
        </div>
      </nav>

      <!-- Bottom: user section -->
      <div class="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div class="relative">
          <button
            @click.stop="toggleUserMenu"
            class="flex items-center w-full p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            :class="{ 'justify-center': !isSidebarOpen }"
          >
            <img
              :src="authStore.user?.avatar || 'https://i.pravatar.cc/150?u=pointofsale'"
              class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 flex-shrink-0"
              alt="User"
            />
            <div v-if="isSidebarOpen" class="ml-3 text-left overflow-hidden flex-1">
              <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {{ authStore.user?.username || 'Usuario' }}
              </p>
              <p class="text-[10px] text-slate-400 truncate">
                {{ authStore.user?.email || 'Sin correo' }}
              </p>
            </div>
            <ChevronDown
              v-if="isSidebarOpen"
              class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0"
              :class="isUserMenuOpen ? 'rotate-180' : ''"
            />
          </button>

          <!-- User dropdown panel -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="isUserMenuOpen"
              class="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50"
              @click.stop
            >
              <div class="flex items-center gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
                <img
                  :src="authStore.user?.avatar || 'https://i.pravatar.cc/150?u=pointofsale'"
                  class="w-10 h-10 rounded-full border-2 border-brand-200 dark:border-brand-700"
                  alt="User"
                />
                <div class="overflow-hidden flex-1">
                  <p class="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {{ authStore.user?.username || 'Usuario' }}
                  </p>
                  <p class="text-xs text-slate-400 truncate">
                    {{ authStore.user?.email || 'Sin correo' }}
                  </p>
                </div>
              </div>

              <button
                @click="logout"
                class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
              >
                <LogOut class="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out" :class="isSidebarOpen ? 'md:ml-72 ml-0' : 'md:ml-20 ml-0'">
      <header class="sticky top-0 z-20 h-16 px-4 md:px-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800">
        <div class="flex items-center gap-2 md:gap-4">
          <button @click="toggleMobileMenu" class="p-2 rounded-lg transition-colors text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden">
            <Menu class="w-5 h-5" />
          </button>
          <button @click="toggleSidebar" class="p-2 rounded-lg transition-colors text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 hidden md:block">
            <Menu class="w-5 h-5" />
          </button>
          <h2 class="text-sm font-medium text-slate-500 dark:text-slate-400">
            Dashboard / <span class="text-slate-900 dark:text-white">{{ currentPageTitle }}</span>
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="authStore.isSuperAdmin"
            @click="backToPlatform"
            class="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1"
          >
            <Building2 class="w-4 h-4" />
            Volver a Plataforma
          </button>
          <button
            class="p-2 rounded-lg transition-colors text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Notificaciones"
          >
            <Bell class="w-5 h-5" />
          </button>
          <button
            @click="openWiki"
            class="p-2 rounded-lg transition-colors text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Documentación"
          >
            <BookOpen class="w-5 h-5" />
          </button>
        </div>
      </header>

      <main class="flex-1 p-6 overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

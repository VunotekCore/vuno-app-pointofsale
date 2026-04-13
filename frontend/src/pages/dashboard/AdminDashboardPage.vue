<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store.js'
import { useLocationStore } from '../../stores/location.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { dashboardService } from '../../services/dashboard.service.js'
import { coreService } from '../../services/inventory.service.js'
import { expirationService } from '../../services/expiration.service.js'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Calculator,
  Building2,
  Target,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  AlertTriangle,
  Package,
  Clock,
  Settings,
  LayoutDashboard
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const locationStore = useLocationStore()
const currencyStore = useCurrencyStore()

const loading = ref(true)
const dashboard = ref(null)
const dateRange = ref('month')
const showFilters = ref(false)
const expiringItems = ref([])
const expiredItems = ref([])
const loadingExpirations = ref(false)

const selectedLocation = computed(() => locationStore.getSelectedLocation())
const userLocations = computed(() => locationStore.locations)

const today = new Date()
const getDateRange = () => {
  const end = today.toISOString().split('T')[0]
  let start
  switch (dateRange.value) {
    case 'week':
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      break
    case 'month':
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      break
    case 'quarter':
      start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      break
    case 'year':
      start = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      break
    default:
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
  return { start, end }
}

const formatCurrency = (value) => currencyStore.formatMoney(value)
const formatNumber = (value) => currencyStore.formatNumber(value)

function formatDate (dateStr) {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

const totalExpiringCount = computed(() => expiringItems.value.length + expiredItems.value.length)

const formatPercent = (value) => {
  return `${value >= 0 ? '+' : ''}${value?.toFixed(1) || 0}%`
}

const getChangePercent = (current, previous) => {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous * 100).toFixed(1)
}

const salesChange = computed(() => {
  if (!dashboard.value?.daily || !dashboard.value?.yesterday) return 0
  return getChangePercent(dashboard.value.daily.total_sales, dashboard.value.yesterday.total_sales)
})

const transactionsChange = computed(() => {
  if (!dashboard.value?.daily || !dashboard.value?.yesterday) return 0
  return getChangePercent(dashboard.value.daily.transactions, dashboard.value.yesterday.transactions)
})

const fetchDashboard = async () => {
  loading.value = true
  try {
    const { start, end } = getDateRange()
    const locationId = selectedLocation.value?.id || null
    const response = await dashboardService.getAdminDashboard(start, end, locationId)
    dashboard.value = response.data.data
  } catch (error) {
    console.error('Error loading admin dashboard:', error)
  } finally {
    loading.value = false
  }
}

const fetchExpirations = async () => {
  loadingExpirations.value = true
  try {
    const location = selectedLocation.value
    const locationId = location?.id || location?.location_id
    const params = locationId ? { location_id: locationId } : {}
    const [expiring, expired] = await Promise.all([
      expirationService.getExpiring(params),
      expirationService.getExpired(params)
    ])
    expiringItems.value = expiring.data.data || []
    expiredItems.value = expired.data.data || []
  } catch (error) {
    console.error('Error loading expirations:', error)
  } finally {
    loadingExpirations.value = false
  }
}

const fetchLocations = async () => {
  try {
    const { data } = await coreService.getUserLocations()
    let activeLocations = (data.data || []).filter(l => l.is_active).map(l => ({
      id: l.location_id,
      name: l.location_name,
      code: l.location_code,
      is_active: l.is_active,
      is_default: l.is_default
    }))
    
    if (activeLocations.length === 0) {
      const { data: allLocations } = await coreService.getLocations()
      activeLocations = (allLocations.data || []).filter(l => l.is_active)
    }
    
    locationStore.setLocations(activeLocations)
  } catch (error) {
    console.error('Error loading locations:', error)
  }
}

watch([dateRange], () => {
  fetchDashboard()
})

const onLocationChange = (val) => {
  const loc = userLocations.value.find(l => l.id === val)
  locationStore.setSelectedLocation(loc)
  fetchDashboard()
}

const navigateTo = (route) => {
  router.push(route)
}

onMounted(async () => {
  await currencyStore.loadConfig()
  await fetchLocations()
  await fetchDashboard()
  await fetchExpirations()
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 p-4">
        <div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
            Panel Estratégico y Financiero
          </p>
        </div>
        <div class="flex flex-col sm:flex-row items-start sm:items-end gap-3 w-full lg:w-auto">
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <label class="text-sm text-slate-500 dark:text-slate-400">Período:</label>
            <select v-model="dateRange" class="input-field w-full sm:w-32">
              <option value="week">Semana</option>
              <option value="month">Mes</option>
              <option value="quarter">Trimestre</option>
              <option value="year">Año</option>
            </select>
          </div>
          <div v-if="userLocations.length > 0" class="flex items-center gap-2 w-full sm:w-auto">
            <label class="text-sm text-slate-500 dark:text-slate-400">Ubicación:</label>
            <select
              :value="locationStore.selectedLocationId"
              @change="onLocationChange($event.target.value)"
              class="input-field w-full sm:w-48"
            >
              <option :value="null">Todas las ubicaciones</option>
              <option v-for="loc in userLocations" :key="loc.id" :value="loc.id">
                {{ loc.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
    </div>

    <div v-else class="space-y-6">
      <div class="card p-6">
        <h3 class="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <LayoutDashboard class="w-5 h-5 text-brand-500" />
          Dashboards Especializados
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="navigateTo('/dashboard/manager')"
            class="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-all text-left"
          >
            <Settings class="w-8 h-8 mb-3 opacity-90" />
            <p class="font-bold text-lg">Dashboard Manager</p>
            <p class="text-sm opacity-80">Control Operativo</p>
          </button>
          <button
            @click="navigateTo('/dashboard/cashier')"
            class="p-4 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-lg transition-all text-left"
          >
            <Target class="w-8 h-8 mb-3 opacity-90" />
            <p class="font-bold text-lg">Dashboard POS</p>
            <p class="text-sm opacity-80">Ventas y Transacciones</p>
          </button>
        </div>
      </div>

      <template v-if="dashboard">        

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-5 border-l-4 border-brand-500">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <DollarSign class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <span class="text-xs text-slate-500 dark:text-slate-400">Ingresos</span>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ formatCurrency(dashboard.financial_overview?.total_revenue) }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Ingresos Totales</p>
          </div>

          <div class="card p-5 border-l-4 border-green-500">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span class="text-xs text-slate-500 dark:text-slate-400">Rentabilidad</span>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ formatCurrency(dashboard.financial_overview?.gross_profit) }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Utilidad Bruta</p>
          </div>

          <div class="card p-5 border-l-4 border-blue-500">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calculator class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span class="text-xs text-slate-500 dark:text-slate-400">Margen</span>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ dashboard.financial_overview?.ebitda_margin || 0 }}%
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Margen EBITDA</p>
          </div>

          <div class="card p-5 border-l-4 border-purple-500">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BarChart3 class="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span class="text-xs text-slate-500 dark:text-slate-400">Transacciones</span>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ formatNumber(dashboard.financial_overview?.total_transactions) }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Ticket Prom: {{ formatCurrency(dashboard.financial_overview?.average_ticket) }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-5 border-l-4 border-brand-500">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <DollarSign class="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div :class="['flex items-center gap-1 text-sm font-medium', salesChange >= 0 ? 'text-green-600' : 'text-red-600']">
                <TrendingUp v-if="salesChange >= 0" class="w-4 h-4" />
                <TrendingDown v-else class="w-4 h-4" />
                {{ salesChange }}%
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ formatCurrency(dashboard.daily?.total_sales) }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Ventas de Hoy</p>
          </div>

          <div class="card p-5 border-l-4 border-blue-500">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ShoppingCart class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div :class="['flex items-center gap-1 text-sm font-medium', transactionsChange >= 0 ? 'text-green-600' : 'text-red-600']">
                <TrendingUp v-if="transactionsChange >= 0" class="w-4 h-4" />
                <TrendingDown v-else class="w-4 h-4" />
                {{ transactionsChange }}%
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ formatNumber(dashboard.daily?.transactions) }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Transacciones Hoy</p>
          </div>

          <div class="card p-5 border-l-4 border-green-500">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ formatCurrency(dashboard.week?.total_sales) }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Ventas de la Semana</p>
          </div>

          <div class="card p-5 border-l-4 border-purple-500">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users class="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ formatNumber(dashboard.new_customers?.total_new_customers) }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Clientes Nuevos (Mes)</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp class="w-5 h-5 text-brand-500" />
                Comparativa Año vs Año (YoY)
              </h3>
            </div>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Período Actual</p>
                  <p class="text-xl font-bold text-slate-900 dark:text-white">{{ formatCurrency(dashboard.yoy_comparison?.current?.total_revenue) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-slate-500 dark:text-slate-400">Período Anterior</p>
                  <p class="text-xl font-bold text-slate-600 dark:text-slate-400">{{ formatCurrency(dashboard.yoy_comparison?.previous?.total_revenue) }}</p>
                </div>
              </div>
              <div class="flex flex-col md:flex-row gap-4">
                <div class="flex-1 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p class="text-sm text-green-600 dark:text-green-400 font-medium">Cambio en Ingresos</p>
                  <div class="flex items-center gap-2 mt-1">
                    <component :is="dashboard.yoy_comparison?.changes?.revenue_change >= 0 ? ArrowUpRight : ArrowDownRight" class="w-5 h-5" :class="dashboard.yoy_comparison?.changes?.revenue_change >= 0 ? 'text-green-600' : 'text-red-600'" />
                    <span class="text-2xl font-bold" :class="dashboard.yoy_comparison?.changes?.revenue_change >= 0 ? 'text-green-600' : 'text-red-600'">
                      {{ formatPercent(dashboard.yoy_comparison?.changes?.revenue_change) }}
                    </span>
                  </div>
                </div>
                <div class="flex-1 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p class="text-sm text-blue-600 dark:text-blue-400 font-medium">Cambio en Transacciones</p>
                  <div class="flex items-center gap-2 mt-1">
                    <component :is="dashboard.yoy_comparison?.changes?.transaction_change >= 0 ? ArrowUpRight : ArrowDownRight" class="w-5 h-5" :class="dashboard.yoy_comparison?.changes?.transaction_change >= 0 ? 'text-green-600' : 'text-red-600'" />
                    <span class="text-2xl font-bold" :class="dashboard.yoy_comparison?.changes?.transaction_change >= 0 ? 'text-blue-600' : 'text-red-600'">
                      {{ formatPercent(dashboard.yoy_comparison?.changes?.transaction_change) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 class="w-5 h-5 text-brand-500" />
                P&L por Ubicación
              </h3>
            </div>
            <div class="space-y-3 max-h-[200px] overflow-y-auto">
              <div v-for="location in dashboard.pnl_by_location" :key="location.location_id"
                class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div class="flex-1">
                  <p class="font-medium text-slate-900 dark:text-white">{{ location.location_name }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">{{ location.transactions }} transacciones</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-slate-900 dark:text-white">{{ formatCurrency(location.revenue) }}</p>
                  <p class="text-xs" :class="location.margin >= 0 ? 'text-green-600' : 'text-red-600'">Margen: {{ location.margin }}%</p>
                </div>
              </div>
              <div v-if="!dashboard.pnl_by_location?.length" class="text-center py-4 text-slate-500">
                Sin datos disponibles
              </div>
            </div>
          </div>
        </div>        

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users class="w-5 h-5 text-brand-500" />
                Customer Lifetime Value
              </h3>
            </div>
            <div class="space-y-3">
              <div class="text-center p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20">
                <p class="text-sm text-brand-600 dark:text-brand-400">CLV Estimado</p>
                <p class="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">
                  {{ formatCurrency(dashboard.customer_lifetime_value?.summary?.estimated_clv) }}
                </p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                  <p class="text-xs text-slate-500 dark:text-slate-400">Clientes</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ formatNumber(dashboard.customer_lifetime_value?.summary?.total_customers) }}</p>
                </div>
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                  <p class="text-xs text-slate-500 dark:text-slate-400">Compra Prom.</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ formatCurrency(dashboard.customer_lifetime_value?.summary?.average_purchase_value) }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText class="w-5 h-5 text-brand-500" />
                Cumplimiento Fiscal
              </h3>
            </div>
            <div class="space-y-3">
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p class="text-sm text-slate-500 dark:text-slate-400">Impuesto Recaudado</p>
                <p class="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {{ formatCurrency(dashboard.tax_compliance?.total_tax_collected) }}
                </p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p class="text-xs text-slate-500 dark:text-slate-400">Ventas Gravables</p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ formatCurrency(dashboard.tax_compliance?.total_taxable_sales) }}</p>
                </div>
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p class="text-xs text-slate-500 dark:text-slate-400">Tasa Efectiva</p>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">{{ dashboard.tax_compliance?.effective_tax_rate || 0 }}%</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target class="w-5 h-5 text-brand-500" />
                CAC (Adquisición)
              </h3>
            </div>
            <div class="space-y-3">
              <div class="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                <p class="text-sm text-green-600 dark:text-green-400">Costo por Cliente</p>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {{ formatCurrency(dashboard.customer_acquisition_cost?.cac) }}
                </p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                  <p class="text-xs text-slate-500 dark:text-slate-400">Nuevos</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ formatNumber(dashboard.customer_acquisition_cost?.new_customers) }}</p>
                </div>
                <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                  <p class="text-xs text-slate-500 dark:text-slate-400">Revenue/Cliente</p>
                  <p class="text-lg font-bold text-slate-900 dark:text-white">{{ formatCurrency(dashboard.customer_acquisition_cost?.revenue_per_customer) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="card p-6 h-[400px] flex flex-col">
            <h3 class="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Package class="w-5 h-5 text-brand-500" />
              Productos más Vendidos
            </h3>
            <div class="flex-1 overflow-y-auto space-y-2">
              <div v-for="(item, index) in dashboard.top_items?.slice(0, 8)" :key="item.id"
                class="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {{ index + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900 dark:text-white text-sm truncate">{{ item.name }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-slate-900 dark:text-white text-sm">{{ formatNumber(item.total_quantity) }}</p>
                </div>
              </div>
              <div v-if="!dashboard.top_items?.length" class="text-center py-8 text-slate-500">
                Sin datos disponibles
              </div>
            </div>
          </div>

          <div class="card p-6 h-[400px] flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle class="w-5 h-5 text-orange-500" />
                Stock Bajo
              </h3>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ dashboard.low_stock?.length || 0 }} productos</span>
            </div>
            <div class="flex-1 overflow-y-auto space-y-2">
              <div v-for="item in dashboard.low_stock?.slice(0, 10)" :key="item.id"
                class="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                @click="navigateTo('/inventory/stock')">
                <div class="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Package class="w-4 h-4 text-orange-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900 dark:text-white text-sm truncate">{{ item.name }}</p>
                  <p class="text-xs text-slate-500">{{ item.category_name || 'Sin categoría' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold" :class="item.total_quantity === 0 ? 'text-red-600' : 'text-orange-600'">
                    {{ formatNumber(item.total_quantity) }}
                  </p>
                </div>
              </div>
              <div v-if="!dashboard.low_stock?.length" class="text-center py-8 text-slate-500">
                Stock OK
              </div>
            </div>
          </div>

          <div class="card p-6 h-[400px] flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock class="w-5 h-5 text-red-500" />
                Productos por Vencer
              </h3>
              <span v-if="totalExpiringCount > 0" class="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium">
                {{ totalExpiringCount }}
              </span>
            </div>
            
            <div v-if="loadingExpirations" class="flex justify-center py-8">
              <div class="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <div v-else-if="totalExpiringCount === 0" class="text-center py-8 text-slate-500 text-sm">
              No hay productos por vencer
            </div>
            
            <div v-else class="flex-1 overflow-y-auto space-y-2">
              <div
                v-for="item in [...expiredItems, ...expiringItems].slice(0, 10)"
                :key="item.id"
                class="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                @click="router.push({ path: '/reportes', query: { tab: 'expirations' } })"
              >
                <div class="w-7 h-7 rounded-lg flex items-center justify-center" :class="(item.days_remaining ?? 0) <= 0 ? 'bg-red-100 dark:bg-red-900/30' : (item.days_remaining ?? 0) <= 7 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'">
                  <Clock class="w-4 h-4" :class="(item.days_remaining ?? 0) <= 0 ? 'text-red-600' : (item.days_remaining ?? 0) <= 7 ? 'text-orange-600' : 'text-yellow-600'" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900 dark:text-white text-sm truncate">{{ item.item_name }}</p>
                  <p class="text-xs text-slate-500">{{ item.location_name }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold" :class="(item.days_remaining ?? 0) <= 0 ? 'text-red-600' : (item.days_remaining ?? 0) <= 7 ? 'text-orange-600' : 'text-yellow-600'">
                    {{ (item.days_remaining ?? 0) <= 0 ? 'VENCIDO' : `${item.days_remaining}d` }}
                  </p>
                  <p class="text-xs text-slate-500">{{ formatDate(item.expiration_date) }}</p>
                </div>
              </div>
            </div>
            
            <div v-if="totalExpiringCount > 10" class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <router-link to="/reports" class="text-xs text-brand-600 hover:text-brand-700 font-medium">
                Ver todos ({{ totalExpiringCount }}) →
              </router-link>
            </div>
          </div>

          <div class="card p-6 h-[400px] flex flex-col">
            <h3 class="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock class="w-5 h-5 text-brand-500" />
              Ventas Recientes
            </h3>
            <div class="flex-1 overflow-y-auto space-y-2">
              <div v-for="sale in dashboard.recent_sales?.slice(0, 10)" :key="sale.id"
                class="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div class="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <ShoppingCart class="w-4 h-4 text-green-600" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-slate-900 dark:text-white text-sm">{{ sale.sale_number }}</p>
                  <p class="text-xs text-slate-500">{{ sale.employee_name }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-slate-900 dark:text-white text-sm">{{ formatCurrency(sale.total) }}</p>
                </div>
              </div>
              <div v-if="!dashboard.recent_sales?.length" class="text-center py-8 text-slate-500">
                Sin ventas recientes
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="card p-8 text-center">
        <p class="text-slate-500">No se pudo cargar el dashboard</p>
        <button @click="fetchDashboard" class="btn-primary mt-4">Reintentar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

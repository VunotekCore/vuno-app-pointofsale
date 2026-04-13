<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { dashboardService } from '../../services/dashboard.service.js'
import { expirationService } from '../../services/expiration.service.js'
import {
  Package,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  BarChart3,
  RefreshCw,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-vue-next'

const router = useRouter()
const currencyStore = useCurrencyStore()

const loading = ref(true)
const dashboard = ref(null)
const selectedLocation = ref(null)
const locations = ref([])
const dateRange = ref('week')
const expiringItems = ref([])
const expiredItems = ref([])
const loadingExpirations = ref(false)

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
    default:
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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

const fetchDashboard = async () => {
  loading.value = true
  try {
    const { start, end } = getDateRange()
    const response = await dashboardService.getManagerDashboard(start, end, selectedLocation.value)
    dashboard.value = response.data.data
  } catch (error) {
    console.error('Error loading manager dashboard:', error)
  } finally {
    loading.value = false
  }
}

const fetchExpirations = async () => {
  loadingExpirations.value = true
  try {
    const params = selectedLocation.value ? { location_id: selectedLocation.value } : {}
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
    const response = await dashboardService.getLocations()
    locations.value = response.data.data
  } catch (error) {
    console.error('Error loading locations:', error)
  }
}

const onLocationChange = () => {
  fetchDashboard()
  fetchExpirations()
}

const onDateRangeChange = () => {
  fetchDashboard()
}

const getHeatmapColor = (transactions, maxTransactions) => {
  if (!maxTransactions || maxTransactions === 0) return 'bg-slate-100 dark:bg-slate-800'
  const intensity = transactions / maxTransactions
  if (intensity > 0.75) return 'bg-red-500 text-white'
  if (intensity > 0.5) return 'bg-orange-400 text-white'
  if (intensity > 0.25) return 'bg-yellow-400 text-slate-900'
  return 'bg-green-300 text-slate-900'
}

const maxTransactions = computed(() => {
  if (!dashboard.value?.sales_by_hour?.hourly_breakdown) return 0
  return Math.max(...dashboard.value.sales_by_hour.hourly_breakdown.map(h => h.transactions))
})

const totalExpiringCount = computed(() => expiringItems.value.length + expiredItems.value.length)

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
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
          Panel de Control Operativo
        </p>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
          Dashboard <span class="text-blue-500">Gerente</span>
        </h1>
      </div>
      <div class="flex flex-col sm:flex-row items-start sm:items-end gap-3 w-full">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <label class="text-sm text-slate-500 dark:text-slate-400">Período:</label>
          <select
            v-model="dateRange"
            @change="onDateRangeChange"
            class="input-field w-full sm:w-32"
          >
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </div>
        <div v-if="locations.length > 0" class="flex items-center gap-2 w-full sm:w-auto">
          <label class="text-sm text-slate-500 dark:text-slate-400">Ubicación:</label>
          <select
            v-model="selectedLocation"
            @change="onLocationChange"
            class="input-field w-full sm:w-48"
          >
            <option :value="null">Todas las ubicaciones</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <template v-else-if="dashboard">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card p-5 border-l-4 border-blue-500">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <RefreshCw class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span class="text-xs text-slate-500 dark:text-slate-400">Inventario</span>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ dashboard.inventory_turnover?.turnover_rate || 0 }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Rotación (veces/mes)</p>
        </div>

        <div class="card p-5 border-l-4 border-green-500">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Package class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span class="text-xs text-slate-500 dark:text-slate-400">Días</span>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ dashboard.inventory_turnover?.turnover_period_days || 0 }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Días de Inventario</p>
        </div>

        <div class="card p-5 border-l-4 border-red-500">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span class="text-xs text-slate-500 dark:text-slate-400">Anulaciones</span>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ dashboard.returns_and_cancellations?.rate?.cancellation_rate || 0 }}%
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Tasa de Cancelación</p>
        </div>

        <div class="card p-5 border-l-4 border-purple-500">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <AlertTriangle class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span class="text-xs text-slate-500 dark:text-slate-400">Discrepancias</span>
          </div>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ dashboard.drawer_discrepancies?.summary?.pending_count || 0 }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Pendientes de Revisar</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users class="w-5 h-5 text-blue-500" />
              Ventas por Empleado
            </h3>
          </div>
          <div class="space-y-3 max-h-[350px] overflow-y-auto">
            <div
              v-for="(employee, index) in dashboard.sales_by_employee"
              :key="employee.id"
              class="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                :class="index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-slate-300 text-slate-700' : index === 2 ? 'bg-orange-400 text-orange-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'">
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-900 dark:text-white truncate">{{ employee.name }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ employee.transactions }} transacciones</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-slate-900 dark:text-white">{{ formatCurrency(employee.total_sales) }}</p>
                <p class="text-xs" :class="employee.percentage_of_total >= 20 ? 'text-green-600' : 'text-slate-500'">
                  {{ employee.percentage_of_total }}% del total
                </p>
              </div>
            </div>
            <div v-if="!dashboard.sales_by_employee?.length" class="text-center py-8 text-slate-500">
              Sin datos disponibles
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock class="w-5 h-5 text-blue-500" />
              Análisis de Horas Pico
            </h3>
            <span v-if="dashboard.sales_by_hour?.peak_hour" class="text-xs text-slate-500">
              Hora pico: {{ dashboard.sales_by_hour.peak_hour.hour }}:00
            </span>
          </div>
          <div class="grid grid-cols-6 lg:grid-cols-8 gap-1">
            <div
              v-for="hour in dashboard.sales_by_hour?.hourly_breakdown"
              :key="hour.hour"
              class="aspect-square rounded flex flex-col items-center justify-center text-xs p-1"
              :class="getHeatmapColor(hour.transactions, maxTransactions)"
              :title="`${hour.label}: ${hour.transactions} transacciones`"
            >
              <span class="font-bold">{{ hour.hour }}</span>
              <span class="text-[10px] opacity-75">{{ hour.transactions }}</span>
            </div>
          </div>
          <div class="flex items-center justify-center gap-4 mt-4 text-xs">
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 rounded bg-green-300"></div>
              <span>Bajo</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 rounded bg-yellow-400"></div>
              <span>Medio</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 rounded bg-orange-400"></div>
              <span>Alto</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 rounded bg-red-500"></div>
              <span>Pico</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-orange-500" />
              Alertas de Stock
            </h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ dashboard.low_stock_alerts?.length }} productos</span>
          </div>
          <div class="space-y-2 max-h-[300px] overflow-y-auto">
            <div
              v-for="item in dashboard.low_stock_alerts?.slice(0, 10)"
              :key="item.id"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
              @click="navigateTo('/inventory/stock')"
            >
              <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Package class="w-4 h-4 text-orange-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-900 dark:text-white text-sm truncate">{{ item.name }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ item.category_name || 'Sin categoría' }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold" :class="item.total_quantity === 0 ? 'text-red-600' : 'text-orange-600'">
                  {{ formatNumber(item.total_quantity) }}
                </p>
                <p class="text-xs text-slate-500">min: {{ item.reorder_level || 0 }}</p>
              </div>
            </div>
            <div v-if="!dashboard.low_stock_alerts?.length" class="text-center py-8 text-slate-500 text-sm">
              Stock OK
            </div>
          </div>
        </div>

        <div class="card p-6">
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
          
          <div v-else class="space-y-2 max-h-[300px] overflow-y-auto">
            <div
              v-for="item in [...expiredItems, ...expiringItems].slice(0, 10)"
              :key="item.id"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
              @click="router.push({ path: '/reportes', query: { tab: 'expirations' } })"
            >
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="(item.days_remaining ?? 0) <= 0 ? 'bg-red-100 dark:bg-red-900/30' : (item.days_remaining ?? 0) <= 7 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'">
                <Clock class="w-4 h-4" :class="(item.days_remaining ?? 0) <= 0 ? 'text-red-600' : (item.days_remaining ?? 0) <= 7 ? 'text-orange-600' : 'text-yellow-600'" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-900 dark:text-white text-sm truncate">{{ item.item_name }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ item.location_name }}</p>
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

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart class="w-5 h-5 text-red-500" />
              Devoluciones y Anulaciones
            </h3>
          </div>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p class="text-xs text-red-600 dark:text-red-400">Devoluciones</p>
                <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ dashboard.returns_and_cancellations?.returns?.count || 0 }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ formatCurrency(dashboard.returns_and_cancellations?.returns?.value || 0) }}</p>
              </div>
              <div class="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <p class="text-xs text-orange-600 dark:text-orange-400">Cancelaciones</p>
                <p class="text-xl font-bold text-orange-600 dark:text-orange-400">{{ dashboard.returns_and_cancellations?.cancellations?.count || 0 }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ formatCurrency(dashboard.returns_and_cancellations?.cancellations?.value || 0) }}</p>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-slate-600 dark:text-slate-400">Tasa de Devoluciones</span>
                <span class="font-bold text-red-600">{{ dashboard.returns_and_cancellations?.rate?.return_rate || 0 }}%</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  class="bg-red-500 h-2 rounded-full transition-all"
                  :style="{ width: `${Math.min(dashboard.returns_and_cancellations?.rate?.return_rate || 0, 100)}%` }"
                ></div>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-slate-600 dark:text-slate-400">Tasa de Cancelación</span>
                <span class="font-bold text-orange-600">{{ dashboard.returns_and_cancellations?.rate?.cancellation_rate || 0 }}%</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  class="bg-orange-500 h-2 rounded-full transition-all"
                  :style="{ width: `${Math.min(dashboard.returns_and_cancellations?.rate?.cancellation_rate || 0, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign class="w-5 h-5 text-purple-500" />
              Discrepancias de Caja
            </h3>
          </div>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p class="text-xs text-green-600 dark:text-green-400">Sobrantes</p>
                <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(dashboard.drawer_discrepancies?.summary?.total_overages || 0) }}</p>
              </div>
              <div class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p class="text-xs text-red-600 dark:text-red-400">Faltantes</p>
                <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ formatCurrency(dashboard.drawer_discrepancies?.summary?.total_shortages || 0) }}</p>
              </div>
            </div>
            <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-600 dark:text-slate-400">Diferencia Neta</span>
                <span class="font-bold" :class="(dashboard.drawer_discrepancies?.summary?.net_discrepancy || 0) >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ formatCurrency(dashboard.drawer_discrepancies?.summary?.net_discrepancy || 0) }}
                </span>
              </div>
            </div>
            <div v-if="dashboard.drawer_discrepancies?.pending_adjustments?.length > 0" class="space-y-2">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Pendientes de Revisión:</p>
              <div
                v-for="adj in dashboard.drawer_discrepancies.pending_adjustments.slice(0, 3)"
                :key="adj.id"
                class="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
              >
                <AlertTriangle class="w-4 h-4 text-yellow-600" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ adj.location }}</p>
                  <p class="text-xs text-slate-500">{{ adj.created_by }}</p>
                </div>
                <span class="text-sm font-bold" :class="adj.type === 'overage' ? 'text-green-600' : 'text-red-600'">
                  {{ adj.type === 'overage' ? '+' : '' }}{{ formatCurrency(adj.amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="card p-8 text-center">
      <p class="text-slate-500">No se pudo cargar el dashboard</p>
      <button @click="fetchDashboard" class="btn-primary mt-4">
        Reintentar
      </button>
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

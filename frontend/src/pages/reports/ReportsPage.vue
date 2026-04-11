<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { useLocationStore } from '../../stores/location.store.js'
import { useAuthStore } from '../../stores/auth.store.js'
import api from '../../services/api.service.js'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import {
  FileText,
  ShoppingCart,
  Package,
  Truck,
  Wallet,
  Calendar,
  Download,
  Loader2,
  Filter,
  FileSpreadsheet
} from 'lucide-vue-next'

const notification = useNotificationStore()
const currencyStore = useCurrencyStore()
const locationStore = useLocationStore()
const authStore = useAuthStore()

const activeTab = ref('sales')
const tabs = [
  { key: 'sales', name: 'Ventas', icon: ShoppingCart },
  { key: 'inventory', name: 'Inventario', icon: Package },
  { key: 'purchases', name: 'Compras', icon: Truck },
  { key: 'cash', name: 'Caja', icon: Wallet }
]

const loading = ref(false)
const data = ref([])
const totalRecords = ref(0)
const currentPage = ref(1)
const pageLimit = ref(20)

const dateFrom = ref('')
const dateTo = ref('')
const dateFromInputRefDesktop = ref(null)
const dateToInputRefDesktop = ref(null)
const dateFromInputRefMobile = ref(null)
const dateToInputRefMobile = ref(null)
let dateFromPicker = null
let dateToPicker = null
const showFilters = ref(false)

const selectedLocation = ref(null)
const selectedUser = ref(null)
const statusFilter = ref('')

const users = ref([])
const isAdmin = computed(() => authStore.user?.is_admin == 1 || authStore.user?.role_name?.toLowerCase() === 'admin')

const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))

function getCurrentMonthDates() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const formatDate = (date) => date.toISOString().split('T')[0]
  return { from: formatDate(firstDay), to: formatDate(lastDay) }
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const statusOptions = computed(() => {
  switch (activeTab.value) {
    case 'sales':
      return [
        { value: '', label: 'Todos los estados' },
        { value: 'pending', label: 'Pendiente' },
        { value: 'completed', label: 'Completada' },
        { value: 'suspended', label: 'Suspendida' },
        { value: 'cancelled', label: 'Cancelada' }
      ]
    case 'purchases':
      return [
        { value: '', label: 'Todos los estados' },
        { value: 'pending', label: 'Pendiente' },
        { value: 'completed', label: 'Completada' },
        { value: 'cancelled', label: 'Cancelada' }
      ]
    case 'inventory':
      return [
        { value: '', label: 'Todos los tipos' },
        { value: 'in', label: 'Entrada' },
        { value: 'out', label: 'Salida' },
        { value: 'adjustment', label: 'Ajuste' }
      ]
    default:
      return []
  }
})

const tableColumns = computed(() => {
  switch (activeTab.value) {
    case 'sales':
      return [
        { key: 'sale_number', label: 'Número' },
        { key: 'sale_date', label: 'Fecha' },
        { key: 'customer_name', label: 'Cliente' },
        { key: 'employee_name', label: 'Empleado' },
        { key: 'location_name', label: 'Ubicación' },
        { key: 'total', label: 'Total' },
        { key: 'status', label: 'Estado' }
      ]
    case 'inventory':
      return [
        { key: 'created_at', label: 'Fecha' },
        { key: 'item_name', label: 'Producto' },
        { key: 'movement_type', label: 'Tipo' },
        { key: 'quantity_change', label: 'Cantidad' },
        { key: 'location_name', label: 'Ubicación' },
        { key: 'created_by_name', label: 'Usuario' }
      ]
    case 'purchases':
      return [
        { key: 'document_date', label: 'Fecha' },
        { key: 'document_type', label: 'Tipo' },
        { key: 'document_number', label: 'Número' },
        { key: 'supplier_name', label: 'Proveedor' },
        { key: 'location_name', label: 'Ubicación' },
        { key: 'total_amount', label: 'Total' },
        { key: 'status', label: 'Estado' }
      ]
    case 'cash':
      return [
        { key: 'created_at', label: 'Fecha' },
        { key: 'transaction_type', label: 'Tipo' },
        { key: 'type', label: 'Detalle' },
        { key: 'amount', label: 'Monto' },
        { key: 'location_name', label: 'Ubicación' },
        { key: 'user_name', label: 'Usuario' }
      ]
    default:
      return []
  }
})

onMounted(async () => {
  const { from, to } = getCurrentMonthDates()
  dateFrom.value = from
  dateTo.value = to
  
  await nextTick()
  
  const spanishLocale = {
    firstDayOfWeek: 1,
    weekdays: {
      shorthand: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
      longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    },
    months: {
      shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    }
  }

  if (dateFromInputRefDesktop.value) {
    dateFromPicker = flatpickr(dateFromInputRefDesktop.value, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      locale: spanishLocale,
      onChange: (selectedDates, dateStr) => {
        dateFrom.value = dateStr
        loadData()
      }
    })
    dateFromPicker.setDate(from)
  }

  if (dateToInputRefDesktop.value) {
    dateToPicker = flatpickr(dateToInputRefDesktop.value, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      locale: spanishLocale,
      onChange: (selectedDates, dateStr) => {
        dateTo.value = dateStr
        loadData()
      }
    })
    dateToPicker.setDate(to)
  }

  if (dateFromInputRefMobile.value) {
    flatpickr(dateFromInputRefMobile.value, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      locale: spanishLocale,
      onChange: (selectedDates, dateStr) => {
        dateFrom.value = dateStr
        loadData()
      }
    })
  }

  if (dateToInputRefMobile.value) {
    flatpickr(dateToInputRefMobile.value, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      locale: spanishLocale,
      onChange: (selectedDates, dateStr) => {
        dateTo.value = dateStr
        loadData()
      }
    })
  }

  await loadLocations()
  await loadUsers()
  await loadData()
})

watch([activeTab], () => {
  currentPage.value = 1
  statusFilter.value = ''
  loadData()
})

watch([statusFilter, dateFrom, dateTo, selectedLocation, selectedUser], () => {
  currentPage.value = 1
  loadData()
})

async function loadLocations() {
  try {
    const { data: response } = await api.get('/users-locations/me/locations')
    let activeLocations = (response.data || []).filter(l => l.is_active).map(l => ({
      id: l.location_id,
      name: l.location_name,
      code: l.location_code,
      is_active: l.is_active
    }))
    
    if (activeLocations.length === 0) {
      const { data: allLocations } = await api.get('/core/locations')
      activeLocations = (allLocations.data || []).filter(l => l.is_active)
    }
    
    locationStore.setLocations(activeLocations)
    if (!isAdmin.value) {
      selectedLocation.value = locationStore.getSelectedLocation()
    }
  } catch (error) {
    console.error('Error loading locations:', error)
  }
}

async function loadUsers() {
  try {
    const { data: response } = await api.get('/users', { params: { limit: 1000 } })
    users.value = (response.data || []).map(u => ({
      id: u.id,
      username: u.username,
      name: u.first_name ? `${u.first_name} ${u.last_name || ''}` : u.username
    }))
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value
    }

    if (dateFrom.value) params.start_date = dateFrom.value
    if (dateTo.value) params.end_date = dateTo.value
    
    if (selectedLocation.value) {
      params.location_id = selectedLocation.value.id || selectedLocation.value
    } else if (!isAdmin.value && locationStore.selectedLocationId) {
      params.location_id = locationStore.selectedLocationId
    }

    if (selectedUser.value) {
      params.user_id = selectedUser.value.id || selectedUser.value
    }

    if (statusFilter.value) {
      params.status = statusFilter.value
    }

    if (activeTab.value === 'inventory' && statusFilter.value) {
      params.movement_type = statusFilter.value
    }

    const endpoints = {
      sales: '/reports/sales',
      inventory: '/reports/inventory',
      purchases: '/reports/purchases',
      cash: '/reports/cash'
    }

    const { data: response } = await api.get(endpoints[activeTab.value], { params })
    data.value = response.data || []
    totalRecords.value = response.total || 0
  } catch (error) {
    notification.error('Error al cargar datos')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadData()
  }
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatMoney(amount) {
  return currencyStore.formatMoney(amount)
}

function getCellValue(row, column) {
  switch (column.key) {
    case 'sale_date':
    case 'created_at':
    case 'document_date':
      return formatDate(row[column.key])
    case 'customer_name':
      const firstName = row.customer_first_name || ''
      const lastName = row.customer_last_name || ''
      return firstName || lastName ? `${firstName} ${lastName}`.trim() : '-'
    case 'total':
    case 'total_amount':
      return formatMoney(row[column.key])
    case 'amount':
      return formatMoney(row[column.key])
    case 'quantity_change':
      const qty = parseFloat(row[column.key])
      return qty > 0 ? `+${qty}` : qty
    case 'document_type':
      return row.document_type === 'receiving' ? 'Recepción' : 'Orden de Compra'
    case 'document_number':
      return row.receiving_number || row.po_number || '-'
    case 'movement_type':
      const types = { in: 'Entrada', out: 'Salida', adjustment: 'Ajuste' }
      return types[row[column.key]] || row[column.key]
    case 'transaction_type':
      const txTypes = { shift: 'Turno', transaction: 'Transacción', adjustment: 'Ajuste' }
      return txTypes[row[column.key]] || row[column.key]
    case 'type':
      return row.type || row.adjustment_type || '-'
    default:
      return row[column.key] || '-'
  }
}

function getStatusClass(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    suspended: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    pending_approval: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return colors[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

function exportData(format) {
  const params = new URLSearchParams()
  if (dateFrom.value) params.append('start_date', dateFrom.value)
  if (dateTo.value) params.append('end_date', dateTo.value)
  if (selectedLocation.value) params.append('location_id', selectedLocation.value.id || selectedLocation.value)
  if (selectedUser.value) params.append('user_id', selectedUser.value.id || selectedUser.value)
  if (statusFilter.value) params.append('status', statusFilter.value)

  if (activeTab.value === 'inventory' && statusFilter.value) {
    params.append('movement_type', statusFilter.value)
  }


  const token = localStorage.getItem('token')

  const API_URL = import.meta.env.VITE_APP_URL
  const API_PORT = import.meta.env.VITE_APP_PORT
  
  const baseUrl = API_PORT ?  `${API_URL}:${API_PORT}/reports/${activeTab.value}/export` : `${API_URL}/reports/${activeTab.value}/export`

  const url = `${baseUrl}?${params.toString()}&format=${format}`
  
  window.open(url, '_blank')
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <FileText class="w-7 h-7 text-brand-500" />
          Reportes
        </h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Visualiza y exporta reportes del sistema</p>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
      <div class="border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <nav class="flex gap-1 p-1 min-w-max">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            :class="activeTab === tab.key
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Mobile Filter Toggle -->
      <div class="lg:hidden p-3 border-b border-slate-200 dark:border-slate-800">
        <button
          @click="showFilters = !showFilters"
          class="w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-500 transition-colors flex items-center justify-center gap-2"
        >
          <Filter class="w-4 h-4" />
          {{ showFilters ? 'Ocultar filtros' : 'Mostrar filtros' }}
          <span v-if="selectedUser || selectedLocation || statusFilter" class="px-1.5 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs rounded-full">
            {{ [selectedUser && 'Usuario', selectedLocation && 'Ubicación', statusFilter && 'Estado'].filter(Boolean).length }}
          </span>
        </button>
      </div>

      <!-- Desktop Filters (always visible) -->
      <div class="hidden lg:block p-4">
        <div class="flex flex-wrap gap-3">
          <div class="flex-1 min-w-[200px]">
            <select
              v-model="selectedUser"
              class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option :value="null">Todos los usuarios</option>
              <option v-for="user in users" :key="user.id" :value="user">
                {{ user.name }}
              </option>
            </select>
          </div>

          <select
            v-if="isAdmin"
            v-model="selectedLocation"
            class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-w-[180px]"
          >
            <option :value="null">Todas las ubicaciones</option>
            <option v-for="loc in locationStore.locations" :key="loc.id" :value="loc">
              {{ loc.name }}
            </option>
          </select>

          <select
            v-if="statusOptions.length > 0"
            v-model="statusFilter"
            class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-w-[160px]"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <div class="relative">
            <input
              ref="dateFromInputRefDesktop"
              v-model="dateFrom"
              type="text"
              class="px-4 py-2.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer"
            />
          </div>
          <div class="relative">
            <input
              ref="dateToInputRefDesktop"
              v-model="dateTo"
              type="text"
              class="px-4 py-2.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer"
            />
          </div>

          <div class="flex gap-2 ml-auto">
            <button
              @click="exportData('csv')"
              class="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
            >
              <FileSpreadsheet class="w-4 h-4" />
              CSV
            </button>
            <button
              @click="exportData('excel')"
              class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
            >
              <Download class="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Filters Panel -->
      <div v-if="showFilters" class="lg:hidden p-4 space-y-3">
        <select
          v-model="selectedUser"
          class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          <option :value="null">Todos los usuarios</option>
          <option v-for="user in users" :key="user.id" :value="user">
            {{ user.name }}
          </option>
        </select>

        <select
          v-if="isAdmin"
          v-model="selectedLocation"
          class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          <option :value="null">Todas las ubicaciones</option>
          <option v-for="loc in locationStore.locations" :key="loc.id" :value="loc">
            {{ loc.name }}
          </option>
        </select>

        <select
          v-if="statusOptions.length > 0"
          v-model="statusFilter"
          class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <div class="flex gap-2">
          <div class="flex-1">
            <input
              ref="dateFromInputRefMobile"
              v-model="dateFrom"
              type="text"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white cursor-pointer"
            />
          </div>
          <div class="flex-1">
            <input
              ref="dateToInputRefMobile"
              v-model="dateTo"
              type="text"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white cursor-pointer"
            />
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="exportData('csv')"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
          >
            <FileSpreadsheet class="w-4 h-4" />
            CSV
          </button>
          <button
            @click="exportData('excel')"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
          >
            <Download class="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div v-if="loading" class="p-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
      </div>
      <div v-else-if="data.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
        No hay datos para mostrar
      </div>
      <template v-else>
        <!-- Desktop Table -->
        <div class="hidden lg:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th
                  v-for="col in tableColumns"
                  :key="col.key"
                  class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                >
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr
                v-for="(row, index) in data"
                :key="index"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td
                  v-for="col in tableColumns"
                  :key="col.key"
                  class="px-4 py-3"
                  :class="{
                    'font-medium text-slate-900 dark:text-white': col.key === 'sale_number' || col.key === 'document_number',
                    'whitespace-nowrap': ['sale_date', 'created_at', 'document_date', 'total', 'total_amount', 'amount'].includes(col.key)
                  }"
                >
                  <template v-if="col.key === 'status' || col.key === 'adjustment_status'">
                    <span
                      class="inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize"
                      :class="getStatusClass(row[col.key])"
                    >
                      {{ row[col.key] }}
                    </span>
                  </template>
                  <template v-else-if="col.key === 'quantity_change'">
                    <span :class="parseFloat(row[col.key]) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ getCellValue(row, col) }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-slate-600 dark:text-slate-300">
                      {{ getCellValue(row, col) }}
                    </span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
          <div
            v-for="(row, index) in data"
            :key="index"
            class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <p class="font-medium text-slate-900 dark:text-white text-sm">
                  {{ row.sale_number || row.document_number || row.receiving_number || row.po_number || tableColumns[0]?.key ? row[tableColumns[0]?.key] : '' }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ row.sale_date || row.created_at || row.document_date || '' }}
                </p>
              </div>
              <template v-if="row.status || row.movement_type">
                <span
                  v-if="row.status"
                  class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize whitespace-nowrap"
                  :class="getStatusClass(row.status)"
                >
                  {{ row.status }}
                </span>
                <span
                  v-else
                  class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize whitespace-nowrap"
                  :class="row.movement_type === 'in' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : row.movement_type === 'out' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
                >
                  {{ row.movement_type === 'in' ? 'Entrada' : row.movement_type === 'out' ? 'Salida' : 'Ajuste' }}
                </span>
              </template>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div v-for="col in tableColumns.filter(c => !['sale_number', 'document_number', 'sale_date', 'created_at', 'document_date', 'status', 'movement_type'].includes(c.key))" :key="col.key">
                <span class="text-slate-400">{{ col.label }}:</span>
                <span :class="col.key === 'quantity_change' ? (parseFloat(row[col.key]) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-slate-600 dark:text-slate-300'" class="ml-1">
                  {{ getCellValue(row, col) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="totalRecords > 0"
      class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl text-slate-700 dark:text-slate-300"
    >
      <div class="text-sm font-medium">
        {{ totalRecords }} registro{{ totalRecords !== 1 ? 's' : '' }} | Página {{ currentPage }} de {{ totalPages }}
      </div>
      <div v-if="totalPages > 1" class="flex items-center gap-1">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          &larr;
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          @click="goToPage(page)"
          class="px-3 py-1.5 text-sm font-medium rounded-lg border"
          :class="page === currentPage
            ? 'bg-brand-500 text-white border-brand-500'
            : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
        >
          {{ page }}
        </button>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          &rarr;
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.flatpickr-calendar {
  border-radius: 12px !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e2e8f0 !important;
}

.flatpickr-day.selected,
.flatpickr-day.startRange,
.flatpickr-day.endRange,
.flatpickr-day.selected.inRange,
.flatpickr-day.startRange.inRange,
.flatpickr-day.endRange.inRange,
.flatpickr-day.selected:focus,
.flatpickr-day.startRange:focus,
.flatpickr-day.endRange:focus,
.flatpickr-day.selected:hover,
.flatpickr-day.startRange:hover,
.flatpickr-day.endRange:hover {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.flatpickr-day.inRange {
  border-color: #e2e8f0 !important;
}

.flatpickr-months .flatpickr-prev-month:hover,
.flatpickr-months .flatpickr-next-month:hover {
  fill: #3b82f6 !important;
}

.flatpickr-current-month .flatpickr-monthDropdown-months:hover {
  background: transparent !important;
}
</style>

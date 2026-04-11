<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useLocationStore } from '../../stores/location.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { useAuthStore } from '../../stores/auth.store.js'
import { useDebounce } from '../../composables/useDebounce.js'
import { paymentService } from '../../services/payment.service.js'
import { coreService } from '../../services/inventory.service.js'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import {
  FileText,
  Download,
  X,
  Search,
  MapPin,
  User,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-vue-next'

const router = useRouter()
const notification = useNotificationStore()
const locationStore = useLocationStore()
const currencyStore = useCurrencyStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.user?.role_name?.toLowerCase() === 'admin' || authStore.user?.is_admin)

const drawerClosures = ref([])
const selectedLocation = ref(null)
const loading = ref(false)
const locations = ref([])
const expandedClosure = ref(null)
const closureDetails = ref(null)
const loadingDetails = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageLimit = ref(20)
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))
const showFilters = ref(false)

const dateFrom = ref('')
const dateTo = ref('')
const dateFromInputRefDesktop = ref(null)
const dateToInputRefDesktop = ref(null)
const dateFromInputRefMobile = ref(null)
const dateToInputRefMobile = ref(null)
let dateFromPicker = null
let dateToPicker = null

function getCurrentMonthDates() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return {
    from: formatDate(firstDay),
    to: formatDate(lastDay)
  }
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadClosures()
}, 300)

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
        currentPage.value = 1
        loadClosures()
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
        currentPage.value = 1
        loadClosures()
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
        currentPage.value = 1
        loadClosures()
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
        currentPage.value = 1
        loadClosures()
      }
    })
  }
  
  await loadLocations()
  if (locationStore.locations.length > 0) {
    selectedLocation.value = locationStore.getSelectedLocation()
    await loadClosures()
  }
})

async function toggleDetails(closure) {
  if (expandedClosure.value === closure.id) {
    expandedClosure.value = null
    closureDetails.value = null
  } else {
    expandedClosure.value = closure.id
    loadingDetails.value = true
    try {
      const { data } = await paymentService.getCashSummary(closure.id)
      if (data.success) {
        closureDetails.value = data.data
      }
    } catch (error) {
      notification.error('Error al cargar detalles')
    } finally {
      loadingDetails.value = false
    }
  }
}

async function loadLocations() {
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
    notification.error('Error al cargar ubicaciones')
  }
}

async function loadClosures() {
  if (!selectedLocation.value) return
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      search: searchQuery.value
    }
    
    if (dateFrom.value) params.start_date = dateFrom.value
    if (dateTo.value) params.end_date = dateTo.value
    
    const { data } = await paymentService.getDrawerHistory(selectedLocation.value.id, params)
    if (data.success) {
      drawerClosures.value = data.data || []
      totalRecords.value = data.total || data.data?.length || 0
    }
  } catch (error) {
    notification.error('Error al cargar cierres de caja')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadClosures()
  }
}

watch(searchQuery, () => {
  debouncedSearch()
})

watch(selectedLocation, () => {
  currentPage.value = 1
  loadClosures()
})

function formatMoney(amount) {
  return currencyStore.formatMoney(amount || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatTime(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function downloadPDF(closure) {
  try {
    const response = await paymentService.downloadClosePDF(closure.id)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    const fileName = `cierre-${closure.name.replace(/\s+/g, '-')}-${new Date(closure.closed_at).toISOString().split('T')[0]}.pdf`
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    notification.success('PDF descargado')
  } catch (error) {
    console.error('Error downloading PDF:', error)
    notification.error('Error al descargar el PDF')
  }
}

function goToCaja() {
  router.push('/caja')
}
</script>

<template>
  <div class="h-[calc(100vh-8rem)] flex flex-col gap-4">
    <!-- Header -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <FileText class="w-6 h-6 md:w-7 md:h-7 text-brand-500" />
            Historial de Cierres
          </h1>
          <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">Ver el historial de cierres de caja</p>
        </div>
        <button
          @click="goToCaja"
          class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center gap-2"
        >
          <Unlock class="w-4 h-4" />
          Ir a Caja
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <!-- Mobile Filter Toggle -->
        <div class="lg:hidden p-3 border-b border-slate-200 dark:border-slate-800">
          <button
            @click="showFilters = !showFilters"
            class="w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-500 transition-colors flex items-center justify-center gap-2"
          >
            <Search class="w-4 h-4" />
            {{ showFilters ? 'Ocultar filtros' : 'Mostrar filtros' }}
            <span v-if="searchQuery || selectedLocation" class="px-1.5 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs rounded-full">
              {{ [searchQuery && 'Búsqueda', selectedLocation && 'Ubicación'].filter(Boolean).length }}
            </span>
          </button>
        </div>

        <!-- Desktop Filters (always visible) -->
        <div class="hidden lg:flex flex-row gap-3 p-4">
          <div class="flex-1 min-w-[150px]">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar..."
                class="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
              <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
            </div>
          </div>
          <select
            v-model="selectedLocation"
            @change="loadClosures"
            class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option v-for="loc in locationStore.locations" :key="loc.id" :value="loc">
              {{ loc.name }}
            </option>
          </select>
          <div class="relative">
            <input
              ref="dateFromInputRefDesktop"
              v-model="dateFrom"
              type="text"
              class="w-36 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer"
            />
          </div>
          <div class="relative">
            <input
              ref="dateToInputRefDesktop"
              v-model="dateTo"
              type="text"
              class="w-36 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer"
            />
          </div>
        </div>

        <!-- Mobile Filters Panel -->
        <div v-if="showFilters" class="lg:hidden p-4 space-y-3">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar..."
              class="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
          <select
            v-model="selectedLocation"
            @change="loadClosures"
            class="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          >
            <option v-for="loc in locationStore.locations" :key="loc.id" :value="loc">
              {{ loc.name }}
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
        </div>
      </div>
    </div>

    <!-- Closures List -->
    <div class="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-auto">
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>

      <div v-else-if="drawerClosures.length === 0" class="flex flex-col items-center justify-center h-full">
        <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <FileText class="w-12 h-12 text-slate-400" />
        </div>
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">No hay cierres</h2>
        <p class="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
          No se han registrado cierres de caja para esta ubicación.
        </p>
        <button
          @click="goToCaja"
          class="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center gap-2"
        >
          <Unlock class="w-5 h-5" />
          Abrir Caja
        </button>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="closure in drawerClosures"
          :key="closure.id"
          class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Lock class="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 class="font-semibold text-slate-900 dark:text-white">{{ closure.name }}</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Cerrado el {{ formatDateTime(closure.closed_at) }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Ubicación</p>
                  <p class="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                    <MapPin class="w-3 h-3" />
                    {{ closure.location_name }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Abierto por</p>
                  <p class="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                    <User class="w-3 h-3" />
                    {{ closure.opened_by_name || 'N/A' }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Monto Inicial</p>
                  <p class="font-medium text-slate-900 dark:text-white">
                    {{ formatMoney(closure.initial_amount) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Monto Final</p>
                  <p class="font-medium text-green-600 dark:text-green-400">
                    {{ formatMoney(closure.current_amount) }}
                  </p>
                </div>
              </div>

              <div v-if="closure.notes" class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p class="text-xs text-slate-500 dark:text-slate-400">Observaciones:</p>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ closure.notes }}</p>
              </div>
            </div>

            <button
              @click="downloadPDF(closure)"
              class="ml-2 p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg hover:bg-brand-200 dark:hover:bg-brand-900/50"
              title="Descargar PDF"
            >
              <Download class="w-5 h-5" />
            </button>
            <button
              @click="toggleDetails(closure)"
              class="ml-2 p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              :title="expandedClosure === closure.id ? 'Ocultar detalles' : 'Ver detalles'"
            >
              <ChevronDown v-if="expandedClosure === closure.id" class="w-5 h-5" />
              <ChevronRight v-else class="w-5 h-5" />
            </button>
          </div>

          <div v-if="expandedClosure === closure.id" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div v-if="loadingDetails" class="text-center py-2">
              <span class="text-slate-500">Cargando detalles...</span>
            </div>
            <div v-else-if="closureDetails" class="space-y-3">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Ventas en Efectivo</p>
                  <p class="font-medium text-green-600 dark:text-green-400">{{ formatMoney(closureDetails.total_cash_sales) }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Total Retiros</p>
                  <p class="font-medium text-red-600 dark:text-red-400">{{ formatMoney(closureDetails.total_withdrawals) }}</p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Efectivo Esperado</p>
                  <p class="font-medium text-slate-900 dark:text-white">{{ formatMoney(closureDetails.expected_cash) }}</p>
                </div>
              </div>
              <div v-if="closureDetails.sales && closureDetails.sales.length > 0">
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Ventas:</p>
                <div class="space-y-2">
                  <div v-for="sale in closureDetails.sales" :key="sale.id" 
                    class="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm">
                    <div class="flex items-center justify-between">
                      <span class="text-blue-600 dark:text-blue-400">Venta {{ sale.sale_number }}</span>
                      <span class="font-semibold text-green-600 dark:text-green-400">{{ formatMoney(sale.total) }}</span>
                    </div>
                    <div v-if="sale.created_by_name" class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Cajero: {{ sale.created_by_name }} - {{ new Date(sale.sale_date).toLocaleString() }}
                    </div>
                    <div v-if="sale.first_name || sale.last_name" class="text-xs text-slate-400 dark:text-slate-500">
                      Cliente: {{ sale.first_name }} {{ sale.last_name }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="closureDetails.transactions && closureDetails.transactions.length > 0">
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-2">Transacciones:</p>
                <div class="space-y-2">
                  <div v-for="tx in closureDetails.transactions" :key="tx.id" 
                    class="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm">
                    <div class="flex items-center justify-between">
                      <span :class="tx.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-green-600'">
                        {{ tx.transaction_type === 'withdrawal' ? 'Retiro' : 'Depósito' }}
                      </span>
                      <span :class="tx.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-green-600'">
                        {{ tx.transaction_type === 'withdrawal' ? '-' : '+' }}{{ formatMoney(tx.amount) }}
                      </span>
                    </div>
                    <div v-if="tx.notes" class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Nota: {{ tx.notes }}
                    </div>
                    <div v-if="tx.created_by_name" class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Por: {{ tx.created_by_name }} - {{ new Date(tx.created_at).toLocaleString() }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl text-slate-700 dark:text-slate-300">
        <div class="text-sm font-medium">
          {{ totalRecords }} registro{{ totalRecords !== 1 ? 's' : '' }} | Página {{ currentPage }} de {{ totalPages }}
        </div>
        <div v-if="totalPages > 1" class="flex items-center gap-1">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
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
              : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'"
          >
            {{ page }}
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

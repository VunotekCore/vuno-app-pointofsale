<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { useLocationStore } from '../../stores/location.store.js'
import { useAuthStore } from '../../stores/auth.store.js'
import { salesService } from '../../services/sales.service.js'
import { coreService } from '../../services/inventory.service.js'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import {
  Plus,
  Pencil,
  Eye,
  X,
  ShoppingCart,
  Search,
  Loader2,
  Receipt,
  CreditCard,
  DollarSign,
  Calendar,
  Download,
  AlertTriangle
} from 'lucide-vue-next'

const notification = useNotificationStore()
const currencyStore = useCurrencyStore()
const locationStore = useLocationStore()
const authStore = useAuthStore()

const sales = ref([])
const loading = ref(false)
const loadingDetail = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const dateFromDisplay = ref('')
const dateToDisplay = ref('')
const dateFromInputRef = ref(null)
const dateToInputRef = ref(null)
const selectedLocation = ref(null)
let dateFromPicker = null
let dateToPicker = null
const selectedSale = ref(null)
const showDetailModal = ref(false)
const showTicketPreview = ref(false)
const showCancelModal = ref(false)
const showCompleteModal = ref(false)
const cancelNotes = ref('')
const completePaymentMethod = ref('cash')
const completeAmountPaid = ref(0)
const completeAmountPaidDisplay = ref('0')
const completingSale = ref(false)
const ticketData = ref(null)
const ticketHtml = ref(null)
const ticketSaleNumber = ref('')
const ticketSaleId = ref('')
const loadingTicket = ref(false)

function getCurrentMonthDates() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  const formatDate = (date) => date.toISOString().split('T')[0]
  
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

// Pagination
const currentPage = ref(1)
const pageLimit = ref(20)
const totalRecords = ref(0)

const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))
const isAdmin = computed(() => authStore.user?.role_name === 'admin')

onMounted(async () => {
  const { from, to } = getCurrentMonthDates()
  dateFrom.value = from
  dateTo.value = to
  dateFromDisplay.value = formatDateDisplay(from)
  dateToDisplay.value = formatDateDisplay(to)
  
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

  if (dateFromInputRef.value) {
    dateFromPicker = flatpickr(dateFromInputRef.value, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      locale: spanishLocale,
      onChange: (selectedDates, dateStr) => {
        dateFrom.value = dateStr
        loadSales()
      }
    })
    dateFromPicker.setDate(from)
  }

  if (dateToInputRef.value) {
    dateToPicker = flatpickr(dateToInputRef.value, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      locale: spanishLocale,
      onChange: (selectedDates, dateStr) => {
        dateTo.value = dateStr
        loadSales()
      }
    })
    dateToPicker.setDate(to)
  }
  
  await loadLocations()
  await loadSales()
})

watch([statusFilter, dateFrom, dateTo, selectedLocation], () => {
  currentPage.value = 1
  loadSales()
})

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadSales()
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
    selectedLocation.value = isAdmin.value ? null : locationStore.getSelectedLocation()
  } catch (error) {
    console.error('Error loading locations:', error)
  }
}

async function loadSales() {
  loading.value = true
  try {
    const params = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (dateFrom.value) params.start_date = dateFrom.value
    if (dateTo.value) params.end_date = dateTo.value
    if (selectedLocation.value) {
      params.location_id = selectedLocation.value.id
    } else if (!isAdmin.value && locationStore.selectedLocationId) {
      params.location_id = locationStore.selectedLocationId
    }
    
    params.limit = pageLimit.value
    params.offset = (currentPage.value - 1) * pageLimit.value
    
    const { data } = await salesService.getSales(params)
    sales.value = data.data || []
    totalRecords.value = data.total || 0
  } catch (error) {
    notification.error('Error al cargar ventas')
  } finally {
    loading.value = false
  }
}

async function viewSale(sale) {
  loadingDetail.value = true
  showDetailModal.value = true
  selectedSale.value = null
  try {
    const { data } = await salesService.getSale(sale.id)
    selectedSale.value = data.data
  } catch (error) {
    notification.error('Error al cargar detalles de venta')
    showDetailModal.value = false
  } finally {
    loadingDetail.value = false
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedSale.value = null
}

async function resumeSale(sale) {
  window.$confirm(
    '¿Desea reanudar esta venta?',
    async () => {
      try {
        await salesService.resumeSale(sale.id)
        notification.success('Venta reanudada correctamente')
        loadSales()
        showDetailModal.value = false
      } catch (error) {
        notification.error(error.response?.data?.message || 'Error al reanudar venta')
      }
    },
    { type: 'info', title: 'Reanudar Venta', buttonLabel: 'Reanudar' }
  )
}

async function cancelSale(sale) {
  selectedSale.value = sale
  cancelNotes.value = ''
  showCancelModal.value = true
}

async function confirmCancelSale() {
  if (!cancelNotes.value.trim()) {
    notification.warning('Ingrese un motivo de cancelación')
    return
  }
  
  try {
    await salesService.cancelSale(selectedSale.value.id, cancelNotes.value)
    notification.success('Venta cancelada correctamente')
    showCancelModal.value = false
    loadSales()
    showDetailModal.value = false
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al cancelar venta')
  }
}

function openCompleteModal(sale) {
  selectedSale.value = sale
  completePaymentMethod.value = 'cash'
  completeAmountPaid.value = parseFloat(sale.total)
  const decimals = currencyStore.decimal_places || 2
  completeAmountPaidDisplay.value = completeAmountPaid.value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  showCompleteModal.value = true
}

function onCompleteAmountInput(e) {
  const val = e.target.value.replace(/[^0-9.]/g, '')
  const num = parseFloat(val)
  completeAmountPaid.value = isNaN(num) ? 0 : currencyStore.roundMoney(num)
  completeAmountPaidDisplay.value = val
}

function onCompleteAmountBlur() {
  const decimals = currencyStore.decimal_places || 2
  completeAmountPaidDisplay.value = completeAmountPaid.value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

async function confirmCompleteSale() {
  if (completeAmountPaid.value < parseFloat(selectedSale.value.total)) {
    notification.warning('El monto pagado es menor al total')
    return
  }

  completingSale.value = true
  try {
    await salesService.completeSale(selectedSale.value.id, [
      {
        payment_type: completePaymentMethod.value,
        amount: completeAmountPaid.value
      }
    ])
    notification.success('Venta completada correctamente')
    showCompleteModal.value = false
    loadSales()
    showDetailModal.value = false
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al completar venta')
  } finally {
    completingSale.value = false
  }
}

async function downloadTicket(sale) {
  const saleId = sale?.id || sale
  if (!saleId) {
    notification.error('ID de venta inválido')
    return
  }
  loadingTicket.value = true
  showTicketPreview.value = true
  ticketHtml.value = null
  ticketSaleNumber.value = ''
  ticketSaleId.value = saleId
  try {
    const { data } = await salesService.getTicketHtml(saleId)
    ticketHtml.value = data.data.html
    ticketSaleNumber.value = data.data.saleNumber
  } catch (error) {
    notification.error('Error al cargar ticket')
    showTicketPreview.value = false
  } finally {
    loadingTicket.value = false
  }
}

async function downloadFromPreview() {
  if (!ticketSaleId.value) return
  
  try {
    const response = await salesService.downloadTicket(ticketSaleId.value)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ticket-${ticketSaleNumber.value}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    notification.success('Ticket descargado')
  } catch (error) {
    console.error('Error downloading ticket:', error)
    notification.error('Error al descargar ticket')
  }
}

function closeTicketPreview() {
  showTicketPreview.value = false
  ticketData.value = null
  ticketHtml.value = null
  ticketSaleNumber.value = ''
  ticketSaleId.value = ''
}

function formatDate(date) {
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

const filteredSales = computed(() => {
  if (!searchQuery.value) return sales.value
  const query = searchQuery.value.toLowerCase()
  return sales.value.filter(s => 
    s.sale_number?.toLowerCase().includes(query) ||
    s.customer_name?.toLowerCase().includes(query) ||
    s.employee_name?.toLowerCase().includes(query)
  )
})


const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  suspended: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  layaway: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
}

onMounted(loadSales)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Ventas</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Historial de ventas realizadas</p>
      </div>
      <button
        @click="$router.push('/pos')"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nueva Venta
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por número, cliente o empleado..."
              class="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
          </div>
        </div>
        <select
          v-if="isAdmin"
          v-model="selectedLocation"
          @change="loadSales"
          class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          <option :value="null">Todas las ubicaciones</option>
          <option v-for="loc in locationStore.locations" :key="loc.id" :value="loc">
            {{ loc.name }}
          </option>
        </select>
        <select
          v-model="statusFilter"
          class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="completed">Completada</option>
          <option value="suspended">Suspendida</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <div class="relative">
          <input
            ref="dateFromInputRef"
            v-model="dateFrom"
            type="text"
            class="px-4 py-2.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer"
          />
        </div>
        <div class="relative">
          <input
            ref="dateToInputRef"
            v-model="dateTo"
            type="text"
            class="px-4 py-2.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer"
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div v-if="loading" class="p-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
      </div>
      <table v-else class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Número</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Fecha</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cliente</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Empleado</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ubicación</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Estado</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr v-for="sale in filteredSales" :key="sale.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="px-4 py-3">
              <span class="font-medium text-slate-900 dark:text-white">{{ sale.sale_number }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {{ formatDate(sale.sale_date) }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              {{ sale.customer_name || '-' }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              {{ sale.employee_name }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              {{ sale.location_name }}
            </td>
            <td class="px-4 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
              {{ formatMoney(sale.total) }}
            </td>
            <td class="px-4 py-3">
              <span 
                class="inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize"
                :class="statusColors[sale.status] || 'bg-slate-100 text-slate-700'"
              >
                {{ sale.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  v-if="sale.status === 'completed'"
                  @click="downloadTicket(sale)"
                  class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Descargar ticket"
                >
                  <Receipt class="w-4 h-4" />
                </button>
                <button
                  @click="viewSale(sale)"
                  class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Ver detalles"
                >
                  <Eye class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredSales.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
              No hay ventas registradas
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl text-slate-700 dark:text-slate-300">
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
      <div v-else class="text-sm text-slate-400">
        (sin paginación)
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeDetailModal"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Detalles de Venta
            </h2>
            <button @click="closeDetailModal" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div class="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div v-if="loadingDetail" class="flex justify-center py-8">
              <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
            </div>
            
            <div v-else-if="selectedSale" class="space-y-4">
              <div class="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Número de venta</p>
                  <p class="font-bold text-slate-900 dark:text-white">{{ selectedSale.sale_number }}</p>
                </div>
                <div>
                  <span 
                    class="inline-flex px-3 py-1 text-sm font-medium rounded-full"
                    :class="statusColors[selectedSale.status]"
                  >
                    {{ selectedSale.status }}
                  </span>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-slate-500 dark:text-slate-400">Fecha</p>
                  <p class="font-medium text-slate-900 dark:text-white">{{ formatDate(selectedSale.sale_date) }}</p>
                </div>
                <div>
                  <p class="text-slate-500 dark:text-slate-400">Ubicación</p>
                  <p class="font-medium text-slate-900 dark:text-white">{{ selectedSale.location_name }}</p>
                </div>
                <div>
                  <p class="text-slate-500 dark:text-slate-400">Empleado</p>
                  <p class="font-medium text-slate-900 dark:text-white">{{ selectedSale.employee_name }}</p>
                </div>
                <div>
                  <p class="text-slate-500 dark:text-slate-400">Cliente</p>
                  <p class="font-medium text-slate-900 dark:text-white">{{ selectedSale.customer_name || 'Sin cliente' }}</p>
                </div>
              </div>
              
              <div v-if="selectedSale.items?.length" class="border-t border-slate-200 dark:border-slate-800 pt-4">
                <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Productos</h3>
                <div class="space-y-2">
                  <div 
                    v-for="item in selectedSale.items" 
                    :key="item.id"
                    class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                  >
                    <div class="flex-1">
                      <p class="font-medium text-slate-900 dark:text-white">{{ item.item_name }}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">{{ item.item_number }}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium text-slate-900 dark:text-white">{{ Number.isInteger(Number(item.quantity)) ? Number(item.quantity) : Number(item.quantity).toFixed(2) }} x {{ formatMoney(item.unit_price) }}</p>
                      <p class="text-sm text-slate-500 dark:text-slate-400">{{ formatMoney(item.line_total) }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="selectedSale.payments?.length" class="border-t border-slate-200 dark:border-slate-800 pt-4">
                <h3 class="font-semibold text-slate-900 dark:text-white mb-3">Pagos</h3>
                <div class="space-y-2">
                  <div 
                    v-for="payment in selectedSale.payments" 
                    :key="payment.id"
                    class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                  >
                    <div>
                      <p class="font-medium text-slate-900 dark:text-white">{{ payment.payment_type }}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatDate(payment.payment_date) }}</p>
                    </div>
                    <p class="font-bold text-green-600 dark:text-green-400">{{ formatMoney(payment.amount) }}</p>
                  </div>
                </div>
              </div>
              
              <div class="border-t border-slate-200 dark:border-slate-800 pt-4">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span class="text-slate-900 dark:text-white">{{ formatMoney(selectedSale.subtotal) }}</span>
                </div>
                <div v-if="selectedSale.discount_amount" class="flex justify-between text-sm mb-1">
                  <span class="text-slate-500 dark:text-slate-400">Descuento</span>
                  <span class="text-red-600 dark:text-red-400">-{{ formatMoney(selectedSale.discount_amount) }}</span>
                </div>
                <div v-if="selectedSale.tax_amount" class="flex justify-between text-sm mb-1">
                  <span class="text-slate-500 dark:text-slate-400">Impuesto</span>
                  <span class="text-slate-900 dark:text-white">{{ formatMoney(selectedSale.tax_amount) }}</span>
                </div>
                <div class="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span class="text-slate-900 dark:text-white">Total</span>
                  <span class="text-brand-600 dark:text-brand-400">{{ formatMoney(selectedSale.total) }}</span>
                </div>
              </div>
              
              <div v-if="selectedSale.notes" class="border-t border-slate-200 dark:border-slate-800 pt-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">Notas</p>
                <p class="text-sm text-slate-900 dark:text-white">{{ selectedSale.notes }}</p>
              </div>

              <div class="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                <div class="flex gap-2" v-if="selectedSale.status === 'suspended'">
                  <button
                    @click="resumeSale(selectedSale)"
                    class="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Reanudar Venta
                  </button>
                  <button
                    @click="cancelSale(selectedSale)"
                    class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
                <div class="flex gap-2" v-else-if="selectedSale.status === 'pending'">
                  <button
                    @click="openCompleteModal(selectedSale)"
                    class="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CreditCard class="w-4 h-4" />
                    Completar Venta
                  </button>
                  <button
                    @click="cancelSale(selectedSale)"
                    class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
                <div class="flex gap-2" v-else-if="selectedSale.status === 'completed'">
                  <button
                    @click="downloadTicket(selectedSale)"
                    class="w-full px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Receipt class="w-4 h-4" />
                    Ver Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Ticket Preview Modal -->
    <Teleport to="body">
      <div v-if="showTicketPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeTicketPreview"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">
              Vista Previa del Ticket
            </h2>
            <button @click="closeTicketPreview" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div class="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div v-if="loadingTicket" class="flex justify-center py-8">
              <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
            </div>
            
            <div v-else-if="ticketHtml" class="flex justify-center">
              <div id="ticket-preview-content" v-html="ticketHtml" class="bg-white p-2"></div>
            </div>
          </div>

          <div class="p-4 border-t border-slate-200 dark:border-slate-800">
            <button
              @click="downloadFromPreview"
              class="w-full px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Download class="w-4 h-4" />
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Cancel Sale Modal -->
    <Teleport to="body">
      <div v-if="showCancelModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showCancelModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 class="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle class="w-5 h-5" />
              Cancelar Venta
            </h2>
            <button @click="showCancelModal = false" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          
          <div class="p-4 space-y-4">
            <p class="text-slate-600 dark:text-slate-300">
              ¿Está seguro que desea cancelar la venta <strong class="text-slate-900 dark:text-white">{{ selectedSale?.sale_number }}</strong>?
            </p>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Motivo de cancelación
              </label>
              <textarea
                v-model="cancelNotes"
                rows="3"
                placeholder="Ingrese el motivo de la cancelación..."
                class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm resize-none"
              ></textarea>
            </div>

            <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p class="text-sm text-red-700 dark:text-red-300">
                Esta acción no se puede deshacer. La venta será marcada como cancelada y el inventario será reintegrado.
              </p>
            </div>
          </div>

          <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">
            <button
              @click="showCancelModal = false"
              class="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="confirmCancelSale"
              class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Complete Sale Modal -->
    <Teleport to="body">
      <div v-if="showCompleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showCompleteModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Completar Venta</h2>
          
          <div class="space-y-4 mb-6">
            <div class="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-slate-600 dark:text-slate-400">Total a pagar</span>
                <span class="text-2xl font-bold text-brand-600 dark:text-brand-400">{{ formatMoney(selectedSale?.total) }}</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Método de pago</label>
              <select
                v-model="completePaymentMethod"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="cash">Efectivo</option>
                <option value="credit">Tarjeta de Crédito</option>
                <option value="debit">Tarjeta de Débito</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto pagado</label>
              <input
                :value="completeAmountPaidDisplay"
                @input="onCompleteAmountInput"
                @focus="e => e.target.select()"
                @blur="onCompleteAmountBlur"
                type="text"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-semibold"
              />
              <p v-if="completeAmountPaid > 0 && completeAmountPaid < selectedSale?.total" class="text-xs text-red-500 mt-1">
                Falta {{ formatMoney(selectedSale?.total - completeAmountPaid) }} para completar el pago
              </p>
            </div>
            <div class="flex justify-between text-lg font-bold p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span class="text-slate-700 dark:text-slate-300">Cambio</span>
              <span class="text-green-600">{{ formatMoney(Math.max(0, completeAmountPaid - selectedSale?.total)) }}</span>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="showCompleteModal = false"
              class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              @click="confirmCompleteSale"
              :disabled="completingSale"
              class="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Loader2 v-if="completingSale" class="w-4 h-4 animate-spin" />
              {{ completingSale ? 'Procesando...' : 'Completar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

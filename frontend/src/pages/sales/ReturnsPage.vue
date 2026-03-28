<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { useDebounce } from '../../composables/useDebounce.js'
import { salesService } from '../../services/sales.service.js'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import {
  Search,
  Loader2,
  Eye,
  RefreshCw,
  Plus,
  X,
  Trash2,
  Calendar
} from 'lucide-vue-next'

const notification = useNotificationStore()
const currencyStore = useCurrencyStore()

const returns = ref([])
const loading = ref(false)
const loadingDetail = ref(false)
const searchQuery = ref('')
const selectedReturn = ref(null)
const showDetailModal = ref(false)
const currentPage = ref(1)
const pageLimit = ref(20)
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))

const dateFrom = ref('')
const dateTo = ref('')
const dateFromInputRef = ref(null)
const dateToInputRef = ref(null)
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

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadReturns()
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

  if (dateFromInputRef.value) {
    dateFromPicker = flatpickr(dateFromInputRef.value, {
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'd/m/Y',
      locale: spanishLocale,
      onChange: (selectedDates, dateStr) => {
        dateFrom.value = dateStr
        currentPage.value = 1
        loadReturns()
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
        currentPage.value = 1
        loadReturns()
      }
    })
    dateToPicker.setDate(to)
  }
  
  await loadReturns()
})

const showCreateModal = ref(false)
const selectedSale = ref(null)
const returnItems = ref([])
const returnForm = ref({
  reason: '',
  notes: ''
})

async function loadReturns() {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      search: searchQuery.value
    }
    
    if (dateFrom.value) params.start_date = dateFrom.value
    if (dateTo.value) params.end_date = dateTo.value
    
    const { data } = await salesService.getReturns(params)
    returns.value = data.data || []
    totalRecords.value = data.total || 0
  } catch (error) {
    notification.error('Error al cargar devoluciones')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadReturns()
  }
}

watch(searchQuery, () => {
  debouncedSearch()
})

async function searchSale() {
  if (!searchQuery.value) return
  
  loading.value = true
  try {
    const { data } = await salesService.getSales({ search: searchQuery.value, status: 'completed', limit: 5 })
    if (data.data && data.data.length > 0) {
      selectedSale.value = data.data[0]
      returnItems.value = selectedSale.value.items?.map(item => ({
        ...item,
        return_quantity: 0,
        selected: false
      })) || []
    }
  } catch (error) {
    notification.error('Error al buscar venta')
  } finally {
    loading.value = false
  }
}

function toggleItemSelection(index) {
  const item = returnItems.value[index]
  if (item.return_quantity > 0) {
    item.selected = true
  } else {
    item.selected = false
  }
}

function updateReturnQuantity(index, value) {
  const item = returnItems.value[index]
  const qty = parseInt(value) || 0
  item.return_quantity = Math.min(qty, item.quantity)
  item.selected = item.return_quantity > 0
}

async function createReturn() {
  const selectedItems = returnItems.value.filter(i => i.selected && i.return_quantity > 0)
  if (selectedItems.length === 0) {
    notification.warning('Seleccione al menos un producto para devolver')
    return
  }

  try {
    await salesService.createReturn({
      sale_id: selectedSale.value.id,
      location_id: selectedSale.value.location_id,
      employee_id: selectedSale.value.employee_id,
      subtotal: selectedItems.reduce((sum, i) => sum + (i.unit_price * i.return_quantity), 0),
      tax_amount: selectedItems.reduce((sum, i) => (i.tax_amount / i.quantity) * i.return_quantity, 0),
      total: selectedItems.reduce((sum, i) => sum + (i.line_total / i.quantity) * i.return_quantity, 0),
      refund_method: 'cash',
      reason: returnForm.value.reason,
      notes: returnForm.value.notes,
      items: selectedItems.map(i => ({
        sale_item_id: i.id,
        item_id: i.item_id,
        variation_id: i.variation_id,
        quantity: i.return_quantity,
        unit_price: i.unit_price,
        tax_amount: (i.tax_amount / i.quantity) * i.return_quantity,
        line_total: (i.line_total / i.quantity) * i.return_quantity
      }))
    })
    
    notification.success('Devolución creada correctamente')
    closeCreateModal()
    loadReturns()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al crear devolución')
  }
}

async function processReturn(returnObj) {
  window.$confirm(
    '¿Confirmar esta devolución? Se reintegrará el stock.',
    async () => {
      try {
        await salesService.processReturn(returnObj.id)
        notification.success('Devolución procesada correctamente')
        loadReturns()
        showDetailModal.value = false
      } catch (error) {
        notification.error(error.response?.data?.message || 'Error al procesar devolución')
      }
    },
    { type: 'info', title: 'Confirmar Devolución', buttonLabel: 'Confirmar' }
  )
}

async function viewReturn(returnObj) {
  loadingDetail.value = true
  showDetailModal.value = true
  selectedReturn.value = null
  try {
    const { data } = await salesService.getReturn(returnObj.id)
    selectedReturn.value = data.data
  } catch (error) {
    notification.error('Error al cargar detalles')
    showDetailModal.value = false
  } finally {
    loadingDetail.value = false
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedReturn.value = null
}

function openCreateModal() {
  showCreateModal.value = true
  selectedSale.value = null
  returnItems.value = []
  returnForm.value = { reason: '', notes: '' }
  searchQuery.value = ''
}

function closeCreateModal() {
  showCreateModal.value = false
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

const filteredReturns = computed(() => {
  return returns.value
})

const returnTotal = computed(() => {
  return returnItems.value
    .filter(i => i.selected)
    .reduce((sum, i) => sum + (i.line_total / i.quantity) * i.return_quantity, 0)
})

onMounted(() => {
  loadReturns()
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Devoluciones</h1>
        <p class="text-slate-500 dark:text-slate-400">Gestión de devoluciones de ventas</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        Nueva Devolución
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
              placeholder="Buscar por número..."
              class="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
          </div>
        </div>
        <div class="relative">
          <input
            ref="dateFromInputRef"
            type="text"
            class="px-4 py-2.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer"
          />
        </div>
        <div class="relative">
          <input
            ref="dateToInputRef"
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
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Venta Original</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ubicación</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Estado</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr v-for="ret in filteredReturns" :key="ret.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="px-4 py-3">
              <span class="font-medium text-slate-900 dark:text-white">{{ ret.return_number }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              {{ formatDate(ret.return_date) }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              {{ ret.original_sale_number }}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              {{ ret.location_name }}
            </td>
            <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">
              {{ formatMoney(ret.total) }}
            </td>
            <td class="px-4 py-3">
              <span 
                class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                :class="ret.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'"
              >
                {{ ret.status === 'completed' ? 'Procesada' : 'Pendiente' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                @click="viewReturn(ret)"
                class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Ver detalles"
              >
                <Eye class="w-4 h-4" />
              </button>
              <button
                v-if="ret.status !== 'completed'"
                @click="processReturn(ret)"
                class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Procesar devolución"
              >
                <RefreshCw class="w-4 h-4" />
              </button>
            </td>
          </tr>
          <tr v-if="filteredReturns.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
              No hay devoluciones registradas
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} devolución{{ totalRecords !== 1 ? 'es' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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

    <!-- Create Return Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Nueva Devolución</h2>
          <button @click="closeCreateModal" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-4 space-y-4">
          <!-- Search Sale -->
          <div v-if="!selectedSale">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Buscar Venta</label>
            <div class="flex gap-2">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Número de venta..."
                class="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                @keyup.enter="searchSale"
              />
              <button
                @click="searchSale"
                class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg"
              >
                Buscar
              </button>
            </div>
          </div>

          <!-- Selected Sale -->
          <div v-if="selectedSale" class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="font-medium text-slate-900 dark:text-white">{{ selectedSale.sale_number }}</p>
                <p class="text-sm text-slate-500">{{ formatDate(selectedSale.sale_date) }} - {{ selectedSale.location_name }}</p>
              </div>
              <button @click="selectedSale = null" class="text-slate-400 hover:text-red-500">
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Return Items -->
            <div class="space-y-2 mb-4">
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar productos:</p>
              <div 
                v-for="(item, index) in returnItems" 
                :key="item.id"
                class="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg"
              >
                <input
                  type="checkbox"
                  v-model="item.selected"
                  class="w-4 h-4 rounded border-slate-300"
                />
                <div class="flex-1">
                  <p class="font-medium text-slate-900 dark:text-white text-sm">{{ item.item_name }}</p>
                  <p class="text-xs text-slate-500">Disp: {{ item.quantity }} - {{ formatMoney(item.unit_price) }}</p>
                </div>
                <input
                  type="number"
                  :value="item.return_quantity"
                  @input="e => updateReturnQuantity(index, e.target.value)"
                  :max="item.quantity"
                  min="0"
                  :disabled="!item.selected"
                  class="w-20 px-2 py-1 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>

            <!-- Return Form -->
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo</label>
                <select
                  v-model="returnForm.reason"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="">Seleccionar motivo</option>
                  <option value="defectuoso">Producto defectuoso</option>
                  <option value="no_satisfecho">No satisfecho</option>
                  <option value="error">Error en pedido</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
                <textarea
                  v-model="returnForm.notes"
                  rows="2"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  placeholder="Notas adicionales..."
                ></textarea>
              </div>
              <div class="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                <span class="font-medium text-slate-700 dark:text-slate-300">Total a devolver:</span>
                <span class="text-lg font-bold text-brand-600 dark:text-brand-400">{{ formatMoney(returnTotal) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            @click="closeCreateModal"
            class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            @click="createReturn"
            :disabled="!selectedSale || returnTotal === 0"
            class="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium"
          >
            Crear Devolución
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Detalles de Devolución</h2>
          <button @click="closeDetailModal" class="text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-4" v-if="selectedReturn">
          <div class="flex justify-between items-center mb-4">
            <div>
              <p class="font-bold text-slate-900 dark:text-white">{{ selectedReturn.return_number }}</p>
              <p class="text-sm text-slate-500">{{ formatDate(selectedReturn.return_date) }}</p>
            </div>
            <span 
              class="inline-flex px-3 py-1 text-sm font-medium rounded-full"
              :class="selectedReturn.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
            >
              {{ selectedReturn.status === 'completed' ? 'Procesada' : 'Pendiente' }}
            </span>
          </div>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500">Venta original:</span>
              <span class="text-slate-900 dark:text-white">{{ selectedReturn.original_sale_number }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Ubicación:</span>
              <span class="text-slate-900 dark:text-white">{{ selectedReturn.location_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Empleado:</span>
              <span class="text-slate-900 dark:text-white">{{ selectedReturn.employee_name }}</span>
            </div>
            <div class="flex justify-between font-bold pt-3 border-t">
              <span>Total:</span>
              <span class="text-brand-600">{{ formatMoney(selectedReturn.total) }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            @click="closeDetailModal"
            class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

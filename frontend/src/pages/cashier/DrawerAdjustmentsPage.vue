<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { useAuthStore } from '../../stores/auth.store.js'
import { useDebounce } from '../../composables/useDebounce.js'
import { paymentService } from '../../services/payment.service.js'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import { Loader2, Search } from 'lucide-vue-next'

const notification = useNotificationStore()
const currencyStore = useCurrencyStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.user?.role_name === 'admin')
const adjustments = ref([])
const loading = ref(false)
const selectedStatus = ref('')
const searchQuery = ref('')
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

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadAdjustments()
}, 300)

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
        loadAdjustments()
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
        loadAdjustments()
      }
    })
    dateToPicker.setDate(to)
  }
  
  await loadAdjustments()
})

async function loadAdjustments() {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      status: selectedStatus.value || undefined,
      search: searchQuery.value,
      start_date: dateFrom.value || undefined,
      end_date: dateTo.value || undefined
    }
    const { data } = await paymentService.getMyAdjustments(params)
    adjustments.value = data.data || []
    totalRecords.value = data.total || 0
  } catch (error) {
    notification.error('Error al cargar ajustes')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadAdjustments()
  }
}

watch(searchQuery, () => {
  debouncedSearch()
})

watch([selectedStatus, dateFrom, dateTo], () => {
  currentPage.value = 1
  loadAdjustments()
})

function formatMoney(amount) {
  return currencyStore.formatMoney(amount || 0)
}

function getStatusLabel(status) {
  const labels = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' }
  return labels[status] || status
}

function getStatusColor(status) {
  const colors = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getTypeLabel(type) {
  return type === 'overage' ? 'Sobrante' : 'Faltante'
}

function getTypeColor(type) {
  return type === 'overage' ? 'text-green-600' : 'text-red-600'
}

async function updateStatus(id, status) {
  try {
    await paymentService.updateAdjustmentStatus(id, status)
    notification.success(`Ajuste ${status === 'approved' ? 'aprobado' : 'rechazado'}`)
    await loadAdjustments()
  } catch (error) {
    notification.error('Error al actualizar ajuste')
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('es-MX')
}
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Ajustes de Caja</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Gestiona faltantes y sobrantes de dinero</p>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-4">
      <div class="relative flex-1 min-w-[200px]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar ajustes..."
          class="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
        />
        <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
      </div>
      <select
        v-model="selectedStatus"
        class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
      >
        <option value="">Todos</option>
        <option value="pending">Pendientes</option>
        <option value="approved">Aprobados</option>
        <option value="rejected">Rechazados</option>
      </select>
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

    <div v-if="loading && adjustments.length === 0" class="text-center py-8">
      <Loader2 class="w-6 h-6 animate-spin mx-auto text-brand-500" />
    </div>

    <div v-else-if="adjustments.length === 0" class="text-center py-12">
      <p class="text-slate-500 dark:text-slate-400">No hay ajustes registrados</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="adj in adjustments"
        :key="adj.id"
        class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <div :class="adj.adjustment_type === 'overage' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'" 
                class="w-10 h-10 rounded-lg flex items-center justify-center">
                <span :class="adj.adjustment_type === 'overage' ? 'text-green-600' : 'text-red-600'" class="font-bold text-lg">
                  {{ adj.adjustment_type === 'overage' ? '+' : '-' }}
                </span>
              </div>
              <div>
                <h3 :class="getTypeColor(adj.adjustment_type)" class="font-semibold">
                  {{ getTypeLabel(adj.adjustment_type) }}
                </h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ formatDate(adj.created_at) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Monto</p>
                <p :class="getTypeColor(adj.adjustment_type)" class="font-semibold">
                  {{ formatMoney(adj.amount) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Caja</p>
                <p class="text-slate-900 dark:text-white">{{ adj.drawer_name }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Ubicación</p>
                <p class="text-slate-900 dark:text-white">{{ adj.location_name }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Estado</p>
                <span :class="getStatusColor(adj.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ getStatusLabel(adj.status) }}
                </span>
              </div>
            </div>

            <div v-if="adj.notes" class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p class="text-xs text-slate-500 dark:text-slate-400">Notas:</p>
              <p class="text-sm text-slate-700 dark:text-slate-300">{{ adj.notes }}</p>
            </div>
          </div>

          <div v-if="adj.status === 'pending' && isAdmin" class="ml-4 flex gap-2">
            <button
              @click="updateStatus(adj.id, 'approved')"
              class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
            >
              Aprobar
            </button>
            <button
              @click="updateStatus(adj.id, 'rejected')"
              class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
            >
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} ajuste{{ totalRecords !== 1 ? 's' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { useAuthStore } from '../../stores/auth.store.js'
import { useDebounce } from '../../composables/useDebounce.js'
import { paymentService } from '../../services/payment.service.js'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import { Loader2 } from 'lucide-vue-next'

const notification = useNotificationStore()
const currencyStore = useCurrencyStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.user?.role_name === 'admin')

const accounts = ref([])
const cashiers = ref([])
const summary = ref({ total_debt: 0, total_paid: 0, total_pending: 0, count: 0 })
const loading = ref(false)
const selectedStatus = ref('')
const selectedCashier = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const pageLimit = ref(20)
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))
const showPaymentModal = ref(false)
const selectedAccount = ref(null)
const paymentAmount = ref(0)

const dateFrom = ref('')
const dateTo = ref('')
const dateFromInputRef = ref(null)
const dateToInputRef = ref(null)
let dateFromPicker = null
let dateToPicker = null

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadAccounts()
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
        loadAccounts()
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
        loadAccounts()
      }
    })
    dateToPicker.setDate(to)
  }
  
  await Promise.all([loadAccounts(), loadCashiers()])
})

async function loadCashiers() {
  try {
    const { data } = await paymentService.getCashiers()
    cashiers.value = data.data || []
  } catch (error) {
    console.error('Error loading cashiers:', error)
  }
}

async function loadAccounts() {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      status: selectedStatus.value || undefined,
      user_id: selectedCashier.value || undefined,
      search: searchQuery.value,
      start_date: dateFrom.value || undefined,
      end_date: dateTo.value || undefined
    }
    const { data } = await paymentService.getAccountsReceivable(params)
    accounts.value = data.data || []
    if (data.summary) {
      summary.value = data.summary
    }
    totalRecords.value = data.total || data.data?.length || 0
  } catch (error) {
    notification.error('Error al cargar cuentas por cobrar')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadAccounts()
  }
}

watch(searchQuery, () => {
  debouncedSearch()
})

watch([selectedStatus, selectedCashier, dateFrom, dateTo], () => {
  currentPage.value = 1
  loadAccounts()
})

function formatMoney(amount) {
  return currencyStore.formatMoney(amount || 0)
}

function getStatusLabel(status) {
  const labels = { pending: 'Pendiente', partial: 'Parcial', paid: 'Pagado', forgiven: 'Perdonado' }
  return labels[status] || status
}

function getStatusColor(status) {
  const colors = { pending: 'bg-red-100 text-red-800', partial: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', forgiven: 'bg-gray-100 text-gray-800' }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getPendingAmount(account) {
  return parseFloat(account.amount) - parseFloat(account.paid_amount || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-MX')
}

function openPaymentModal(account) {
  selectedAccount.value = account
  paymentAmount.value = getPendingAmount(account)
  showPaymentModal.value = true
}

async function registerPayment() {
  if (!selectedAccount.value || paymentAmount.value <= 0) {
    notification.error('Monto inválido')
    return
  }

  try {
    await paymentService.payAccountReceivable(selectedAccount.value.id, paymentAmount.value)
    notification.success('Pago registrado')
    showPaymentModal.value = false
    await loadAccounts()
  } catch (error) {
    notification.error('Error al registrar pago')
  }
}
</script>

<template>
  <div class="p-4 md:p-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Cuentas por Cobrar</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">Gestiona las deudas de empleados por faltantes de caja</p>
      </div>
    </div>

    <div class="mb-4 flex flex-col md:flex-row gap-2 md:gap-4">
      <div class="relative flex-1 min-w-[150px]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar..."
          class="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
        />
        <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
      </div>
      <select
        v-model="selectedCashier"
        class="w-full md:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
      >
        <option value="">Todos los cajeros</option>
        <option v-for="cashier in cashiers" :key="cashier.id" :value="cashier.id">
          {{ cashier.username }}
        </option>
      </select>
      <select
        v-model="selectedStatus"
        class="w-full md:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
      >
        <option value="">Todos los estados</option>
        <option value="pending">Pendiente</option>
        <option value="partial">Parcial</option>
        <option value="paid">Pagado</option>
      </select>
      <div class="relative">
        <input
          ref="dateFromInputRef"
          type="text"
          class="w-full md:w-36 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer"
        />
      </div>
      <div class="relative">
        <input
          ref="dateToInputRef"
          type="text"
          class="w-full md:w-36 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 cursor-pointer"
        />
      </div>
    </div>

    <div v-if="isAdmin" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <p class="text-xs text-red-600 dark:text-red-400 mb-1">Total Deuda</p>
        <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ formatMoney(summary.total_debt) }}</p>
      </div>
      <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
        <p class="text-xs text-green-600 dark:text-green-400 mb-1">Total Pagado</p>
        <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ formatMoney(summary.total_paid) }}</p>
      </div>
      <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
        <p class="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Total Pendiente</p>
        <p class="text-xl font-bold text-yellow-600 dark:text-yellow-400">{{ formatMoney(summary.total_pending) }}</p>
      </div>
      <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Registros</p>
        <p class="text-xl font-bold text-slate-900 dark:text-white">{{ summary.count }}</p>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <span class="text-slate-500">Cargando...</span>
    </div>

    <div v-else-if="accounts.length === 0" class="text-center py-12">
      <p class="text-slate-500 dark:text-slate-400">No hay cuentas por cobrar registradas</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="acc in accounts"
        :key="acc.id"
        class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <span class="text-red-600 font-bold text-lg">$</span>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-white">{{ acc.user_name }}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  {{ formatDate(acc.created_at) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <p class="font-semibold text-red-600 dark:text-red-400">{{ formatMoney(acc.amount) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Pagado</p>
                <p class="font-medium text-green-600 dark:text-green-400">{{ formatMoney(acc.paid_amount || 0) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Pendiente</p>
                <p class="font-semibold text-slate-900 dark:text-white">{{ formatMoney(getPendingAmount(acc)) }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Caja</p>
                <p class="text-slate-900 dark:text-white">{{ acc.drawer_name || '-' }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 dark:text-slate-400">Estado</p>
                <span :class="getStatusColor(acc.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ getStatusLabel(acc.status) }}
                </span>
              </div>
            </div>

            <div v-if="acc.notes" class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p class="text-xs text-slate-500 dark:text-slate-400">Notas:</p>
              <p class="text-sm text-slate-700 dark:text-slate-300">{{ acc.notes }}</p>
            </div>
          </div>

          <div v-if="isAdmin && acc.status !== 'paid'" class="ml-4">
            <button
              @click="openPaymentModal(acc)"
              class="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
            >
              Registrar Pago
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} cuenta{{ totalRecords !== 1 ? 's' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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

    <div v-if="showPaymentModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <span class="text-green-600 dark:text-green-400 text-xl font-bold">$</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Registrar Pago</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Registra el pago parcial o total</p>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-slate-500 dark:text-slate-400">Empleado</span>
              <span class="font-semibold text-slate-900 dark:text-white">{{ selectedAccount?.user_name }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-500 dark:text-slate-400">Monto pendiente</span>
              <span class="font-bold text-lg text-red-600 dark:text-red-400">{{ formatMoney(getPendingAmount(selectedAccount)) }}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Monto a pagar</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{{ currencyStore.currency_symbol }}</span>
              <input
                v-model="paymentAmount"
                type="number"
                step="0.01"
                min="0.01"
                :max="getPendingAmount(selectedAccount)"
                class="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-lg font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Pago máximo: {{ formatMoney(getPendingAmount(selectedAccount)) }}
            </p>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            @click="showPaymentModal = false"
            class="px-5 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="registerPayment"
            class="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium shadow-sm hover:shadow transition-colors flex items-center gap-2"
          >
            <span>$</span> Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
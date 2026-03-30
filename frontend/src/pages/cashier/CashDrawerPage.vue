<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { useAuthStore } from '../../stores/auth.store.js'
import { useCashDrawerStore } from '../../stores/cash-drawer.store.js'
import { useLocationStore } from '../../stores/location.store.js'
import { coreService } from '../../services/inventory.service.js'
import { shiftService } from '../../services/shift.service.js'
import {
  DollarSign,
  Lock,
  Unlock,
  Clock,
  User,
  FileText,
  ArrowRight,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Bell,
  X,
  ArrowDownToLine
} from 'lucide-vue-next'

const router = useRouter()
const notification = useNotificationStore()
const currencyStore = useCurrencyStore()
const authStore = useAuthStore()
const cashDrawerStore = useCashDrawerStore()
const locationStore = useLocationStore()

const selectedLocation = ref(null)
const activeShift = ref(null)
const shiftClosingReminders = ref([])

const showOpenModal = ref(false)
const showCloseModal = ref(false)
const showPreviewModal = ref(false)
const showWithdrawalModal = ref(false)
const openingAmount = ref(0)
const closingAmount = ref(0)
const closingNotes = ref('')
const closingAmountDisplay = ref('0')
const withdrawalAmount = ref(0)
const withdrawalAmountDisplay = ref('0')
const withdrawalNotes = ref('')
const loading = ref(false)
const filterStartDate = ref('')
const filterEndDate = ref('')
const showCloseReminderModal = ref(false)

const hasOpenModal = computed(() => showOpenModal.value || showCloseModal.value || showPreviewModal.value || showCloseReminderModal.value || showWithdrawalModal.value)

onMounted(async () => {
  await loadLocations()
  if (locationStore.locations.length > 0) {
    selectedLocation.value = locationStore.getSelectedLocation()
    await cashDrawerStore.checkOpenDrawer(selectedLocation.value.id)
  }
})

watch(selectedLocation, async (loc) => {
  if (loc) {
    locationStore.setSelectedLocation(loc)
    await cashDrawerStore.checkOpenDrawer(loc.id)
    await loadActiveShift(loc.id)
    setDefaultDates()
  }
})

let reminderInterval = null

onMounted(async () => {
  await loadLocations()
  if (locationStore.locations.length > 0) {
    selectedLocation.value = locationStore.getSelectedLocation()
    await cashDrawerStore.checkOpenDrawer(selectedLocation.value.id)
    await loadActiveShift(selectedLocation.value.id)
  }
  reminderInterval = setInterval(checkCloseReminders, 60000)
})

onUnmounted(() => {
  if (reminderInterval) {
    clearInterval(reminderInterval)
  }
})

async function loadActiveShift(locationId) {
  try {
    const { data } = await shiftService.getActiveShift(locationId)
    if (data.success && data.data) {
      activeShift.value = data.data
    } else {
      activeShift.value = null
    }
  } catch (error) {
    activeShift.value = null
  }
}

async function openDrawerWithShift() {
  if (activeShift.value && activeShift.value.default_initial_amount > 0) {
    loading.value = true
    try {
      await cashDrawerStore.openDrawer({
        location_id: selectedLocation.value.id,
        initial_amount: parseFloat(activeShift.value.default_initial_amount) || 0,
        name: `Caja - ${selectedLocation.value.name} (${activeShift.value.name})`
      })
      notification.success('Caja abierta correctamente')
    } catch (error) {
      notification.error(error.response?.data?.message || 'Error al abrir caja')
    } finally {
      loading.value = false
    }
  } else {
    showOpenModal.value = true
  }
}

async function checkCloseReminders() {
  if (!selectedLocation.value || !cashDrawerStore.isDrawerOpen) return
  
  try {
    const { data } = await shiftService.getCloseReminders(selectedLocation.value.id)
    if (data.success && data.data && data.data.length > 0) {
      shiftClosingReminders.value = data.data
      showCloseReminderModal.value = true
    }
  } catch (error) {
    console.error('Error checking close reminders:', error)
  }
}

function setDefaultDates() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  filterStartDate.value = startOfDay.toISOString().slice(0, 16)
  filterEndDate.value = now.toISOString().slice(0, 16)
}

async function loadSummaryWithDates() {
  if (!currentDrawer.value) return
  await cashDrawerStore.loadCashSummary(
    currentDrawer.value.id,
    filterStartDate.value ? new Date(filterStartDate.value).toISOString() : null,
    filterEndDate.value ? new Date(filterEndDate.value).toISOString() : null
  )
}

async function loadLocations() {
  try {
    const { data } = await coreService.getUserLocations()
    let userLocations = (data.data || []).filter(l => l.is_active).map(l => ({
      id: l.location_id,
      name: l.location_name,
      code: l.location_code,
      is_active: l.is_active,
      is_default: l.is_default
    }))
    
    if (userLocations.length === 0) {
      const { data: allLocations } = await coreService.getLocations()
      userLocations = (allLocations.data || []).filter(l => l.is_active)
    }
    
    locationStore.setLocations(userLocations)
  } catch (error) {
    notification.error('Error al cargar ubicaciones')
  }
}

function formatMoney(amount) {
  return currencyStore.formatMoney(amount || 0)
}

function formatClosingAmountDisplay() {
  const decimals = currencyStore.decimal_places || 2
  closingAmountDisplay.value = closingAmount.value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

function onClosingAmountInput(e) {
  const val = e.target.value.replace(/[^0-9.]/g, '')
  const num = parseFloat(val)
  closingAmount.value = isNaN(num) ? 0 : currencyStore.roundMoney(num)
  closingAmountDisplay.value = val
}

function onClosingAmountFocus(e) {
  e.target.select()
}

function onClosingAmountBlur() {
  formatClosingAmountDisplay()
}

function formatWithdrawalAmountDisplay() {
  const decimals = currencyStore.decimal_places || 2
  withdrawalAmountDisplay.value = withdrawalAmount.value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

function onWithdrawalAmountInput(e) {
  const val = e.target.value.replace(/[^0-9.]/g, '')
  const num = parseFloat(val)
  withdrawalAmount.value = isNaN(num) ? 0 : currencyStore.roundMoney(num)
  withdrawalAmountDisplay.value = val
}

function onWithdrawalAmountFocus(e) {
  e.target.select()
}

function onWithdrawalAmountBlur() {
  formatWithdrawalAmountDisplay()
}

const isDrawerOpen = computed(() => cashDrawerStore.isDrawerOpen)
const currentDrawer = computed(() => cashDrawerStore.currentDrawer)
const cashSummary = computed(() => cashDrawerStore.cashSummary)

const difference = computed(() => {
  if (!cashSummary.value || !currentDrawer.value) return 0
  const expected = cashSummary.value.expected_cash || 0
  const counted = closingAmount.value > 0 ? closingAmount.value : parseFloat(currentDrawer.value.current_amount || 0)
  return counted - expected
})

function openTime() {
  if (!currentDrawer.value?.opened_at) return ''
  const date = new Date(currentDrawer.value.opened_at)
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

function openDate() {
  if (!currentDrawer.value?.opened_at) return ''
  const date = new Date(currentDrawer.value.opened_at)
  return date.toLocaleDateString('es-CL')
}

async function handleOpenDrawer() {
  if (!selectedLocation.value) {
    notification.warning('Selecciona una ubicación')
    return
  }
  
  loading.value = true
  try {
    const initialAmount = activeShift.value?.default_initial_amount || openingAmount.value
    
    await cashDrawerStore.openDrawer({
      location_id: selectedLocation.value.id,
      initial_amount: parseFloat(initialAmount) || 0,
      name: activeShift.value 
        ? `Caja - ${selectedLocation.value.name} (${activeShift.value.name})`
        : `Caja - ${selectedLocation.value.name}`
    })
    notification.success('Caja abierta correctamente')
    showOpenModal.value = false
    openingAmount.value = 0
    
    await cashDrawerStore.checkOpenDrawer(selectedLocation.value.id)
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al abrir caja')
  } finally {
    loading.value = false
  }
}

async function handleCloseDrawer() {
  if (!currentDrawer.value) return
  
  loading.value = true
  try {
    const result = await cashDrawerStore.closeDrawer(
      currentDrawer.value.id,
      parseFloat(closingAmount.value) || 0,
      closingNotes.value
    )
    
    notification.success('Caja cerrada correctamente')
    showCloseModal.value = false
    closingAmount.value = 0
    closingNotes.value = ''
    
    if (result.data?.difference !== undefined) {
      const diff = result.data.difference
      if (diff > 0) {
        notification.success(`Sobrante: ${formatMoney(diff)}`)
      } else if (diff < 0) {
        notification.warning(`Faltante: ${formatMoney(Math.abs(diff))}`)
      } else {
        notification.success('Cuadre perfecto!')
      }
    }
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al cerrar caja')
  } finally {
    loading.value = false
  }
}

function prepareClose() {
  if (cashSummary.value) {
    closingAmount.value = cashSummary.value.expected_cash
    closingAmountDisplay.value = closingAmount.value.toString()
  }
  showCloseModal.value = true
}

async function downloadClosePDF() {
  if (!currentDrawer.value) return
  try {
    const response = await cashDrawerStore.downloadClosePDF(currentDrawer.value.id)
    notification.success('Reporte de cierre descargado')
  } catch (error) {
    notification.error('Error al descargar el reporte')
  }
}

function openWithdrawalModal() {
  withdrawalAmount.value = 0
  withdrawalAmountDisplay.value = '0'
  withdrawalNotes.value = ''
  showWithdrawalModal.value = true
}

async function handleWithdrawal() {
  if (!currentDrawer.value || !withdrawalAmount.value || withdrawalAmount.value <= 0) {
    notification.error('Ingrese un monto válido')
    return
  }
  
  loading.value = true
  try {
    await cashDrawerStore.addWithdrawal(
      currentDrawer.value.id,
      withdrawalAmount.value,
      withdrawalNotes.value
    )
    notification.success('Retiro registrado correctamente')
    showWithdrawalModal.value = false
    withdrawalAmount.value = 0
    withdrawalNotes.value = ''
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al registrar el retiro')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col gap-4 min-w-0">
      <!-- Header -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Wallet class="w-6 h-6 md:w-7 md:h-7 text-brand-500" />
              Cierre de Caja
            </h1>
            <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">Gestiona la apertura y cierre de caja</p>
          </div>
          <div class="flex items-center gap-3">
            <select
              v-model="selectedLocation"
              class="w-full md:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            >
              <option v-for="loc in locationStore.locations" :key="loc.id" :value="loc">
                {{ loc.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Drawer Status -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex-1">
        <!-- No Drawer Open -->
        <div v-if="!isDrawerOpen" class="h-full flex flex-col items-center justify-center">
          <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <Lock class="w-12 h-12 text-slate-400" />
          </div>
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">Caja Cerrada</h2>
          <p class="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
            No hay caja abierta en este momento.<br/>
            Abre la caja para comenzar a vender.
          </p>
          <button
            @click="openDrawerWithShift"
            class="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center gap-2"
          >
            <Unlock class="w-5 h-5" />
            Abrir Caja
          </button>
        </div>

        <!-- Drawer Open -->
        <div v-else class="space-y-6">
          <!-- Status Card -->
          <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <Unlock class="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p class="font-semibold text-green-800 dark:text-green-300">Caja Abierta</p>
                <p class="text-sm text-green-600 dark:text-green-400">
                  Desde {{ openDate() }} a las {{ openTime() }}
                </p>
              </div>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Ubicación</p>
              <p class="font-semibold text-slate-900 dark:text-white">{{ selectedLocation?.name }}</p>
            </div>
            <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Cajero</p>
              <p class="font-semibold text-slate-900 dark:text-white">{{ authStore.user?.username }}</p>
            </div>
          </div>

          <!-- Sales Summary -->
          <div v-if="cashSummary" class="space-y-4">
            <h3 class="font-semibold text-slate-900 dark:text-white">Resumen de Ventas</h3>
            
            <!-- Turno Info -->
            <div v-if="activeShift" class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Clock class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span class="font-medium text-blue-800 dark:text-blue-300">{{ activeShift.name }}</span>
                </div>
                <span class="text-sm text-blue-600 dark:text-blue-400">
                  {{ activeShift.start_time?.substring(0, 5) }} - {{ activeShift.end_time?.substring(0, 5) }}
                </span>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div class="flex items-center gap-2 mb-1">
                  <DollarSign class="w-4 h-4 text-slate-400" />
                  <span class="text-sm text-slate-500 dark:text-slate-400">Monto Inicial</span>
                </div>
                <p class="text-xl font-bold text-slate-900 dark:text-white">{{ formatMoney(cashSummary.initial_amount) }}</p>
              </div>
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div class="flex items-center gap-2 mb-1">
                  <TrendingUp class="w-4 h-4 text-green-500" />
                  <span class="text-sm text-slate-500 dark:text-slate-400">Ventas en Efectivo</span>
                </div>
                <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ formatMoney(cashSummary.total_cash_sales) }}</p>
              </div>
              <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div class="flex items-center gap-2 mb-1">
                  <TrendingDown class="w-4 h-4 text-red-500" />
                  <span class="text-sm text-slate-500 dark:text-slate-400">Retiros</span>
                </div>
                <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ formatMoney(cashSummary.total_withdrawals) }}</p>
              </div>
              <div class="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-200 dark:border-brand-800">
                <div class="flex items-center gap-2 mb-1">
                  <FileText class="w-4 h-4 text-brand-500" />
                  <span class="text-sm text-brand-600 dark:text-brand-400">Monto Esperado</span>
                </div>
                <p class="text-xl font-bold text-brand-600 dark:text-brand-400">{{ formatMoney(cashSummary.expected_cash) }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <button
              @click="showPreviewModal = true"
              class="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm"
            >
              <FileText class="w-5 h-5" />
              Vista Previa
            </button>
            <button
              @click="openWithdrawalModal"
              class="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowDownToLine class="w-5 h-5" />
              Registrar Retiro
            </button>
            <!-- Botón cerrado temporalmente - se accede desde Vista Previa
            <button
              @click="prepareClose"
              class="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Lock class="w-5 h-5" />
              Cerrar Caja
            </button>
            -->
          </div>
        </div>
      </div>
    </div>

    <!-- Open Modal -->
    <Teleport to="body">
      <div v-if="showOpenModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showOpenModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Abrir Caja</h2>
          
          <div class="space-y-4 mb-6">
            <div v-if="activeShift" class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div class="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Clock class="w-4 h-4" />
                <span class="font-medium">{{ activeShift.name }}</span>
              </div>
              <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Horario: {{ activeShift.start_time?.substring(0, 5) }} - {{ activeShift.end_time?.substring(0, 5) }}
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monto Inicial
              </label>
              <div class="flex gap-2">
                <input
                  v-model.number="openingAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  class="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-semibold"
                />
                <button
                  v-if="activeShift?.default_initial_amount"
                  @click="openingAmount = activeShift.default_initial_amount"
                  type="button"
                  class="px-3 py-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl text-sm font-medium hover:bg-brand-200 dark:hover:bg-brand-900/50"
                  title="Usar monto del turno"
                >
                  <DollarSign class="w-4 h-4" />
                </button>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                {{ activeShift?.default_initial_amount 
                  ? `Monto sugerido del turno: ${formatMoney(activeShift.default_initial_amount)}` 
                  : 'Dinero con el que starts la jornada' }}
              </p>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="showOpenModal = false"
              class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              @click="handleOpenDrawer"
              :disabled="loading"
              class="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <Unlock v-else class="w-4 h-4" />
              Abrir
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Close Modal -->
    <Teleport to="body">
      <div v-if="showCloseModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showCloseModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cerrar Caja</h2>
          
          <!-- Preview del Cierre -->
          <div class="space-y-3 mb-6">
            <div class="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <h3 class="font-medium text-slate-900 dark:text-white mb-3">Resumen del Turno</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-500">Monto Inicial:</span>
                  <span class="font-medium text-slate-900 dark:text-white">{{ formatMoney(cashSummary?.initial_amount) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Ventas en Efectivo:</span>
                  <span class="font-medium text-green-600 dark:text-green-400">+{{ formatMoney(cashSummary?.total_cash_sales) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Retiros:</span>
                  <span class="font-medium text-red-600 dark:text-red-400">-{{ formatMoney(cashSummary?.total_withdrawals) }}</span>
                </div>
                <div class="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                  <div class="flex justify-between">
                    <span class="font-medium text-slate-700 dark:text-slate-300">Efectivo Esperado:</span>
                    <span class="font-bold text-brand-600 dark:text-brand-400">{{ formatMoney(cashSummary?.expected_cash) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dinero Contado
              </label>
              <input
                :value="closingAmountDisplay"
                @input="onClosingAmountInput"
                @focus="onClosingAmountFocus"
                @blur="onClosingAmountBlur"
                type="text"
                placeholder="0.00"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-semibold"
              />
            </div>

            <div v-if="closingAmount > 0" 
              class="p-4 rounded-xl"
              :class="difference > 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : difference < 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium" :class="difference > 0 ? 'text-green-700 dark:text-green-300' : difference < 0 ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'">
                  {{ difference > 0 ? 'Sobrante' : difference < 0 ? 'Faltante' : 'Cuadre Perfecto!' }}
                </span>
                <span class="font-bold text-lg" :class="difference > 0 ? 'text-green-600 dark:text-green-400' : difference < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'">
                  {{ difference !== 0 ? formatMoney(Math.abs(difference)) : '✓' }}
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notas (opcional)
              </label>
              <textarea
                v-model="closingNotes"
                rows="2"
                placeholder="Observaciones del cierre..."
                class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="showCloseModal = false"
              class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              @click="handleCloseDrawer"
              :disabled="loading"
              class="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <Lock v-else class="w-4 h-4" />
              Cerrar Caja
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Close Reminder Modal -->
    <Teleport to="body">
      <div v-if="showCloseReminderModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showCloseReminderModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell class="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">Recordatorio de Cierre</h2>
            <p class="text-slate-500 dark:text-slate-400 mb-4">
              El turno está por finalizar. Es hora de preparar el cierre de caja.
            </p>
            <div v-if="shiftClosingReminders.length > 0" class="space-y-2 mb-4">
              <div
                v-for="reminder in shiftClosingReminders"
                :key="reminder.id"
                class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-left"
              >
                <p class="font-medium text-amber-800 dark:text-amber-300">{{ reminder.shift_name }}</p>
                <p class="text-sm text-amber-600 dark:text-amber-400">
                  Finaliza a las {{ reminder.end_time?.substring(0, 5) }}
                </p>
              </div>
            </div>
            <div class="flex gap-3">
              <button
                @click="showCloseReminderModal = false"
                class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
              >
                Más tarde
              </button>
              <button
                @click="showCloseReminderModal = false; prepareClose()"
                class="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Lock class="w-4 h-4" />
                Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="showPreviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
        <div class="absolute inset-0 bg-black/50" @click="showPreviewModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-4 flex flex-col max-h-[90vh]">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-semibold text-slate-900 dark:text-white">Vista Previa - Cierre</h2>
            <button @click="showPreviewModal = false" class="text-slate-400 hover:text-slate-600">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Preview Content -->
          <div class="bg-white border-2 border-slate-800 rounded-lg p-3 text-sm font-mono overflow-y-auto flex-1">
            <div class="text-center border-b-2 border-dashed border-slate-300 pb-3 mb-3">
              <h3 class="font-bold text-base uppercase">Cierre de Caja</h3>
              <p class="text-slate-600">{{ new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
            </div>
            
            <div class="space-y-1 mb-4 text-slate-800">
              <div class="flex justify-between">
                <span>Caja:</span>
                <span class="font-semibold">{{ currentDrawer?.name }}</span>
              </div>
              <div class="flex justify-between">
                <span>Ubicación:</span>
                <span class="font-semibold">{{ selectedLocation?.name }}</span>
              </div>
              <div class="flex justify-between">
                <span>Apertura:</span>
                <span class="font-semibold">{{ openDate() }} {{ openTime() }}</span>
              </div>
              <div class="flex justify-between">
                <span>Cajero:</span>
                <span class="font-semibold">{{ authStore.user?.username }}</span>
              </div>
            </div>
            
            <div class="border-t-2 border-dashed border-slate-300 pt-3 mt-3">
              <div class="space-y-1 text-slate-800">
                <div class="flex justify-between">
                  <span>Monto Inicial:</span>
                  <span class="font-semibold">{{ formatMoney(cashSummary?.initial_amount) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Ventas Efectivo:</span>
                  <span class="font-semibold text-green-700">+{{ formatMoney(cashSummary?.total_cash_sales) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Retiros:</span>
                  <span class="font-semibold text-red-700">-{{ formatMoney(cashSummary?.total_withdrawals) }}</span>
                </div>
              </div>
              
              <div class="border-t-2 border-slate-800 pt-2 mt-2">
                <div class="flex justify-between font-bold text-slate-800">
                  <span>Efectivo Esperado:</span>
                  <span>{{ formatMoney(cashSummary?.expected_cash) }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="closingAmount > 0" class="mt-4 p-2 rounded-lg text-center font-semibold"
              :class="difference > 0 ? 'bg-green-100 text-green-800' : difference < 0 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'"
            >
              {{ difference > 0 ? `Sobrante: ${formatMoney(difference)}` : difference < 0 ? `Faltante: ${formatMoney(Math.abs(difference))}` : 'Cuadre Perfecto!' }}
            </div>
          </div>
          
          <div class="flex gap-2 mt-3 shrink-0">
            <button
              @click="showPreviewModal = false"
              class="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium text-sm"
            >
              Cerrar
            </button>
            <button
              @click="showPreviewModal = false; prepareClose()"
              class="flex-1 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium flex items-center justify-center gap-1 text-sm"
            >
              <Lock class="w-3 h-3" />
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Withdrawal Modal -->
    <Teleport to="body">
      <div v-if="showWithdrawalModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showWithdrawalModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Registrar Retiro</h2>
            <button @click="showWithdrawalModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monto a Retirar
              </label>
              <input
                :value="withdrawalAmountDisplay"
                @input="onWithdrawalAmountInput"
                @focus="onWithdrawalAmountFocus"
                @blur="onWithdrawalAmountBlur"
                type="text"
                placeholder="0.00"
                class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-semibold"
              />
              <p class="text-xs text-slate-500 mt-1">
                Efectivo disponible: {{ formatMoney(cashSummary?.expected_cash || 0) }}
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Observaciones (opcional)
              </label>
              <textarea
                v-model="withdrawalNotes"
                rows="2"
                placeholder="Ej: Retiro para banco, Gastos operativos..."
                class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm resize-none"
              ></textarea>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="showWithdrawalModal = false"
              class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              @click="handleWithdrawal"
              :disabled="loading || !withdrawalAmount || withdrawalAmount <= 0"
              class="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <ArrowDownToLine v-else class="w-4 h-4" />
              Retirar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useLocationStore } from '../../stores/location.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { shiftService } from '../../services/shift.service.js'
import { coreService } from '../../services/inventory.service.js'
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  X,
  Loader2,
  Save,
  Calendar,
  ArrowLeftRight
} from 'lucide-vue-next'

const notification = useNotificationStore()
const locationStore = useLocationStore()
const currencyStore = useCurrencyStore()

const shifts = ref([])
const locations = ref([])
const selectedLocation = ref(null)
const loading = ref(false)
const showModal = ref(false)
const editingShift = ref(null)

const initialAmountDisplay = ref('0')

const form = ref({
  name: '',
  start_time: '08:00',
  end_time: '16:00',
  default_initial_amount: 0,
  is_active: true,
  sort_order: 0
})

function formatInitialAmountDisplay() {
  const decimals = currencyStore.decimal_places || 2
  initialAmountDisplay.value = (form.value.default_initial_amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

function onInitialAmountInput(e) {
  const val = e.target.value.replace(/[^0-9.]/g, '')
  const num = parseFloat(val)
  form.value.default_initial_amount = isNaN(num) ? 0 : currencyStore.roundMoney(num)
  initialAmountDisplay.value = val
}

function onInitialAmountFocus(e) {
  e.target.select()
}

function onInitialAmountBlur() {
  formatInitialAmountDisplay()
}

onMounted(async () => {
  await loadLocations()
  if (locationStore.locations.length > 0) {
    selectedLocation.value = locationStore.locations[0]
    await loadShifts()
  }
})

async function loadLocations() {
  try {
    const { data } = await coreService.getLocations()
    const activeLocations = (data.data || []).filter(l => l.is_active)
    locationStore.setLocations(activeLocations)
    locations.value = activeLocations
  } catch (error) {
    notification.error('Error al cargar ubicaciones')
  }
}

async function loadShifts() {
  if (!selectedLocation.value) return
  loading.value = true
  try {
    const { data } = await shiftService.getShiftConfigs(selectedLocation.value.id)
    if (data.success) {
      shifts.value = data.data
    }
  } catch (error) {
    notification.error('Error al cargar turnos')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingShift.value = null
  form.value = {
    name: '',
    start_time: '08:00',
    end_time: '16:00',
    default_initial_amount: 0,
    is_active: true,
    sort_order: shifts.value.length
  }
  formatInitialAmountDisplay()
  showModal.value = true
}

function openEditModal(shift) {
  editingShift.value = shift
  form.value = {
    name: shift.name,
    start_time: shift.start_time ? shift.start_time.substring(0, 5) : '08:00',
    end_time: shift.end_time ? shift.end_time.substring(0, 5) : '16:00',
    default_initial_amount: shift.default_initial_amount,
    is_active: Boolean(shift.is_active),
    sort_order: shift.sort_order
  }
  formatInitialAmountDisplay()
  showModal.value = true
}

async function saveShift() {
  if (!selectedLocation.value) {
    notification.warning('Selecciona una ubicación')
    return
  }
  
  if (!form.value.name) {
    notification.warning('El nombre del turno es requerido')
    return
  }

  loading.value = true
  try {
    const payload = {
      ...form.value,
      location_id: selectedLocation.value.id
    }
    
    if (editingShift.value) {
      const { data } = await shiftService.updateShiftConfig(editingShift.value.id, payload)
      if (data.success) {
        notification.success('Turno actualizado')
      }
    } else {
      const { data } = await shiftService.createShiftConfig(payload)
      if (data.success) {
        notification.success('Turno creado')
      }
    }
    
    showModal.value = false
    await loadShifts()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al guardar turno')
  } finally {
    loading.value = false
  }
}

async function deleteShift(shift) {
  window.$confirm(
    `¿Eliminar el turno "${shift.name}"?`,
    async () => {
      loading.value = true
      try {
        const { data } = await shiftService.deleteShiftConfig(shift.id)
        if (data.success) {
          notification.success('Turno eliminado')
          await loadShifts()
        }
      } catch (error) {
        notification.error(error.response?.data?.message || 'Error al eliminar turno')
      } finally {
        loading.value = false
      }
    },
    { type: 'danger', title: 'Eliminar Turno', buttonLabel: 'Eliminar' }
  )
}

function formatTime(time) {
  if (!time) return ''
  return time.substring(0, 5)
}

function getDayName(dayNum) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return days[dayNum] || ''
}
</script>

<template>
  <div class="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4">
    <!-- Main Content -->
    <div class="flex-1 flex flex-col gap-4 min-w-0">
      <!-- Header -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Clock class="w-6 h-6 md:w-7 md:h-7 text-brand-500" />
              Turnos y Cajas
            </h1>
            <p class="text-slate-500 dark:text-slate-400 mt-1 text-sm">Configura los horarios de turnos y montos iniciales</p>
          </div>
          <button
            @click="openCreateModal"
            class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center gap-2"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Nuevo Turno</span>
          </button>
        </div>
      </div>

      <!-- Location Selector -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Seleccionar Ubicación
        </label>
        <select
          v-model="selectedLocation"
          @change="loadShifts"
          class="w-full md:w-64 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
        >
          <option v-for="loc in locations" :key="loc.id" :value="loc">
            {{ loc.name }}
          </option>
        </select>
      </div>

      <!-- Shifts List -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 flex-1 overflow-auto">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <Loader2 class="w-8 h-8 animate-spin text-brand-500" />
        </div>
        
        <div v-else-if="shifts.length === 0" class="text-center py-12">
          <Clock class="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">No hay turnos configurados</h3>
          <p class="text-slate-500 dark:text-slate-400 mb-4">Crea turnos para definir los horarios de trabajo</p>
          <button
            @click="openCreateModal"
            class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium inline-flex items-center gap-2"
          >
            <Plus class="w-4 h-4" />
            Crear Turno
          </button>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="shift in shifts"
            :key="shift.id"
            class="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 transition-colors"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 md:w-12 md:h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock class="w-5 h-5 md:w-6 md:h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-slate-900 dark:text-white">{{ shift.name }}</h3>
                    <span
                      v-if="!shift.is_active"
                      class="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    >
                      Inactivo
                    </span>
                  </div>
                  <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                    <span class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock class="w-3 h-3" />
                      {{ formatTime(shift.start_time) }} - {{ formatTime(shift.end_time) }}
                    </span>
                    <span class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <DollarSign class="w-3 h-3" />
                      Inicial: {{ currencyStore.currency_symbol }}{{ Number(shift.default_initial_amount).toLocaleString() }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 ml-14 sm:ml-0">
                <button
                  @click="openEditModal(shift)"
                  class="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button
                  @click="deleteShift(shift)"
                  class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Panel - hidden on mobile and tablet -->
    <div class="hidden lg:block w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex-shrink-0">
      <h2 class="font-semibold text-slate-900 dark:text-white mb-4">Información</h2>
      <div class="space-y-4 text-sm text-slate-600 dark:text-slate-400">
        <p>
          Los turnos definen los horarios de trabajo y el monto inicial de caja para cada ubicación.
        </p>
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p class="font-medium text-blue-800 dark:text-blue-300 mb-1">Horario actual</p>
          <p class="text-blue-600 dark:text-blue-400">
            {{ new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }}
          </p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p class="font-medium text-slate-700 dark:text-slate-300 mb-1">Días de la semana</p>
          <div class="flex gap-1 flex-wrap">
            <span
              v-for="day in ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']"
              :key="day"
              class="px-2 py-1 text-xs rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              {{ day }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {{ editingShift ? 'Editar Turno' : 'Nuevo Turno' }}
          </h2>
          
          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Turno
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Ej: Mañana, Tarde, Noche"
                class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hora de Inicio
                </label>
                <input
                  v-model="form.start_time"
                  type="time"
                  class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hora de Fin
                </label>
                <input
                  v-model="form.end_time"
                  type="time"
                  class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monto Inicial por Defecto
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{{ currencyStore.currency_symbol }}</span>
                <input
                  :value="initialAmountDisplay"
                  @input="onInitialAmountInput"
                  @focus="onInitialAmountFocus"
                  @blur="onInitialAmountBlur"
                  type="text"
                  class="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <p class="text-xs text-slate-500 mt-1">Dinero que se deja para cambios al iniciar el turno</p>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="form.is_active"
                type="checkbox"
                id="is_active"
                class="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              />
              <label for="is_active" class="text-sm text-slate-700 dark:text-slate-300">
                Turno activo
              </label>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="showModal = false"
              class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              @click="saveShift"
              :disabled="loading"
              class="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

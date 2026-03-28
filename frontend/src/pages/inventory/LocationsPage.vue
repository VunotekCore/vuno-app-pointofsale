<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { usePhoneFormatter } from '../../utils/phone.utils.js'
import { useDebounce } from '../../composables/useDebounce.js'
import { coreService } from '../../services/inventory.service.js'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Building2,
  MapPin,
  Search,
  Loader2
} from 'lucide-vue-next'

const { formatPhoneOnBlur } = usePhoneFormatter()

const notification = useNotificationStore()

const locations = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageLimit = ref(50)
const totalRecords = ref(0)

const { debounced: debouncedLoad } = useDebounce(() => {
  currentPage.value = 1
  loadLocations()
}, 300)

const form = ref({
  name: '',
  code: '',
  address: '',
  phone: '',
  email: '',
  is_warehouse: false,
  is_active: true,
  timezone: 'America/Santiago',
  default_tax_rate: 0
})

const filteredLocations = computed(() => {
  return locations.value
})

const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))

async function loadLocations() {
  loading.value = true
  try {
    const params = {
      search: searchQuery.value,
      is_active: statusFilter.value,
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value
    }
    const { data } = await coreService.getLocations(params)
    locations.value = data.data || []
    totalRecords.value = data.total || 0
  } catch (error) {
    notification.error('Error al cargar ubicaciones')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadLocations()
  }
}

watch(searchQuery, () => {
  debouncedLoad()
})

watch(statusFilter, () => {
  currentPage.value = 1
  loadLocations()
})

function openModal(location = null) {
  if (location) {
    editingId.value = location.id
    form.value = { 
      ...location,
      is_active: Boolean(location.is_active)
    }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      is_warehouse: false,
      is_active: true,
      timezone: 'America/Santiago',
      default_tax_rate: 0
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function saveLocation() {
  try {
    if (editingId.value) {
      await coreService.updateLocation(editingId.value, form.value)
      notification.success('Ubicación actualizada')
    } else {
      await coreService.createLocation(form.value)
      notification.success('Ubicación creada')
    }
    closeModal()
    loadLocations()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al guardar')
  }
}

async function deleteLocation(id) {
  window.$confirm(
    '¿Está seguro de eliminar esta ubicación?',
    async () => {
      try {
        await coreService.deleteLocation(id)
        notification.success('Ubicación eliminada')
        loadLocations()
      } catch (error) {
        notification.error('Error al eliminar')
      }
    },
    { type: 'danger', title: 'Eliminar Ubicación', buttonLabel: 'Eliminar' }
  )
}

onMounted(() => {
  loadLocations()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Ubicaciones</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestiona sucursales y almacenes</p>
      </div>
      <button
        @click="openModal()"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nueva Ubicación
      </button>
    </div>

    <!-- Search -->
    <div class="flex flex-wrap gap-4 mb-4">
      <div class="flex-1 min-w-[200px] relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar ubicaciones..."
          class="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
      </div>
      <select
        v-model="statusFilter"
        class="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
      >
        <option value="">Todos los estados</option>
        <option value="true">Activo</option>
        <option value="false">Inactivo</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div v-if="loading" class="p-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
      </div>
      <table v-else class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Código</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nombre</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tipo</th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Estado</th>
            <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-for="location in filteredLocations" :key="location.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="px-4 py-3">
              <span class="font-mono text-sm text-slate-600 dark:text-slate-300">{{ location.code }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <Building2 class="w-4 h-4 text-slate-400" />
                <span class="font-medium text-slate-900 dark:text-white">{{ location.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                :class="location.is_warehouse ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'"
                class="px-2 py-0.5 rounded-md text-xs font-medium"
              >
                {{ location.is_warehouse ? 'Almacén' : 'Sucursal' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="location.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
                class="px-2 py-0.5 rounded-md text-xs font-medium"
              >
                {{ location.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  @click="openModal(location)"
                  class="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="deleteLocation(location.id)"
                  class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredLocations.length === 0">
            <td colspan="5" class="px-4 py-8 text-center text-slate-400">
              <MapPin class="w-8 h-8 mx-auto mb-2 opacity-50" />
              No hay ubicaciones
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} ubicación{{ totalRecords !== 1 ? 'es' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ editingId ? 'Editar' : 'Nueva' }} Ubicación
            </h2>
            <button @click="closeModal" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>
          <form @submit.prevent="saveLocation" class="p-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código</label>
                <input
                  v-model="form.code"
                  type="text"
                  required
                  placeholder="CEN, ALM01"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
              <input
                v-model="form.address"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  @blur="formatPhoneOnBlur"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zona Horaria</label>
              <select
                v-model="form.timezone"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="America/Santiago">America/Santiago</option>
                <option value="America/Lima">America/Lima</option>
                <option value="America/Bogota">America/Bogota</option>
                <option value="America/Mexico_City">America/Mexico_City</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="form.is_warehouse"
                  type="checkbox"
                  class="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">Solo almacén (no vende)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300">Activo</span>
              </label>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors"
              >
                {{ editingId ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

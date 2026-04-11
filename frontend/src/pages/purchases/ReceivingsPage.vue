<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useLocationStore } from '../../stores/location.store.js'
import { useDebounce } from '../../composables/useDebounce.js'
import { purchaseService } from '../../services/purchase.service.js'
import { coreService, itemsService } from '../../services/inventory.service.js'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Loader2,
  Package,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-vue-next'

const notification = useNotificationStore()
const locationStore = useLocationStore()

const receivings = ref([])
const suppliers = ref([])
const locations = ref([])
const purchaseOrders = ref([])
const loading = ref(false)
const loadingSuppliers = ref(false)
const loadingLocations = ref(false)
const loadingOrders = ref(false)
const showModal = ref(false)
const showDetailModal = ref(false)
const editingId = ref(null)
const selectedReceiving = ref(null)
const searchQuery = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageLimit = ref(20)
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))
const showFilters = ref(false)

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadReceivings()
}, 300)

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' }
]

const form = ref({
  purchase_order_id: '',
  supplier_id: '',
  location_id: '',
  receiving_type: 'purchase_order',
  notes: '',
  items: []
})

const itemForm = ref({
  item_id: '',
  quantity: 1,
  unit_cost: 0,
  variation_id: ''
})

const availableItems = ref([])
const loadingItems = ref(false)

const filteredReceivings = computed(() => {
  return receivings.value
})

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

const statusLabels = {
  pending: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada'
}

async function loadReceivings() {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      search: searchQuery.value,
      status: filterStatus.value || undefined
    }
    const { data } = await purchaseService.getReceivings(params)
    receivings.value = data.data || []
    totalRecords.value = data.total || 0
  } catch (error) {
    notification.error('Error al cargar recepciones')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadReceivings()
  }
}

watch(searchQuery, () => {
  debouncedSearch()
})

watch(filterStatus, () => {
  currentPage.value = 1
  loadReceivings()
})

async function loadSuppliers() {
  loadingSuppliers.value = true
  try {
    const { data } = await purchaseService.getSuppliers()
    suppliers.value = data.data || []
  } catch (error) {
    notification.error('Error al cargar proveedores')
  } finally {
    loadingSuppliers.value = false
  }
}

async function loadLocations() {
  if (locationStore.locations.length > 0) {
    locations.value = locationStore.locations
    return
  }
  
  loadingLocations.value = true
  try {
    const { data } = await coreService.getUserLocations()
    let userLocations = data.data || []
    
    userLocations = userLocations
      .filter(l => l.is_active)
      .map(l => ({
        id: l.location_id,
        name: l.location_name,
        code: l.location_code,
        is_active: l.is_active,
        is_default: l.is_default
      }))
    
    locations.value = userLocations
    if (locations.value.length > 0) {
      locationStore.setLocations(locations.value)
    }
  } catch (error) {
    const { data } = await coreService.getLocations()
    locations.value = data.data || []
  } finally {
    loadingLocations.value = false
  }
}

async function loadPurchaseOrders() {
  loadingOrders.value = true
  try {
    const { data } = await purchaseService.getPurchaseOrders({ status: 'sent' })
    purchaseOrders.value = data.data || []
  } catch (error) {
    notification.error('Error al cargar órdenes')
  } finally {
    loadingOrders.value = false
  }
}

async function loadAvailableItems() {
  loadingItems.value = true
  try {
    const { data } = await itemsService.getItems()
    availableItems.value = data.data || []
  } catch (error) {
    console.error('Error loading items:', error)
  } finally {
    loadingItems.value = false
  }
}

async function onOrderSelect() {
  if (!form.value.purchase_order_id) {
    form.value.supplier_id = ''
    form.value.location_id = ''
    form.value.items = []
    return
  }
  
  try {
    const { data } = await purchaseService.getPurchaseOrder(form.value.purchase_order_id)
    const order = data.data
    
    if (order) {
      form.value.supplier_id = order.supplier_id
      form.value.location_id = order.location_id
      form.value.notes = order.notes ? `Orden: ${order.po_number} - ${order.notes}` : `Orden: ${order.po_number}`
      form.value.items = (order.items || []).map(item => ({
        item_id: item.item_id,
        variation_id: item.variation_id,
        item_name: item.item_name,
        item_number: item.item_number,
        quantity: item.quantity_ordered - (item.quantity_received || 0),
        unit_cost: item.cost_price,
        total_cost: (item.quantity_ordered - (item.quantity_received || 0)) * item.cost_price
      }))
    }
  } catch (error) {
    console.error('Error loading order:', error)
    notification.error('Error al cargar detalles de la orden')
  }
}

async function openModal(receiving = null) {
  await loadSuppliers()
  await loadLocations()
  await loadPurchaseOrders()
  await loadAvailableItems()
  
  if (receiving) {
    editingId.value = receiving.id
    selectedReceiving.value = receiving
    form.value = {
      purchase_order_id: receiving.purchase_order_id,
      supplier_id: receiving.supplier_id,
      location_id: receiving.location_id,
      receiving_type: receiving.receiving_type,
      notes: receiving.notes,
      items: receiving.items || []
    }
  } else {
    editingId.value = null
    selectedReceiving.value = null
    form.value = {
      purchase_order_id: '',
      supplier_id: '',
      location_id: '',
      receiving_type: 'purchase_order',
      notes: '',
      items: []
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  selectedReceiving.value = null
}

function addItem() {
  if (!itemForm.value.item_id || !itemForm.value.quantity || !itemForm.value.unit_cost) {
    notification.warning('Complete los datos del producto')
    return
  }
  
  const item = availableItems.value.find(i => i.id === itemForm.value.item_id)
  if (!item) return
  
  const newItem = {
    ...itemForm.value,
    item_name: item.name,
    item_number: item.item_number,
    total_cost: parseFloat(itemForm.value.quantity) * parseFloat(itemForm.value.unit_cost)
  }
  
  form.value.items.push(newItem)
  
  itemForm.value = {
    item_id: '',
    quantity: 1,
    unit_cost: 0,
    variation_id: ''
  }
}

function removeItem(index) {
  form.value.items.splice(index, 1)
}

async function saveReceiving() {
  if (!form.value.supplier_id || !form.value.location_id || form.value.items.length === 0) {
    notification.warning('Complete todos los campos requeridos')
    return
  }
  
  try {
    const data = {
      purchase_order_id: form.value.purchase_order_id || null,
      supplier_id: form.value.supplier_id,
      location_id: typeof form.value.location_id === 'object' ? form.value.location_id.id : form.value.location_id,
      receiving_type: form.value.receiving_type,
      notes: form.value.notes,
      items: form.value.items.map(item => ({
        item_id: item.item_id,
        variation_id: item.variation_id || null,
        quantity: item.quantity,
        cost_price: item.unit_cost
      }))
    }
    
    console.log('Creating receiving:', data)
    
    if (editingId.value) {
      notification.error('No se puede editar una recepción')
      return
    }
    
    await purchaseService.createReceiving(data)
    notification.success('Recepción creada')
    
    closeModal()
    loadReceivings()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al guardar')
  }
}

async function viewReceiving(receiving) {
  try {
    const { data } = await purchaseService.getReceiving(receiving.id)
    selectedReceiving.value = data.data
    showDetailModal.value = true
  } catch (error) {
    notification.error('Error al cargar detalles')
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedReceiving.value = null
}

async function completeReceiving(id) {
  window.$confirm(
    '¿Está seguro de completar esta recepción? Se actualizará el stock y el costo promedio.',
    async () => {
      try {
        await purchaseService.completeReceiving(id)
        notification.success('Recepción completada correctamente')
        closeDetailModal()
        loadReceivings()
      } catch (error) {
        notification.error(error.response?.data?.message || 'Error al completar recepción')
      }
    },
    { type: 'info', title: 'Completar Recepción', buttonLabel: 'Completar' }
  )
}

async function deleteReceiving(id) {
  window.$confirm(
    '¿Está seguro de eliminar esta recepción?',
    async () => {
      try {
        await purchaseService.deleteReceiving(id)
        notification.success('Recepción eliminada')
        loadReceivings()
      } catch (error) {
        notification.error(error.response?.data?.message || 'Error al eliminar')
      }
    },
    { type: 'danger', title: 'Eliminar Recepción', buttonLabel: 'Eliminar' }
  )
}

onMounted(() => {
  loadReceivings()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Recepciones</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm">Recepciones de mercancía de proveedores</p>
      </div>
      <button
        @click="openModal()"
        class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg flex items-center gap-2 transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nueva Recepción
      </button>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <!-- Mobile Filter Toggle -->
      <div class="lg:hidden p-3 border-b border-slate-200 dark:border-slate-800">
        <button
          @click="showFilters = !showFilters"
          class="w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-500 transition-colors flex items-center justify-center gap-2"
        >
          <Search class="w-4 h-4" />
          {{ showFilters ? 'Ocultar filtros' : 'Mostrar filtros' }}
          <span v-if="searchQuery || filterStatus" class="px-1.5 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs rounded-full">
            {{ [searchQuery && 'Búsqueda', filterStatus && 'Estado'].filter(Boolean).length }}
          </span>
        </button>
      </div>

      <!-- Desktop Filters (always visible) -->
      <div class="hidden lg:flex flex-col sm:flex-row gap-2 sm:gap-4 p-4">
        <div class="flex-1 relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            title="Buscar por número o proveedor"
            class="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
          <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
        </div>
        <select
          v-model="filterStatus"
          class="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white whitespace-nowrap"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Mobile Filters Panel -->
      <div v-if="showFilters" class="lg:hidden p-4 pt-0 space-y-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar..."
            class="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <select
          v-model="filterStatus"
          class="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white whitespace-nowrap"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <!-- Desktop Table -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Número</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Orden</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Proveedor</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ubicación</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Fecha</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            <tr v-if="loading">
              <td colspan="8" class="px-4 py-8 text-center">
                <Loader2 class="w-6 h-6 animate-spin mx-auto text-brand-500" />
              </td>
            </tr>
            <tr v-else-if="filteredReceivings.length === 0">
              <td colspan="8" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                No hay recepciones
              </td>
            </tr>
            <tr v-for="receiving in filteredReceivings" :key="receiving.id" class="hover:bg-slate-50 dark:hover:bg-slate-800">
              <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ receiving.receiving_number }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ receiving.po_number || '-' }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ receiving.supplier_name }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ receiving.location_name }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">C$ {{ parseFloat(receiving.total_amount || 0).toFixed(2) }}</td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-1 text-xs font-medium rounded-full', statusColors[receiving.status]]">
                  {{ statusLabels[receiving.status] }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ receiving.received_at?.split('T')[0] || receiving.created_at?.split('T')[0] }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="viewReceiving(receiving)" class="p-1 text-slate-400 hover:text-brand-500" title="Ver recepción">
                    <Package class="w-4 h-4" />
                  </button>
                  <button
                    v-if="receiving.status === 'pending'"
                    @click="completeReceiving(receiving.id)"
                    class="p-1 text-green-500 hover:text-green-700"
                    title="Completar recepción"
                  >
                    <CheckCircle2 class="w-4 h-4" />
                  </button>
                  <button @click="deleteReceiving(receiving.id)" class="p-1 text-slate-400 hover:text-red-500" title="Eliminar recepción">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
        <div v-if="loading" class="p-8 text-center">
          <Loader2 class="w-6 h-6 animate-spin mx-auto text-brand-500" />
        </div>
        <div v-else-if="filteredReceivings.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
          No hay recepciones
        </div>
        <div
          v-for="receiving in filteredReceivings"
          :key="receiving.id"
          class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        >
          <div class="flex items-start justify-between gap-2 mb-3">
            <div>
              <p class="font-medium text-slate-900 dark:text-white">{{ receiving.receiving_number }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ receiving.received_at?.split('T')[0] || receiving.created_at?.split('T')[0] }}</p>
            </div>
            <span :class="['px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap', statusColors[receiving.status]]">
              {{ statusLabels[receiving.status] }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
            <div>
              <span class="text-slate-400">Orden:</span> {{ receiving.po_number || '-' }}
            </div>
            <div>
              <span class="text-slate-400">Proveedor:</span> {{ receiving.supplier_name }}
            </div>
            <div>
              <span class="text-slate-400">Ubicación:</span> {{ receiving.location_name }}
            </div>
            <div>
              <span class="text-slate-400">Total:</span> C$ {{ parseFloat(receiving.total_amount || 0).toFixed(2) }}
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button @click="viewReceiving(receiving)" class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Ver">
              <Package class="w-4 h-4" />
            </button>
            <button
              v-if="receiving.status === 'pending'"
              @click="completeReceiving(receiving.id)"
              class="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
              title="Completar"
            >
              <CheckCircle2 class="w-4 h-4" />
            </button>
            <button @click="deleteReceiving(receiving.id)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Eliminar">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} recepción{{ totalRecords !== 1 ? 'es' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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

    <!-- Modal Nueva Recepción -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            Nueva Recepción
          </h2>
          <button @click="closeModal" class="p-1 text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Orden de Compra (opcional)</label>
            <select
              v-model="form.purchase_order_id"
              @change="onOrderSelect"
              class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              :disabled="loadingOrders"
            >
              <option value="">Recepción directa (sin orden)</option>
              <option v-for="o in purchaseOrders" :key="o.id" :value="o.id">
                {{ o.po_number }} - {{ o.supplier_name }}
              </option>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proveedor *</label>
              <select
                v-model="form.supplier_id"
                class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                :disabled="loadingSuppliers || form.purchase_order_id"
              >
                <option value="">Seleccionar proveedor</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ubicación *</label>
              <select
                v-model="form.location_id"
                class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                :disabled="loadingLocations || form.purchase_order_id"
              >
                <option value="">Seleccionar ubicación</option>
                <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            ></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Productos</label>
            
            <div class="flex gap-2 mb-2">
              <select
                v-model="itemForm.item_id"
                class="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Seleccionar producto</option>
                <option v-for="i in availableItems" :key="i.id" :value="i.id">{{ i.name }} ({{ i.item_number }})</option>
              </select>
              <input
                v-model.number="itemForm.quantity"
                type="number"
                min="1"
                placeholder="Cantidad"
                class="w-24 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <input
                v-model.number="itemForm.unit_cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="Costo"
                class="w-28 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                @click="addItem"
                class="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>
            
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Producto</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Cantidad</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Costo</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Total</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  <tr v-for="(item, index) in form.items" :key="index" class="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td class="px-3 py-2 text-slate-900 dark:text-white font-medium">{{ item.item_name }}</td>
                    <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{{ item.quantity }}</td>
                    <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">C$ {{ parseFloat(item.unit_cost || 0).toFixed(2) }}</td>
                    <td class="px-3 py-2 text-right text-slate-900 dark:text-white font-medium">C$ {{ parseFloat(item.total_cost || 0).toFixed(2) }}</td>
                    <td class="px-3 py-2 text-right">
                      <button @click="removeItem(index)" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                        <X class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="form.items.length === 0">
                    <td colspan="5" class="px-3 py-4 text-center text-slate-400">No hay productos agregados</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-800">
          <button @click="closeModal" class="bg-red-500   px-4 py-2 text-white hover:bg-red-600 dark:hover:bg-red-800 rounded-lg">
            Cancelar
          </button>
          <button
            @click="saveReceiving"
            class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg"
            :disabled="!form.supplier_id || !form.location_id || form.items.length === 0"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Detalle -->
    <div v-if="showDetailModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeDetailModal">
      <div class="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            Recepción: {{ selectedReceiving?.receiving_number }}
          </h2>
          <button @click="closeDetailModal" class="p-1 text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-slate-500">Proveedor:</span>
              <span class="ml-2 font-medium text-slate-900 dark:text-white">{{ selectedReceiving?.supplier_name }}</span>
            </div>
            <div>
              <span class="text-slate-500">Ubicación:</span>
              <span class="ml-2 font-medium text-slate-900 dark:text-white">{{ selectedReceiving?.location_name }}</span>
            </div>
            <div>
              <span class="text-slate-500">Orden:</span>
              <span class="ml-2 font-medium text-slate-900 dark:text-white">{{ selectedReceiving?.po_number || 'Directa' }}</span>
            </div>
            <div>
              <span class="text-slate-500">Estado:</span>
              <span :class="['ml-2 px-2 py-0.5 text-xs font-medium rounded-full', statusColors[selectedReceiving?.status]]">
                {{ statusLabels[selectedReceiving?.status] }}
              </span>
            </div>
          </div>
          
          <div>
            <h3 class="font-medium text-slate-900 dark:text-white mb-2">Productos</h3>
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Producto</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Cantidad</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Costo</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  <tr v-for="item in selectedReceiving?.items" :key="item.id" class="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td class="px-3 py-2 text-slate-900 dark:text-white font-medium">{{ item.item_name }}</td>
                    <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{{ item.quantity }}</td>
                    <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">C$ {{ parseFloat(item.cost_price || 0).toFixed(2) }}</td>
                    <td class="px-3 py-2 text-right text-slate-900 dark:text-white font-medium">C$ {{ parseFloat(item.total_cost || 0).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div v-if="selectedReceiving?.status === 'pending'" class="flex gap-2">
            <button
              @click="completeReceiving(selectedReceiving.id)"
              class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
            >
              <CheckCircle2 class="w-4 h-4" />
              Completar Recepción
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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
  Truck,
  Package,
  Check,
  Clock,
  AlertCircle,
  MapPin
} from 'lucide-vue-next'

const notification = useNotificationStore()
const locationStore = useLocationStore()

const orders = ref([])
const suppliers = ref([])
const locations = ref([])
const loading = ref(false)
const loadingSuppliers = ref(false)
const loadingLocations = ref(false)
const showModal = ref(false)
const showDetailModal = ref(false)
const editingId = ref(null)
const selectedOrder = ref(null)
const searchQuery = ref('')
const filterStatus = ref('')
const selectedLocationId = ref(null)
const currentPage = ref(1)
const pageLimit = ref(20)
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))
const showFilters = ref(false)

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadOrders()
}, 300)

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'sent', label: 'Enviada' },
  { value: 'partial', label: 'Parcial' },
  { value: 'received', label: 'Recibida' },
  { value: 'cancelled', label: 'Cancelada' }
]

const form = ref({
  supplier_id: '',
  location_id: '',
  expected_date: '',
  notes: '',
  items: []
})

const itemForm = ref({
  item_id: '',
  quantity_ordered: 1,
  unit_cost: 0
})

const availableItems = ref([])
const loadingItems = ref(false)

const filteredOrders = computed(() => {
  return orders.value
})

const statusColors = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  received: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}

const statusLabels = {
  draft: 'Borrador',
  sent: 'Enviada',
  partial: 'Parcial',
  received: 'Recibida',
  cancelled: 'Cancelada'
}

async function loadOrders() {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      search: searchQuery.value,
      status: filterStatus.value || undefined,
      location_id: selectedLocationId.value || undefined
    }
    const { data } = await purchaseService.getPurchaseOrders(params)
    orders.value = data.data || []
    totalRecords.value = data.total || 0
  } catch (error) {
    notification.error('Error al cargar órdenes de compra')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadOrders()
  }
}

watch(searchQuery, () => {
  debouncedSearch()
})

watch(filterStatus, () => {
  currentPage.value = 1
  loadOrders()
})

watch(selectedLocationId, () => {
  currentPage.value = 1
  loadOrders()
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
        is_default: l.is_default,
        company_id: l.company_id
      }))
    
    locations.value = userLocations
    locationStore.setLocations(userLocations)
    
    if (locations.value.length > 0) {
      selectedLocationId.value = locationStore.selectedLocationId || locations.value[0]?.id || null
    }
  } catch (error) {
    const { data } = await coreService.getLocations()
    locations.value = data.data || []
    if (locations.value.length > 0) {
      selectedLocationId.value = locations.value[0]?.id || null
    }
  } finally {
    loadingLocations.value = false
  }
}

async function loadAvailableItems(supplierId = null) {
  loadingItems.value = true
  try {
    const params = {}
    if (supplierId) {
      params.supplier_id = supplierId
    }
    const { data } = await itemsService.getItems(params)
    availableItems.value = data.data || []
  } catch (error) {
    console.error('Error loading items:', error)
  } finally {
    loadingItems.value = false
  }
}

async function onSupplierChange() {
  if (form.value.supplier_id) {
    await loadAvailableItems(form.value.supplier_id)
  } else {
    await loadAvailableItems()
  }
  itemForm.value.item_id = ''
}

async function openModal(order = null) {
  showModal.value = true
  
  await Promise.all([
    loadSuppliers(),
    loadLocations()
  ])
  
  if (order) {
    if (order.status !== 'draft') {
      notification.warning('Solo se pueden editar órdenes en estado Borrador')
      return
    }
    
    try {
      const { data } = await purchaseService.getPurchaseOrder(order.id)
      const fullOrder = data.data
      editingId.value = fullOrder.id
      selectedOrder.value = fullOrder
      form.value = {
        supplier_id: fullOrder.supplier_id,
        location_id: fullOrder.location_id,
        expected_date: fullOrder.expected_date,
        notes: fullOrder.notes,
        items: (fullOrder.items || []).map(item => ({
          item_id: item.item_id,
          variation_id: item.variation_id,
          item_name: item.item_name,
          item_number: item.item_number,
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.cost_price,
          total_cost: item.total_cost
        }))
      }
      await loadAvailableItems(fullOrder.supplier_id)
    } catch (error) {
      notification.error('Error al cargar orden')
      return
    }
  } else {
    editingId.value = null
    selectedOrder.value = null
    form.value = {
      supplier_id: '',
      location_id: '',
      expected_date: '',
      notes: '',
      items: []
    }
    await loadAvailableItems()
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
  selectedOrder.value = null
}

function addItem() {
  if (!itemForm.value.item_id || !itemForm.value.quantity_ordered || !itemForm.value.unit_cost) {
    notification.warning('Complete los datos del producto')
    return
  }
  
  const item = availableItems.value.find(i => i.id === itemForm.value.item_id)
  if (!item) return
  
  const newItem = {
    ...itemForm.value,
    item_name: item.name,
    item_number: item.item_number,
    total_cost: parseFloat(itemForm.value.quantity_ordered) * parseFloat(itemForm.value.unit_cost)
  }
  
  form.value.items.push(newItem)
  
  itemForm.value = {
    item_id: '',
    quantity_ordered: 1,
    unit_cost: 0
  }
}

function removeItem(index) {
  form.value.items.splice(index, 1)
}

async function saveOrder() {
  if (!form.value.supplier_id || !form.value.location_id || form.value.items.length === 0) {
    notification.warning('Complete todos los campos requeridos')
    return
  }
  
  try {
    const data = {
      supplier_id: form.value.supplier_id,
      location_id: form.value.location_id,
      expected_date: form.value.expected_date || null,
      notes: form.value.notes,
      items: form.value.items.map(item => ({
        item_id: item.item_id,
        variation_id: item.variation_id || null,
        quantity_ordered: item.quantity_ordered,
        cost_price: item.unit_cost || item.cost_price
      }))
    }
    
    if (editingId.value) {
      await purchaseService.updatePurchaseOrder(editingId.value, data)
      notification.success('Orden actualizada')
    } else {
      await purchaseService.createPurchaseOrder(data)
      notification.success('Orden creada')
    }
    
    closeModal()
    loadOrders()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al guardar')
  }
}

async function viewOrder(order) {
  try {
    const { data } = await purchaseService.getPurchaseOrder(order.id)
    selectedOrder.value = data.data
    showDetailModal.value = true
  } catch (error) {
    notification.error('Error al cargar detalles')
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  selectedOrder.value = null
}

async function updateStatus(orderId, newStatus) {
  try {
    await purchaseService.updatePurchaseOrder(orderId, { status: newStatus })
    notification.success('Estado actualizado')
    closeDetailModal()
    loadOrders()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al actualizar estado')
  }
}

async function generateAutoOrders() {
  const locationId = selectedLocationId.value || locationStore.selectedLocationId
  
  if (!locationId) {
    notification.warning('Seleccione una ubicación')
    return
  }
  
  try {
    const { data } = await purchaseService.generateAutoOrders({ location_id: locationId })
    notification.success(data.message || 'Órdenes generadas')
    loadOrders()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al generar órdenes')
  }
}

async function deleteOrder(id) {
  window.$confirm(
    '¿Está seguro de eliminar esta orden?',
    async () => {
      try {
        await purchaseService.deletePurchaseOrder(id)
        notification.success('Orden eliminada')
        loadOrders()
      } catch (error) {
        notification.error(error.response?.data?.message || 'Error al eliminar')
      }
    },
    { type: 'danger', title: 'Eliminar Orden', buttonLabel: 'Eliminar' }
  )
}

onMounted(async () => {
  await loadLocations()
  loadOrders()
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Órdenes de Compra</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm">Gestión de órdenes de compra a proveedores</p>
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <div class="flex items-center gap-2">
          <MapPin class="w-4 h-4 text-slate-400" />
          <select
            v-model="selectedLocationId"
            class="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm min-w-[120px] md:min-w-[150px]"
            :disabled="loadingLocations"
          >
            <option :value="null" disabled>Seleccionar</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
        <button
          @click="generateAutoOrders"
          class="flex-1 md:flex-none px-3 md:px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <AlertCircle class="w-4 h-4" />
          <span>Generar</span>
        </button>
        <button
          @click="openModal()"
          class="flex-1 md:flex-none px-3 md:px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <Plus class="w-4 h-4" />
          <span>Nueva</span>
        </button>
      </div>
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
              <td colspan="7" class="px-4 py-8 text-center">
                <Loader2 class="w-6 h-6 animate-spin mx-auto text-brand-500" />
              </td>
            </tr>
            <tr v-else-if="filteredOrders.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                No hay órdenes de compra
              </td>
            </tr>
            <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-slate-50 dark:hover:bg-slate-800">
              <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ order.po_number }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ order.supplier_name }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ order.location_name }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">C$ {{ parseFloat(order.total_amount || 0).toFixed(2) }}</td>
              <td class="px-4 py-3">
                <span :class="['px-2 py-1 text-xs font-medium rounded-full', statusColors[order.status]]">
                  {{ statusLabels[order.status] }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ order.created_at?.split('T')[0] }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="viewOrder(order)" class="p-1 text-slate-400 hover:text-brand-500">
                    <Package class="w-4 h-4" />
                  </button>
                  <button 
                    @click="openModal(order)" 
                    class="p-1 hover:text-brand-500"
                    :class="order.status === 'draft' ? 'text-slate-400' : 'text-slate-300 cursor-not-allowed'"
                    :disabled="order.status !== 'draft'"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="deleteOrder(order.id)" class="p-1 text-slate-400 hover:text-red-500">
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
        <div v-else-if="filteredOrders.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">
          No hay órdenes de compra
        </div>
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        >
          <div class="flex items-start justify-between gap-2 mb-3">
            <div>
              <p class="font-medium text-slate-900 dark:text-white">{{ order.po_number }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ order.created_at?.split('T')[0] }}</p>
            </div>
            <span :class="['px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap', statusColors[order.status]]">
              {{ statusLabels[order.status] }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
            <div>
              <span class="text-slate-400">Proveedor:</span> {{ order.supplier_name }}
            </div>
            <div>
              <span class="text-slate-400">Ubicación:</span> {{ order.location_name }}
            </div>
            <div>
              <span class="text-slate-400">Total:</span> C$ {{ parseFloat(order.total_amount || 0).toFixed(2) }}
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button @click="viewOrder(order)" class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Package class="w-4 h-4" />
            </button>
            <button 
              @click="openModal(order)" 
              class="p-2 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              :class="order.status === 'draft' ? 'text-slate-400' : 'text-slate-300 cursor-not-allowed'"
              :disabled="order.status !== 'draft'"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button @click="deleteOrder(order.id)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} orden{{ totalRecords !== 1 ? 'es' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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

    <!-- Modal Nueva/Editar Orden -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
            {{ editingId ? 'Editar Orden' : 'Nueva Orden de Compra' }}
          </h2>
          <button @click="closeModal" class="p-1 text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proveedor *</label>
              <select
                v-model="form.supplier_id"
                @change="onSupplierChange"
                class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                :disabled="loadingSuppliers"
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
                :disabled="loadingLocations"
              >
                <option value="">Seleccionar ubicación</option>
                <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha esperada</label>
            <input
              v-model="form.expected_date"
              type="date"
              class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
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
            <div class="flex items-end gap-2 mb-2">
              <div class="flex-1">
                <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Producto</label>
                <select
                  v-model="itemForm.item_id"
                  class="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  :disabled="loadingItems"
                >
                  <option value="">{{ loadingItems ? 'Cargando...' : 'Seleccionar producto' }}</option>
                  <option v-for="i in availableItems" :key="i.id" :value="i.id">{{ i.name }} ({{ i.item_number }})</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Cant.</label>
                <input
                  v-model.number="itemForm.quantity_ordered"
                  type="number"
                  min="1"
                  placeholder="Cantidad"
                  class="w-24 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Costo</label>
                <input
                  v-model.number="itemForm.unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Costo"
                  class="w-28 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
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
                    <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{{ item.quantity_ordered }}</td>
                    <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">C$ {{ parseFloat(item.unit_cost || item.cost_price || 0).toFixed(2) }}</td>
                    <td class="px-3 py-2 text-right text-slate-900 dark:text-white font-medium">C$ {{ parseFloat(item.total_cost).toFixed(2) }}</td>
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
          <button @click="closeModal" class="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            Cancelar
          </button>
          <button
            @click="saveOrder"
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
            Orden: {{ selectedOrder?.po_number }}
          </h2>
          <button @click="closeDetailModal" class="p-1 text-slate-400 hover:text-slate-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-slate-500">Proveedor:</span>
              <span class="ml-2 font-medium text-slate-900 dark:text-white">{{ selectedOrder?.supplier_name }}</span>
            </div>
            <div>
              <span class="text-slate-500">Ubicación:</span>
              <span class="ml-2 font-medium text-slate-900 dark:text-white">{{ selectedOrder?.location_name }}</span>
            </div>
            <div>
              <span class="text-slate-500">Estado:</span>
              <span :class="['ml-2 px-2 py-0.5 text-xs font-medium rounded-full', statusColors[selectedOrder?.status]]">
                {{ statusLabels[selectedOrder?.status] }}
              </span>
            </div>
            <div>
              <span class="text-slate-500">Fecha:</span>
              <span class="ml-2 font-medium text-slate-900 dark:text-white">{{ selectedOrder?.created_at?.split('T')[0] }}</span>
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
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Recibido</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Costo</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  <tr v-for="item in selectedOrder?.items" :key="item.id" class="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td class="px-3 py-2 text-slate-900 dark:text-white font-medium">{{ item.item_name }}</td>
                    <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{{ item.quantity_ordered }}</td>
                    <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">{{ item.quantity_received || 0 }}</td>
                    <td class="px-3 py-2 text-right text-slate-600 dark:text-slate-300">C$ {{ parseFloat(item.cost_price || 0).toFixed(2) }}</td>
                    <td class="px-3 py-2 text-right text-slate-900 dark:text-white font-medium">C$ {{ parseFloat(item.total_cost || 0).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div v-if="selectedOrder?.status === 'draft'" class="flex gap-2">
            <button
              @click="updateStatus(selectedOrder.id, 'sent')"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
            >
              <Truck class="w-4 h-4" />
              Marcar como Enviada
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

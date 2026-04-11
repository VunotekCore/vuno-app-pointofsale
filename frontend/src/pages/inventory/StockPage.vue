<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useDebounce } from '../../composables/useDebounce.js'
import { inventoryService, coreService, itemsService } from '../../services/inventory.service.js'
import {
  Plus,
  Pencil,
  X,
  Package,
  Search,
  Loader2,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Warehouse,
  ClipboardList,
  RotateCcw
} from 'lucide-vue-next'

const notification = useNotificationStore()

const stock = ref([])
const locations = ref([])
const items = ref([])
const movements = ref([])
const loading = ref(false)
const showModal = ref(false)
const searchQuery = ref('')
const selectedLocation = ref(null)
const activeTab = ref('stock')
const showFilters = ref(false)
const currentPage = ref(1)
const pageLimit = ref(50)
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadStock()
}, 300)

const form = ref({
  item_id: null,
  variation_id: null,
  location_id: null,
  quantity: 0,
  movement_type: 'adjustment_in',
  notes: '',
  unit_cost: null
})

async function loadStock() {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      search: searchQuery.value,
      location_id: selectedLocation.value || undefined
    }
    const { data } = await inventoryService.getStock(params)
    stock.value = data.data || []
    totalRecords.value = data.total || 0
  } catch (error) {
    notification.error('Error al cargar stock')
  } finally {
    loading.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const [locationsRes, itemsRes] = await Promise.all([
      coreService.getLocations(),
      itemsService.getItems()
    ])
    locations.value = locationsRes.data.data || []
    items.value = itemsRes.data.data || []
    await loadStock()
  } catch (error) {
    notification.error('Error al cargar datos')
  } finally {
    loading.value = false
  }
}

async function loadMovements() {
  loading.value = true
  try {
    const params = {
      limit: 100
    }
    const { data } = await inventoryService.getMovements(params)
    movements.value = data.data || []
  } catch (error) {
    notification.error('Error al cargar movimientos')
  } finally {
    loading.value = false
  }
}

async function filterByLocation() {
  currentPage.value = 1
  await loadStock()
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadStock()
  }
}

watch(searchQuery, () => {
  debouncedSearch()
})

watch(selectedLocation, () => {
  currentPage.value = 1
  loadStock()
})

watch(activeTab, (newTab) => {
  if (newTab === 'history') {
    loadMovements()
  }
})

const filteredStock = computed(() => {
  return stock.value
})

const getCurrentCost = computed(() => {
  if (!form.value.item_id) return '0.00'
  const item = items.value.find(i => i.id === form.value.item_id)
  return item?.cost_price || '0.00'
})

function openModal() {
  form.value = {
    item_id: null,
    variation_id: null,
    location_id: selectedLocation.value || (locations.value[0]?.id),
    quantity: 0,
    movement_type: 'adjustment_in',
    notes: '',
    unit_cost: ''
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function adjustStock() {
  if (!form.value.item_id) {
    notification.error('Debe seleccionar un producto')
    return
  }
  if (!form.value.location_id) {
    notification.error('Debe seleccionar una ubicación')
    return
  }
  if (!form.value.quantity || form.value.quantity <= 0) {
    notification.error('La cantidad debe ser mayor a 0')
    return
  }
  
  try {
    const movementTypeMap = {
      'adjustment_in': 'correction',
      'adjustment_out': 'correction',
      'damaged': 'damage',
      'lost': 'loss',
      'found': 'found'
    }
    
    const adjustmentType = movementTypeMap[form.value.movement_type] || 'correction'
    
    const { data: createRes } = await inventoryService.createAdjustmentQuick({
      location_id: form.value.location_id,
      adjustment_type: adjustmentType,
      notes: form.value.notes || `Ajuste tipo: ${form.value.movement_type}`,
      item_id: form.value.item_id,
      variation_id: form.value.variation_id,
      quantity: form.value.quantity,
      movement_type: form.value.movement_type,
      unit_cost: form.value.unit_cost || null
    })
    
    notification.success('Stock actualizado correctamente')
    closeModal()
    loadData()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al ajustar')
  }
}

function getQuantityClass(quantity, reorderLevel = 0) {
  if (quantity <= 0) return 'text-red-600 dark:text-red-400 font-bold'
  if (quantity <= reorderLevel) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
}

function getMovementTypeLabel(type) {
  const labels = {
    adjustment: 'Ajuste',
    adjustment_in: 'Entrada',
    adjustment_out: 'Salida',
    damaged: 'Dañado',
    lost: 'Perdido',
    found: 'Encontrado',
    purchase: 'Compra',
    sale: 'Venta',
    transfer: 'Transferencia',
    return: 'Devolución'
  }
  return labels[type] || type
}

function getMovementTypeClass(type) {
  const classes = {
    adjustment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    adjustment_in: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    adjustment_out: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    damaged: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    found: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    purchase: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    sale: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    transfer: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    return: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400'
  }
  return classes[type] || 'bg-slate-100 text-slate-800'
}

function getDifferenceClass(diff) {
  if (diff > 0) return 'text-green-600 dark:text-green-400'
  if (diff < 0) return 'text-red-600 dark:text-red-400'
  return 'text-slate-500'
}

onMounted(loadData)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Stock</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Control de inventario por ubicación</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 w-full">
        <div class="flex gap-2 flex-1">
          <button
            @click="activeTab = 'stock'"
            :class="[
              'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-colors text-sm',
              activeTab === 'stock' 
                ? 'bg-brand-500 hover:bg-brand-600 text-white' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            ]"
          >
            <Warehouse class="w-4 h-4" />
            <span>Stock</span>
          </button>
          <button
            @click="activeTab = 'history'"
            :class="[
              'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-medium transition-colors text-sm',
              activeTab === 'history' 
                ? 'bg-brand-500 hover:bg-brand-600 text-white' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            ]"
          >
            <ClipboardList class="w-4 h-4" />
            <span>Historial</span>
          </button>
        </div>
        <button
          @click="openModal"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors text-sm"
        >
          <RotateCcw class="w-4 h-4" />
          <span>Ajustar Stock</span>
        </button>
      </div>
    </div>

    <!-- TAB: STOCK -->
    <div v-if="activeTab === 'stock'">
      <!-- Filters -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
        <!-- Mobile/Tablet Filter Toggle -->
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

        <!-- Desktop Search Bar (always visible) -->
        <div class="hidden lg:block p-4 border-b border-slate-200 dark:border-slate-800">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por SKU o nombre..."
              class="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
          </div>
        </div>

        <!-- Desktop Filters -->
        <div class="hidden lg:flex flex-wrap gap-3 p-4">
          <select
            v-model="selectedLocation"
            @change="filterByLocation"
            class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option :value="null">Todas las ubicaciones</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }} ({{ loc.code }})</option>
          </select>
        </div>

        <!-- Mobile Filters Panel -->
        <div v-if="showFilters" class="lg:hidden p-4 space-y-3">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar..."
              class="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
          <select
            v-model="selectedLocation"
            @change="filterByLocation"
            class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          >
            <option :value="null">Todas las ubicaciones</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }} ({{ loc.code }})</option>
          </select>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Warehouse class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="text-xs text-slate-500">Total Items</p>
              <p class="text-xl font-bold text-slate-900 dark:text-white">{{ filteredStock.length }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="text-xs text-slate-500">Total Stock</p>
              <p class="text-xl font-bold text-slate-900 dark:text-white">
                {{ filteredStock.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p class="text-xs text-slate-500">Bajo Stock</p>
              <p class="text-xl font-bold text-slate-900 dark:text-white">
                {{ filteredStock.filter(s => parseFloat(s.quantity) <= 0).length }}
              </p>
            </div>
          </div>
        </div>
      </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div v-if="loading" class="p-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
      </div>
      
      <!-- Desktop Table -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SKU</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Producto</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ubicación</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Variación</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cantidad</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Reservado</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">En Tránsito</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="item in filteredStock" :key="item.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td class="px-4 py-3">
                <span class="font-mono text-sm text-slate-600 dark:text-slate-300">{{ item.item_number }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <Package class="w-4 h-4 text-slate-400" />
                  <span class="font-medium text-slate-900 dark:text-white">{{ item.item_name }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <MapPin class="w-3 h-3 text-slate-400" />
                  <span class="text-sm text-slate-600 dark:text-slate-400">{{ item.location_name }} ({{ item.location_code }})</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                <span v-if="item.attributes" class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                  {{ item.attributes ? JSON.stringify(item.attributes) : '-' }}
                </span>
                <span v-else>-</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span :class="getQuantityClass(item.quantity)" class="font-medium">
                  {{ parseFloat(item.quantity || 0).toLocaleString() }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                {{ parseFloat(item.quantity_reserved || 0).toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                {{ parseFloat(item.quantity_in_transit || 0).toLocaleString() }}
              </td>
            </tr>
            <tr v-if="filteredStock.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-slate-400">
                <Package class="w-8 h-8 mx-auto mb-2 opacity-50" />
                No hay stock
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
        <div v-if="filteredStock.length === 0" class="p-8 text-center text-slate-400">
          <Package class="w-8 h-8 mx-auto mb-2 opacity-50" />
          No hay stock
        </div>
        <div
          v-for="item in filteredStock"
          :key="item.id"
          class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <p class="font-mono text-xs text-slate-500">{{ item.item_number }}</p>
              <p class="font-medium text-slate-900 dark:text-white">{{ item.item_name }}</p>
            </div>
            <span :class="getQuantityClass(item.quantity)" class="font-bold text-lg">
              {{ parseFloat(item.quantity || 0).toLocaleString() }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <div>
              <span class="text-slate-400">Ubicación:</span> {{ item.location_name }}
            </div>
            <div>
              <span class="text-slate-400">Reservado:</span> {{ parseFloat(item.quantity_reserved || 0).toLocaleString() }}
            </div>
            <div v-if="item.attributes">
              <span class="text-slate-400">Variación:</span> {{ JSON.stringify(item.attributes) }}
            </div>
          </div>
        </div>
      </div>
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
    </div>
    </div>

    <!-- TAB: HISTORIAL -->
    <div v-if="activeTab === 'history'">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div v-if="loading" class="p-8 flex justify-center">
          <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
        </div>
        
        <!-- Desktop Table -->
        <div class="hidden lg:block overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Fecha</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Producto</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ubicación</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tipo</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Antes</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cambio</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Después</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Notas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="mov in movements" :key="mov.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  {{ new Date(mov.created_at).toLocaleString() }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <Package class="w-4 h-4 text-slate-400" />
                    <span class="font-medium text-slate-900 dark:text-white">{{ mov.item_name }}</span>
                  </div>
                  <span class="text-xs text-slate-500">{{ mov.item_number }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <MapPin class="w-3 h-3 text-slate-400" />
                    <span class="text-sm text-slate-600 dark:text-slate-400">{{ mov.location_name }} ({{ mov.location_code }})</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span :class="getMovementTypeClass(mov.movement_type)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ getMovementTypeLabel(mov.movement_type) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                  {{ parseFloat(mov.quantity_before || 0).toLocaleString() }}
                </td>
                <td class="px-4 py-3 text-right">
                  <span :class="getDifferenceClass(mov.quantity_change)" class="font-medium">
                    {{ mov.quantity_change > 0 ? '+' : '' }}{{ parseFloat(mov.quantity_change || 0).toLocaleString() }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-white">
                  {{ parseFloat(mov.quantity_after || 0).toLocaleString() }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                  {{ mov.notes || '-' }}
                </td>
              </tr>
              <tr v-if="movements.length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-slate-400">
                  <ClipboardList class="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No hay movimientos de inventario
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
          <div v-if="movements.length === 0" class="p-8 text-center text-slate-400">
            <ClipboardList class="w-8 h-8 mx-auto mb-2 opacity-50" />
            No hay movimientos
          </div>
          <div
            v-for="mov in movements"
            :key="mov.id"
            class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <p class="font-medium text-slate-900 dark:text-white">{{ mov.item_name }}</p>
                <p class="text-xs text-slate-500">{{ new Date(mov.created_at).toLocaleString() }}</p>
              </div>
              <span :class="getMovementTypeClass(mov.movement_type)" class="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                {{ getMovementTypeLabel(mov.movement_type) }}
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs mb-2">
              <div class="text-center">
                <p class="text-slate-400">Antes</p>
                <p class="font-medium text-slate-600 dark:text-slate-300">{{ parseFloat(mov.quantity_before || 0).toLocaleString() }}</p>
              </div>
              <div class="text-center">
                <p class="text-slate-400">Cambio</p>
                <p :class="getDifferenceClass(mov.quantity_change)" class="font-bold">
                  {{ mov.quantity_change > 0 ? '+' : '' }}{{ parseFloat(mov.quantity_change || 0).toLocaleString() }}
                </p>
              </div>
              <div class="text-center">
                <p class="text-slate-400">Después</p>
                <p class="font-medium text-slate-900 dark:text-white">{{ parseFloat(mov.quantity_after || 0).toLocaleString() }}</p>
              </div>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              <span class="text-slate-400">Ubicación:</span> {{ mov.location_name }}
            </p>
            <p v-if="mov.notes" class="text-xs text-slate-500 mt-1">{{ mov.notes }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
          <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Ajustar Stock</h2>
            <button @click="closeModal" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>
          <form @submit.prevent="adjustStock" class="p-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Producto *</label>
              <select
                v-model="form.item_id"
                required
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option :value="null" disabled>Seleccionar producto</option>
                <option v-for="item in items" :key="item.id" :value="item.id">
                  {{ item.name }} ({{ item.item_number }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ubicación *</label>
              <select
                v-model="form.location_id"
                required
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option :value="null" disabled>Seleccionar ubicación</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }} ({{ loc.code }})</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Movimiento</label>
              <select
                v-model="form.movement_type"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="adjustment_in">Entrada por ajuste</option>
                <option value="adjustment_out">Salida por ajuste</option>
                <option value="damaged">Dañado</option>
                <option value="lost">Perdido</option>
                <option value="found">Encontrado</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad</label>
              <input
                v-model.number="form.quantity"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div v-if="form.movement_type === 'adjustment_in' || form.movement_type === 'found'">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Costo Unitario
                <span class="text-xs font-normal text-slate-500">(opcional - costo actual: {{ getCurrentCost }})</span>
              </label>
              <input
                v-model="form.unit_cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="Dejar vacío para usar costo actual"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
              <textarea
                v-model="form.notes"
                rows="2"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              ></textarea>
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
                Ajustar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

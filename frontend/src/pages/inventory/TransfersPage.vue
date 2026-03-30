<script setup>
  import { ref, onMounted, computed, watch } from 'vue'
  import { useNotificationStore } from '../../stores/notification.store.js'
  import { useCurrencyStore } from '../../stores/currency.store.js'
  import { useDebounce } from '../../composables/useDebounce.js'
  import { inventoryService, coreService, itemsService } from '../../services/inventory.service.js'
  import AuditInfo from '../../components/AuditInfo.vue'
  import {
    Plus,
    Trash2,
    X,
    Search,
    Loader2,
    ArrowRightLeft,
    Package,
    MapPin,
    Send,
    ArrowDownToLine,
    Save,
    Eye
  } from 'lucide-vue-next'

  const notification = useNotificationStore()
  const currency = useCurrencyStore()

  const transfers = ref([])
  const locations = ref([])
  const items = ref([])
  const loading = ref(false)
  const showModal = ref(false)
  const selectedTransfer = ref(null)
  const searchQuery = ref('')
  const selectedFilter = ref('')
  const saving = ref(false)
  const currentPage = ref(1)
  const pageLimit = ref(20)
  const totalRecords = ref(0)
  const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))

  const { debounced: debouncedSearch } = useDebounce(() => {
    currentPage.value = 1
    loadTransfers()
  }, 300)

  const form = ref({
    from_location_id: '',
    to_location_id: '',
    notes: ''
  })

  const itemForm = ref({
    item_id: '',
    variation_id: null,
    quantity: 1
  })

  const filteredTransfers = computed(() => {
    return transfers.value
  })

  async function loadTransfers() {
    loading.value = true
    try {
      const params = {
        limit: pageLimit.value,
        offset: (currentPage.value - 1) * pageLimit.value,
        search: searchQuery.value,
        status: selectedFilter.value || undefined
      }
      const { data } = await inventoryService.getTransfers(params)
      transfers.value = data.data || []
      totalRecords.value = data.total || 0
    } catch (error) {
      notification.error('Error al cargar transferencias')
    } finally {
      loading.value = false
    }
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      loadTransfers()
    }
  }

  watch(searchQuery, () => {
    debouncedSearch()
  })

  watch(selectedFilter, () => {
    currentPage.value = 1
    loadTransfers()
  })

  async function loadLocations() {
    try {
      const { data } = await coreService.getLocations()
      locations.value = data.data || []
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  async function loadItems() {
    try {
      const { data } = await itemsService.getItems()
      items.value = data.data || []
    } catch (error) {
      console.error('Error loading items:', error)
    }
  }

  async function loadTransferDetails(id) {
    try {
      const { data } = await inventoryService.getTransfer(id)
      selectedTransfer.value = data.data
    } catch (error) {
      notification.error('Error al cargar detalles')
    }
  }

  async function createTransfer() {
    if (!form.value.from_location_id || !form.value.to_location_id) {
      notification.error('Selecciona origen y destino')
      return
    }
    if (form.value.from_location_id === form.value.to_location_id) {
      notification.error('Origen y destino no pueden ser iguales')
      return
    }

    saving.value = true
    try {
      const result = await inventoryService.createTransfer(form.value)
      notification.success('Transferencia creada')

      await loadTransferDetails(result.data.data.id)
      await loadTransfers()

      showModal.value = true
    } catch (error) {
      notification.error(error.response?.data?.message || 'Error al crear transferencia')
    } finally {
      saving.value = false
    }
  }

  async function addItem() {
    if (!selectedTransfer.value || !itemForm.value.item_id) return
    if (parseFloat(itemForm.value.quantity) <= 0) {
      notification.error('Cantidad debe ser mayor a 0')
      return
    }

    try {
      await inventoryService.addTransferItem(selectedTransfer.value.id, {
        transfer_id: selectedTransfer.value.id,
        item_id: itemForm.value.item_id,
        variation_id: itemForm.value.variation_id,
        quantity: itemForm.value.quantity
      })
      notification.success('Item agregado')
      await loadTransferDetails(selectedTransfer.value.id)
      await loadTransfers()
      itemForm.value = { item_id: '', variation_id: null, quantity: 1 }
    } catch (error) {
      notification.error(error.response?.data?.message || 'Error al agregar item')
    }
  }

  async function removeItem(itemId) {
    if (!selectedTransfer.value) return
    window.$confirm(
      '¿Eliminar item de la transferencia?',
      async () => {
        try {
          await inventoryService.removeTransferItem(selectedTransfer.value.id, itemId)
          notification.success('Item eliminado')
          await loadTransferDetails(selectedTransfer.value.id)
          await loadTransfers()
        } catch (error) {
          notification.error('Error al eliminar item')
        }
      },
      { title: 'Eliminar item', type: 'danger', buttonLabel: 'Eliminar' }
    )
  }

  async function shipTransfer() {
    if (!selectedTransfer.value) return
    window.$confirm(
      'El stock se moverá a "en tránsito" en la ubicación de origen.',
      async () => {
        try {
          await inventoryService.shipTransfer(selectedTransfer.value.id)
          notification.success('Transferencia enviada')
          await loadTransferDetails(selectedTransfer.value.id)
          await loadTransfers()
        } catch (error) {
          notification.error(error.response?.data?.message || 'Error al enviar transferencia')
        }
      },
      { title: 'Enviar transferencia', type: 'info', buttonLabel: 'Enviar' }
    )
  }

  async function receiveTransfer() {
    if (!selectedTransfer.value) return
    window.$confirm(
      'El stock se sumará en la ubicación de destino.',
      async () => {
        try {
          await inventoryService.receiveTransfer(selectedTransfer.value.id)
          notification.success('Transferencia recibida')
          await loadTransferDetails(selectedTransfer.value.id)
          await loadTransfers()
        } catch (error) {
          notification.error(error.response?.data?.message || 'Error al recibir transferencia')
        }
      },
      { title: 'Recibir transferencia', type: 'success', buttonLabel: 'Confirmar' }
    )
  }

  async function cancelTransfer() {
    if (!selectedTransfer.value) return
    window.$confirm(
      '¿Cancelar esta transferencia?',
      async () => {
        try {
          await inventoryService.cancelTransfer(selectedTransfer.value.id)
          notification.success('Transferencia cancelada')
          closeModal()
          await loadTransfers()
        } catch (error) {
          notification.error(error.response?.data?.message || 'Error al cancelar transferencia')
        }
      },
      { title: 'Cancelar transferencia', type: 'danger', buttonLabel: 'Cancelar' }
    )
  }

function openModal(transfer = null) {
    if (transfer) {
      loadTransferDetails(transfer.id)
    } else {
      selectedTransfer.value = null
      form.value = { from_location_id: '', to_location_id: '', notes: '' }
    }
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    selectedTransfer.value = null
    form.value = { from_location_id: '', to_location_id: '', notes: '' }
  }

  function getStatusBadge(status) {
    const badges = {
      pending: {
        class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        label: 'Pendiente'
      },
      in_transit: {
        class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'En Tránsito'
      },
      completed: {
        class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        label: 'Completado'
      },
      cancelled: {
        class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        label: 'Cancelado'
      },
      rejected: {
        class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        label: 'Rechazado'
      }
    }
    return badges[status] || badges.pending
  }

  onMounted(() => {
    currency.loadConfig()
    loadTransfers()
    loadLocations()
    loadItems()
  })
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Transferencias</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Mover stock entre ubicaciones</p>
      </div>
      <button
        @click="openModal()"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nueva Transferencia
      </button>
    </div>

    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
      <div class="relative flex-1 min-w-[150px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar..."
          class="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
      </div>
      <select
        v-model="selectedFilter"
        class="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
      >
        <option value="">Todos los estados</option>
        <option value="pending">Pendiente</option>
        <option value="in_transit">En Tránsito</option>
        <option value="completed">Completado</option>
        <option value="cancelled">Cancelado</option>
      </select>
    </div>

    <div
      class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto"
    >
      <div v-if="loading" class="p-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
      </div>
      <table v-else class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Número
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Origen
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Destino
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Items
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Estado
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Fecha
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Acción
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          <tr
            v-for="transfer in filteredTransfers"
            :key="transfer.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">
              {{ transfer.transfer_number }}
            </td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
              <div class="flex items-center gap-2">
                <MapPin class="w-3.5 h-3.5" />
                {{ transfer.from_location_name }}
              </div>
            </td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
              <div class="flex items-center gap-2">
                <MapPin class="w-3.5 h-3.5" />
                {{ transfer.to_location_name }}
              </div>
            </td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
              {{ transfer.total_items || 0 }}
            </td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'px-2 py-0.5 rounded-md text-xs font-medium',
                  getStatusBadge(transfer.status).class
                ]"
              >
                {{ getStatusBadge(transfer.status).label }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500 dark:text-slate-400 text-sm">
              {{ new Date(transfer.created_at).toLocaleDateString() }}
            </td>
            <td class="px-4 py-3 text-right">
              <button
                @click="openModal(transfer)"
                class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Ver detalles"
              >
                <Eye class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!loading && filteredTransfers.length === 0" class="p-8 text-center text-slate-400">
        <ArrowRightLeft class="w-8 h-8 mx-auto mb-2 opacity-50" />
        No hay transferencias
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} transferencia{{ totalRecords !== 1 ? 's' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal"></div>

        <div
          class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-x-auto flex flex-col"
        >
          <div
            class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800"
          >
            <div>
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                {{ selectedTransfer ? selectedTransfer.transfer_number : 'Nueva Transferencia' }}
              </h2>
              <span
                v-if="selectedTransfer"
                :class="[
                  'mt-1 inline-block px-2 py-0.5 rounded-md text-xs font-medium',
                  getStatusBadge(selectedTransfer.status).class
                ]"
              >
                {{ getStatusBadge(selectedTransfer.status).label }}
              </span>
            </div>
            <button
              @click="closeModal"
              class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="flex-1 overflow-auto p-4 space-y-4">
            <template v-if="!selectedTransfer">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >Origen *</label
                  >
                  <select
                    v-model="form.from_location_id"
                    class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                      {{ loc.name }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >Destino *</label
                  >
                  <select
                    v-model="form.to_location_id"
                    class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">Seleccionar...</option>
                    <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                      {{ loc.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >Notas</label
                >
                <textarea
                  v-model="form.notes"
                  rows="2"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                ></textarea>
              </div>
            </template>

            <template v-else>
              <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p class="text-xs text-slate-500 uppercase">Origen</p>
                  <p
                    class="font-medium text-slate-900 dark:text-white flex items-center gap-2 mt-1"
                  >
                    <MapPin class="w-4 h-4" />
                    {{ selectedTransfer.from_location_name }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-slate-500 uppercase">Destino</p>
                  <p
                    class="font-medium text-slate-900 dark:text-white flex items-center gap-2 mt-1"
                  >
                    <MapPin class="w-4 h-4" />
                    {{ selectedTransfer.to_location_name }}
                  </p>
                </div>
              </div>

              <div
                v-if="selectedTransfer.notes"
                class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <p class="text-xs text-slate-500 uppercase">Notas</p>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {{ selectedTransfer.notes }}
                </p>
              </div>

              <AuditInfo
                :created-by="selectedTransfer.created_by_name"
                :created-at="selectedTransfer.created_at"
                :updated-by="selectedTransfer.updated_by_name"
                :updated-at="selectedTransfer.updated_at"
                created-label="Creado por"
                updated-label="Última acción"
              />

              <div>
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-2">Items</h3>

                <div
                  v-if="selectedTransfer.status === 'pending'"
                  class="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                >
                  <p class="text-xs text-slate-500 mb-2">Agregar producto</p>
                  <div class="flex gap-2">
                    <select
                      v-model="itemForm.item_id"
                      class="flex-1 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                    >
                      <option value="">Producto...</option>
                      <option v-for="item in items" :key="item.id" :value="item.id">
                        {{ item.name }} ({{ item.item_number }})
                      </option>
                    </select>
                    <input
                      v-model.number="itemForm.quantity"
                      type="number"
                      min="1"
                      class="w-20 px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center text-slate-900 dark:text-white"
                    />
                    <button
                      @click="addItem"
                      :disabled="!itemForm.item_id"
                      class="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      <Plus class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <div
                    v-for="item in selectedTransfer.items"
                    :key="item.id"
                    class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <Package class="w-4 h-4 text-slate-400" />
                      <div>
                        <p class="font-medium text-slate-900 dark:text-white text-sm">
                          {{ item.item_name }}
                        </p>
                        <p class="text-xs text-slate-500">{{ item.item_number }}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <span
                        class="text-sm font-medium text-slate-900 dark:text-white min-w-[80px] text-right"
                      >
                        {{ currency.formatNumber(item.quantity) }}
                      </span>
                      <button
                        v-if="selectedTransfer.status === 'pending'"
                        @click="removeItem(item.item_id)"
                        class="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="!selectedTransfer.items?.length"
                    class="text-center text-slate-400 py-4 text-sm"
                  >
                    Agrega productos a la transferencia
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div class="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
            <button
              v-if="
                selectedTransfer &&
                selectedTransfer.status !== 'completed' &&
                selectedTransfer.status !== 'cancelled'
              "
              @click="cancelTransfer"
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 text-sm"
            >
              Cancelar
            </button>
            <div v-else></div>

            <div class="flex gap-2">
              <button
                v-if="!selectedTransfer"
                @click="closeModal"
                class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                v-if="!selectedTransfer"
                @click="createTransfer"
                :disabled="saving || !form.from_location_id || !form.to_location_id"
                class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <Save class="w-4 h-4" />
                Crear
              </button>
              <button
                v-if="selectedTransfer?.status === 'pending' && selectedTransfer.items?.length > 0"
                @click="shipTransfer"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 text-sm"
              >
                <Send class="w-4 h-4" />
                Enviar
              </button>
              <button
                v-if="selectedTransfer?.status === 'in_transit'"
                @click="receiveTransfer"
                class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 text-sm"
              >
                <ArrowDownToLine class="w-4 h-4" />
                Recibir
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

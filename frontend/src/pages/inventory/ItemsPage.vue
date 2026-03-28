<script setup>
  import { ref, onMounted, computed, watch } from 'vue'
  import { useNotificationStore } from '../../stores/notification.store.js'
  import { useCurrencyStore } from '../../stores/currency.store.js'
  import { useDebounce } from '../../composables/useDebounce.js'
  import { itemsService, coreService, inventoryService } from '../../services/inventory.service.js'
  import { unitsService } from '../../services/units.service.js'
  import ImageUpload from '../../components/ImageUpload.vue'
  import {
    Plus,
    Pencil,
    Trash2,
    X,
    Package,
    Search,
    Loader2,
    Box,
    AlertTriangle,
    Eye,
    Minus,
    Percent,
    MapPin
  } from 'lucide-vue-next'

  const notification = useNotificationStore()
  const currencyStore = useCurrencyStore()

  const items = ref([])
  const categories = ref([])
  const suppliers = ref([])
  const loading = ref(false)
  const showModal = ref(false)
  const showDetailModal = ref(false)
  const editingId = ref(null)
  const selectedItem = ref(null)
  const searchQuery = ref('')
  const statusFilter = ref('')
  const currentPage = ref(1)
  const pageLimit = ref(20)
  const totalRecords = ref(0)
  const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))
  let categoriesLoaded = false
  let suppliersLoaded = false

  const { debounced: debouncedSearch } = useDebounce(() => {
    currentPage.value = 1
    loadItems()
  }, 300)

  const form = ref({
    item_number: '',
    name: '',
    description: '',
    category_id: null,
    supplier_id: null,
    cost_price: 0,
    unit_price: 0,
    reorder_level: 0,
    reorder_quantity: 0,
    is_serialized: false,
    is_service: false,
    is_kit: false,
    is_variable_sale: false,
    status: 'active',
    kit_components: []
  })

  const kitItems = ref([])
  const newKitComponent = ref({ item_id: null, quantity: 1 })
  
  const allUnits = ref([])
  const itemUnits = ref([])
  const newItemUnit = ref({ unit_id: null })

  const priceHistory = ref([])
  const loadingHistory = ref(false)
  const showHistoryModal = ref(false)

  // Image upload
  const formImageFile = ref(null)
  const formImagePreview = ref('')
  const isUploadingImage = ref(false)

  const priceStep = computed(() => {
    const decimals = currencyStore.decimal_places
    return decimals > 0 ? Math.pow(10, -decimals) : 1
  })

  function formatPriceInput(value) {
    if (value === null || value === undefined || value === '') return ''
    const num = parseFloat(value) || 0
    const decimals = currencyStore.decimal_places
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  function parsePriceInput(value) {
    return parseFloat(value.replace(/,/g, '')) || 0
  }

  function handleCostInput(event) {
    const value = event.target.value.replace(/,/g, '')
    form.value.cost_price = parseFloat(value) || 0
  }

  function handleCostBlur() {
    form.value.cost_price = currencyStore.roundMoney(form.value.cost_price)
    calculatePriceFromMargin()
  }

  function handlePriceInput(event) {
    const value = event.target.value.replace(/,/g, '')
    form.value.unit_price = parseFloat(value) || 0
    onUnitPriceInput()
  }

  function handlePriceBlur() {
    form.value.unit_price = currencyStore.roundMoney(form.value.unit_price)
    onUnitPriceInput()
  }

  function selectAllInput(event) {
    event.target.select()
  }

  const kitStockInfo = computed(() => {
    if (!form.value.is_kit || !form.value.kit_components?.length) {
      return { available: 0, canCreate: false, details: [] }
    }

    const details = []
    let minStock = Infinity

    for (const comp of form.value.kit_components) {
      const item = items.value.find((i) => i.id === comp.item_id)
      const stock = item?.total_quantity || 0
      const needed = comp.quantity
      const available = Math.floor(stock / needed)

      details.push({
        name: comp.item_name,
        stock,
        needed,
        available
      })

      if (available < minStock) {
        minStock = available
      }
    }

    const canCreate = minStock > 0

    return {
      available: minStock === Infinity ? 0 : minStock,
      canCreate,
      details
    }
  })

  const filteredItems = computed(() => {
    return items.value
  })

  async function loadLookups() {
    try {
      const promises = []
      
      if (!categoriesLoaded) {
        promises.push(coreService.getCategories().then(res => {
          categories.value = res.data.data || []
          categoriesLoaded = true
        }))
      }
      
      if (!suppliersLoaded) {
        promises.push(coreService.getSuppliers().then(res => {
          suppliers.value = res.data.data || []
          suppliersLoaded = true
        }))
      }
      
      if (promises.length > 0) {
        await Promise.all(promises)
      }
    } catch (error) {
      console.error('Error loading lookups:', error)
    }
  }

  async function loadItems() {
    loading.value = true
    try {
      const params = {
        limit: pageLimit.value,
        offset: (currentPage.value - 1) * pageLimit.value,
        search: searchQuery.value,
        status: statusFilter.value
      }
      const { data } = await itemsService.getItems(params)
      items.value = data.data || []
      totalRecords.value = data.total || 0
      kitItems.value = items.value.filter((i) => !i.is_kit && i.status === 'active')
    } catch (error) {
      notification.error('Error al cargar productos')
    } finally {
      loading.value = false
    }
  }

  async function loadData() {
    await loadLookups()
    await loadItems()
  }

  async function loadPriceHistory(itemId) {
    loadingHistory.value = true
    try {
      const { data } = await itemsService.getPriceHistory(itemId)
      priceHistory.value = data.data || []
    } catch (error) {
      console.error('Error loading price history:', error)
    } finally {
      loadingHistory.value = false
    }
  }

  function openHistoryModal(itemId) {
    loadPriceHistory(itemId)
    showHistoryModal.value = true
  }

  function closeHistoryModal() {
    showHistoryModal.value = false
    priceHistory.value = []
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      loadItems()
    }
  }

  watch(searchQuery, () => {
    debouncedSearch()
  })

  watch(statusFilter, () => {
    currentPage.value = 1
    loadItems()
  })

  async function openModal(item = null) {
    isLoadingKit.value = true
    
    if (item) {
      editingId.value = item.id

      let components = item.kit_components || []
      if (components.length > 0) {
        components = components.map((comp) => {
          const fullItem = items.value.find((i) => i.id === comp.item_id)
          return {
            ...comp,
            cost_price: fullItem?.cost_price || 0,
            unit_price: fullItem?.unit_price || 0,
            item_name: fullItem?.name || comp.item_name || ''
          }
        })
      }

      userModifiedPrice.value = false

      form.value = {
        ...item,
        cost_price: currencyStore.roundMoney(item.cost_price),
        unit_price: currencyStore.roundMoney(item.unit_price),
        is_serialized: Boolean(item.is_serialized),
        is_service: Boolean(item.is_service),
        is_kit: Boolean(item.is_kit),
        is_variable_sale: Boolean(item.is_variable_sale),
        kit_components: components
      }

      // Set existing image preview
      formImagePreview.value = item.image_url || ''

      if (components.length > 0) {
        recalculateKitPrices()
      }

      const cost = form.value.cost_price || 0
      const price = form.value.unit_price || 0
      if (cost > 0 && price > cost) {
        profitMargin.value = parseFloat(((price - cost) / price * 100).toFixed(2))
      } else if (cost > 0 && price > 0) {
        profitMargin.value = 0
      }

      await loadItemUnits(item.id)
      isLoadingKit.value = false
    } else {
      editingId.value = null
      resetUserModifiedPrice()
      form.value = {
        item_number: '',
        name: '',
        description: '',
        category_id: null,
        supplier_id: null,
        cost_price: 0,
        unit_price: 0,
        reorder_level: 0,
        reorder_quantity: 0,
        is_serialized: false,
        is_service: false,
        is_kit: false,
        is_variable_sale: false,
        status: 'active',
        kit_components: []
      }
      itemUnits.value = []
      isLoadingKit.value = false
      // Reset image fields for new item
      formImageFile.value = null
      formImagePreview.value = ''
    }
    newKitComponent.value = { item_id: null, quantity: 1 }
    showModal.value = true
  }

  async function loadItemUnits(itemId) {
    try {
      const { data } = await unitsService.getItemUnits(itemId)
      itemUnits.value = data.data || []
    } catch (error) {
      console.error('Error loading item units:', error)
      itemUnits.value = []
    }
  }

  function addKitComponent() {
    if (!newKitComponent.value.item_id || newKitComponent.value.quantity < 1) {
      notification.error('Selecciona un producto y cantidad válida')
      return
    }

    const exists = form.value.kit_components.find(
      (c) => c.item_id === newKitComponent.value.item_id
    )
    if (exists) {
      notification.error('El producto ya está en el kit')
      return
    }

    const selectedItem = items.value.find((i) => i.id === newKitComponent.value.item_id)
    if (!selectedItem) {
      notification.error('Producto no encontrado')
      return
    }

    const componentData = {
      item_id: newKitComponent.value.item_id,
      quantity: newKitComponent.value.quantity,
      item_name: selectedItem.name || '',
      item_number: selectedItem.item_number || '',
      cost_price: parseFloat(selectedItem.cost_price) || 0,
      unit_price: parseFloat(selectedItem.unit_price) || 0
    }

    form.value.kit_components.push(componentData)

    recalculateKitPrices()

    newKitComponent.value = { item_id: null, quantity: 1 }
  }

  function removeKitComponent(index) {
    form.value.kit_components.splice(index, 1)
    recalculateKitPrices()
  }

  async function addItemUnit() {
    if (!newItemUnit.value.unit_id) {
      notification.error('Selecciona una unidad')
      return
    }

    const exists = itemUnits.value.find(u => u.unit_id === newItemUnit.value.unit_id)
    if (exists) {
      notification.error('Esta unidad ya está agregada')
      return
    }

    try {
      const { data } = await unitsService.createItemUnit({
        item_id: editingId.value,
        unit_id: newItemUnit.value.unit_id,
        is_default: itemUnits.value.length === 0
      })

      itemUnits.value = data.data || []
      notification.success('Unidad agregada')

      newItemUnit.value = { unit_id: null }
    } catch (error) {
      notification.error(error.response?.data?.message || 'Error al agregar unidad')
    }
  }

  async function deleteItemUnit(itemUnitId) {
    if (!confirm('¿Eliminar esta unidad?')) return

    try {
      const { data } = await unitsService.deleteItemUnit(itemUnitId)
      itemUnits.value = data.data || []
      notification.success('Unidad eliminada')
    } catch (error) {
      notification.error(error.response?.data?.message || 'Error al eliminar unidad')
    }
  }

  async function setDefaultUnit(itemUnitId) {
    try {
      const { data } = await unitsService.updateItemUnit(itemUnitId, { is_default: true })
      itemUnits.value = data.data || []
      notification.success('Unidad por defecto actualizada')
    } catch (error) {
      notification.error(error.response?.data?.message || 'Error al actualizar')
    }
  }

  const userModifiedPrice = ref(false)
  const profitMargin = ref(0)
  const isLoadingKit = ref(false)

  watch(
    () => form.value.kit_components,
    (newComponents) => {
      if (form.value.is_kit && newComponents?.length > 0 && !isLoadingKit.value) {
        recalculateKitPrices()
      }
    },
    { deep: true }
  )

  function recalculateKitPrices() {
    const components = form.value.kit_components
    if (!components || components.length === 0) return

    let totalCost = 0
    let totalPrice = 0
    for (const comp of components) {
      totalCost += (parseFloat(comp.cost_price) || 0) * comp.quantity
      totalPrice += (parseFloat(comp.unit_price) || 0) * comp.quantity
    }
    form.value.cost_price = currencyStore.roundMoney(totalCost)

    if (!userModifiedPrice.value) {
      form.value.unit_price = currencyStore.roundMoney(totalPrice)
    }
  }

  function calculatePriceFromMargin() {
    if (form.value.cost_price > 0 && profitMargin.value >= 0 && profitMargin.value < 100) {
      form.value.unit_price = currencyStore.roundMoney(form.value.cost_price / (1 - profitMargin.value / 100))
      userModifiedPrice.value = true
    }
  }

  function onUnitPriceInput() {
    userModifiedPrice.value = true
    const cost = form.value.cost_price || 0
    const price = form.value.unit_price || 0
    if (cost > 0 && price > cost) {
      profitMargin.value = parseFloat(((price - cost) / price * 100).toFixed(2))
    } else if (cost > 0 && price > 0) {
      profitMargin.value = 0
    }
  }

  function resetUserModifiedPrice() {
    userModifiedPrice.value = false
    profitMargin.value = 0
  }

  function closeModal() {
    showModal.value = false
    editingId.value = null
    // Reset image fields
    formImageFile.value = null
    formImagePreview.value = ''
  }

  async function viewItem(item) {
    try {
      const { data } = await itemsService.getItem(item.id)
      selectedItem.value = data.data
      showDetailModal.value = true
    } catch (error) {
      notification.error('Error al cargar detalles')
    }
  }

  function closeDetailModal() {
    showDetailModal.value = false
    selectedItem.value = null
  }

  async function saveItem() {
    if (!form.value.name || !form.value.name.trim()) {
      notification.error('El nombre del producto es requerido')
      return
    }

    if (form.value.is_kit && form.value.kit_components?.length > 0) {
      if (!kitStockInfo.value.canCreate) {
        const outOfStock = kitStockInfo.value.details
          .filter((d) => d.available === 0)
          .map((d) => d.name)
          .join(', ')
        notification.error(`No hay stock disponible de: ${outOfStock}`)
        return
      }
    }

    const payload = {
      ...form.value,
      cost_price: currencyStore.roundMoney(form.value.cost_price),
      unit_price: currencyStore.roundMoney(form.value.unit_price)
    }
    
    // Use existing image preview URL if no new file uploaded
    if (formImagePreview.value && !formImageFile.value) {
      payload.image_url = formImagePreview.value
    }

    try {
      let itemId = editingId.value

      if (editingId.value) {
        await itemsService.updateItem(editingId.value, payload)
        notification.success('Producto actualizado')
      } else {
        const response = await itemsService.createItem(payload)
        itemId = response.data.data?.id
        notification.success('Producto creado')
      }

      // Upload image if there's a new file selected
      if (formImageFile.value && itemId) {
        isUploadingImage.value = true
        const fileName = formImageFile.value.name  // Capture filename before async
        try {
          const reader = new FileReader()
          reader.onload = async (e) => {
            const base64 = e.target.result
            await itemsService.uploadItemImage(itemId, {
              image: base64,
              fileName: fileName
            })
            isUploadingImage.value = false
          }
          reader.onerror = () => {
            isUploadingImage.value = false
          }
          reader.readAsDataURL(formImageFile.value)
        } catch (imgError) {
          console.error('Error uploading image:', imgError)
          isUploadingImage.value = false
        }
      }

      closeModal()
      loadData()
    } catch (error) {
      notification.error(error.response?.data?.message || 'Error al guardar')
    }
  }

  async function deleteItem(id) {
    window.$confirm(
      '¿Está seguro de eliminar este producto?',
      async () => {
        try {
          await itemsService.deleteItem(id)
          notification.success('Producto eliminado')
          loadData()
        } catch (error) {
          notification.error('Error al eliminar')
        }
      },
      { type: 'danger', title: 'Eliminar Producto', buttonLabel: 'Eliminar' }
    )
  }

  function getStatusClass(status) {
    const classes = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      discontinued: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
    return classes[status] || classes.active
  }

  function formatPrice(price) {
    return currencyStore.formatMoney(price)
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getProfitMargin(item) {
    const cost = parseFloat(item.cost_price) || 0
    const price = parseFloat(item.unit_price) || 0
    if (cost > 0 && price > cost) {
      return ((price - cost) / price * 100).toFixed(2) + '%'
    }
    return '0%'
  }

  function getVariationStock(variationId) {
    if (!selectedItem.value?.stock) return currencyStore.formatNumber(0)
    const stockItem = selectedItem.value.stock.find(s => s.variation_id === variationId)
    return currencyStore.formatNumber(parseFloat(stockItem?.quantity) || 0)
  }

  onMounted(async () => {
    await currencyStore.loadConfig()
    await loadUnits()
    loadData()
  })

  async function loadUnits() {
    try {
      const { data } = await unitsService.getAll()
      allUnits.value = data.data || []
    } catch (error) {
      console.error('Error loading units:', error)
    }
  }
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Productos</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestión de inventario</p>
      </div>
      <button
        @click="openModal()"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nuevo Producto
      </button>
    </div>

    <!-- Search -->
    <div class="flex flex-wrap gap-4 mb-4">
      <div class="flex-1 min-w-[200px] relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar productos..."
          class="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
      </div>
      <select
        v-model="statusFilter"
        class="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
      >
        <option value="">Todos los estados</option>
        <option value="active">Activo</option>
        <option value="inactive">Inactivo</option>
        <option value="discontinued">Descontinuado</option>
      </select>
    </div>

    <!-- Table -->
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
    >
      <div v-if="loading" class="p-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
      </div>
      <table v-else class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th
              class="px-2 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              SKU
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Imagen
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Producto
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Categoría
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Costo
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Precio
            </th>
            <th
              class="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Stock
            </th>
            <th
              class="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Estado
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr
            v-for="item in filteredItems"
            :key="item.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <td class="px-4 py-3">
              <span class="font-mono text-sm text-slate-600 dark:text-slate-300">{{
                item.item_number
              }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                  @error="item.image_url = null"
                />
                <Package v-else class="w-5 h-5 text-slate-400" />
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <Package v-if="!item.is_kit" class="w-4 h-4 text-slate-400" />
                <Box v-else class="w-4 h-4 text-brand-500" />
                <span class="font-medium text-slate-900 dark:text-white">{{ item.name }}</span>
              </div>
              <div class="flex gap-1 mt-1">
                <span
                  v-if="item.is_kit"
                  class="px-1.5 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 rounded text-[10px] font-medium"
                >
                  Kit
                </span>
                <span
                  v-if="item.is_serialized"
                  class="px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-medium"
                  >Serializado</span
                >
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
              {{ item.category_name || '-' }}
            </td>
            <td class="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
              {{ formatPrice(item.cost_price) }}
            </td>
            <td class="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-white">
              {{ formatPrice(item.unit_price) }}
            </td>
            <td class="px-4 py-3 text-center">
              <div v-if="item.is_kit" class="flex flex-col items-center">
                <span
                  :class="
                    (item.total_quantity || 0) <= item.reorder_level
                      ? 'text-red-500'
                      : 'text-green-500'
                  "
                  class="font-medium text-lg"
                >
                  {{ Number(item.total_quantity || 0).toFixed(2) }}
                </span>
                <span class="text-[10px] text-slate-400">kits</span>
              </div>
              <span
                v-else
                :class="
                  (item.total_quantity || 0) <= item.reorder_level
                    ? 'text-red-500'
                    : 'text-green-500'
                "
                class="font-medium"
              >
                {{ Number(item.total_quantity || 0).toFixed(2) }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <span
                :class="getStatusClass(item.status)"
                class="px-2 py-0.5 rounded-md text-xs font-medium capitalize"
              >
                {{ item.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  @click="viewItem(item)"
                  class="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <button
                  @click="openModal(item)"
                  class="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  @click="deleteItem(item.id)"
                  class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredItems.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-slate-400">
              <Box class="w-8 h-8 mx-auto mb-2 opacity-50" />
              No hay productos
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} producto{{ totalRecords !== 1 ? 's' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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

    <!-- Modal Create/Edit -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal"></div>
        <div
          class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div
            class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800"
          >
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ editingId ? 'Editar' : 'Nuevo' }} Producto
            </h2>
            <button
              @click="closeModal"
              class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <form @submit.prevent="saveItem" class="p-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >SKU</label
                >
                <input
                  v-model="form.item_number"
                  type="text"
                  placeholder="Auto-generado si vacío"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >Nombre *</label
                >
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >Descripción</label
              >
              <textarea
                v-model="form.description"
                rows="2"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              ></textarea>
            </div>
            
            <!-- Image Upload -->
            <ImageUpload
              v-model="formImageFile"
              :preview-url="formImagePreview"
              @update:preview-url="formImagePreview = $event"
              label="Imagen del producto"
            />
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >Categoría</label
                >
                <select
                  v-model="form.category_id"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <option :value="null">Sin categoría</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >Proveedor</label
                >
                <select
                  v-model="form.supplier_id"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <option :value="null">Sin proveedor</option>
                  <option v-for="sup in suppliers" :key="sup.id" :value="sup.id">
                    {{ sup.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Costo
                  <span
                    v-if="form.is_kit && form.kit_components?.length > 0"
                    class="text-xs font-normal text-green-600"
                    >(auto)</span
                  >
                </label>
                <div class="relative">
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 text-sm font-medium"
                  >
                    {{ currencyStore.currency_symbol }}
                  </span>
                  <input
                    :value="currencyStore.roundMoney(form.cost_price)"
                    @input="handleCostInput"
                    @focus="selectAllInput"
                    @blur="handleCostBlur"
                    type="number"
                    :step="priceStep"
                    min="0"
                    :disabled="form.is_kit && form.kit_components?.length > 0"
                    :class="
                      form.is_kit && form.kit_components?.length > 0
                        ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
                        : ''
                    "
                    class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  % Ganancia
                </label>
                <div class="relative">
                  <Percent
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  />
                  <input
                    v-model.number="profitMargin"
                    @input="calculatePriceFromMargin"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Precio Venta
                  <span
                    v-if="form.is_kit && form.kit_components?.length > 0 && !userModifiedPrice"
                    class="text-xs font-normal text-green-600"
                    >(auto)</span
                  >
                </label>
                <div class="relative">
                  <span
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 text-sm font-medium"
                  >
                    {{ currencyStore.currency_symbol }}
                  </span>
                  <input
                    :value="currencyStore.roundMoney(form.unit_price)"
                    @input="handlePriceInput"
                    @focus="selectAllInput"
                    @blur="handlePriceBlur"
                    type="number"
                    :step="priceStep"
                    min="0"
                    class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Stock Minimo
                  <span class="text-xs font-normal text-slate-500">(Stock mínimo para alerta)</span>
                </label>
                <input
                  v-model.number="form.reorder_level"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cantidad Sugerida
                  <span class="text-xs font-normal text-slate-500"
                    >(Cantidad sugerida al pedir)</span
                  >
                </label>
                <input
                  v-model.number="form.reorder_quantity"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  v-model="form.is_serialized"
                  type="checkbox"
                  class="w-4 h-4 text-brand-500 rounded"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300"
                  >Serializado
                  <span class="text-xs text-slate-400 block">(requiere número serie)</span></span
                >
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  v-model="form.is_service"
                  type="checkbox"
                  class="w-4 h-4 text-brand-500 rounded"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300"
                  >Servicio <span class="text-xs text-slate-400 block">(sin stock físico)</span></span
                >
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  v-model="form.is_kit"
                  type="checkbox"
                  class="w-4 h-4 text-brand-500 rounded"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300"
                  >Kit/Paquete
                  <span class="text-xs text-slate-400 block">(conjunto de productos)</span></span
                >
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" :class="{ 'opacity-50': form.is_kit }">
                <input
                  v-model="form.is_variable_sale"
                  type="checkbox"
                  class="w-4 h-4 text-brand-500 rounded"
                  :disabled="form.is_kit"
                />
                <span class="text-sm text-slate-700 dark:text-slate-300"
                  >Venta Variada
                  <span class="text-xs text-slate-400 block">(por peso/cantidad variable)</span></span
                >
              </label>
            </div>

            <!-- Componentes del Kit -->
            <div
              v-if="form.is_kit"
              class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
            >
              <h4 class="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <Package class="w-4 h-4" />
                Componentes del Kit
              </h4>
              <p class="text-xs text-slate-500">
                Selecciona los productos que forman parte de este kit
              </p>

              <div class="flex gap-2">
                <select
                  v-model="newKitComponent.item_id"
                  class="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <option :value="null">Seleccionar producto...</option>
                  <option
                    v-for="item in kitItems"
                    :key="item.id"
                    :value="item.id"
                    :disabled="form.kit_components.some((c) => c.item_id === item.id)"
                  >
                    {{ item.name }} ({{ item.item_number }})
                  </option>
                </select>
                <input
                  v-model.number="newKitComponent.quantity"
                  type="number"
                  min="1"
                  class="w-20 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <button
                  type="button"
                  @click="addKitComponent"
                  class="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>

              <div v-if="form.kit_components.length > 0" class="space-y-2 mt-3">
                <div
                  v-for="(comp, index) in form.kit_components"
                  :key="comp.item_id"
                  class="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <Box class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-700 dark:text-slate-300">{{
                      comp.item_name
                    }}</span>
                    <span class="text-xs text-slate-400">x{{ comp.quantity }}</span>
                    <span class="text-xs text-green-600">
                      (${{ (comp.cost_price * comp.quantity).toFixed(2) }} / ${{
                        (comp.unit_price * comp.quantity).toFixed(2)
                      }})
                    </span>
                  </div>
                  <button
                    type="button"
                    @click="removeKitComponent(index)"
                    class="text-red-500 hover:text-red-600"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div class="text-xs text-slate-500 text-right pt-2">
                  Costo total:
                  <span class="font-medium">${{ form.cost_price?.toFixed(2) || '0.00' }}</span> |
                  Precio venta:
                  <span class="font-medium text-green-600"
                    >${{ form.unit_price?.toFixed(2) || '0.00' }}</span
                  >
                </div>
              </div>

              <p v-else class="text-xs text-slate-400 text-center py-2">
                No hay componentes agregados
              </p>
            </div>

            <div class="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Unidades de Medida
              </label>

              <div class="flex gap-2 mb-3">
                <select
                  v-model="newItemUnit.unit_id"
                  class="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm"
                >
                  <option :value="null">Seleccionar unidad...</option>
                  <option
                    v-for="unit in allUnits.filter(u => !itemUnits.find(iu => iu.unit_id === u.id))"
                    :key="unit.id"
                    :value="unit.id"
                  >
                    {{ unit.name }} ({{ unit.abbreviation }})
                  </option>
                </select>
                <button
                  type="button"
                  @click="addItemUnit"
                  class="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>

              <div v-if="itemUnits.length > 0" class="space-y-2">
                <div
                  v-for="itemUnit in itemUnits"
                  :key="itemUnit.id"
                  class="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <span
                      v-if="itemUnit.is_default"
                      class="text-[10px] bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded"
                    >
                      Default
                    </span>
                    <span class="text-sm text-slate-700 dark:text-slate-300">
                      {{ itemUnit.unit_name }} ({{ itemUnit.unit_abbreviation }})
                    </span>
                    <span class="text-xs text-slate-400">
                      {{ itemUnit.conversion_factor }} {{ itemUnit.unit_type }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      v-if="!itemUnit.is_default"
                      type="button"
                      @click="setDefaultUnit(itemUnit.id)"
                      class="text-xs text-brand-500 hover:text-brand-600"
                    >
                      Marcar default
                    </button>
                    <button
                      type="button"
                      @click="deleteItemUnit(itemUnit.id)"
                      class="text-red-500 hover:text-red-600"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <p v-else class="text-xs text-slate-400 text-center py-2">
                No hay unidades agregadas. Agrega al menos una unidad para vender el producto.
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >Estado</label
              >
              <select
                v-model="form.status"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="discontinued">Descontinuado</option>
              </select>
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

    <!-- Modal Detail -->
    <Teleport to="body">
      <div
        v-if="showDetailModal && selectedItem"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeDetailModal"></div>
        <div
          class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div
            class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-brand-500 to-brand-600"
          >
            <div>
              <h2 class="text-xl font-bold text-white">
                {{ selectedItem.name }}
              </h2>
              <p class="text-sm text-brand-100">SKU: {{ selectedItem.item_number || 'N/A' }}</p>
            </div>
            <button
              @click="closeDetailModal"
              class="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 space-y-6">
            <!-- Info Row -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Categoría</p>
                <p class="font-medium text-slate-900 dark:text-white">{{ selectedItem.category_name || '-' }}</p>
              </div>
              <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Proveedor</p>
                <p class="font-medium text-slate-900 dark:text-white">{{ selectedItem.supplier_name || '-' }}</p>
              </div>
            </div>

            <!-- Prices -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                <p class="text-xs text-blue-600 dark:text-blue-400 mb-1">Costo</p>
                <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ formatPrice(selectedItem.cost_price) }}</p>
              </div>
              <div class="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-100 dark:border-green-800">
                <p class="text-xs text-green-600 dark:text-green-400 mb-1">Precio Venta</p>
                <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ formatPrice(selectedItem.unit_price) }}</p>
              </div>
            </div>

            <!-- Profit Margin -->
            <div class="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-100 dark:border-purple-800">
              <p class="text-xs text-purple-600 dark:text-purple-400 mb-1">Ganancia</p>
              <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ getProfitMargin(selectedItem) }}</p>
            </div>

            <!-- Price History Button -->
            <div class="text-center">
              <button
                @click="openHistoryModal(selectedItem.id)"
                class="px-4 py-2 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
              >
                Ver historial de precios
              </button>
            </div>

            <!-- Status -->
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span class="text-sm text-slate-600 dark:text-slate-300">Estado</span>
              <span
                :class="getStatusClass(selectedItem.status)"
                class="px-3 py-1 rounded-full text-sm font-medium capitalize"
              >
                {{ selectedItem.status }}
              </span>
            </div>

            <!-- Stock -->
            <div>
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Stock</p>
              <!-- Kit Stock -->
              <div v-if="selectedItem.is_kit" class="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-center">
                <p class="text-xs text-amber-600 dark:text-amber-400 mb-1">Stock disponible para Kits</p>
                <p class="text-2xl font-bold text-amber-700 dark:text-amber-300">{{ currencyStore.formatNumber(selectedItem.total_quantity || 0) }}</p>
                <p v-if="selectedItem.kit_components?.length" class="text-xs text-amber-500 dark:text-amber-500 mt-2">
                  ({{ selectedItem.kit_components.length }} componentes)
                </p>
              </div>
              <!-- Regular Stock -->
              <div v-else-if="selectedItem.stock?.length" class="space-y-2">
                <div
                  v-for="s in selectedItem.stock"
                  :key="s.id"
                  class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg"
                >
                  <div class="flex items-center gap-2">
                    <MapPin class="w-4 h-4 text-slate-400" />
                    <span class="text-sm text-slate-600 dark:text-slate-300"
                      >{{ s.location_name }} ({{ s.location_code }})</span
                    >
                  </div>
                  <span class="font-bold text-slate-900 dark:text-white">{{ currencyStore.formatNumber(parseFloat(s.quantity) || 0) }}</span>
                </div>
                <div class="mt-3 p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg flex justify-between">
                  <span class="font-medium text-brand-700 dark:text-brand-300">Total Stock</span>
                  <span class="font-bold text-brand-700 dark:text-brand-300">{{ currencyStore.formatNumber(selectedItem.stock.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0)) }}</span>
                </div>
              </div>
              <div v-else class="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-center">
                <p class="text-slate-500 dark:text-slate-400">Sin stock disponible</p>
              </div>
            </div>

            <!-- Variations -->
            <div v-if="selectedItem.variations?.length">
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Variaciones</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div
                  v-for="variation in selectedItem.variations"
                  :key="variation.id"
                  class="p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 rounded-lg"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-medium text-purple-700 dark:text-purple-300">{{ variation.sku }}</p>
                      <p class="text-sm text-purple-600 dark:text-purple-400">{{ formatPrice(variation.unit_price) }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-purple-500 dark:text-purple-400">Stock</p>
                      <p class="font-bold text-purple-700 dark:text-purple-300">{{ getVariationStock(variation.id) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Price History -->
    <Teleport to="body">
      <div v-if="showHistoryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeHistoryModal"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Historial de Precios</h3>
            <button @click="closeHistoryModal" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-4 overflow-y-auto max-h-[60vh]">
            <div v-if="loadingHistory" class="flex justify-center py-8">
              <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
            </div>
            <div v-else-if="priceHistory.length === 0" class="text-center py-8 text-slate-500">
              No hay cambios de precio registrados
            </div>
            <table v-else class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Costo Antes</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Costo Después</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Precio Antes</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Precio Después</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Usuario</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                <tr v-for="h in priceHistory" :key="h.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td class="px-3 py-2 text-slate-600 dark:text-slate-400">{{ formatDateTime(h.created_at) }}</td>
                  <td class="px-3 py-2 text-right text-blue-600">{{ formatPrice(h.cost_price_before) }}</td>
                  <td class="px-3 py-2 text-right text-blue-700 font-medium">{{ formatPrice(h.cost_price_after) }}</td>
                  <td class="px-3 py-2 text-right text-green-600">{{ formatPrice(h.unit_price_before) }}</td>
                  <td class="px-3 py-2 text-right text-green-700 font-medium">{{ formatPrice(h.unit_price_after) }}</td>
                  <td class="px-3 py-2 text-slate-600 dark:text-slate-400">{{ h.created_by_name || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

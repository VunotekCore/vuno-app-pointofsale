<script setup>
  import { ref, onMounted, computed, watch, nextTick } from 'vue'
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
  const identityRef = ref(null)
  const imageCardRef = ref(null)

  watch(
    () => showModal.value,
    async (val) => {
      if (val) {
        await nextTick()
        if (identityRef.value && imageCardRef.value) {
          const h = identityRef.value.offsetHeight
          if (h > 0) imageCardRef.value.style.height = `${h}px`
        }
      }
    }
  )
  const searchQuery = ref('')
const statusFilter = ref('')
const showFilters = ref(false)
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
    tracks_expiration: false,
    status: 'active',
    initial_quantity: 0,
    kit_components: []
  })

  const kitItems = ref([])
  const newKitComponent = ref({ item_id: null, quantity: 1 })
  
  const allUnits = ref([])
  const itemUnits = ref([])
  const newItemUnit = ref({ unit_id: null })
  const pendingItemUnits = ref([]) // For new items before they are created

  const priceHistory = ref([])
  const loadingHistory = ref(false)
  const showHistoryModal = ref(false)
  const showUnitModal = ref(false)
  
  // Image upload
  const formImageFile = ref(null)
  const formImagePreview = ref('')
  const isUploadingImage = ref(false)

  const priceStep = computed(() => {
    const decimals = currencyStore.decimal_places
    return decimals > 0 ? Math.pow(10, -decimals) : 1
  })

  // Combine pending and existing units for display
  const displayUnits = computed(() => {
    if (!editingId.value) {
      return pendingItemUnits.value
    }
    return itemUnits.value
  })

  // Available units for adding (excluding already added)
  const availableUnits = computed(() => {
    const addedUnitIds = displayUnits.value.map(u => u.unit_id || u.id)
    return allUnits.value.filter(u => !addedUnitIds.includes(u.id))
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
        tracks_expiration: Boolean(item.tracks_expiration),
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
        tracks_expiration: false,
        status: 'active',
        kit_components: []
      }
      itemUnits.value = []
      pendingItemUnits.value = []

      // Auto-add "unidad (und)" by default for new items
      const defaultUnit = allUnits.value.find(u => u.abbreviation === 'und' || u.name.toLowerCase().includes('unidad'))
      if (defaultUnit && pendingItemUnits.value.length === 0) {
        pendingItemUnits.value.push({
          unit_id: defaultUnit.id,
          unit_name: defaultUnit.name,
          unit_abbreviation: defaultUnit.abbreviation,
          conversion_factor: 1,
          unit_type: defaultUnit.type || 'unit',
          is_default: true
        })
      }

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

  function addItemUnit() {
    if (!newItemUnit.value.unit_id) {
      notification.error('Selecciona una unidad')
      return
    }

    // Check if simple product already has a unit (max 1)
    if (!form.value.is_variable_sale && displayUnits.value.length >= 1) {
      notification.error('Los productos simples solo pueden tener 1 unidad. Activa "Venta Variada" para múltiples.')
      return
    }

    // Check in existing units (for editing)
    const existsInExisting = itemUnits.value.find(u => u.unit_id === newItemUnit.value.unit_id)
    if (existsInExisting) {
      notification.error('Esta unidad ya está agregada')
      return
    }

    // Check in pending units (for new item)
    const existsInPending = pendingItemUnits.value.find(u => u.unit_id === newItemUnit.value.unit_id)
    if (existsInPending) {
      notification.error('Esta unidad ya está agregada')
      return
    }

    // Find the unit details
    const unit = allUnits.value.find(u => u.id === newItemUnit.value.unit_id)
    if (!unit) return

    // Add to pending list (for new items) or API (for existing items)
    if (!editingId.value) {
      pendingItemUnits.value.push({
        unit_id: newItemUnit.value.unit_id,
        unit_name: unit.name,
        unit_abbreviation: unit.abbreviation,
        conversion_factor: 1,
        unit_type: unit.type || 'unit',
        is_default: pendingItemUnits.value.length === 0
      })
      notification.success('Unidad agregada')
      newItemUnit.value = { unit_id: null }
    } else {
      // For existing items, call API
      createItemUnitAPI(newItemUnit.value.unit_id)
    }
  }

  function addUnitAndClose() {
    const unitIdToAdd = newItemUnit.value.unit_id
    if (!unitIdToAdd) return

    addItemUnit()

    // Close modal only if unit was successfully added (unit_id reset to null = success)
    if (newItemUnit.value.unit_id === null) {
      showUnitModal.value = false
    }
  }

  async function createItemUnitAPI(unitId) {
    try {
      const { data } = await unitsService.createItemUnit({
        item_id: editingId.value,
        unit_id: unitId,
        is_default: itemUnits.value.length === 0
      })

      itemUnits.value = data.data || []
      notification.success('Unidad agregada')

      newItemUnit.value = { unit_id: null }
    } catch (error) {
      notification.error(error.response?.data?.message || 'Error al agregar unidad')
    }
  }

  function deleteItemUnit(itemUnitId) {
    window.$confirm(
      '¿Eliminar esta unidad?',
      () => {
        // For pending units (new items)
        if (!editingId.value) {
          pendingItemUnits.value = pendingItemUnits.value.filter(u => u.unit_id !== itemUnitId)
          notification.success('Unidad eliminada')
          return
        }

        // For existing items, call API
        deleteItemUnitAPI(itemUnitId)
      }
    )
  }

  async function deleteItemUnitAPI(itemUnitId) {
    try {
      const { data } = await unitsService.deleteItemUnit(itemUnitId)
      itemUnits.value = data.data || []
      notification.success('Unidad eliminada')
    } catch (error) {
      notification.error(error.response?.data?.message || 'Error al eliminar unidad')
    }
  }

  async function setDefaultUnit(itemUnitId) {
    // For pending units (new items)
    if (!editingId.value) {
      pendingItemUnits.value = pendingItemUnits.value.map(u => ({
        ...u,
        is_default: u.unit_id === itemUnitId
      }))
      notification.success('Unidad por defecto actualizada')
      return
    }

    // For existing items, call API
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

  // Clean up extra units when switching from variable sale to simple
  watch(
    () => form.value.is_variable_sale,
    (newVal, oldVal) => {
      // Switching from Variable Sale (true) to Simple (false)
      if (!newVal && oldVal) {
        if (editingId.value) {
          // Existing item: keep only default unit, delete others via API
          const unitsToDelete = itemUnits.value.filter(u => !u.is_default)
          unitsToDelete.forEach(async (unit) => {
            try {
              await unitsService.deleteItemUnit(unit.id)
            } catch (error) {
              console.error('Error deleting unit:', error)
            }
          })
          itemUnits.value = itemUnits.value.filter(u => u.is_default)
        } else {
          // New item: keep only 1 unit (default or first)
          if (pendingItemUnits.value.length > 1) {
            const defaultUnit = pendingItemUnits.value.find(u => u.is_default) || pendingItemUnits.value[0]
            pendingItemUnits.value = defaultUnit ? [defaultUnit] : []
          }
        }
      }
    }
  )

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

        // Create pending item units for new items
        if (pendingItemUnits.value.length > 0 && itemId) {
          for (const unit of pendingItemUnits.value) {
            try {
              await unitsService.createItemUnit({
                item_id: itemId,
                unit_id: unit.unit_id,
                is_default: unit.is_default,
                conversion_factor: unit.conversion_factor,
                unit_type: unit.unit_type
              })
            } catch (unitError) {
              console.error('Error creating unit:', unitError)
            }
          }
        }
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
      
      // Auto-select "Unidad (und)" by default
      const defaultUnit = allUnits.value.find(u => u.abbreviation === 'und' || u.name.toLowerCase().includes('unidad'))
      if (defaultUnit) {
        newItemUnit.value.unit_id = defaultUnit.id
      }
    } catch (error) {
      console.error('Error loading units:', error)
    }
  }
</script>

<template>
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

    <!-- Search & Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
      <!-- Mobile/Tablet Filter Toggle -->
      <div class="lg:hidden p-3 border-b border-slate-200 dark:border-slate-800">
        <button
          @click="showFilters = !showFilters"
          class="w-full px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-500 transition-colors flex items-center justify-center gap-2"
        >
          <Search class="w-4 h-4" />
          {{ showFilters ? 'Ocultar filtros' : 'Mostrar filtros' }}
          <span v-if="statusFilter" class="px-1.5 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs rounded-full">
            1
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
            placeholder="Buscar por nombre o SKU..."
            class="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
        </div>
      </div>

      <!-- Desktop Filters -->
      <div class="hidden lg:flex flex-wrap gap-3 p-4">
        <select
          v-model="statusFilter"
          class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="discontinued">Descontinuado</option>
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
          v-model="statusFilter"
          class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="discontinued">Descontinuado</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div v-if="loading" class="p-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
      </div>
      
      <!-- Desktop Table -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="w-full min-w-[700px]">
          <thead class="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th class="px-2 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">SKU</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Imagen</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Producto</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Categoría</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Costo</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Precio</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Stock</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Estado</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="item in filteredItems" :key="item.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td class="px-4 py-3">
                <span class="font-mono text-sm text-slate-600 dark:text-slate-300">{{ item.item_number }}</span>
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
                  <span v-if="item.is_kit" class="px-1.5 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 rounded text-[10px] font-medium">Kit</span>
                  <span v-if="item.is_serialized" class="px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-medium">Serializado</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{{ item.category_name || '-' }}</td>
              <td class="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">{{ formatPrice(item.cost_price) }}</td>
              <td class="px-4 py-3 text-right text-sm font-medium text-slate-900 dark:text-white">{{ formatPrice(item.unit_price) }}</td>
              <td class="px-4 py-3 text-center">
                <span :class="(item.total_quantity || 0) <= item.reorder_level ? 'text-red-500' : 'text-green-500'" class="font-medium">
                  {{ Number(item.total_quantity || 0).toFixed(2) }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span :class="getStatusClass(item.status)" class="px-2 py-0.5 rounded-md text-xs font-medium capitalize">{{ item.status }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button @click="viewItem(item)" class="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors">
                    <Eye class="w-4 h-4" />
                  </button>
                  <button @click="openModal(item)" class="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="deleteItem(item.id)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredItems.length === 0">
              <td colspan="9" class="px-4 py-8 text-center text-slate-400">
                <Box class="w-8 h-8 mx-auto mb-2 opacity-50" />
                No hay productos
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
        <div v-if="filteredItems.length === 0" class="p-8 text-center text-slate-400">
          <Box class="w-8 h-8 mx-auto mb-2 opacity-50" />
          No hay productos
        </div>
        <div v-for="item in filteredItems" :key="item.id" class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <div class="flex items-start gap-3 mb-2">
            <div class="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="w-full h-full object-cover" @error="item.image_url = null" />
              <Package v-else class="w-6 h-6 text-slate-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900 dark:text-white truncate">{{ item.name }}</p>
              <p class="text-xs text-slate-500">{{ item.item_number }}</p>
              <div class="flex gap-1 mt-1">
                <span v-if="item.is_kit" class="px-1.5 py-0.5 bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 rounded text-[10px] font-medium">Kit</span>
                <span v-if="item.is_serialized" class="px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-medium">Serializado</span>
              </div>
            </div>
            <span :class="getStatusClass(item.status)" class="px-2 py-0.5 rounded-md text-xs font-medium capitalize whitespace-nowrap">
              {{ item.status }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs mb-2">
            <div class="text-center">
              <p class="text-slate-400">Costo</p>
              <p class="font-medium text-slate-600 dark:text-slate-300">{{ formatPrice(item.cost_price) }}</p>
            </div>
            <div class="text-center">
              <p class="text-slate-400">Precio</p>
              <p class="font-bold text-brand-600 dark:text-brand-400">{{ formatPrice(item.unit_price) }}</p>
            </div>
            <div class="text-center">
              <p class="text-slate-400">Stock</p>
              <p :class="(item.total_quantity || 0) <= item.reorder_level ? 'text-red-500 font-bold' : 'text-green-500'" class="font-medium">{{ Number(item.total_quantity || 0).toFixed(2) }}</p>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <p class="text-xs text-slate-500">{{ item.category_name || 'Sin categoría' }}</p>
            <div class="flex items-center gap-1">
              <button @click="viewItem(item)" class="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <Eye class="w-4 h-4" />
              </button>
              <button @click="openModal(item)" class="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <Pencil class="w-4 h-4" />
              </button>
              <button @click="deleteItem(item.id)" class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
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
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
            <div>
              <h2 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                {{ editingId ? 'Editar' : 'Nuevo' }} Producto
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {{ editingId ? 'Modifica los datos del producto' : 'Completa los datos del producto' }}
              </p>
            </div>
            <button @click="closeModal" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Form Content -->
          <form @submit.prevent="saveItem" class="flex-1 overflow-y-auto">
             <div class="p-4 sm:p-6">
               <!-- Grid Layout: 12 columns -->
               <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-start">
                 <!-- Row 1: Left = Imagen (col 1-5) | Right = Identidad (col 6-12) -->
                 <div class="xl:col-span-5">
                   <!-- Imagen (Vertical) -->
                   <div ref="imageCardRef" class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                     <ImageUpload
                       v-model="formImageFile"
                       :preview-url="formImagePreview"
                       @update:preview-url="formImagePreview = $event"
                       label=""
                       size="large"
                       :max-height="285"
                     />
                   </div>
                 </div>
                 <div class="xl:col-span-7">
                   <!-- Identidad (SKU, Nombre, Desc, Estado) -->
                   <div ref="identityRef" class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                     <div class="flex items-center gap-2">
                       <h3 class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Identidad</h3>
                       <span class="h-px flex-1 bg-brand-500/30"></span>
                     </div>
                     <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <!-- SKU -->
                       <div>
                         <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU / Código</label>
                         <input
                           v-model="form.item_number"
                           type="text"
                           placeholder="Auto-generado"
                           class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                         />
                       </div>
                       <!-- Estado -->
                       <div>
                         <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                         <select v-model="form.status" class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm">
                           <option value="active">Activo</option>
                           <option value="inactive">Inactivo</option>
                           <option value="discontinued">Descontinuado</option>
                         </select>
                       </div>
                     </div>
                     <!-- Nombre -->
                     <div>
                       <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
                       <input
                         v-model="form.name"
                         type="text"
                         required
                         class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                       />
                     </div>
                     <!-- Descripción -->
                     <div>
                       <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                       <textarea
                         v-model="form.description"
                         rows="3"
                         class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm resize-none"
                       ></textarea>
                      </div>
                     </div>
                   </div>
  
                   <!-- Row 2: Left = Categorización (col 1-5) | Right = Precios y Costos (col 6-12) -->
                   <div class="xl:col-span-5">
                    <!-- Categorización -->
                    <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                      <div class="flex items-center gap-2">
                        <h3 class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categorización</h3>
                        <span class="h-px flex-1 bg-brand-500/30"></span>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                          <select
                            v-model="form.category_id"
                            class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                          >
                            <option :value="null">Sin categoría</option>
                            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proveedor</label>
                          <select
                            v-model="form.supplier_id"
                            class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                          >
                            <option :value="null">Sin proveedor</option>
                            <option v-for="sup in suppliers" :key="sup.id" :value="sup.id">{{ sup.name }}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="xl:col-span-7">
                     <!-- Precios y Costos -->
                     <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                       <div class="flex items-center gap-2">
                         <h3 class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Precios y Costos</h3>
                         <span class="h-px flex-1 bg-brand-500/30"></span>
                       </div>
                       <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                         <div>
                           <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                             Costo
                             <span v-if="form.is_kit && form.kit_components?.length > 0" class="text-xs font-normal text-green-600">(auto)</span>
                           </label>
                           <div class="relative">
                             <span class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 text-sm font-medium">{{ currencyStore.currency_symbol }}</span>
                             <input
                               :value="currencyStore.roundMoney(form.cost_price)"
                               @input="handleCostInput"
                               @focus="selectAllInput"
                               @blur="handleCostBlur"
                               type="number"
                               :step="priceStep"
                               min="0"
                               :disabled="form.is_kit && form.kit_components?.length > 0"
                               :class="form.is_kit && form.kit_components?.length > 0 ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed' : ''"
                               class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                             />
                           </div>
                         </div>
                         <div>
                           <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ganancia %</label>
                           <div class="relative">
                             <Percent class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input
                               v-model.number="profitMargin"
                               @input="calculatePriceFromMargin"
                               type="number"
                               step="0.01"
                               min="0"
                               class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                             />
                           </div>
                         </div>
                         <div>
                           <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                             Precio
                             <span v-if="form.is_kit && form.kit_components?.length > 0 && !userModifiedPrice" class="text-xs font-normal text-green-600">(auto)</span>
                           </label>
                           <div class="relative">
                             <span class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 text-sm font-medium">{{ currencyStore.currency_symbol }}</span>
                             <input
                               :value="currencyStore.roundMoney(form.unit_price)"
                               @input="handlePriceInput"
                               @focus="selectAllInput"
                               @blur="handlePriceBlur"
                               type="number"
                               :step="priceStep"
                               min="0"
                               class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                             />
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
  
                   <!-- Row 3: Full Width = Inventario (col 1-12) -->
                   <div class="md:col-span-2 xl:col-span-12">
                      <!-- Inventario -->
                     <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                       <div class="flex items-center gap-2">
                         <h3 class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inventario</h3>
                         <span class="h-px flex-1 bg-brand-500/30"></span>
                       </div>
                        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Stock Mínimo <span class="text-[10px] font-normal text-slate-500">(alerta)</span>
                            </label>
                            <input
                              v-model.number="form.reorder_level"
                              type="number"
                              min="0"
                              class="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                            />
                          </div>
                          <div>
                            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Cant. Sugerida <span class="text-[10px] font-normal text-slate-500">(al pedir)</span>
                            </label>
                            <input
                              v-model.number="form.reorder_quantity"
                              type="number"
                              min="0"
                              class="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                            />
                          </div>
                          <div v-if="!editingId && !form.is_service && !form.is_kit">
                            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Stock Inicial <span class="text-[10px] font-normal text-slate-500">(al crear)</span>
                            </label>
                            <input
                              v-model.number="form.initial_quantity"
                              type="number"
                              min="0"
                              :step="currencyStore.priceStep"
                              class="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                            />
                          </div>
                          <!-- Fecha de Vencimiento -->
                          <div class="flex items-center justify-between p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800/70 transition-colors ring-1 ring-slate-200/50 dark:ring-slate-700/50" title="activar alertas en inventario">
                            <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">Fecha de Vencimiento</span>
                            <button type="button" @click="form.tracks_expiration = !form.tracks_expiration" :class="form.tracks_expiration ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200">
                              <span :class="form.tracks_expiration ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"></span>
                            </button>
                          </div>
                       </div>
                     </div>
                   </div>
  
                   <!-- Row 4: Left = Atributos (col 1-5) | Right = Tipo de Producto (col 6-12) -->
                   <!-- Row 4: Left = Atributos (col 1-5) | Right = Tipo de Producto (col 6-12) -->
                   <div class="xl:col-span-5">
                    <!-- Atributos del Producto -->
                    <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-4 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                      <div class="flex items-center gap-2">
                        <h3 class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Atributos del Producto</h3>
                        <span class="h-px flex-1 bg-brand-500/30"></span>
                      </div>
                      <div class="space-y-4">
                        <!-- Serializado -->
                        <div class="flex items-center justify-between p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800/70 transition-colors ring-1 ring-slate-200/50 dark:ring-slate-700/50" title="requiere número serie">
                          <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">Serializado</span>
                          <button type="button" @click="form.is_serialized = !form.is_serialized" :class="form.is_serialized ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200">
                            <span :class="form.is_serialized ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"></span>
                          </button>
                        </div>
                        <!-- Servicio -->
                        <div class="flex items-center justify-between p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800/70 transition-colors ring-1 ring-slate-200/50 dark:ring-slate-700/50" title="sin stock físico">
                          <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">Servicio</span>
                          <button type="button" @click="form.is_service = !form.is_service" :class="form.is_service ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200">
                            <span :class="form.is_service ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"></span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="xl:col-span-7">
                    <!-- Tipo de Producto -->
                    <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                      <div class="flex items-center gap-2">
                        <h3 class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo de Producto</h3>
                        <span class="h-px flex-1 bg-brand-500/30"></span>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <!-- Producto Compuesto -->
                        <div class="flex items-center justify-between p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800/70 transition-colors ring-1 ring-slate-200/50 dark:ring-slate-700/50" title="conjunto de productos">
                          <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">Producto Compuesto</span>
                          <button type="button" @click="form.is_kit = !form.is_kit" :class="form.is_kit ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200">
                            <span :class="form.is_kit ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"></span>
                          </button>
                        </div>
                      <!-- Venta Variada -->
                         <div class="flex items-center justify-between p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800/70 transition-colors ring-1 ring-slate-200/50 dark:ring-slate-700/50" :class="{ 'opacity-50': form.is_kit }" title="por peso/cantidad">
                           <span class="text-sm text-slate-700 dark:text-slate-300 font-medium">Venta Variada</span>
                           <button type="button" @click="form.is_variable_sale = !form.is_variable_sale" :disabled="form.is_kit" :class="form.is_variable_sale ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200">
                             <span :class="form.is_variable_sale ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"></span>
                           </button>
                         </div>
                        </div>
                        
                        <!-- Unidades de Medida (compact display) -->
                        <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unidades</span>
                            <button 
                              type="button" 
                              @click="showUnitModal = true"
                              class="text-xs text-brand-500 hover:text-brand-600 font-medium"
                            >
                              Gestionar ({{ displayUnits.length }})
                            </button>
                          </div>
                          <div class="flex flex-wrap gap-1">
                            <span 
                              v-for="(itemUnit, idx) in displayUnits.slice(0, 3)" 
                              :key="itemUnit.id || itemUnit.unit_id"
                              class="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 rounded ring-1 ring-slate-200/50 dark:ring-slate-700/50 text-xs"
                            >
                              <span v-if="itemUnit.is_default" class="text-[8px] bg-brand-100 dark:bg-brand-900/30 text-brand-600 px-0.5 rounded">D</span>
                              <span class="text-slate-700 dark:text-slate-300">{{ itemUnit.unit_abbreviation }}</span>
                            </span>
                            <span 
                              v-if="displayUnits.length > 3" 
                              class="inline-flex items-center px-2 py-0.5 text-xs text-slate-400"
                            >
                              +{{ displayUnits.length - 3 }} más
                            </span>
                            <span v-if="displayUnits.length === 0" class="text-xs text-slate-400">Ninguna</span>
                          </div>
                        </div>
                      </div>
                    </div>
   
                   <!-- Row 5: Full Width = Kit Components (col 1-12) -->
                  <div v-if="form.is_kit" class="md:col-span-2 xl:col-span-12">
                   <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                     <div class="flex items-center gap-2">
                       <h3 class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Elementos incluidos</h3>
                       <span class="h-px flex-1 bg-brand-500/30"></span>
                     </div>
                     <div class="space-y-3">
                       <p class="text-xs text-slate-500">Selecciona los productos que forman parte de este kit</p>
                       <div class="flex flex-col sm:flex-row gap-2">
                         <select v-model="newKitComponent.item_id" class="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm">
                           <option :value="null">Seleccionar producto...</option>
                           <option v-for="item in kitItems" :key="item.id" :value="item.id" :disabled="form.kit_components.some((c) => c.item_id === item.id)">{{ item.name }} ({{ item.item_number }})</option>
                         </select>
                         <input v-model.number="newKitComponent.quantity" type="number" min="1" class="w-full sm:w-20 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm" />
                         <button type="button" @click="addKitComponent" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors">
                           <Plus class="w-4 h-4" />
                         </button>
                       </div>
                       <div v-if="form.kit_components.length > 0" class="space-y-2 mt-3">
                         <div v-for="(comp, index) in form.kit_components" :key="comp.item_id" class="flex items-center justify-between bg-white dark:bg-slate-800/70 rounded-lg px-3 py-2 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                           <div class="flex items-center gap-2 min-w-0">
                             <Box class="w-4 h-4 text-slate-400 flex-shrink-0" />
                             <span class="text-sm text-slate-700 dark:text-slate-300 truncate">{{ comp.item_name }}</span>
                             <span class="text-xs text-slate-400 flex-shrink-0">x{{ comp.quantity }}</span>
                             <span class="text-xs text-green-600 flex-shrink-0">({{ currencyStore.formatMoney(comp.cost_price * comp.quantity) }})</span>
                           </div>
                           <button type="button" @click="removeKitComponent(index)" class="text-red-500 hover:text-red-600 flex-shrink-0 p-1">
                             <Trash2 class="w-4 h-4" />
                           </button>
                         </div>
                         <div class="text-xs text-slate-500 text-right pt-2">
                           Costo: <span class="font-medium">{{ currencyStore.formatMoney(form.cost_price) }}</span> | Precio: <span class="font-medium text-green-600">{{ currencyStore.formatMoney(form.unit_price) }}</span>
                         </div>
                       </div>
                       <p v-else class="text-xs text-slate-400 text-center py-2">No hay componentes agregados</p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
              <button type="button" @click="closeModal" class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium">
                Cancelar
              </button>
              <button type="submit" class="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors text-sm">
                {{ editingId ? 'Actualizar' : 'Crear' }} Producto
              </button>
            </div>
          </form>
        </div>
    </div>
  </Teleport>

  <!-- Modal Unidades de Medida -->
  <Teleport to="body">
    <div v-if="showUnitModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showUnitModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Unidades de Medida</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ form.is_variable_sale ? 'Producto con venta variada - múltiples unidades' : 'Producto simple - una unidad' }}
            </p>
          </div>
          <button @click="showUnitModal = false" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <!-- Lista de unidades existentes -->
          <div v-if="displayUnits.length > 0" class="space-y-2">
            <div 
              v-for="itemUnit in displayUnits" 
              :key="itemUnit.id || itemUnit.unit_id"
              class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-lg ring-1 ring-slate-200/50 dark:ring-slate-700/50"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span v-if="itemUnit.is_default" class="text-[10px] bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded flex-shrink-0">Default</span>
                <span class="text-sm text-slate-700 dark:text-slate-300 truncate">{{ itemUnit.unit_name || itemUnit.unit_abbreviation }}</span>
                <span class="text-xs text-slate-400 flex-shrink-0">({{ itemUnit.conversion_factor }} {{ itemUnit.unit_type }})</span>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button 
                  v-if="!itemUnit.is_default" 
                  type="button" 
                  @click="setDefaultUnit(itemUnit.id || itemUnit.unit_id)" 
                  class="text-xs text-brand-500 hover:text-brand-600 px-1.5 py-0.5"
                >D</button>
                <button 
                  type="button" 
                  @click="deleteItemUnit(itemUnit.id || itemUnit.unit_id)" 
                  class="text-red-500 hover:text-red-600 p-1"
                ><Trash2 class="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-slate-400 text-center py-3">No hay unidades agregadas</p>

          <!-- Formulario para agregar (solo si Venta Variada o no hay unidad) -->
          <div 
            v-if="form.is_variable_sale || displayUnits.length === 0" 
            class="pt-3 border-t border-slate-200 dark:border-slate-700"
          >
            <p class="text-xs text-slate-500 mb-2">
              {{ form.is_variable_sale ? 'Agregar unidad de venta' : 'Seleccionar unidad para este producto' }}
            </p>
            <div class="flex gap-2">
              <select 
                v-model="newItemUnit.unit_id" 
                class="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm"
              >
                <option :value="null">{{ form.is_variable_sale ? 'Agregar unidad...' : 'Seleccionar unidad...' }}</option>
                <option v-for="unit in availableUnits" :key="unit.id" :value="unit.id">{{ unit.name }} ({{ unit.abbreviation }})</option>
              </select>
              <button 
                type="button" 
                @click="addUnitAndClose" 
                :disabled="!newItemUnit.unit_id"
                :class="[
                  'px-4 py-2 rounded-lg transition-colors',
                  newItemUnit.unit_id 
                    ? 'bg-brand-500 hover:bg-brand-600 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                ]"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p 
            v-if="!form.is_variable_sale && displayUnits.length >= 1" 
            class="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded"
          >
            Los productos simples solo pueden tener 1 unidad. Activar "Venta Variada" para múltiples.
          </p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button 
            type="button" 
            @click="showUnitModal = false" 
            class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

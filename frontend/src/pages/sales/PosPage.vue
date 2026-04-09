<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { useSocketStore } from '../../stores/socket.store.js'
import { useCashDrawerStore } from '../../stores/cash-drawer.store.js'
import { useLocationStore } from '../../stores/location.store.js'
import { useOfflineStore } from '../../stores/offline.store.js'
import { useUnitsStore } from '../../stores/units.store.js'
import { useItemsStore } from '../../stores/items.store.js'
import { salesService, customersService } from '../../services/sales.service.js'
import { offlineApi } from '../../services/api.service.js'
import { coreService, inventoryService } from '../../services/inventory.service.js'
import { cacheService } from '../../services/cache.service.js'
import { isNetworkOnline } from '../../composables/useNetworkStatus.js'
import { useDebounce } from '../../composables/useDebounce.js'
import {
  Plus,
  Minus,
  X,
  Trash2,
  Search,
  Loader2,
  ShoppingCart,
  User,
  CreditCard,
  DollarSign,
  Receipt,
  Save,
  RefreshCw,
  Package,
  Tag,
  ChevronDown,
  Tv,
  Wallet,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  CloudOff,
  Cloud
} from 'lucide-vue-next'

const router = useRouter()
const notification = useNotificationStore()
const currencyStore = useCurrencyStore()
const socketStore = useSocketStore()
const cashDrawerStore = useCashDrawerStore()
const locationStore = useLocationStore()
const offlineStore = useOfflineStore()
const itemsStore = useItemsStore()

const customerDisplayOpen = ref(false)
const customerDisplayWindow = ref(null)

const customers = ref([])
const cartItems = ref([])
const selectedCustomer = ref(null)
const selectedLocation = ref(null)
const viewMode = ref('categories')
const currentCategory = ref(null)
const loading = ref(false)
const searching = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const customerSearchQuery = ref('')
const showCustomerSearch = ref(false)
const processingSale = ref(false)

const paymentMethod = ref('cash')
const amountPaid = ref(0)
const amountPaidDisplay = ref('0')
const showPaymentModal = ref(false)
const showDrawerRequiredModal = ref(false)
const showUnitModal = ref(false)
const selectedProductForUnit = ref(null)
const selectedProductUnits = ref([])
const showVariableModal = ref(false)
const variableQuantity = ref(1)
const variableUnit = ref(null)
const variableCustomPrice = ref(0)
const variableCustomPriceDisplay = ref('0')
const variableCalculatedPrice = ref(0)
const variableMinPrice = ref(0)
const discountDisplays = ref({})

function formatAmountDisplay() {
  const decimals = currencyStore.decimal_places || 2
  amountPaidDisplay.value = amountPaid.value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

function onAmountPaidInput(e) {
  const val = e.target.value.replace(/[^0-9.]/g, '')
  const num = parseFloat(val)
  amountPaid.value = isNaN(num) ? 0 : currencyStore.roundMoney(num)
  amountPaidDisplay.value = val
}

function onAmountPaidFocus(e) {
  e.target.select()
}

function onAmountPaidBlur() {
  formatAmountDisplay()
}

const form = ref({
  notes: ''
})

const unitsStore = useUnitsStore()

const { debounced: debouncedSearch, cancel: cancelSearchDebounce } = useDebounce((query) => {
  performSearch(query)
}, 200)

function performSearch(query) {
  if (!query || query.length < 2) {
    searchResults.value = []
    searching.value = false
    return
  }
  const q = query.toLowerCase()
  searchResults.value = itemsStore.items.filter(item =>
    item.name?.toLowerCase().includes(q) ||
    item.item_number?.toLowerCase().includes(q)
  ).slice(0, 10)
  searching.value = false
}

onMounted(async () => {
  await loadLocations()
  await unitsStore.loadUnits()
  await loadItems()
  await loadDefaultCustomer()
})

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
    
    if (!selectedLocation.value && userLocations.length > 0) {
      const defaultLoc = userLocations.find(l => l.is_default) || userLocations[0]
      selectedLocation.value = defaultLoc
      await cashDrawerStore.checkOpenDrawer(selectedLocation.value.id)
    }
  } catch (error) {
    notification.error('Error al cargar ubicaciones')
  }
}

async function loadItems() {
  try {
    if (!isNetworkOnline()) {
      const cachedItems = await cacheService.getItems()
      itemsStore.items = cachedItems.map(item => ({
        ...item,
        status: 'active',
        unit_price: item.price,
        item_number: item.code
      }))
      await loadCategories()
      return
    }

    await itemsStore.loadItems(selectedLocation.value?.id)
    await loadCategories()
    
    await preloadItemUnits()
  } catch (error) {
    const cachedItems = await cacheService.getItems()
    if (cachedItems.length > 0) {
      itemsStore.items = cachedItems.map(item => ({
        ...item,
        status: 'active',
        unit_price: item.price,
        item_number: item.code
      }))
      await loadCategories()
    }
  }
}

async function preloadItemUnits() {
  const items = itemsStore.items
  const promises = items.map(item => unitsStore.getItemUnits(item.id))
  await Promise.all(promises)
}

async function loadCategories() {
  try {
    await itemsStore.loadCategories()
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const itemsByCategory = computed(() => {
  return itemsStore.itemsByCategory
})

const categories = computed(() => {
  return itemsStore.activeCategories
})

const rootCategories = computed(() => {
  return itemsStore.rootCategories
})

const currentSubcategories = computed(() => {
  if (!currentCategory.value) return []
  return itemsStore.getSubcategoriesWithItems(currentCategory.value.id)
})

const currentDirectItems = computed(() => {
  if (!currentCategory.value) return []
  return itemsStore.getCategoryItems(currentCategory.value.id)
})

const categoryPath = computed(() => {
  if (!currentCategory.value) return []
  const path = []
  let cat = currentCategory.value
  
  while (cat) {
    path.unshift(cat)
    if (cat.parent_id) {
      cat = itemsStore.getCategoryById(cat.parent_id)
    } else {
      cat = null
    }
  }
  
  return path
})

function enterCategory(cat) {
  currentCategory.value = cat
  viewMode.value = 'products'
}

function backToCategories() {
  if (currentCategory.value?.parent_id) {
    const parent = itemsStore.getCategoryById(currentCategory.value.parent_id)
    currentCategory.value = parent
  } else {
    currentCategory.value = null
    viewMode.value = 'categories'
  }
}

function backToRoot() {
  currentCategory.value = null
  viewMode.value = 'categories'
}

function navigateToCategory(cat) {
  currentCategory.value = cat
}

function handleProductClick(item) {
  const units = unitsStore.getItemUnitsSync(item.id)
  
  if (item.is_variable_sale && units.length > 0) {
    selectedProductForUnit.value = item
    selectedProductUnits.value = units
    const defaultUnit = units.find(u => u.is_default) || units[0]
    initVariableSale(defaultUnit)
    showVariableModal.value = true
  } else if (units.length <= 1) {
    addToCart(item, units[0] || null)
  } else {
    selectedProductForUnit.value = item
    selectedProductUnits.value = units
    showUnitModal.value = true
  }
}

watch([variableQuantity, variableUnit], () => {
  if (variableUnit.value && showVariableModal.value) {
    variableCalculatedPrice.value = calculateProportionalPrice(variableUnit.value, variableQuantity.value)
    variableMinPrice.value = variableCalculatedPrice.value
    variableCustomPrice.value = variableCalculatedPrice.value
    formatVariablePriceDisplay()
  }
})

watch(selectedLocation, (newVal) => {
  if (newVal) {
    locationStore.setSelectedLocation(newVal)
    currentCategory.value = null
    viewMode.value = 'categories'
    cartItems.value = []
    loadItems()
    cashDrawerStore.checkOpenDrawer(newVal.id)
  }
})

async function loadDefaultCustomer() {
  try {
    if (!isNetworkOnline()) {
      const cachedCustomers = await cacheService.getCustomers()
      const defaultCustomer = cachedCustomers.find(c => c.is_default) || cachedCustomers[0]
      if (defaultCustomer) {
        selectedCustomer.value = {
          id: defaultCustomer.id,
          name: defaultCustomer.name,
          phone: defaultCustomer.phone
        }
      }
      return
    }

    const { data } = await customersService.getCustomers({ is_default: 1 })
    const defaultCustomer = data.data?.[0]
    if (defaultCustomer) {
      selectedCustomer.value = defaultCustomer
    }
  } catch (error) {
    console.error('Error loading default customer:', error)
  }
}

async function searchItems() {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = []
    searching.value = false
    return
  }
  searching.value = true
  debouncedSearch(searchQuery.value)
}

function initVariableSale(unit) {
  variableUnit.value = unit
  variableQuantity.value = 1
  variableCalculatedPrice.value = calculateProportionalPrice(unit, 1)
  variableMinPrice.value = variableCalculatedPrice.value
  variableCustomPrice.value = variableCalculatedPrice.value
  formatVariablePriceDisplay()
}

function calculateProportionalPrice(unit, qty) {
  const itemPrice = parseFloat(selectedProductForUnit.value?.unit_price) || 0
  if (!unit || !unit.conversion_factor) return itemPrice * qty
  
  const defaultUnit = selectedProductUnits.value.find(u => u.is_default)
  if (!defaultUnit) return itemPrice * qty
   
   const ratio = unit.conversion_factor / defaultUnit.conversion_factor
   const unitPrice = itemPrice * ratio
   return Math.round(unitPrice * qty * 100) / 100
 }

function formatVariablePriceDisplay() {
  const decimals = currencyStore.decimal_places || 2
  variableCustomPriceDisplay.value = variableCustomPrice.value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

function onVariablePriceInput(e) {
  const val = e.target.value.replace(/[^0-9.]/g, '')
  const num = parseFloat(val)
  variableCustomPrice.value = isNaN(num) ? 0 : currencyStore.roundMoney(num)
  variableCustomPriceDisplay.value = val
  if (variableCustomPrice.value < variableMinPrice.value) {
    variableCustomPrice.value = variableMinPrice.value
  }
  variableCalculatedPrice.value = variableCustomPrice.value
}

function onVariablePriceFocus(e) {
  e.target.select()
}

function onVariablePriceBlur() {
  formatVariablePriceDisplay()
}

function confirmVariableSale() {
  addToCart(selectedProductForUnit.value, {
    ...variableUnit.value,
    price: variableCalculatedPrice.value,
    quantity: variableQuantity.value
  }, variableQuantity.value)
  
  showVariableModal.value = false
  selectedProductForUnit.value = null
  selectedProductUnits.value = []
  variableUnit.value = null
  variableQuantity.value = 1
  variableCustomPriceDisplay.value = '0'
}

function selectUnitAndAdd(unit) {
  addToCart(selectedProductForUnit.value, unit)
  showUnitModal.value = false
  selectedProductForUnit.value = null
  selectedProductUnits.value = []
}

function addToCart(item, selectedUnit = null, customQty = null) {
  const unitId = selectedUnit?.unit_id || item.default_unit_id
  const unitPrice = selectedUnit?.price || parseFloat(item.unit_price) || 0
  const unitAbbreviation = selectedUnit?.unit_abbreviation || 'und'
  const unitName = selectedUnit?.unit_name || 'unidad'
  const qty = customQty !== null ? customQty : 1
  
  const existing = cartItems.value.find(ci => 
    ci.item_id === item.id && 
    ci.variation_id === null && 
    ci.unit_id === unitId
  )
  
  if (existing) {
    existing.quantity += qty
    existing.line_total = existing.quantity * existing.unit_price
  } else {
    const newIndex = cartItems.value.length
    cartItems.value.push({
      item_id: item.id,
      item_name: item.name,
      item_number: item.item_number,
      variation_id: null,
      quantity: qty,
      unit_id: unitId,
      unit_abbreviation: unitAbbreviation,
      unit_name: unitName,
      item_unit_id: selectedUnit?.id || null,
      unit_price: unitPrice,
      discount_amount: 0,
      tax_amount: 0,
      line_total: unitPrice * qty
    })
    initDiscountDisplay(newIndex, 0)
  }
  searchQuery.value = ''
  searchResults.value = []
}

function updateQuantity(index, delta) {
  const item = cartItems.value[index]
  item.quantity += delta
  if (item.quantity <= 0) {
    cartItems.value.splice(index, 1)
  } else {
    item.line_total = item.quantity * item.unit_price - item.discount_amount
  }
}

function removeFromCart(index) {
  cartItems.value.splice(index, 1)
  delete discountDisplays.value[index]
}

function onDiscountInput(index, e) {
  const val = e.target.value.replace(/[^0-9.]/g, '')
  const item = cartItems.value[index]
  const num = parseFloat(val) || 0
  const maxDiscount = item.quantity * item.unit_price
  item.discount_amount = Math.min(num, maxDiscount)
  item.line_total = item.quantity * item.unit_price - item.discount_amount
  discountDisplays.value[index] = val
}

function onDiscountFocus(index, e) {
  e.target.select()
}

function onDiscountBlur(index) {
  const item = cartItems.value[index]
  const decimals = currencyStore.decimal_places || 2
  discountDisplays.value[index] = item.discount_amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

function getDiscountDisplay(index, value) {
  if (discountDisplays.value[index] !== undefined) {
    return discountDisplays.value[index]
  }
  const decimals = currencyStore.decimal_places || 2
  return (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

function initDiscountDisplay(index, value) {
  const decimals = currencyStore.decimal_places || 2
  discountDisplays.value[index] = (value || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
})

const totalDiscount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.discount_amount, 0)
})

const total = computed(() => {
  return subtotal.value - totalDiscount.value
})

const change = computed(() => {
  return Math.max(0, amountPaid.value - total.value)
})

function formatMoney(amount) {
  return currencyStore.formatMoney(amount)
}

function getConnectionStatusClass() {
  if (offlineStore.isSyncing) {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  }
  if (!offlineStore.isOnline) {
    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  }
  if (offlineStore.pendingCount > 0) {
    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  }
  return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
}

function getConnectionIcon() {
  if (offlineStore.isSyncing) return Loader2
  if (!offlineStore.isOnline) return WifiOff
  return Wifi
}

function getConnectionStatusTitle() {
  if (offlineStore.isSyncing) {
    return 'Sincronizando ventas...'
  }
  if (!offlineStore.isOnline) {
    return `Modo offline - ${offlineStore.pendingCount} venta(s) pendiente(s)`
  }
  if (offlineStore.pendingCount > 0) {
    return `${offlineStore.pendingCount} venta(s) pendiente(s) de sincronizar`
  }
  return 'En línea - Todo sincronizado'
}

function handleConnectionClick() {
  if (offlineStore.pendingCount > 0 && offlineStore.isOnline) {
    offlineStore.syncPendingSales()
  }
}

async function searchCustomers(query) {
  if (!query || query.length < 2) {
    customers.value = []
    return
  }
  try {
    const { data } = await customersService.searchCustomers(query)
    customers.value = data.data || []
  } catch (error) {
    console.error('Error searching customers:', error)
  }
}

function selectCustomer(customer) {
  selectedCustomer.value = customer
  showCustomerSearch.value = false
  customerSearchQuery.value = ''
  customers.value = []
}

function clearCustomer() {
  selectedCustomer.value = null
}

function openPaymentModal() {
  if (cartItems.value.length === 0) {
    notification.warning('Agregue productos al carrito')
    return
  }
  
  if (!cashDrawerStore.isDrawerOpen) {
    showDrawerRequiredModal.value = true
    return
  }
  
  amountPaid.value = total.value
  formatAmountDisplay()
  showPaymentModal.value = true
}

async function processSale() {
  if (amountPaid.value < total.value) {
    notification.warning('El monto pagado es menor al total')
    return
  }

  processingSale.value = true
  try {
    const payments = [
      {
        payment_type: paymentMethod.value,
        amount: amountPaid.value
      }
    ]

    const response = await offlineApi.post('/sales', {
      location_id: selectedLocation.value.id,
      customer_id: selectedCustomer.value?.id,
      subtotal: subtotal.value,
      tax_amount: 0,
      discount_amount: totalDiscount.value,
      total: total.value,
      items: cartItems.value.map(item => ({
        item_id: item.item_id,
        variation_id: item.variation_id,
        item_unit_id: item.item_unit_id,
        unit_abbreviation: item.unit_abbreviation,
        unit_name: item.unit_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        tax_amount: item.tax_amount
      })),
      payments,
      notes: form.value.notes,
      auto_complete: true
    })

    const sale = response.data.data

    if (sale?.offline) {
      notification.success(`Venta guardada offline (${sale?.sale_number})`)
      offlineStore.refreshStats()
    } else {
      notification.success(`Venta ${sale?.sale_number} procesada correctamente`)
    }

    showPaymentModal.value = false
    await resetSale()
    backToCategories()
  } catch (error) {
    notification.error(error.response?.data?.message || error.message || 'Error al procesar venta')
  } finally {
    processingSale.value = false
  }
}

async function suspendSale() {
  if (cartItems.value.length === 0) {
    notification.warning('Agregue productos al carrito')
    return
  }

  processingSale.value = true
  try {
    const saleData = {
      location_id: selectedLocation.value.id,
      customer_id: selectedCustomer.value?.id,
      items: cartItems.value.map(item => ({
        item_id: item.item_id,
        variation_id: item.variation_id,
        item_unit_id: item.item_unit_id,
        unit_abbreviation: item.unit_abbreviation,
        unit_name: item.unit_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        tax_amount: item.tax_amount
      })),
      notes: form.value.notes
    }

    const response = await salesService.createSale(saleData)
    const saleId = response.data.data.id

    await salesService.suspendSale(saleId, {
      notes: form.value.notes
    })

    notification.success('Venta suspendida')
    showPaymentModal.value = false
    await resetSale()
    backToCategories()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al suspender venta')
  } finally {
    processingSale.value = false
  }
}

async function resetSale() {
  cartItems.value = []
  form.value.notes = ''
  amountPaid.value = 0
  amountPaidDisplay.value = '0'
  await loadDefaultCustomer()
  await cacheService.clearItemsCache()
  await loadItems()
  if (customerDisplayOpen.value) {
    socketStore.emitSaleUpdate({
      items: [],
      customer: selectedCustomer.value,
      subtotal: 0,
      discount: 0,
      total: 0
    })
  }
}

function openCustomerDisplay() {
  if (customerDisplayWindow.value && !customerDisplayWindow.value.closed) {
    customerDisplayWindow.value.focus()
    return
  }
  
  customerDisplayOpen.value = true
  socketStore.connect(true)
  
  const checkAndEmit = () => {
    if (socketStore.isConnected) {
      socketStore.emitSaleUpdate({
        items: cartItems.value,
        customer: selectedCustomer.value,
        subtotal: subtotal.value,
        discount: totalDiscount.value,
        total: total.value
      })
    } else {
      setTimeout(checkAndEmit, 100)
    }
  }
  checkAndEmit()
  customerDisplayWindow.value = window.open('/display', '_blank', 'width=1024,height=768')
}

function closeCustomerDisplay() {
  if (customerDisplayWindow.value && !customerDisplayWindow.value.closed) {
    customerDisplayWindow.value.close()
  }
  customerDisplayWindow.value = null
  customerDisplayOpen.value = false
  socketStore.clearSale()
}

watch([cartItems, selectedCustomer, subtotal, totalDiscount, total], () => {
  if (customerDisplayOpen.value && socketStore.isConnected) {
    socketStore.emitSaleUpdate({
      items: cartItems.value,
      customer: selectedCustomer.value,
      subtotal: subtotal.value,
      discount: totalDiscount.value,
      total: total.value
    })
  }
})
</script>

<template>
  <div class="h-[calc(100vh-8rem)] flex gap-4">
    <!-- Products Panel -->
    <div class="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <!-- Category Selector -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800">
        <div class="flex gap-4 mb-4">
          <select
            v-model="selectedLocation"
            class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
          >
            <option v-for="loc in locationStore.locations" :key="loc.id" :value="loc">
              {{ loc.name }}
            </option>
          </select>
          <!-- Cash Drawer Status -->
          <button
            @click="router.push('/caja')"
            class="px-3 py-2 rounded-xl flex items-center gap-2 transition-colors"
            :class="cashDrawerStore.isDrawerOpen 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'"
            :title="cashDrawerStore.isDrawerOpen ? 'Caja abierta' : 'Caja cerrada'"
          >
            <Wallet class="w-4 h-4" />
            <span class="text-sm font-medium">
              {{ cashDrawerStore.isDrawerOpen ? 'Abierta' : 'Cerrada' }}
            </span>
          </button>
          <!-- Connection Status -->
          <div
            class="px-3 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            :class="getConnectionStatusClass()"
            :title="getConnectionStatusTitle()"
            @click="handleConnectionClick"
          >
            <component :is="getConnectionIcon()" class="w-4 h-4" />
            <span class="text-sm font-medium">
              {{ offlineStore.isOnline ? 'Online' : 'Offline' }}
            </span>
            <span v-if="offlineStore.pendingCount > 0" class="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
              {{ offlineStore.pendingCount }}
            </span>
            <span v-else-if="offlineStore.isSyncing" class="ml-1">
              <Loader2 class="w-3 h-3 animate-spin" />
            </span>
          </div>
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              @input="searchItems"
              type="text"
              placeholder="Buscar producto por nombre o SKU..."
              class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
            />
            <!-- Search Results -->
            <div v-if="searchResults.length > 0" class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
              <button
                v-for="item in searchResults"
                :key="item.id"
                @click="addToCart(item)"
                class="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div class="text-left">
                  <p class="font-medium text-slate-900 dark:text-white">{{ item.name }}</p>
                  <p class="text-sm text-slate-500">{{ item.item_number }}</p>
                </div>
                <p class="font-semibold text-brand-600 dark:text-brand-400">{{ formatMoney(item.unit_price) }}</p>
              </button>
            </div>
          </div>
        </div>

        <!-- Categories List (root level) -->
        <div v-if="viewMode === 'categories' && !searchQuery" class="flex-1 overflow-y-auto p-4">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              v-for="cat in rootCategories"
              :key="cat.id"
              @click="enterCategory(cat)"
              class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:shadow-md transition-all text-left"
            >
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center">
                  <Tag class="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
              <p class="font-semibold text-slate-900 dark:text-white text-sm">{{ cat.name }}</p>
              <p class="text-xs text-slate-400 mt-1">
                {{ itemsStore.getAllItemsForCategoryTree(cat.id).length }} productos
              </p>
            </button>
          </div>
        </div>

        <!-- Products List (when category selected) -->
        <div v-else-if="viewMode === 'products'" class="flex-1 flex flex-col overflow-hidden">
          <!-- Breadcrumb navigation -->
          <div class="p-4 border-b border-slate-200 dark:border-slate-800">
            <!-- Breadcrumb -->
            <div class="flex items-center gap-1 mb-3 text-sm overflow-x-auto">
              <button
                @click="backToRoot"
                class="text-brand-500 hover:text-brand-600 dark:text-brand-400 whitespace-nowrap"
              >
                Inicio
              </button>
              <template v-for="(cat, idx) in categoryPath" :key="cat.id">
                <ChevronDown class="w-4 h-4 text-slate-400 rotate-90 flex-shrink-0" />
                <button
                  v-if="idx < categoryPath.length - 1"
                  @click="navigateToCategory(cat)"
                  class="text-slate-500 hover:text-slate-600 dark:text-slate-400 whitespace-nowrap"
                >
                  {{ cat.name }}
                </button>
                <span v-else class="text-slate-900 dark:text-white font-medium whitespace-nowrap">
                  {{ cat.name }}
                </span>
              </template>
            </div>
            
            <!-- Back button -->
            <div class="flex items-center gap-2">
              <button
                @click="backToCategories"
                class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronDown class="w-5 h-5 text-slate-500 rotate-90" />
              </button>
              <span class="text-sm text-slate-500">
                {{ currentDirectItems.length }} productos directos
                <span v-if="currentSubcategories.length > 0">
                  · {{ currentSubcategories.length }} subcategorías
                </span>
              </span>
            </div>
          </div>
          
          <!-- Subcategories and products grid -->
          <div class="flex-1 overflow-y-auto p-4">
            <div class="space-y-4">
              <!-- Subcategories -->
              <div v-if="currentSubcategories.length > 0">
                <p class="text-xs font-medium text-slate-400 uppercase mb-2">Subcategorías</p>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                  <button
                    v-for="subcat in currentSubcategories"
                    :key="subcat.id"
                    @click="enterCategory(subcat)"
                    class="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:shadow-md transition-all text-left relative"
                  >
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Tag class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div v-if="itemsStore.hasSubcategories(subcat.id)" class="absolute top-2 right-2">
                        <ChevronDown class="w-4 h-4 text-slate-400 -rotate-90" />
                      </div>
                    </div>
                    <p class="font-semibold text-slate-900 dark:text-white text-sm">{{ subcat.name }}</p>
                    <p class="text-xs text-slate-400 mt-1">
                      {{ itemsStore.getAllItemsForCategoryTree(subcat.id).length }} productos
                    </p>
                  </button>
                </div>
              </div>

              <!-- Direct products -->
              <div v-if="currentDirectItems.length > 0">
                <p class="text-xs font-medium text-slate-400 uppercase mb-2">
                  {{ currentSubcategories.length > 0 ? 'Productos en esta categoría' : 'Productos' }}
                </p>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <button
                    v-for="item in currentDirectItems"
                    :key="item.id"
                    @click="handleProductClick(item)"
                    class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 transition-colors text-left"
                  >
                    <div class="w-full h-20 bg-slate-100 dark:bg-slate-700 rounded-lg mb-2 flex items-center justify-center relative">
                      <Package class="w-8 h-8 text-slate-400" />
                      <span 
                        v-if="Number(item.total_quantity) > 0"
                        class="absolute top-1 right-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        :class="Number(item.total_quantity) <= 5 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'"
                      >
                        {{ Number.isInteger(Number(item.total_quantity)) ? Number(item.total_quantity) : Number(item.total_quantity).toFixed(2) }}
                      </span>
                      <span 
                        v-else
                        class="absolute top-1 right-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      >
                        0
                      </span>
                    </div>
                    <p class="font-medium text-slate-900 dark:text-white text-sm truncate">{{ item.name }}</p>
                    <p class="text-xs text-slate-500 mb-1">{{ item.item_number }}</p>
                    <p class="font-semibold text-brand-600 dark:text-brand-400">{{ formatMoney(item.unit_price) }}</p>
                  </button>
                </div>
              </div>

              <!-- Empty state -->
              <div v-if="currentSubcategories.length === 0 && currentDirectItems.length === 0" class="text-center py-8 text-slate-400">
                <Package class="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay productos en esta categoría</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div v-else-if="searchQuery && searchResults.length > 0" class="flex-1 overflow-y-auto p-4">
          <p class="text-sm text-slate-500 mb-3">Resultados de búsqueda ({{ searchResults.length }})</p>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              v-for="item in searchResults"
              :key="item.id"
              @click="handleProductClick(item)"
              class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 transition-colors text-left"
            >
              <div class="w-full h-20 bg-slate-100 dark:bg-slate-700 rounded-lg mb-2 flex items-center justify-center relative">
                <Package class="w-8 h-8 text-slate-400" />
                <span 
                  v-if="Number(item.total_quantity) > 0"
                  class="absolute top-1 right-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  :class="Number(item.total_quantity) <= 5 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'"
                >
                  {{ Number.isInteger(Number(item.total_quantity)) ? Number(item.total_quantity) : Number(item.total_quantity).toFixed(2) }}
                </span>
                <span 
                  v-else
                  class="absolute top-1 right-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                >
                  0
                </span>
              </div>
              <p class="font-medium text-slate-900 dark:text-white text-sm truncate">{{ item.name }}</p>
              <p class="text-xs text-slate-500 mb-1">{{ item.item_number }}</p>
              <p class="font-semibold text-brand-600 dark:text-brand-400">{{ formatMoney(item.unit_price) }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Panel -->
    <div class="w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <!-- Cart Header -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart class="w-5 h-5" />
            Carrito
          </h2>
          <span class="text-sm text-slate-500">{{ cartItems.length }} items</span>
        </div>
        
        <!-- Customer -->
        <div v-if="!selectedCustomer" class="mb-3">
          <button
            @click="showCustomerSearch = !showCustomerSearch"
            class="w-full px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center justify-center gap-2"
          >
            <User class="w-4 h-4" />
            Agregar cliente
          </button>
          <div v-if="showCustomerSearch" class="mt-2">
            <input
              v-model="customerSearchQuery"
              @input="searchCustomers(customerSearchQuery)"
              type="text"
              placeholder="Buscar cliente..."
              class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400"
            />
            <div v-if="customers.length > 0" class="mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg max-h-40 overflow-y-auto shadow-lg">
              <button
                v-for="c in customers"
                :key="c.id"
                @click="selectCustomer(c)"
                class="w-full px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <p class="font-medium text-slate-900 dark:text-white">{{ c.first_name }} {{ c.last_name }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ c.email }}</p>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="mb-3 flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
          <div>
            <p class="font-semibold text-brand-900 dark:text-white text-sm">
              {{ selectedCustomer.first_name }} {{ selectedCustomer.last_name }}
            </p>
            <p class="text-xs text-brand-600 dark:text-brand-400">{{ selectedCustomer.email }}</p>
          </div>
          <button @click="clearCustomer" class="p-1.5 text-brand-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="cartItems.length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400">
          <ShoppingCart class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Carrito vacío</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="(item, index) in cartItems" :key="index" class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div class="flex justify-between items-start mb-2">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-900 dark:text-white text-sm truncate">{{ item.item_name }}</p>
                <p class="text-xs text-slate-500">{{ item.item_number }}</p>
              </div>
              <button @click="removeFromCart(index)" class="text-slate-400 hover:text-red-500">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button @click="updateQuantity(index, -1)" class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-brand-100 dark:hover:bg-brand-900/30">
                  <Minus class="w-3 h-3" />
                </button>
                <span class="w-14 text-center font-medium text-slate-900 dark:text-white">
                  {{ item.quantity }} <span class="text-xs text-slate-500">{{ item.unit_abbreviation || 'und' }}</span>
                </span>
                <button @click="updateQuantity(index, 1)" class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-brand-100 dark:hover:bg-brand-900/30">
                  <Plus class="w-3 h-3" />
                </button>
              </div>
              <div class="text-right">
                <p class="font-semibold text-slate-900 dark:text-white">{{ formatMoney(item.line_total) }}</p>
                <p v-if="item.discount_amount > 0" class="text-xs text-green-600">Desc: {{ formatMoney(item.discount_amount) }}</p>
              </div>
            </div>
            <div class="mt-2 flex items-center gap-1">
              <label class="text-xs text-slate-500 whitespace-nowrap">Descuento:</label>
              <input
                :value="getDiscountDisplay(index, item.discount_amount)"
                @input="e => onDiscountInput(index, e)"
                @focus="e => onDiscountFocus(index, e)"
                @blur="() => onDiscountBlur(index)"
                type="text"
                placeholder="0.00"
                class="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Cart Footer -->
      <div class="p-4 border-t border-slate-200 dark:border-slate-800">
        <div class="space-y-2 mb-4">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Subtotal</span>
            <span class="text-slate-900 dark:text-white">{{ formatMoney(subtotal) }}</span>
          </div>
          <div v-if="totalDiscount > 0" class="flex justify-between text-sm">
            <span class="text-slate-500">Descuentos</span>
            <span class="text-green-600">-{{ formatMoney(totalDiscount) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold">
            <span class="text-slate-900 dark:text-white">Total</span>
            <span class="text-brand-600 dark:text-brand-400">{{ formatMoney(total) }}</span>
          </div>
        </div>
        
        <div class="space-y-2">
          <button
            @click="openPaymentModal"
            :disabled="cartItems.length === 0"
            class="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard class="w-4 h-4" />
            Cobrar
          </button>
          <div class="flex gap-2">
            <button
              @click="customerDisplayOpen ? closeCustomerDisplay() : openCustomerDisplay()"
              class="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              :class="customerDisplayOpen ? 'bg-brand-100 dark:bg-brand-900/30 border-brand-300 text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'"
              :title="customerDisplayOpen ? 'Cerrar pantalla del cliente' : 'Abrir pantalla del cliente'"
            >
              <Tv class="w-4 h-4" />
            </button>
            <button
              @click="suspendSale"
              :disabled="cartItems.length === 0"
              class="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save class="w-4 h-4" />
              Suspender
            </button>
            <button
              @click="resetSale"
              :disabled="cartItems.length === 0"
              class="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <Teleport to="body">
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showPaymentModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pago</h2>
          
          <div class="space-y-4 mb-6">
            <div class="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-slate-600 dark:text-slate-400">Total a pagar</span>
                <span class="text-2xl font-bold text-brand-600 dark:text-brand-400">{{ formatMoney(total) }}</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Método de pago</label>
              <select
                v-model="paymentMethod"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="cash">Efectivo</option>
                <option value="credit">Tarjeta de Crédito</option>
                <option value="debit">Tarjeta de Débito</option>
                <!-- <option value="check">Cheque</option> -->
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto pagado</label>
              <input
                :value="amountPaidDisplay"
                @input="onAmountPaidInput"
                @focus="onAmountPaidFocus"
                @blur="onAmountPaidBlur"
                type="text"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-semibold"
                :class="{ 'border-red-500 focus:border-red-500': amountPaid > 0 && amountPaid < total }"
              />
              <p v-if="amountPaid > 0 && amountPaid < total" class="text-xs text-red-500 mt-1">
                Falta {{ formatMoney(total - amountPaid) }} para completar el pago
              </p>
            </div>
            <div class="flex justify-between text-lg font-bold p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <span class="text-slate-700 dark:text-slate-300">Cambio</span>
              <span class="text-green-600">{{ formatMoney(change) }}</span>
            </div>
          </div>

          <div class="flex gap-3">
            <button
              @click="showPaymentModal = false"
              class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              @click="processSale"
              :disabled="processingSale"
              class="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Loader2 v-if="processingSale" class="w-4 h-4 animate-spin" />
              {{ processingSale ? 'Procesando...' : 'Finalizar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Unit Selection Modal -->
    <Teleport to="body">
      <div v-if="showUnitModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showUnitModal = false; selectedProductForUnit = null; selectedProductUnits = []"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl">
          <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Seleccionar Unidad</h2>
            <button @click="showUnitModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-4">
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">{{ selectedProductForUnit?.name }}</p>
            <div class="space-y-2">
              <button
                v-for="unit in selectedProductUnits"
                :key="unit.id"
                @click="selectUnitAndAdd(unit)"
                class="w-full p-4 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-left"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-slate-900 dark:text-white">{{ unit.unit_name }}</p>
                    <p class="text-sm text-slate-500">{{ unit.unit_abbreviation }}</p>
                  </div>
                  <p class="font-semibold text-brand-600 dark:text-brand-400">{{ formatMoney(unit.price) }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Variable Sale Modal -->
    <Teleport to="body">
      <div v-if="showVariableModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showVariableModal = false; selectedProductForUnit = null;"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl">
          <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Venta por Peso</h2>
            <button @click="showVariableModal = false" class="p-1 text-slate-400 hover:text-slate-600">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="p-4 space-y-4">
            <div>
              <p class="font-medium text-slate-900 dark:text-white">{{ selectedProductForUnit?.name }}</p>
              <p class="text-sm text-slate-500">
                {{ formatMoney(variableMinPrice / variableQuantity) }} por {{ variableUnit?.unit_abbreviation || 'unidad' }}
              </p>
            </div>

            <div class="flex gap-3">
              <div class="flex-1">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cantidad</label>
                <input
                  v-model.number="variableQuantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unidad</label>
                <select
                  v-model="variableUnit"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option
                    v-for="unit in selectedProductUnits"
                    :key="unit.id"
                    :value="unit"
                  >
                    {{ unit.unit_name }} ({{ unit.unit_abbreviation }})
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Precio (mínimo: {{ formatMoney(variableMinPrice) }})
              </label>
              <input
                :value="variableCustomPriceDisplay"
                @input="onVariablePriceInput"
                @focus="onVariablePriceFocus"
                @blur="onVariablePriceBlur"
                type="text"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-lg font-semibold"
              />
            </div>

            <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
              <p class="text-sm text-slate-500">Total</p>
              <p class="text-2xl font-bold text-brand-600 dark:text-brand-400">{{ formatMoney(variableCalculatedPrice) }}</p>
            </div>

            <button
              @click="confirmVariableSale"
              class="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
            >
              Agregar al Carrito
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Drawer Required Modal -->
    <Teleport to="body">
      <div v-if="showDrawerRequiredModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showDrawerRequiredModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock class="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">Caja Cerrada</h2>
            <p class="text-slate-500 dark:text-slate-400 mb-6">
              Para procesar ventas es necesario abrir la caja primero.
            </p>
            <div class="flex gap-3">
              <button
                @click="showDrawerRequiredModal = false"
                class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                @click="showDrawerRequiredModal = false; router.push('/caja')"
                class="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Unlock class="w-4 h-4" />
                Abrir Caja
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

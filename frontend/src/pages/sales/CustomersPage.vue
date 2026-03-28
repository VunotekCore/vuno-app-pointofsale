<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { useDebounce } from '../../composables/useDebounce.js'
import { usePhoneFormatter } from '../../utils/phone.utils.js'
import { customersService } from '../../services/sales.service.js'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  User,
  Search,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Star,
  CreditCard,
  ToggleLeft,
  ToggleRight
} from 'lucide-vue-next'

const { formatPhoneOnBlur } = usePhoneFormatter()

const notification = useNotificationStore()
const currency = useCurrencyStore()

const customers = ref([])
const groups = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const activeFilter = ref('')
const currentPage = ref(1)
const pageLimit = ref(20)
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadCustomers()
}, 300)

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  company: '',
  tax_id: '',
  address: '',
  city: '',
  state: '',
  country: 'Mexico',
  postal_code: '',
  customer_group_id: null,
  credit_limit: 0,
  creditLimitDisplay: '0',
  price_tier: 1,
  tax_exempt: false,
  is_default: false,
  notes: '',
  is_active: true
})

function formatCreditLimitDisplay() {
  const decimals = currency.decimal_places || 2
  form.value.creditLimitDisplay = form.value.credit_limit.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

function onCreditLimitInput(e) {
  const val = e.target.value.replace(/[^0-9.]/g, '')
  const num = parseFloat(val)
  form.value.credit_limit = isNaN(num) ? 0 : currency.roundMoney(num)
  form.value.creditLimitDisplay = val
}

function onCreditLimitFocus(e) {
  e.target.select()
}

function onCreditLimitBlur() {
  formatCreditLimitDisplay()
}

async function loadCustomers() {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      search: searchQuery.value,
      is_active: activeFilter.value || undefined
    }
    const { data } = await customersService.getCustomers(params)
    customers.value = data.data || []
    totalRecords.value = data.total || 0
  } catch (error) {
    notification.error('Error al cargar clientes')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadCustomers()
  }
}

watch(searchQuery, () => {
  debouncedSearch()
})

watch(activeFilter, () => {
  currentPage.value = 1
  loadCustomers()
})

async function loadGroups() {
  try {
    const { data } = await customersService.getGroups()
    groups.value = data.data || []
  } catch (error) {
    console.error('Error loading groups:', error)
  }
}

function openModal(customer = null) {
  if (customer) {
    editingId.value = customer.id
    const creditLimit = parseFloat(customer.credit_limit) || 0
    const decimals = currency.decimal_places || 2
    form.value = { 
      ...customer, 
      credit_limit: creditLimit,
      creditLimitDisplay: creditLimit.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }),
      is_active: Boolean(customer.is_active),
      tax_exempt: Boolean(customer.tax_exempt),
      is_default: Boolean(customer.is_default)
    }
  } else {
    editingId.value = null
    form.value = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      tax_id: '',
      address: '',
      city: '',
      state: '',
      country: 'Mexico',
      postal_code: '',
      customer_group_id: null,
      credit_limit: 0,
      creditLimitDisplay: '0',
      price_tier: 1,
      tax_exempt: false,
      is_default: false,
      notes: '',
      is_active: true
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function saveCustomer() {
  try {
    if (editingId.value) {
      await customersService.updateCustomer(editingId.value, form.value)
      notification.success('Cliente actualizado')
    } else {
      await customersService.createCustomer(form.value)
      notification.success('Cliente creado')
    }
    closeModal()
    loadCustomers()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al guardar')
  }
}

async function toggleStatus(customer) {
  try {
    await customersService.toggleCustomerStatus(customer.id)
    notification.success('Estado actualizado')
    loadCustomers()
  } catch (error) {
    notification.error('Error al actualizar estado')
  }
}

async function deleteCustomer(customer) {
  window.$confirm(
    `¿Estás seguro de eliminar al cliente "${customer.first_name} ${customer.last_name}"?`,
    async () => {
      try {
        await customersService.deleteCustomer(customer.id)
        notification.success('Cliente eliminado')
        loadCustomers()
      } catch (error) {
        notification.error(error.response?.data?.message || 'Error al eliminar cliente')
      }
    },
    { title: 'Eliminar Cliente', type: 'danger', buttonLabel: 'Eliminar' }
  )
}

const filteredCustomers = computed(() => {
  return customers.value
})

onMounted(() => {
  loadCustomers()
  loadGroups()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Clientes</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestión de clientes y membresías</p>
      </div>
      <button
        @click="openModal()"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nuevo Cliente
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar clientes..."
              class="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
          </div>
        </div>
        <select
          v-model="activeFilter"
          class="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        >
          <option value="">Todos</option>
          <option value="1">Activos</option>
          <option value="0">Inactivos</option>
        </select>
      </div>
    </div>

    <!-- Grid para renderizar cada car de cliente en sistema -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="loading" class="col-span-full p-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
      </div>
      <div
        v-for="customer in filteredCustomers"
        :key="customer.id"
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
      >
        <!-- Header -->
        <div class="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
              <User class="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-slate-900 dark:text-white truncate">
                {{ customer.first_name }} {{ customer.last_name }}
              </h3>
              <p v-if="customer.group_name" class="text-xs text-slate-500 dark:text-slate-400 truncate">
                {{ customer.group_name }}
              </p>
            </div>
          </div>
          <button
            @click="toggleStatus(customer)"
            class="text-slate-400 hover:text-brand-500 transition-colors flex-shrink-0 ml-2"
            :title="customer.is_active ? 'Desactivar' : 'Activar'"
          >
            <ToggleRight v-if="customer.is_active" class="w-5 h-5 text-green-500" />
            <ToggleLeft v-else class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-4 flex-1 space-y-2 text-sm">
          <div v-if="customer.email" class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Mail class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">{{ customer.email }}</span>
          </div>
          <div v-if="customer.phone" class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Phone class="w-4 h-4 flex-shrink-0" />
            <span>{{ customer.phone }}</span>
          </div>
          <div v-if="customer.points_balance > 0" class="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Star class="w-4 h-4 flex-shrink-0" />
            <span>{{ customer.points_balance }} puntos</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            @click="openModal(customer)"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Pencil class="w-4 h-4" />
            Editar
          </button>
          <button
            @click="deleteCustomer(customer)"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 class="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredCustomers.length === 0" class="text-center py-12 text-slate-500 dark:text-slate-400">
      No hay clientes registrados
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} cliente{{ totalRecords !== 1 ? 's' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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
        <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ editingId ? 'Editar Cliente' : 'Nuevo Cliente' }}
            </h2>
            <button @click="closeModal" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>
          <form @submit.prevent="saveCustomer" class="p-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
                <input
                  v-model="form.first_name"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Apellido</label>
                <input
                  v-model="form.last_name"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  @blur="formatPhoneOnBlur"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Empresa</label>
                <input
                  v-model="form.company"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RFC/Tax ID</label>
                <input
                  v-model="form.tax_id"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
              <textarea
                v-model="form.address"
                rows="2"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              ></textarea>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ciudad</label>
                <input
                  v-model="form.city"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                <input
                  v-model="form.state"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código Postal</label>
                <input
                  v-model="form.postal_code"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grupo</label>
                <select
                  v-model="form.customer_group_id"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option :value="null">Sin grupo</option>
                  <option v-for="group in groups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Límite de Crédito</label>
                <input
                  :value="form.creditLimitDisplay"
                  @input="onCreditLimitInput"
                  @focus="onCreditLimitFocus"
                  @blur="onCreditLimitBlur"
                  type="text"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notas</label>
              <textarea
                v-model="form.notes"
                rows="2"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              ></textarea>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="form.tax_exempt"
                type="checkbox"
                id="tax_exempt"
                class="w-4 h-4 text-brand-500 rounded"
              />
              <label for="tax_exempt" class="text-sm text-slate-700 dark:text-slate-300">Exento de impuestos</label>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model="form.is_default"
                type="checkbox"
                id="is_default"
                class="w-4 h-4 text-brand-500 rounded"
              />
              <label for="is_default" class="text-sm text-slate-700 dark:text-slate-300">Cliente por defecto</label>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors"
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

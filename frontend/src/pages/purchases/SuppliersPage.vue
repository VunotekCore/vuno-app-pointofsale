<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useDebounce } from '../../composables/useDebounce.js'
import { usePhoneFormatter } from '../../utils/phone.utils.js'
import { purchaseService } from '../../services/purchase.service.js'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Truck,
  Search,
  Loader2,
  Mail,
  Phone,
  MapPin
} from 'lucide-vue-next'

const { formatPhoneOnBlur } = usePhoneFormatter()

const notification = useNotificationStore()

const suppliers = ref([])
const loading = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageLimit = ref(50)
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadSuppliers()
}, 300)

const form = ref({
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  address: '',
  rfc: '',
  payment_terms: '30 días',
  is_active: true
})

const filteredSuppliers = computed(() => {
  return suppliers.value
})

async function loadSuppliers() {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      search: searchQuery.value,
      is_active: statusFilter.value || undefined
    }
    const { data } = await purchaseService.getSuppliers(params)
    suppliers.value = data.data || []
    totalRecords.value = data.total || 0
  } catch (error) {
    notification.error('Error al cargar proveedores')
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadSuppliers()
  }
}

watch(searchQuery, () => {
  debouncedSearch()
})

watch(statusFilter, () => {
  currentPage.value = 1
  loadSuppliers()
})

function openModal(supplier = null) {
  if (supplier) {
    editingId.value = supplier.id
    form.value = { 
      ...supplier, 
      is_active: Boolean(supplier.is_active) 
    }
  } else {
    editingId.value = null
    form.value = {
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      is_active: true
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingId.value = null
}

async function saveSupplier() {
  try {
    if (editingId.value) {
      await purchaseService.updateSupplier(editingId.value, form.value)
      notification.success('Proveedor actualizado')
    } else {
      await purchaseService.createSupplier(form.value)
      notification.success('Proveedor creado')
    }
    closeModal()
    loadSuppliers()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al guardar')
  }
}

async function deleteSupplier(id) {
  window.$confirm(
    '¿Está seguro de eliminar este proveedor?',
    async () => {
      try {
        await purchaseService.deleteSupplier(id)
        notification.success('Proveedor eliminado')
        loadSuppliers()
      } catch (error) {
        notification.error('Error al eliminar')
      }
    },
    { type: 'danger', title: 'Eliminar Proveedor', buttonLabel: 'Eliminar' }
  )
}

onMounted(loadSuppliers)
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Proveedores</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestión de proveedores</p>
      </div>
      <button
        @click="openModal()"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nuevo Proveedor
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-wrap gap-4 mb-4">
      <div class="flex-1 min-w-[200px] relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar proveedores..."
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

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="loading" class="col-span-full p-8 flex justify-center">
        <Loader2 class="w-6 h-6 animate-spin text-brand-500" />
      </div>
      <div
        v-for="supplier in filteredSuppliers"
        :key="supplier.id"
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Truck class="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">{{ supplier.name }}</h3>
              <p v-if="supplier.contact_name" class="text-xs text-slate-500">{{ supplier.contact_name }}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="openModal(supplier)"
              class="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              @click="deleteSupplier(supplier.id)"
              class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="space-y-2 text-sm">
          <div v-if="supplier.email" class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Mail class="w-3.5 h-3.5" />
            <span class="truncate">{{ supplier.email }}</span>
          </div>
          <div v-if="supplier.phone" class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Phone class="w-3.5 h-3.5" />
            <span>{{ supplier.phone }}</span>
          </div>
          <div v-if="supplier.address" class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <MapPin class="w-3.5 h-3.5 flex-shrink-0" />
            <span class="truncate">{{ supplier.address }}</span>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span
            :class="supplier.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
            class="px-2 py-0.5 rounded-md text-xs font-medium"
          >
            {{ supplier.is_active ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
      </div>
      <div v-if="!loading && filteredSuppliers.length === 0" class="col-span-full p-8 text-center text-slate-400">
        <Truck class="w-8 h-8 mx-auto mb-2 opacity-50" />
        No hay proveedores
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl text-slate-700 dark:text-slate-300">
      <div class="text-sm font-medium">
        {{ totalRecords }} proveedor{{ totalRecords !== 1 ? 'es' : '' }} | Página {{ currentPage }} de {{ totalPages }}
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
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md">
          <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ editingId ? 'Editar' : 'Nuevo' }} Proveedor
            </h2>
            <button @click="closeModal" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>
          <form @submit.prevent="saveSupplier" class="p-4 space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Persona de Contacto</label>
              <input
                v-model="form.contact_name"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  @blur="formatPhoneOnBlur"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
              <textarea
                v-model="form.address"
                rows="2"
                class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              ></textarea>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500"
              />
              <span class="text-sm text-slate-700 dark:text-slate-300">Activo</span>
            </label>
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

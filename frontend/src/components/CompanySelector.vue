<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useTenantStore } from '../stores/tenant.store.js'
import { usePlatformAuthStore } from '../stores/platform-auth.store.js'
import { platformService } from '../services/platform.service.js'
import { Building2, ChevronDown, Loader2, Check, X } from 'lucide-vue-next'

const emit = defineEmits(['change'])

const tenantStore = useTenantStore()
const platformAuth = usePlatformAuthStore()

const isOpen = ref(false)
const loading = ref(false)
const showCreateModal = ref(false)

const form = ref({
  name: ''
})

onMounted(async () => {
  if (platformAuth.isAuthenticated) {
    await tenantStore.loadCompanies()
    
    if (!tenantStore.selectedCompanyId && tenantStore.companies.length > 0) {
      const defaultCompany = tenantStore.companies.find(c => c.is_default) || tenantStore.companies[0]
      if (defaultCompany) {
        tenantStore.selectCompany(defaultCompany.id)
      }
    }
  }
})

const selectedCompany = computed(() => {
  if (!tenantStore.selectedCompanyId) return null
  return tenantStore.companies.find(c => c.id === tenantStore.selectedCompanyId)
})

async function selectCompany(company) {
  tenantStore.selectCompany(company.id)
  isOpen.value = false
  emit('change', company)
}

async function createCompany() {
  if (!form.value.name.trim()) return

  loading.value = true
  try {
    await platformService.createCompany({ name: form.value.name.trim() })
    await tenantStore.loadCompanies()
    showCreateModal.value = false
    form.value.name = ''
  } catch (error) {
    console.error('Error creating company:', error)
  } finally {
    loading.value = false
  }
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div v-if="platformAuth.isAuthenticated && platformAuth.isSuperAdmin" class="relative">
    <button
      @click="toggleDropdown"
      class="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-500 transition-colors"
    >
      <Building2 class="w-4 h-4 text-brand-500" />
      <div class="text-left">
        <p v-if="selectedCompany" class="text-sm font-medium text-slate-900 dark:text-white">
          {{ selectedCompany.name }}
        </p>
        <p v-else class="text-sm text-slate-400">
          Seleccionar empresa
        </p>
      </div>
      <ChevronDown class="w-4 h-4 text-slate-400" :class="{ 'rotate-180': isOpen }" />
    </button>

    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
      >
        <div class="p-2 border-b border-slate-100 dark:border-slate-700">
          <input
            type="text"
            placeholder="Buscar empresa..."
            class="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div class="max-h-64 overflow-y-auto p-2">
          <button
            v-for="company in tenantStore.companies"
            :key="company.id"
            @click="selectCompany(company)"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            :class="{ 'bg-brand-50 dark:bg-brand-900/20': company.id === tenantStore.selectedCompanyId }"
          >
            <div class="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center">
              <Building2 class="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div class="flex-1 text-left">
              <p class="text-sm font-medium text-slate-900 dark:text-white">{{ company.name }}</p>
              <p class="text-xs text-slate-500">{{ company.slug }}</p>
            </div>
            <Check
              v-if="company.id === tenantStore.selectedCompanyId"
              class="w-4 h-4 text-brand-500"
            />
          </button>

          <div v-if="tenantStore.companies.length === 0" class="p-4 text-center">
            <p class="text-sm text-slate-500">No hay empresas disponibles</p>
          </div>
        </div>

        <div class="p-2 border-t border-slate-100 dark:border-slate-700">
          <button
            @click="showCreateModal = true; isOpen = false"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
          >
            <Building2 class="w-4 h-4" />
            Crear nueva empresa
          </button>
        </div>
      </div>
    </Transition>

    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    ></div>

    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showCreateModal = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Nueva Empresa
          </h2>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nombre de la empresa
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Mi Empresa S.A."
              class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              @keyup.enter="createCompany"
            />
          </div>

          <div class="flex gap-3 mt-6">
            <button
              @click="showCreateModal = false"
              class="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              @click="createCompany"
              :disabled="loading || !form.name.trim()"
              class="flex-1 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              Crear
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

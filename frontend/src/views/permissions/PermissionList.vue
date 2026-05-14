<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api.service.js'
import { useNotificationStore } from '../../stores/notification.store.js'
import { Loader2, Database, LayoutDashboard } from 'lucide-vue-next'
import Pagination from '../../components/Pagination.vue'

const router = useRouter()
const notification = useNotificationStore()

const allPermissions = ref([])
const loading = ref(true)

const search = ref('')
const actionFilter = ref('all')
const tablePage = ref(1)
const tablePageSize = ref(20)

const viewSearch = ref('')
const syncingViews = ref(false)
const viewPage = ref(1)
const viewPageSize = ref(20)

const tablePermissions = computed(() => {
  let result = allPermissions.value.filter(p => !p.code.startsWith('view.') && !p.code.startsWith('menu.'))
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(p =>
      p.code.toLowerCase().includes(searchLower) ||
      (p.name || '').toLowerCase().includes(searchLower)
    )
  }
  if (actionFilter.value !== 'all') {
    result = result.filter(p => p.code.includes(`.${actionFilter.value}`))
  }
  return result
})

const viewPermissions = computed(() => {
  let result = allPermissions.value.filter(p => p.code.startsWith('view.'))
  if (viewSearch.value) {
    const searchLower = viewSearch.value.toLowerCase()
    result = result.filter(p =>
      p.code.toLowerCase().includes(searchLower) ||
      (p.name || '').toLowerCase().includes(searchLower)
    )
  }
  return result
})

const paginatedTablePerms = computed(() => {
  const start = (tablePage.value - 1) * tablePageSize.value
  return tablePermissions.value.slice(start, start + tablePageSize.value)
})

const tableTotalRecords = computed(() => tablePermissions.value.length)

const paginatedViewPerms = computed(() => {
  const start = (viewPage.value - 1) * viewPageSize.value
  return viewPermissions.value.slice(start, start + viewPageSize.value)
})

const viewTotalRecords = computed(() => viewPermissions.value.length)

const fetchAllPermissions = async () => {
  try {
    loading.value = true
    const response = await api.get('/permissions', { params: { limit: 0 } })
    allPermissions.value = response.data.data || []
  } catch (error) {
    notification.error('Error al cargar permisos')
  } finally {
    loading.value = false
  }
}

const onTablePageChange = (page) => { tablePage.value = page }
const onTableLimitChange = (limit) => { tablePageSize.value = limit; tablePage.value = 1 }
const onViewPageChange = (page) => { viewPage.value = page }
const onViewLimitChange = (limit) => { viewPageSize.value = limit; viewPage.value = 1 }

const syncTables = async () => {
  try {
    const response = await api.post('/permissions/detect')
    const data = response.data.data
    if (response.data.success) {
      if (data.newCount > 0) {
        notification.success(`+${data.newCount} permisos actualizados`)
      } else {
        notification.info('No se detectaron cambios')
      }
      await fetchAllPermissions()
    }
  } catch (error) {
    notification.error('Error al sincronizar tablas')
  }
}

const syncViews = async () => {
  try {
    syncingViews.value = true
    const mainRoute = router.options.routes.find(r => r.path === '/')
    const routes = mainRoute?.children
      .filter(r => r.name && r.path !== undefined)
      .map(r => ({
        name: r.name,
        path: r.path === '' ? 'dashboard' : r.path,
        permission: `view.${r.path === '' ? 'dashboard' : r.path.replace(/\//g, '_').replace(/-/g, '_')}`
      })) || []

    const response = await api.post('/permissions/detect-views', { routes })
    const data = response.data.data
    if (response.data.success) {
      if (data.newCount > 0) {
        notification.success(`+${data.newCount} vistas detectadas`)
      } else {
        notification.info('No se detectaron cambios en vistas')
      }
      await fetchAllPermissions()
    }
  } catch (error) {
    notification.error('Error al sincronizar vistas')
  } finally {
    syncingViews.value = false
  }
}

onMounted(() => { fetchAllPermissions() })

watch([search, actionFilter], () => { tablePage.value = 1 })
watch(viewSearch, () => { viewPage.value = 1 })
</script>

<template>
  <div>
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <Database class="w-5 h-5 text-brand-500" />
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Permisos de Tablas</h2>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
        <div class="p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 flex-1 max-w-md">
              <input v-model="search" placeholder="Buscar permisos..." class="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />
              <select v-model="actionFilter" class="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100">
                <option value="all">Todas</option>
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <button @click="syncTables" :disabled="loading" class="btn-primary flex items-center gap-2 whitespace-nowrap">
              <Database class="w-4 h-4" /> {{ loading ? 'Sincronizando...' : 'Detectar Tablas' }}
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div v-if="loading" class="p-8 flex justify-center"><Loader2 class="w-6 h-6 animate-spin text-brand-500" /></div>
        <div v-if="!loading && tablePermissions.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">No se encontraron permisos</div>
        <div v-if="!loading && tablePermissions.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Código</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Nombre</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Descripción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr v-for="permission in paginatedTablePerms" :key="permission.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-3"><span class="font-mono text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{{ permission.code }}</span></td>
                <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ permission.name || permission.code }}</td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400">{{ permission.description || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Pagination v-if="tableTotalRecords > 0" class="mt-4" :current-page="tablePage" :page-size="tablePageSize" :total-pages="Math.ceil(tableTotalRecords / tablePageSize)" :total-records="tableTotalRecords" @page-change="onTablePageChange" @limit-change="onTableLimitChange" />
      <div v-else class="mt-4 text-center text-sm text-slate-400">No hay permisos de tablas</div>
    </div>

    <div class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <LayoutDashboard class="w-5 h-5 text-brand-500" />
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Permisos de Vistas UI</h2>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
        <div class="p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 max-w-md">
              <input v-model="viewSearch" placeholder="Buscar vistas..." class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />
            </div>
            <button @click="syncViews" :disabled="syncingViews" class="btn-primary flex items-center gap-2 whitespace-nowrap">
              <LayoutDashboard class="w-4 h-4" /> {{ syncingViews ? 'Sincronizando...' : 'Detectar Vistas' }}
            </button>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div v-if="loading" class="p-8 flex justify-center"><Loader2 class="w-6 h-6 animate-spin text-brand-500" /></div>
        <div v-if="!loading && viewPermissions.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">No se encontraron permisos de vistas. Haz clic en "Detectar Vistas" para sincronizar.</div>
        <div v-if="!loading && viewPermissions.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Código</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Nombre</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Descripción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr v-for="permission in paginatedViewPerms" :key="permission.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-3"><span class="font-mono text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{{ permission.code }}</span></td>
                <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ permission.name || permission.code }}</td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400">{{ permission.description || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Pagination v-if="viewTotalRecords > 0" class="mt-4" :current-page="viewPage" :page-size="viewPageSize" :total-pages="Math.ceil(viewTotalRecords / viewPageSize)" :total-records="viewTotalRecords" @page-change="onViewPageChange" @limit-change="onViewLimitChange" />
      <div v-else class="mt-4 text-center text-sm text-slate-400">No hay permisos de vistas</div>
    </div>
  </div>
</template>
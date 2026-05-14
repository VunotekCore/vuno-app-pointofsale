<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '../../services/api.service.js'
import { useNotificationStore } from '../../stores/notification.store.js'
import { Loader2, Shield, Check } from 'lucide-vue-next'
import Pagination from '../../components/Pagination.vue'

const notification = useNotificationStore()

const permissions = ref([])
const roles = ref([])
const loading = ref(true)
const saving = ref(false)
const selectedRoleId = ref('')
const rolePermissions = ref({})
const searchRoles = ref('')

const tablePage = ref(1)
const tablePageSize = ref(10)
const viewPage = ref(1)
const viewPageSize = ref(10)

const tablePermissions = computed(() =>
  permissions.value.filter(p => {
    if (p.code.startsWith('view.') || p.code.startsWith('menu.')) return false
    const table = p.code?.split('.')[0]
    return table !== 'permissions'
  })
)

const viewPermissions = computed(() =>
  permissions.value.filter(p => p.code.startsWith('view.') && p.code !== 'view.permissions')
)

const groupedTablePerms = computed(() => {
  const groups = {}
  const term = searchRoles.value.toLowerCase()
  for (const perm of tablePermissions.value) {
    const table = perm.code?.split('.')[0] || 'other'
    if (term && !table.toLowerCase().includes(term)) continue
    if (!groups[table]) groups[table] = { read: null, write: null, delete: null }
    const action = perm.code?.split('.')[1]
    if (action === 'read') groups[table].read = perm
    else if (action === 'write') groups[table].write = perm
    else if (action === 'delete') groups[table].delete = perm
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
})

const groupedViewPerms = computed(() => {
  const groups = {}
  for (const perm of viewPermissions.value) {
    const parts = perm.code?.split('.')
    if (parts?.[0] === 'view' && parts?.[1]) {
      groups[parts[1]] = { access: perm }
    }
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
})

const paginatedTableGroups = computed(() => {
  const start = (tablePage.value - 1) * tablePageSize.value
  return groupedTablePerms.value.slice(start, start + tablePageSize.value)
})

const tableTotalRecords = computed(() => groupedTablePerms.value.length)

const paginatedViewGroups = computed(() => {
  const start = (viewPage.value - 1) * viewPageSize.value
  return groupedViewPerms.value.slice(start, start + viewPageSize.value)
})

const viewTotalRecords = computed(() => groupedViewPerms.value.length)

const fetchPermissions = async () => {
  try {
    loading.value = true
    const response = await api.get('/permissions', { params: { limit: 0 } })
    permissions.value = response.data.data || []
  } catch (error) {
    notification.error('Error al cargar permisos')
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const response = await api.get('/roles')
    roles.value = response.data.data || []
  } catch (error) {
    notification.error('Error al cargar roles')
  }
}

const fetchRolePermissions = async (roleId) => {
  if (!roleId) return
  try {
    loading.value = true
    const response = await api.get(`/permissions/role/${roleId}`)
    const perms = response.data.data || []
    const newRolePermissions = {}
    for (const p of perms) {
      newRolePermissions[p.permission_id || p.id] = true
    }
    rolePermissions.value = newRolePermissions
  } catch (error) {
    rolePermissions.value = {}
  } finally {
    loading.value = false
  }
}

const hasRolePermission = (permId) => rolePermissions.value[permId] === true

const toggleRolePermission = (permId) => {
  if (selectedRoleId.value) {
    rolePermissions.value[permId] = !rolePermissions.value[permId]
  }
}

const saveRolePermissions = async () => {
  if (!selectedRoleId.value) { notification.warning('Selecciona un rol primero'); return }
  try {
    saving.value = true
    const permIds = Object.entries(rolePermissions.value).filter(([_, v]) => v).map(([id]) => id)
    await api.put(`/permissions/role/${selectedRoleId.value}`, { permissionIds: permIds })
    notification.success('Permisos del rol guardados')
    await fetchRolePermissions(selectedRoleId.value)
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al guardar permisos')
  } finally {
    saving.value = false
  }
}

const onTablePageChange = (page) => { tablePage.value = page }
const onTableLimitChange = (limit) => { tablePageSize.value = limit; tablePage.value = 1 }
const onViewPageChange = (page) => { viewPage.value = page }
const onViewLimitChange = (limit) => { viewPageSize.value = limit; viewPage.value = 1 }

watch(searchRoles, () => { tablePage.value = 1; viewPage.value = 1 })

onMounted(async () => {
  await fetchPermissions()
  await fetchRoles()
  if (roles.value.length > 0) {
    selectedRoleId.value = roles.value[0].id
    await fetchRolePermissions(selectedRoleId.value)
  }
})
</script>

<template>
  <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
    <div class="p-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <Shield class="w-5 h-5 text-brand-600" />
          <span class="font-medium text-slate-900 dark:text-white">Asignar Permisos a Rol</span>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="searchRoles" placeholder="Buscar tabla..." class="w-48 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />
          <select v-model="selectedRoleId" @change="fetchRolePermissions(selectedRoleId)" class="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100">
            <option value="" disabled>Seleccionar rol...</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
          </select>
          <button @click="saveRolePermissions" :disabled="saving || !selectedRoleId" class="btn-primary flex items-center gap-1 px-3 py-2">
            <Check class="w-4 h-4" /> {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!selectedRoleId" class="p-8 text-center text-slate-500 dark:text-slate-400">Selecciona un rol para asignar permisos</div>

    <template v-else>
      <div class="mb-8">
        <div class="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Permisos de Tablas</h3>
        </div>
        <div v-if="paginatedTableGroups.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">No se encontraron tablas</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase w-48">Tabla</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Lectura</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Escritura</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Eliminar</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr v-for="[tableName, perms] in paginatedTableGroups" :key="tableName" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-3"><span class="font-medium text-slate-900 dark:text-white capitalize">{{ tableName }}</span></td>
                <td class="px-4 py-3 text-center">
                  <button v-if="perms.read" @click="toggleRolePermission(perms.read.id)" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="hasRolePermission(perms.read.id) ? 'bg-green-500' : 'bg-red-500'">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="hasRolePermission(perms.read.id) ? 'translate-x-6' : 'translate-x-1'" />
                  </button>
                  <span v-else class="text-slate-300">-</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <button v-if="perms.write" @click="toggleRolePermission(perms.write.id)" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="hasRolePermission(perms.write.id) ? 'bg-green-500' : 'bg-red-500'">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="hasRolePermission(perms.write.id) ? 'translate-x-6' : 'translate-x-1'" />
                  </button>
                  <span v-else class="text-slate-300">-</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <button v-if="perms.delete" @click="toggleRolePermission(perms.delete.id)" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="hasRolePermission(perms.delete.id) ? 'bg-green-500' : 'bg-red-500'">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="hasRolePermission(perms.delete.id) ? 'translate-x-6' : 'translate-x-1'" />
                  </button>
                  <span v-else class="text-slate-300">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination v-if="tableTotalRecords > 0" class="m-4" :current-page="tablePage" :page-size="tablePageSize" :total-pages="Math.ceil(tableTotalRecords / tablePageSize)" :total-records="tableTotalRecords" @page-change="onTablePageChange" @limit-change="onTableLimitChange" />
      </div>

      <div class="mb-8">
        <div class="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Permisos de Vistas UI</h3>
        </div>
        <div v-if="paginatedViewGroups.length === 0" class="p-8 text-center text-slate-500 dark:text-slate-400">No se encontraron vistas UI</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase w-48">Vista</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Acceso</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr v-for="[resourceName, perms] in paginatedViewGroups" :key="resourceName" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-3"><span class="font-medium text-slate-900 dark:text-white capitalize">{{ resourceName }}</span></td>
                <td class="px-4 py-3 text-center">
                  <button v-if="perms.access" @click="toggleRolePermission(perms.access.id)" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors" :class="hasRolePermission(perms.access.id) ? 'bg-green-500' : 'bg-red-500'">
                    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" :class="hasRolePermission(perms.access.id) ? 'translate-x-6' : 'translate-x-1'" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination v-if="viewTotalRecords > 0" class="m-4" :current-page="viewPage" :page-size="viewPageSize" :total-pages="Math.ceil(viewTotalRecords / viewPageSize)" :total-records="viewTotalRecords" @page-change="onViewPageChange" @limit-change="onViewLimitChange" />
      </div>
    </template>
  </div>
</template>

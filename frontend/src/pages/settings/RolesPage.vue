<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../services/api.service.js'
import { useNotificationStore } from '../../stores/notification.store.js'
import { MENU_SECTIONS, MENU_ITEMS } from '../../config/menu.config.js'
import { Plus, Trash2, X, Shield, Pencil, Eye, Edit, Trash, Database } from 'lucide-vue-next'

const notify = useNotificationStore()

const roles = ref([])
const menuPermissions = ref([])
const tablePermissions = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingRole = ref(null)
const newRole = ref({ name: '', description: '' })
const selectedMenuPermissions = ref([])
const selectedTablePermissions = ref([])

const roleFormTitle = computed(() => editingRole.value ? 'Editar Rol' : 'Nuevo Rol')

const menuSectionsConfig = computed(() => {
  return MENU_SECTIONS.map(section => ({
    ...section,
    items: MENU_ITEMS.filter(item => item.section === section.key)
  }))
})

const loadData = async () => {
  try {
    loading.value = true
    const [rolesRes, menuPermsRes, tablePermsRes] = await Promise.all([
      api.get('/roles'),
      api.get('/permissions/menu'),
      api.get('/permissions/grouped')
    ])
    roles.value = rolesRes.data.data || []
    menuPermissions.value = menuPermsRes.data.data || []
    tablePermissions.value = tablePermsRes.data.data || []
  } catch (error) {
    notify.error('Error al cargar datos')
  } finally {
    loading.value = false
  }
}

const loadRoleWithPermissions = async (role) => {
  try {
    const res = await api.get(`/roles/${role.id}/table-permissions`)
    return res.data.data
  } catch (error) {
    notify.error('Error al cargar permisos del rol')
    return null
  }
}

const openCreateModal = async () => {
  editingRole.value = null
  newRole.value = { name: '', description: '' }
  selectedMenuPermissions.value = []
  selectedTablePermissions.value = []
  showModal.value = true
}

const openEditModal = async (role) => {
  const roleWithPerms = await loadRoleWithPermissions(role)
  if (!roleWithPerms) return
  
  editingRole.value = role
  newRole.value = { name: role.name, description: role.description || '' }
  
  const enabledMenus = (roleWithPerms.menuPermissions || [])
    .filter(p => p.enabled)
    .map(p => p.code)
  selectedMenuPermissions.value = enabledMenus
  
  selectedTablePermissions.value = roleWithPerms.tablePermissions || []
  showModal.value = true
}

const saveRole = async () => {
  try {
    const payload = {
      name: newRole.value.name,
      description: newRole.value.description,
      menuPermissions: selectedMenuPermissions.value,
      tablePermissions: selectedTablePermissions.value
    }
    if (editingRole.value) {
      await api.put(`/roles/${editingRole.value.id}`, payload)
      notify.success('Rol actualizado')
    } else {
      await api.post('/roles', payload)
      notify.success('Rol creado')
    }
    showModal.value = false
    await loadData()
  } catch (error) {
    notify.error(error.response?.data?.message || 'Error al guardar rol')
  }
}

const deleteRole = async (id) => {
  window.$confirm(
    '¿Estás seguro de eliminar este rol?',
    async () => {
      try {
        await api.delete(`/roles/${id}`)
        notify.success('Rol eliminado')
        await loadData()
      } catch (error) {
        notify.error(error.response?.data?.message || 'Error al eliminar rol')
      }
    },
    { type: 'danger', title: 'Eliminar Rol', buttonLabel: 'Eliminar' }
  )
}

const isMenuPermissionEnabled = (permCode) => {
  return selectedMenuPermissions.value.includes(permCode)
}

const toggleMenuPermission = (permCode) => {
  const index = selectedMenuPermissions.value.indexOf(permCode)
  if (index > -1) {
    selectedMenuPermissions.value.splice(index, 1)
  } else {
    selectedMenuPermissions.value.push(permCode)
  }
}

const isTablePermissionEnabled = (tableName, operation) => {
  const table = selectedTablePermissions.value.find(t => t.table === tableName)
  if (!table || !table.permissions) return false
  return table.permissions[operation]?.enabled || false
}

const toggleTablePermission = (tableName, operation) => {
  const tableIndex = selectedTablePermissions.value.findIndex(t => t.table === tableName)
  
  if (tableIndex === -1) {
    selectedTablePermissions.value.push({
      table: tableName,
      permissions: {
        [operation]: {
          id: getPermissionId(tableName, operation),
          code: `${tableName}.${operation}`,
          enabled: true
        }
      }
    })
  } else {
    const current = selectedTablePermissions.value[tableIndex].permissions[operation]
    if (current && current.enabled) {
      selectedTablePermissions.value[tableIndex].permissions[operation] = { ...current, enabled: false }
    } else {
      selectedTablePermissions.value[tableIndex].permissions[operation] = {
        id: getPermissionId(tableName, operation),
        code: `${tableName}.${operation}`,
        enabled: true
      }
    }
  }
}

const getPermissionId = (tableName, operation) => {
  const table = tablePermissions.value.find(t => t.table === tableName)
  if (!table || !table.permissions) return null
  return table.permissions[operation]?.id || null
}

const formatMenuName = (code) => {
  const names = {
    dashboard: 'Dashboard',
    inventory: 'Inventario',
    stock: 'Stock',
    products: 'Productos',
    suppliers: 'Proveedores',
    sales: 'Ventas',
    settings: 'Configuración',
    users: 'Usuarios',
    roles: 'Roles y Permisos',
    company: 'Datos de Empresa',
    locations: 'Ubicaciones',
    categories: 'Categorías',
    reports: 'Reportes',
    customers: 'Clientes',
    transfers: 'Transferencias',
    sales_list: 'Lista de Ventas',
    pos: 'Punto de Venta'
  }
  return names[code] || code
}

const formatTableName = (name) => {
  return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Roles</h1>
      <p class="text-sm text-slate-500 mt-1">Gestiona los roles y permisos del sistema</p>
    </div>

    <div class="flex justify-end gap-2">
      <button @click="openCreateModal" class="btn-primary flex items-center gap-2">
        <Plus class="w-4 h-4" /> Nuevo Rol
      </button>
    </div>

    <div v-if="loading" class="text-center py-8 text-slate-500">Cargando...</div>

    <div v-else class="grid gap-4">
      <div v-for="role in roles" :key="role.id" class="card p-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
              <Shield class="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white">{{ role.name }}</h3>
              <p class="text-sm text-slate-500">{{ role.description || 'Sin descripción' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="openEditModal(role)" class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Pencil class="w-4 h-4" />
            </button>
            <button
              v-if="role.id !== 'aaaaaaaa-aaaa-0001-aaaa-aaaaaaaaaaaa'"
              @click="deleteRole(role.id)"
              class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="role.permissions?.length" class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase mb-2">Permisos de Tabla</p>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="perm in role.permissions.filter(p => !p.code.startsWith('menu.') && p.code.includes('.')).slice(0, 8)"
                  :key="perm.id"
                  class="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded"
                >
                  {{ perm.code }}
                </span>
                <span v-if="role.permissions.filter(p => !p.code.startsWith('menu.') && p.code.includes('.')).length > 8" class="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                  +{{ role.permissions.filter(p => !p.code.startsWith('menu.') && p.code.includes('.')).length - 8 }}
                </span>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500 uppercase mb-2">Permisos de Menú</p>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="perm in role.permissions.filter(p => p.code.startsWith('menu.')).slice(0, 8)"
                  :key="perm.id"
                  class="px-2 py-0.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded"
                >
                  {{ formatMenuName(perm.code.replace('menu.', '')) }}
                </span>
                <span v-if="role.permissions.filter(p => p.code.startsWith('menu.')).length > 8" class="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                  +{{ role.permissions.filter(p => p.code.startsWith('menu.')).length - 8 }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="roles.length === 0" class="text-center py-12 text-slate-500">
        No hay roles configurados
      </div>
    </div>

    <!-- ROLE MODAL -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ roleFormTitle }}</h2>
          <button @click="showModal = false" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form @submit.prevent="saveRole" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre del Rol</label>
              <input v-model="newRole.name" type="text" class="form-input" required :disabled="editingRole?.id === 'aaaaaaaa-aaaa-0001-aaaa-aaaaaaaaaaaa'" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
              <input v-model="newRole.description" type="text" class="form-input" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Permisos de Menú (Vista)
              <span class="text-xs font-normal text-slate-500">(Controla qué opciones del menú puede ver)</span>
            </label>
            <div class="space-y-4 max-h-60 overflow-y-auto">
              <div v-for="section in menuSectionsConfig" :key="section.key" class="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <h4 class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">{{ section.name }}</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <label
                    v-for="item in section.items"
                    :key="item.key"
                    class="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <input 
                      type="checkbox" 
                      :checked="isMenuPermissionEnabled(item.permission)"
                      @change="toggleMenuPermission(item.permission)"
                      class="w-4 h-4 rounded border-slate-300 text-green-500 focus:ring-green-500"
                    />
                    <span class="text-sm text-slate-700 dark:text-slate-300">{{ item.name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Permisos de Tabla (CRUD)
              <span class="text-xs font-normal text-slate-500">(Controla las operaciones en la base de datos)</span>
            </label>
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Tabla</th>
                    <th class="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                      <div class="flex items-center justify-center gap-1"><Eye class="w-3 h-3" /> Leer</div>
                    </th>
                    <th class="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                      <div class="flex items-center justify-center gap-1"><Plus class="w-3 h-3" /> Crear</div>
                    </th>
                    <th class="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                      <div class="flex items-center justify-center gap-1"><Edit class="w-3 h-3" /> Editar</div>
                    </th>
                    <th class="px-3 py-2 text-center text-xs font-semibold text-slate-500">
                      <div class="flex items-center justify-center gap-1"><Trash class="w-3 h-3" /> Eliminar</div>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-for="perm in tablePermissions" :key="perm.table" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td class="px-3 py-2 text-sm font-medium text-slate-900 dark:text-white">
                      {{ formatTableName(perm.table) }}
                    </td>
                    <td class="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        :checked="isTablePermissionEnabled(perm.table, 'read')"
                        @change="toggleTablePermission(perm.table, 'read')"
                        class="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        :checked="isTablePermissionEnabled(perm.table, 'create')"
                        @change="toggleTablePermission(perm.table, 'create')"
                        class="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        :checked="isTablePermissionEnabled(perm.table, 'update')"
                        @change="toggleTablePermission(perm.table, 'update')"
                        class="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td class="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        :checked="isTablePermissionEnabled(perm.table, 'delete')"
                        @change="toggleTablePermission(perm.table, 'delete')"
                        class="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <button type="button" @click="showModal = false" class="btn-secondary flex-1">Cancelar</button>
            <button type="submit" class="btn-primary flex-1">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

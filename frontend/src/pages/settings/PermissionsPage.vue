<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../services/api.service.js'
import { useNotificationStore } from '../../stores/notification.store.js'
import { MENU_SECTIONS, MENU_ITEMS, MENU_ICONS } from '../../config/menu.config.js'
import {
  RefreshCw, Eye, Edit, Plus, Trash, Database, LayoutGrid
} from 'lucide-vue-next'

const notify = useNotificationStore()

const tablePermissions = ref([])
const menuPermissions = ref([])
const loading = ref(true)
const activePermTab = ref('tables')

const menuSections = computed(() => {
  return MENU_SECTIONS.map(section => {
    const sectionItems = MENU_ITEMS
      .filter(item => item.section === section.key)
      .map(item => ({
        ...item,
        icon: MENU_ICONS[item.icon] || LayoutGrid,
        permission: menuPermissions.value.find(p => p.code === item.permission)
      }))
    
    return {
      ...section,
      icon: MENU_ICONS[section.icon] || LayoutGrid,
      items: sectionItems
    }
  })
})

const uncategorizedPermissions = computed(() => {
  const configuredCodes = MENU_ITEMS.map(item => item.permission)
  return menuPermissions.value.filter(p => !configuredCodes.includes(p.code))
})

const syncTablePermissions = async () => {
  try {
    await api.post('/permissions/clean-orphan')
    await api.post('/permissions/sync')
    notify.success('Permisos sincronizados y limpiados')
    await loadData()
  } catch (error) {
    notify.error('Error al sincronizar permisos')
  }
}

const syncMenuPermissions = async () => {
  try {
    await api.post('/permissions/sync-menu')
    notify.success('Permisos de menú sincronizados')
    await loadData()
  } catch (error) {
    notify.error('Error al sincronizar permisos')
  }
}

const formatTableName = (name) => {
  return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

const loadData = async () => {
  try {
    loading.value = true
    const [tablePermsRes, menuPermsRes] = await Promise.all([
      api.get('/permissions/grouped'),
      api.get('/permissions/menu')
    ])
    tablePermissions.value = tablePermsRes.data.data || []
    menuPermissions.value = menuPermsRes.data.data || []
  } catch (error) {
    notify.error('Error al cargar datos')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Permisos</h1>
      <p class="text-sm text-slate-500 mt-1">Gestiona permisos de tabla y menú del sistema</p>
    </div>

    <div v-if="loading" class="text-center py-8 text-slate-500">Cargando...</div>

    <div v-else class="space-y-4">
      <div class="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
        <button
          @click="activePermTab = 'tables'"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          :class="activePermTab === 'tables' ? 'bg-white dark:bg-slate-700 shadow text-brand-600' : 'text-slate-500'"
        >
          <Database class="w-4 h-4" /> Permisos de Tabla
        </button>
        <button
          @click="activePermTab = 'menu'"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          :class="activePermTab === 'menu' ? 'bg-white dark:bg-slate-700 shadow text-brand-600' : 'text-slate-500'"
        >
          <LayoutGrid class="w-4 h-4" /> Permisos de Menú
        </button>
      </div>

      <div v-if="activePermTab === 'tables'" class="space-y-4">
        <div class="flex justify-end">
          <button @click="syncTablePermissions" class="btn-primary flex items-center gap-2">
            <RefreshCw class="w-4 h-4" /> Sincronizar Tablas
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tabla</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                  <div class="flex items-center justify-center gap-1"><Eye class="w-3 h-3" /> Leer</div>
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                  <div class="flex items-center justify-center gap-1"><Plus class="w-3 h-3" /> Crear</div>
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                  <div class="flex items-center justify-center gap-1"><Edit class="w-3 h-3" /> Editar</div>
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                  <div class="flex items-center justify-center gap-1"><Trash class="w-3 h-3" /> Eliminar</div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="perm in tablePermissions" :key="perm.table" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  {{ formatTableName(perm.table) }}
                  <span class="text-xs text-slate-400 ml-1">{{ perm.table }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span 
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs"
                    :class="perm.permissions.read?.enabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'"
                  >
                    {{ perm.permissions.read?.enabled ? '✓' : '✗' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span 
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs"
                    :class="perm.permissions.create?.enabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'"
                  >
                    {{ perm.permissions.create?.enabled ? '✓' : '✗' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span 
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs"
                    :class="perm.permissions.update?.enabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'"
                  >
                    {{ perm.permissions.update?.enabled ? '✓' : '✗' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span 
                    class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs"
                    :class="perm.permissions.delete?.enabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'"
                  >
                    {{ perm.permissions.delete?.enabled ? '✓' : '✗' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="activePermTab === 'menu'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white">Permisos de Menú</h3>
            <p class="text-sm text-slate-500">Controlan qué opciones del menú puede ver cada rol</p>
          </div>
          <button @click="syncMenuPermissions" class="btn-primary flex items-center gap-2">
            <RefreshCw class="w-4 h-4" /> Sincronizar
          </button>
        </div>

        <div class="grid gap-6">
          <div
            v-for="section in menuSections"
            :key="section.key"
            class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div class="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="section.color">
                <component :is="section.icon" class="w-4 h-4" />
              </div>
              <h4 class="font-semibold text-slate-900 dark:text-white">{{ section.name }}</h4>
              <span class="ml-auto text-xs text-slate-500">{{ section.items?.length || 0 }} permisos</span>
            </div>

            <div class="p-4">
              <div v-if="section.items?.length > 0" class="grid gap-3">
                <div
                  v-for="item in section.items"
                  :key="item.key"
                  class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <component :is="item.icon" class="w-5 h-5 text-slate-400" />
                    <div>
                      <p class="font-medium text-slate-900 dark:text-white">{{ item.name }}</p>
                      <p class="text-xs text-slate-500">{{ item.path }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <code class="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                      {{ item.permission?.code }}
                    </code>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-slate-400 text-sm">
                No hay permisos configurados para esta sección
              </div>
            </div>
          </div>

          <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                <LayoutGrid class="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 class="font-medium text-amber-800 dark:text-amber-200">Permisos sin categorizar</h4>
                <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">Permisos de menú que no están asignados a ninguna sección del menú</p>
              </div>
            </div>
            <div class="mt-3 ml-11 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div
                v-for="perm in uncategorizedPermissions"
                :key="perm.id"
                class="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800"
              >
                <code class="text-xs text-slate-600 dark:text-slate-400">{{ perm.code }}</code>
              </div>
              <div
                v-if="uncategorizedPermissions.length === 0"
                class="col-span-full text-center text-sm text-amber-600 dark:text-amber-400 py-2"
              >
                Todos los permisos están categorizados
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

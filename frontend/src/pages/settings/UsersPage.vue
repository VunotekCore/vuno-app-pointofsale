<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import api from '../../services/api.service.js'
import { useNotificationStore } from '../../stores/notification.store.js'
import { usePhoneFormatter } from '../../utils/phone.utils.js'
import { useDebounce } from '../../composables/useDebounce.js'
import ImageUpload from '../../components/ImageUpload.vue'
import { Plus, Trash2, X, Mail, Pencil, MapPin, User, Briefcase, Phone, Calendar, Loader2, Search } from 'lucide-vue-next'

const notify = useNotificationStore()
const { formatPhoneOnBlur } = usePhoneFormatter()

const users = ref([])
const roles = ref([])
const locations = ref([])
const userLocations = ref({})
const loading = ref(true)
const showModal = ref(false)
const editingUser = ref(null)
const activeTab = ref('user')
const formData = ref({ username: '', email: '', password: '', role_id: '', location_ids: [] })
const employeeData = ref({
  first_name: '', last_name: '', phone: '', email: '', position: '', department: '',
  hire_date: '', salary: '', address: '', city: '', emergency_contact_name: '', emergency_contact_phone: ''
})
const searchQuery = ref('')
const avatarFile = ref(null)
const avatarPreview = ref('')
const saving = ref(false)

const currentPage = ref(1)
const pageLimit = ref(20)
const totalRecords = ref(0)
const totalPages = computed(() => Math.ceil(totalRecords.value / pageLimit.value))

const { debounced: debouncedSearch } = useDebounce(() => {
  currentPage.value = 1
  loadUsers()
}, 300)

const modalTitle = computed(() => editingUser.value ? 'Editar Usuario' : 'Nuevo Usuario')

const loadEmployeeData = async (userId) => {
  try {
    const response = await api.get(`/employees/user/${userId}`)
    if (response.data.data) {
      const emp = response.data.data
      employeeData.value = {
        first_name: emp.first_name || '',
        last_name: emp.last_name || '',
        phone: emp.phone || '',
        email: emp.email || '',
        address: emp.address || '',
        city: emp.city || '',
        state: emp.state || '',
        country: emp.country || '',
        postal_code: emp.postal_code || '',
        position: emp.position || '',
        department: emp.department || '',
        hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
        salary: emp.salary || '',
        emergency_contact_name: emp.emergency_contact_name || '',
        emergency_contact_phone: emp.emergency_contact_phone || ''
      }
    } else {
      resetEmployeeData()
    }
  } catch (error) {
    resetEmployeeData()
  }
}

const resetEmployeeData = () => {
  employeeData.value = {
    first_name: '', last_name: '', phone: '', email: '', position: '', department: '',
    hire_date: '', salary: '', address: '', city: '', emergency_contact_name: '', emergency_contact_phone: ''
  }
}

const saveEmployee = async (userId) => {
  try {
    const payload = {
      user_id: userId,
      first_name: employeeData.value.first_name,
      last_name: employeeData.value.last_name,
      phone: employeeData.value.phone,
      position: employeeData.value.position,
      department: employeeData.value.department,
      hire_date: employeeData.value.hire_date || null,
      salary: employeeData.value.salary || null,
      address: employeeData.value.address,
      city: employeeData.value.city,
      emergency_contact_name: employeeData.value.emergency_contact_name,
      emergency_contact_phone: employeeData.value.emergency_contact_phone
    }
    
    const existing = await api.get(`/employees/user/${userId}`)
    if (existing.data.data) {
      await api.put(`/employees/${existing.data.data.id}`, payload)
    } else {
      await api.post('/employees', payload)
    }
  } catch (error) {
    console.error('Error saving employee:', error)
    throw error
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      limit: pageLimit.value,
      offset: (currentPage.value - 1) * pageLimit.value,
      search: searchQuery.value
    }
    const response = await api.get('/users', { params })
    users.value = response.data.data || []
    totalRecords.value = response.data.total || response.data.data?.length || 0
  } catch (error) {
    notify.error(error.response?.data?.message || 'Error al cargar usuarios')
  } finally {
    loading.value = false
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadUsers()
  }
}

const loadRoles = async () => {
  try {
    const response = await api.get('/roles')
    roles.value = response.data.data || []
  } catch (error) {
    console.error('Error loading roles:', error)
  }
}

const loadLocations = async () => {
  try {
    const response = await api.get('/core/locations')
    locations.value = response.data.data || []
  } catch (error) {
    console.error('Error loading locations:', error)
  }
}

const loadUserLocations = async (userId) => {
  try {
    const response = await api.get(`/users-locations/users/${userId}/locations`)
    userLocations.value[userId] = response.data.data || []
    return userLocations.value[userId]
  } catch (error) {
    console.error('Error loading user locations:', error)
    return []
  }
}

const loadAllUserLocations = async () => {
  for (const user of users.value) {
    await loadUserLocations(user.id)
  }
}

const openCreateModal = async () => {
  if (roles.value.length === 0) {
    notify.error('Cargando roles, intenta de nuevo')
    return
  }
  editingUser.value = null
  avatarFile.value = null
  avatarPreview.value = ''
  const defaultRoleId = roles.value.find(r => r.name === 'cashier')?.id || roles.value[0]?.id
  formData.value = { username: '', email: '', password: '', role_id: defaultRoleId, location_ids: [], avatar: '' }
  resetEmployeeData()
  activeTab.value = 'user'
  showModal.value = true
}

const openEditModal = async (user) => {
  editingUser.value = user
  const userLocs = await loadUserLocations(user.id)
  avatarFile.value = null
  avatarPreview.value = user.avatar || ''
  formData.value = { 
    username: user.username, 
    email: user.email, 
    password: '', 
    role_id: user.role_id,
    location_ids: userLocs.map(ul => ul.location_id),
    avatar: user.avatar || ''
  }
  activeTab.value = 'user'
  await loadEmployeeData(user.id)
  showModal.value = true
}

const saveUser = async () => {
  try {
    saving.value = true
    let avatarUrl = formData.value.avatar || ''

    if (avatarFile.value && editingUser.value) {
      avatarUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const base64 = e.target.result
            const uploadResponse = await api.post(`/users/${editingUser.value.id}/avatar`, {
              image: base64,
              fileName: avatarFile.value.name
            })
            resolve(uploadResponse.data.data?.url || avatarUrl)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('Error al leer archivo'))
        reader.readAsDataURL(avatarFile.value)
      })
    }

    const payload = {
      username: formData.value.username,
      email: formData.value.email,
      role_id: formData.value.role_id,
      is_active: formData.value.is_active,
      location_ids: formData.value.location_ids || [],
      avatar: avatarUrl,
      employee: {
        first_name: employeeData.value.first_name,
        last_name: employeeData.value.last_name,
        phone: employeeData.value.phone,
        email: employeeData.value.email,
        address: employeeData.value.address,
        city: employeeData.value.city,
        state: employeeData.value.state,
        country: employeeData.value.country,
        postal_code: employeeData.value.postal_code,
        position: employeeData.value.position,
        department: employeeData.value.department,
        hire_date: employeeData.value.hire_date,
        salary: employeeData.value.salary,
        emergency_contact_name: employeeData.value.emergency_contact_name,
        emergency_contact_phone: employeeData.value.emergency_contact_phone
      }
    }
    if (formData.value.password) {
      payload.password = formData.value.password
    }

    if (editingUser.value) {
      await api.put(`/users/${editingUser.value.id}`, payload)
      notify.success('Usuario actualizado')
    } else {
      await api.post('/users', payload)
      notify.success('Usuario creado')
    }

    showModal.value = false
    await loadUsers()
    await loadAllUserLocations()
  } catch (error) {
    notify.error(error.response?.data?.message || 'Error al guardar usuario')
  } finally {
    saving.value = false
  }
}

const saveUserLocations = async (userId) => {
  try {
    const currentLocations = userLocations.value[userId]?.map(ul => ul.location_id) || []
    const newLocations = formData.value.location_ids || []

    const toAdd = newLocations.filter(id => !currentLocations.includes(id))
    const toRemove = currentLocations.filter(id => !newLocations.includes(id))

    for (const locationId of toAdd) {
      await api.post('/users-locations/users/locations', { 
        user_id: userId, 
        location_id: locationId 
      })
    }

    for (const locationId of toRemove) {
      await api.delete(`/users-locations/users/${userId}/locations/${locationId}`)
    }

    const defaultLocation = newLocations.find(id => 
      !currentLocations.includes(id) || 
      userLocations.value[userId]?.find(ul => ul.location_id === id && ul.is_default)
    )
    if (defaultLocation) {
      await api.put('/users-locations/users/locations/default', {
        user_id: userId,
        location_id: defaultLocation
      })
    }
  } catch (error) {
    console.error('Error saving user locations:', error)
  }
}

const deleteUser = async (id) => {
  window.$confirm(
    '¿Estás seguro de eliminar este usuario?',
    async () => {
      try {
        await api.delete(`/users/${id}`)
        notify.success('Usuario eliminado')
        await loadUsers()
      } catch (error) {
        notify.error(error.response?.data?.message || 'No tienes permiso para eliminar este usuario')
      }
    },
    { type: 'danger', title: 'Eliminar Usuario', buttonLabel: 'Eliminar' }
  )
}

const getUserLocations = (userId) => {
  return userLocations.value[userId]?.map(ul => ul.location_name).join(', ') || 'Sin asignar'
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadRoles(), loadLocations()])
  await loadAllUserLocations()
})

watch(searchQuery, () => {
  debouncedSearch()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Usuarios</h1>
        <p class="text-sm text-slate-500 mt-1">Gestiona los usuarios del sistema</p>
      </div>
      <button @click="openCreateModal" class="btn-primary">
        <Plus class="w-4 h-4" />
        Nuevo Usuario
      </button>
    </div>

    <div v-if="loading" class="text-center py-8 text-slate-500">Cargando...</div>

    <div v-else class="card overflow-hidden">
      <!-- Filters -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-700">
        <div class="relative max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por usuario o email..."
            class="w-full pl-10 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <Loader2 v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 animate-spin" />
        </div>
      </div>

      <table class="w-full">
          <thead class="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <!-- <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ID</th> -->
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Usuario</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Rol</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ubicaciones</th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <td class="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{{ user.username }}</td>
            <td class="px-6 py-4 text-sm text-slate-500 flex items-center gap-2">
              <Mail class="w-4 h-4" />
              {{ user.email }}
            </td>
            <td class="px-6 py-4 text-sm text-slate-500">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-400">
                {{ roles.find(r => r.id === user.role_id)?.name || 'Rol ' + user.role_id }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-500">
              <span class="inline-flex items-center gap-1">
                <MapPin class="w-3 h-3" />
                {{ getUserLocations(user.id) }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-1">
                <button @click="openEditModal(user)" class="p-2 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Pencil class="w-4 h-4" />
                </button>
                <button @click="deleteUser(user.id)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="users.length === 0" class="text-center py-12 text-slate-500">
        No hay usuarios
      </div>

      <!-- Pagination -->
      <div v-if="totalRecords > 0" class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
        <div class="text-sm font-medium">
          {{ totalRecords }} usuario{{ totalRecords !== 1 ? 's' : '' }} | Página {{ currentPage }} de {{ totalPages }}
        </div>
        <div v-if="totalPages > 1" class="flex items-center gap-1">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
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
              : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'"
          >
            {{ page }}
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showModal = false"></div>
      <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ modalTitle }}</h2>
          <button @click="showModal = false" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X class="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-200 dark:border-slate-700 mb-4">
          <button 
            @click="activeTab = 'user'"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'user' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700'"
          >
            <User class="w-4 h-4" />
            Usuario
          </button>
          <button 
            @click="activeTab = 'employee'"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'employee' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700'"
          >
            <Briefcase class="w-4 h-4" />
            Empleado
          </button>
        </div>

        <form @submit.prevent="saveUser" class="space-y-4">
          <!-- Tab: Usuario -->
          <div v-show="activeTab === 'user'" class="space-y-4">
            <div class="flex justify-center mb-4">
              <ImageUpload
                v-model="avatarFile"
                :preview-url="avatarPreview"
                label=""
                size="avatar"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Usuario</label>
              <input v-model="formData.username" type="text" class="form-input" required />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input v-model="formData.email" type="email" class="form-input" required />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contraseña
                <span v-if="editingUser" class="text-xs font-normal text-slate-400">(dejar vacío para no cambiar)</span>
              </label>
              <input v-model="formData.password" type="password" class="form-input" :required="!editingUser" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Rol</label>
              <select v-model="formData.role_id" class="form-input" required>
                <option v-for="role in roles" :key="role.id" :value="role.id">
                  {{ role.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ubicaciones</label>
              <div class="space-y-2 max-h-32 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg p-2">
                <label 
                  v-for="location in locations" 
                  :key="location.id"
                  class="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                >
                  <input 
                    type="checkbox" 
                    :value="location.id" 
                    v-model="formData.location_ids"
                    class="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span class="text-sm text-slate-700 dark:text-slate-300">
                    {{ location.name }} ({{ location.code }})
                  </span>
                </label>
              </div>
              <p class="text-xs text-slate-400 mt-1">Selecciona una o más ubicaciones</p>
            </div>
          </div>

          <!-- Tab: Empleado -->
          <div v-show="activeTab === 'employee'" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre(s)</label>
                <input v-model="employeeData.first_name" type="text" class="form-input" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Apellido(s)</label>
                <input v-model="employeeData.last_name" type="text" class="form-input" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                <input v-model="employeeData.phone" type="tel" class="form-input" @blur="formatPhoneOnBlur" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ciudad</label>
                <input v-model="employeeData.city" type="text" class="form-input" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Dirección</label>
              <input v-model="employeeData.address" type="text" class="form-input" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Puesto</label>
                <input v-model="employeeData.position" type="text" class="form-input" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Departamento</label>
                <input v-model="employeeData.department" type="text" class="form-input" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar class="w-4 h-4 inline mr-1" />Fecha de Contratación
                </label>
                <input v-model="employeeData.hire_date" type="date" class="form-input" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Salario</label>
                <input v-model="employeeData.salary" type="number" step="0.01" class="form-input" />
              </div>
            </div>
            <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contacto de Emergencia</p>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Nombre</label>
                  <input v-model="employeeData.emergency_contact_name" type="text" class="form-input text-sm" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-1">Teléfono</label>
                  <input v-model="employeeData.emergency_contact_phone" type="tel" class="form-input text-sm" @blur="formatPhoneOnBlur" />
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <button type="button" @click="showModal = false" class="btn-secondary flex-1" :disabled="saving">Cancelar</button>
            <button type="submit" class="btn-primary flex-1" :disabled="saving">
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin inline mr-2" />
              {{ saving ? 'Guardando...' : (editingUser ? 'Guardar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

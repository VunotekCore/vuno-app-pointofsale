<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNotificationStore } from '../../stores/notification.store.js'
import { platformService } from '../../services/platform.service.js'
import { usePhoneFormatter } from '../../utils/phone.utils.js'
import ImageUpload from '../../components/ImageUpload.vue'
import { Building2, Plus, Edit2, Trash2, Users, MapPin, ShoppingCart, Search, Star, Loader2, User, Mail, Lock, Eye, EyeOff, Shield, Phone, FileText, KeyRound } from 'lucide-vue-next'

const notification = useNotificationStore()
const { formatPhoneOnBlur } = usePhoneFormatter()

const loading = ref(false)
const companies = ref([])
const showModal = ref(false)
const editingCompany = ref(null)
const showDeleteConfirm = ref(false)
const companyToDelete = ref(null)
const searchQuery = ref('')
const companyStats = ref({})
const showPassword = ref(false)
const showPasswordFields = ref(false)
const companyAdmin = ref(null)

const form = ref({
  name: '',
  logo_url: '',
  address: '',
  phone: '',
  business_email: '',
  nit: '',
  imagekit_private_key: '',
  imagekit_url_endpoint: '',
  admin_username: '',
  admin_email: '',
  admin_password: '',
  admin_new_password: '',
  admin_confirm_password: ''
})
const logoFile = ref(null)

const filteredCompanies = computed(() => {
  if (!searchQuery.value) return companies.value
  const query = searchQuery.value.toLowerCase()
  return companies.value.filter(c => 
    c.name.toLowerCase().includes(query) || 
    c.slug.toLowerCase().includes(query)
  )
})

const isFormValid = computed(() => {
  if (!form.value.name?.trim()) return false
  if (!editingCompany.value) {
    if (!form.value.admin_username?.trim()) return false
    if (!form.value.admin_email?.trim()) return false
    if (!form.value.admin_password || form.value.admin_password.length < 6) return false
  }
  return true
})

onMounted(() => {
  loadCompanies()
})

async function loadCompanies() {
  loading.value = true
  try {
    const response = await platformService.getCompanies()
    companies.value = response.data || []
    await loadAllStats()
  } catch (error) {
    notification.error('Error al cargar empresas')
  } finally {
    loading.value = false
  }
}

async function loadAllStats() {
  for (const company of companies.value) {
    try {
      const response = await platformService.getCompanyStats(company.id)
      companyStats.value[company.id] = response.data || { users: 0, locations: 0, sales: 0 }
    } catch {
      companyStats.value[company.id] = { users: 0, locations: 0, sales: 0 }
    }
  }
}

async function openCreateModal() {
  editingCompany.value = null
  companyAdmin.value = null
  logoFile.value = null
  form.value = {
    name: '',
    logo_url: '',
    address: '',
    phone: '',
    business_email: '',
    nit: '',
    admin_username: '',
    admin_email: '',
    admin_password: '',
    admin_new_password: '',
    admin_confirm_password: ''
  }
  showModal.value = true
}

async function openEditModal(company) {
  editingCompany.value = company
  logoFile.value = null
  form.value = {
    name: company.name,
    logo_url: company.logo_url || '',
    address: company.address || '',
    phone: company.phone || '',
    business_email: company.business_email || '',
    nit: company.nit || '',
    imagekit_private_key: company.imagekit_private_key || '',
    imagekit_url_endpoint: company.imagekit_url_endpoint || '',
    admin_username: '',
    admin_email: '',
    admin_password: '',
    admin_new_password: '',
    admin_confirm_password: ''
  }
  
  try {
    const response = await platformService.getCompanyAdmin(company.id)
    companyAdmin.value = response.data?.admin || null
  } catch {
    companyAdmin.value = null
  }
  
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingCompany.value = null
  companyAdmin.value = null
  showPassword.value = false
  showPasswordFields.value = false
}

async function saveCompany() {
  if (!form.value.name.trim()) {
    notification.warning('El nombre es requerido')
    return
  }

  if (!editingCompany.value) {
    if (!form.value.admin_username?.trim()) {
      notification.warning('El nombre de usuario admin es requerido')
      return
    }
    if (!form.value.admin_email?.trim()) {
      notification.warning('El email admin es requerido')
      return
    }
    if (!form.value.admin_password || form.value.admin_password.length < 6) {
      notification.warning('La contraseña debe tener al menos 6 caracteres')
      return
    }
  }

  if (form.value.admin_new_password && form.value.admin_new_password.length < 6) {
    notification.warning('La nueva contraseña debe tener al menos 6 caracteres')
    return
  }

  if (form.value.admin_new_password && form.value.admin_new_password !== form.value.admin_confirm_password) {
    notification.warning('Las contraseñas no coinciden')
    return
  }

  loading.value = true
  try {
    let logoUrl = form.value.logo_url

    if (editingCompany.value && logoFile.value) {
      logoUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const base64 = e.target.result
            const uploadResponse = await platformService.uploadCompanyLogo(editingCompany.value.id, {
              image: base64,
              fileName: logoFile.value.name
            })
            resolve(uploadResponse.data?.url || logoUrl)
          } catch (err) {
            reject(err)
          }
        }
        reader.onerror = () => reject(new Error('Error al leer archivo'))
        reader.readAsDataURL(logoFile.value)
      })
    }

    const companyData = {
      name: form.value.name,
      logo_url: logoUrl,
      address: form.value.address,
      phone: form.value.phone,
      business_email: form.value.business_email,
      nit: form.value.nit,
      imagekit_private_key: form.value.imagekit_private_key,
      imagekit_url_endpoint: form.value.imagekit_url_endpoint
    }

    if (editingCompany.value) {
      if (form.value.admin_new_password && companyAdmin.value) {
        companyData.admin_user_id = companyAdmin.value.id
        companyData.admin_new_password = form.value.admin_new_password
      }
      await platformService.updateCompany(editingCompany.value.id, companyData)
      notification.success('Empresa actualizada')
    } else {
      const createResponse = await platformService.createCompany({
        ...companyData,
        admin_username: form.value.admin_username,
        admin_email: form.value.admin_email,
        admin_password: form.value.admin_password
      })
      
      if (logoFile.value) {
        const formData = new FormData()
        formData.append('image', logoFile.value)
        const uploadResponse = await platformService.uploadCompanyLogo(createResponse.data.id, formData)
        if (uploadResponse.data?.url) {
          await platformService.updateCompany(createResponse.data.id, { logo_url: uploadResponse.data.url })
        }
      }
      
      notification.success(`Empresa creada. Admin: ${form.value.admin_username}`)
    }
    closeModal()
    loadCompanies()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al guardar')
  } finally {
    loading.value = false
  }
}

function confirmDelete(company) {
  companyToDelete.value = company
  showDeleteConfirm.value = true
}

async function deleteCompany() {
  if (!companyToDelete.value) return
  
  loading.value = true
  try {
    await platformService.deleteCompany(companyToDelete.value.id)
    notification.success('Empresa desactivada')
    showDeleteConfirm.value = false
    companyToDelete.value = null
    loadCompanies()
  } catch (error) {
    notification.error(error.response?.data?.message || 'Error al eliminar')
  } finally {
    loading.value = false
  }
}

async function toggleActive(company) {
  try {
    await platformService.updateCompany(company.id, { is_active: company.is_active ? 0 : 1 })
    notification.success(company.is_active ? 'Empresa desactivada' : 'Empresa activada')
    loadCompanies()
  } catch (error) {
    notification.error('Error al actualizar')
  }
}

async function setAsDefault(company) {
  try {
    await platformService.updateCompany(company.id, { is_default: 1 })
    for (const c of companies.value) {
      if (c.id !== company.id) {
        c.is_default = 0
      }
    }
    company.is_default = 1
    notification.success('Empresa marcada como principal')
  } catch (error) {
    notification.error('Error al actualizar')
  }
}

function handlePhoneBlur(event) {
  formatPhoneOnBlur(event)
  form.value.phone = event.target.value
}
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Empresas Vuno-Point of Sale</h1>
        <p class="text-sm text-slate-500 mt-1">Gestionar empresas de la plataforma</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
      >
        <Plus class="w-4 h-4" />
        Nueva Empresa
      </button>
    </div>

    <div class="mb-6">
      <div class="relative max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar empresas..."
          class="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>
    </div>

    <div v-if="loading && companies.length === 0" class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 text-brand-500 animate-spin" />
    </div>

    <div v-else-if="companies.length === 0" class="text-center py-12">
      <Building2 class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p class="text-slate-500">No hay empresas registradas</p>
      <button @click="openCreateModal" class="mt-4 text-brand-500 hover:text-brand-600 font-medium">
        Crear primera empresa
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="company in filteredCompanies"
        :key="company.id"
        class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center overflow-hidden">
              <img v-if="company.logo_url" :src="company.logo_url" class="w-full h-full object-cover" />
              <Building2 v-else class="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">{{ company.name }}</h3>
              <p class="text-xs text-slate-500">{{ company.slug }}</p>
            </div>
          </div>
          <button
            @click="toggleActive(company)"
            class="px-2 py-1 rounded-lg text-xs font-medium"
            :class="company.is_active 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
          >
            {{ company.is_active ? 'Activa' : 'Inactiva' }}
          </button>
        </div>

        <div class="flex items-center gap-1 mb-4">
          <span
            v-if="company.is_default"
            class="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-medium rounded-full flex items-center gap-1"
          >
            <Star class="w-3 h-3" />
            Principal
          </span>
          <button
            v-else
            @click.stop="setAsDefault(company)"
            class="px-2 py-0.5 text-xs text-slate-400 hover:text-amber-500 transition-colors"
            title="Marcar como principal"
          >
            <Star class="w-3 h-3" />
          </button>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Users class="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p class="text-lg font-semibold text-slate-700 dark:text-slate-300">{{ companyStats[company.id]?.users || 0 }}</p>
            <p class="text-xs text-slate-500">Usuarios</p>
          </div>
          <div class="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <MapPin class="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p class="text-lg font-semibold text-slate-700 dark:text-slate-300">{{ companyStats[company.id]?.locations || 0 }}</p>
            <p class="text-xs text-slate-500">Ubicaciones</p>
          </div>
          <div class="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <ShoppingCart class="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p class="text-lg font-semibold text-slate-700 dark:text-slate-300">{{ companyStats[company.id]?.sales || 0 }}</p>
            <p class="text-xs text-slate-500">Ventas</p>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            @click="openEditModal(company)"
            class="flex-1 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
          >
            <Edit2 class="w-3 h-3" />
            Editar
          </button>
          <button
            @click="confirmDelete(company)"
            class="px-3 py-2 border border-red-200 dark:border-red-800 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            {{ editingCompany ? 'Editar Empresa' : 'Nueva Empresa' }}
          </h2>

          <div class="text-center mb-6">
            <div class="inline-block">
              <ImageUpload
                v-model="logoFile"
                :preview-url="form.logo_url"
                label=""
                size="logo"
              />
            </div>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la empresa *
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Mi Empresa S.A."
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  NIT *
                </label>
                <input
                  v-model="form.nit"
                  type="text"
                  placeholder="12345678"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <FileText class="w-4 h-4 inline mr-1" />
                Dirección
              </label>
              <input
                v-model="form.address"
                type="text"
                placeholder="Dirección de la empresa"
                class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Phone class="w-4 h-4 inline mr-1" />
                  Teléfono
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="88888888"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  @blur="handlePhoneBlur"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Mail class="w-4 h-4 inline mr-1" />
                  Correo empresarial
                </label>
                <input
                  v-model="form.business_email"
                  type="email"
                  placeholder="info@empresa.com"
                  class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div class="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <KeyRound class="w-4 h-4" />
                Configuración de ImageKit
              </h3>
              <p class="text-xs text-slate-500 mb-3">
                Configura las credenciales de ImageKit para subir imágenes de productos.
              </p>

              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ImageKit URL Endpoint
                  </label>
                  <input
                    v-model="form.imagekit_url_endpoint"
                    type="url"
                    placeholder="https://ik.imagekit.io/your-id"
                    class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ImageKit Private Key
                  </label>
                  <input
                    v-model="form.imagekit_private_key"
                    type="password"
                    placeholder="Clave privada de ImageKit"
                    class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div v-if="editingCompany" class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p class="text-xs text-slate-500 mb-1">Slug generado automáticamente</p>
              <p class="font-mono text-sm text-slate-700 dark:text-slate-300">
                {{ editingCompany.slug }}
              </p>
            </div>

            <!-- Admin Info Section (for editing existing companies) -->
            <div v-if="editingCompany && companyAdmin" class="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Shield class="w-4 h-4 text-brand-500" />
                Administrador de la empresa
              </h3>
              
              <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                <div class="flex items-center gap-2">
                  <User class="w-4 h-4 text-slate-400" />
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {{ companyAdmin.username }}
                  </span>
                  <span v-if="companyAdmin.is_active" class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    Activo
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <Mail class="w-4 h-4 text-slate-400" />
                  <span class="text-sm text-slate-600 dark:text-slate-400">
                    {{ companyAdmin.email }}
                  </span>
                </div>
              </div>
              
              <div class="mt-3">
                <div v-if="!showPasswordFields">
                  <button
                    @click="showPasswordFields = true"
                    class="text-sm text-brand-500 hover:text-brand-600 flex items-center gap-1"
                  >
                    <KeyRound class="w-4 h-4" />
                    Cambiar contraseña del admin
                  </button>
                </div>
                
                <div v-else class="space-y-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Nueva contraseña
                    </span>
                    <button
                      @click="showPasswordFields = false; form.admin_new_password = ''; form.admin_confirm_password = ''"
                      class="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Nueva contraseña *
                    </label>
                    <div class="relative">
                      <input
                        v-model="form.admin_new_password"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="Mínimo 6 caracteres"
                        class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                      />
                      <button
                        type="button"
                        @click="showPassword = !showPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
                      </button>
                    </div>
                    <p v-if="form.admin_new_password && form.admin_new_password.length < 6" class="text-xs text-red-500 mt-1">
                      Mínimo 6 caracteres
                    </p>
                  </div>
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Confirmar contraseña *
                    </label>
                    <input
                      v-model="form.admin_confirm_password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Repetir contraseña"
                      class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                    />
                    <p v-if="form.admin_confirm_password && form.admin_confirm_password !== form.admin_new_password" class="text-xs text-red-500 mt-1">
                      Las contraseñas no coinciden
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Admin User Section (only for new companies) -->
            <div v-if="!editingCompany" class="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <User class="w-4 h-4" />
                Administrador de la empresa
              </h3>

              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de usuario *
                  </label>
                  <input
                    v-model="form.admin_username"
                    type="text"
                    placeholder="admin"
                    class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Correo electrónico *
                  </label>
                  <input
                    v-model="form.admin_email"
                    type="email"
                    placeholder="admin@empresa.com"
                    class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña *
                  </label>
                  <div class="relative">
                    <input
                      v-model="form.admin_password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Mínimo 6 caracteres"
                      class="w-full px-3 py-2 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <p class="text-xs text-slate-500 mt-2">
                Con estos datos, el administrador podrá iniciar sesión en la empresa.
              </p>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button
              @click="closeModal"
              class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              @click="saveCompany"
              :disabled="loading || !isFormValid"
              class="flex-1 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              {{ editingCompany ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="showDeleteConfirm = false"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 class="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              ¿Desactivar empresa?
            </h2>
            <p class="text-slate-500 mb-6">
              La empresa "{{ companyToDelete?.name }}" será desactivada. Podrás reactivarla después.
            </p>
            <div class="flex gap-3">
              <button
                @click="showDeleteConfirm = false"
                class="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                @click="deleteCompany"
                :disabled="loading"
                class="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
                Desactivar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api.service.js'
import { useNotificationStore } from '../../stores/notification.store.js'
import { usePhoneFormatter } from '../../utils/phone.utils.js'
import { useAuthStore } from '../../stores/auth.store.js'
import ImageUpload from '../../components/ImageUpload.vue'
import { Save, Building2, Phone, Mail, FileText, Image, Loader2, Pencil, X } from 'lucide-vue-next'

const notify = useNotificationStore()
const authStore = useAuthStore()
const { formatPhoneOnBlur } = usePhoneFormatter()

const loading = ref(true)
const saving = ref(false)
const isEditing = ref(false)
const hasCompanyData = ref(false)
const formData = ref({
  name: '',
  address: '',
  phone: '',
  business_email: '',
  nit: '',
  logo_url: '',
  invoice_prefix: 'F',
  invoice_sequence: 1,
  currency_code: 'NIO',
  currency_symbol: 'C$',
  decimal_places: 2
})

const formErrors = ref({})
const logoFile = ref(null)

const validateForm = () => {
  const errors = {}

  if (!formData.value.name?.trim()) {
    errors.name = 'El nombre de la empresa es requerido'
  }
  if (!formData.value.address?.trim()) {
    errors.address = 'La dirección es requerida'
  }
  if (!formData.value.nit?.trim()) {
    errors.nit = 'El NIT es requerido'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const loadCompanyData = async () => {
  try {
    const response = await api.get('/companies')
    if (response.data.data) {
      const company = response.data.data
      formData.value = {
        name: company.name || '',
        address: company.address || '',
        phone: company.phone || '',
        business_email: company.business_email || '',
        nit: company.nit || '',
        logo_url: company.logo_url || '',
        invoice_prefix: company.invoice_prefix || 'F',
        invoice_sequence: company.invoice_sequence || 1,
        currency_code: company.currency_code || 'NIO',
        currency_symbol: company.currency_symbol || 'C$',
        decimal_places: company.decimal_places || 2
      }
      hasCompanyData.value = true
    }
  } catch (error) {
    console.error('Error loading company data:', error)
    notify.error('Error al cargar los datos')
  } finally {
    loading.value = false
  }
}

const startEditing = () => {
  logoFile.value = null
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  loadCompanyData()
}

const saveCompanyData = async () => {
  if (!validateForm()) {
    const firstError = Object.values(formErrors.value)[0]
    notify.error(firstError)
    return
  }

  saving.value = true
  try {
    let logoUrl = formData.value.logo_url

    if (logoFile.value) {
      const formDataImg = new FormData()
      formDataImg.append('image', logoFile.value)
      const uploadResponse = await api.uploadCompanyLogo(formDataImg)
      logoUrl = uploadResponse.data?.url || logoUrl
    }

    const data = {
      name: formData.value.name,
      address: formData.value.address,
      phone: formData.value.phone,
      business_email: formData.value.business_email,
      nit: formData.value.nit,
      logo_url: logoUrl,
      invoice_prefix: formData.value.invoice_prefix || 'F',
      invoice_sequence: formData.value.invoice_sequence ? parseInt(formData.value.invoice_sequence) : 1,
      currency_code: formData.value.currency_code || 'NIO',
      currency_symbol: formData.value.currency_symbol || 'C$',
      decimal_places: formData.value.decimal_places || 2
    }
    await api.put('/companies', data)
    formData.value.logo_url = logoUrl
    notify.success('Datos guardados exitosamente')
    formErrors.value = {}
    isEditing.value = false
    hasCompanyData.value = true
  } catch (error) {
    console.error('Error saving company data:', error)
    if (error.response?.data?.errors) {
      formErrors.value = error.response.data.errors
      const firstError = Object.values(error.response.data.errors)[0]
      notify.error(firstError)
    } else {
      notify.error(error.response?.data?.message || 'Error al guardar los datos')
    }
  } finally {
    saving.value = false
  }
}

onMounted(loadCompanyData)
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Datos de la Empresa</h1>
        <p class="text-sm text-slate-500 mt-1">Configura los datos de tu empresa</p>
      </div>
      <div class="flex gap-2" v-if="hasCompanyData && !isEditing">
        <button @click="startEditing" class="btn-secondary">
          <Pencil class="w-4 h-4 mr-2" />
          Editar Datos
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-brand-500" />
    </div>

    <div v-else class="max-w-4xl mx-auto">
      <form @submit.prevent="saveCompanyData" class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        <div class="text-center mb-6">
          <div class="inline-block">
            <ImageUpload
              v-model="logoFile"
              :preview-url="formData.logo_url"
              label="Logo de la empresa"
              size="logo"
              :disabled="!isEditing"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <Building2 class="w-4 h-4 inline mr-1" />
              Nombre de la Empresa <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="formData.name" 
              type="text" 
              class="input-field"
              :class="{ 'border-red-500': formErrors.name }"
              placeholder="Nombre de tu empresa"
              :disabled="!isEditing"
            />
            <p v-if="formErrors.name" class="text-red-500 text-xs mt-1">{{ formErrors.name }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <FileText class="w-4 h-4 inline mr-1" />
              NIT <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="formData.nit" 
              type="text" 
              class="input-field"
              :class="{ 'border-red-500': formErrors.nit }"
              placeholder="Número de NIT"
              :disabled="!isEditing"
            />
            <p v-if="formErrors.nit" class="text-red-500 text-xs mt-1">{{ formErrors.nit }}</p>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Dirección <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="formData.address" 
              type="text" 
              class="input-field"
              :class="{ 'border-red-500': formErrors.address }"
              placeholder="Dirección completa"
              :disabled="!isEditing"
            />
            <p v-if="formErrors.address" class="text-red-500 text-xs mt-1">{{ formErrors.address }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <Phone class="w-4 h-4 inline mr-1" />
              Teléfono
            </label>
            <input v-model="formData.phone" type="tel" class="input-field" placeholder="Número de teléfono" :disabled="!isEditing" @blur="formatPhoneOnBlur" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <Mail class="w-4 h-4 inline mr-1" />
              Correo Electrónico
            </label>
            <input v-model="formData.business_email" type="email" class="input-field" placeholder="correo@empresa.com" :disabled="!isEditing" />
          </div>
        </div>

        <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h3 class="font-semibold text-slate-900 dark:text-white mb-4">
            <FileText class="w-4 h-4 inline mr-1" />
            Configuración de Facturación
          </h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Configura el prefijo y el número inicial para las facturas.
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prefijo de Factura</label>
              <input v-model="formData.invoice_prefix" type="text" class="input-field" placeholder="F" :disabled="!isEditing" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número de Secuencia</label>
              <input v-model="formData.invoice_sequence" type="number" class="input-field" placeholder="1" :disabled="!isEditing" />
            </div>
          </div>
        </div>

        <div v-if="isEditing" class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button type="button" @click="cancelEditing" class="btn-secondary">
            <X class="w-4 h-4 mr-2" />
            Cancelar
          </button>
          <button type="submit" :disabled="saving" class="btn-primary">
            <Save class="w-4 h-4 mr-2" />
            {{ saving ? 'Guardando...' : 'Guardar Datos' }}
          </button>
        </div>
        <div v-else-if="!hasCompanyData" class="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button type="submit" :disabled="saving" class="btn-primary">
            <Save class="w-4 h-4 mr-2" />
            {{ saving ? 'Guardando...' : 'Guardar Datos' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

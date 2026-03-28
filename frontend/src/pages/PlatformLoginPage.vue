<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlatformAuthStore } from '../stores/platform-auth.store.js'
import { Building2, Loader2, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const platformAuth = usePlatformAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  
  if (!email.value || !password.value) {
    error.value = 'Email y contraseña son requeridos'
    return
  }

  loading.value = true
  try {
    const result = await platformAuth.login(email.value, password.value)
    if (result.success) {
      router.push('/settings/companies')
    } else {
      error.value = result.message
    }
  } catch (err) {
    error.value = 'Error de conexión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white mb-2">Plataforma Vuno-Point of Sale</h1>
        <p class="text-slate-400">Administración de empresas</p>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-6 text-center">
          Iniciar Sesión
        </h2>

        <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              v-model="email"
              type="email"
              placeholder="admin@vuno.com"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <router-link 
            to="/login" 
            class="text-sm text-brand-500 hover:text-brand-600"
          >
            ¿Acceso de empresa? Iniciar sesión aquí
          </router-link>
        </div>
      </div>

      <p class="text-center text-slate-500 text-sm mt-6">
        © 2024 Vuno Tek. Todos los derechos reservados.
      </p>
    </div>
  </div>
</template>

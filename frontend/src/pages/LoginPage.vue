<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store.js'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Por favor ingresa usuario y contraseña'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.login(username.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex w-full bg-white dark:bg-slate-950">
    <div class="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
      <div class="absolute inset-0 opacity-20">
        <svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad)" />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color: #0b9257; stop-opacity: 1" />
              <stop offset="100%" style="stop-color: #020617; stop-opacity: 1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div class="relative z-10 flex items-center gap-3">
        <img src="https://ik.imagekit.io/vijys5g3r/logos/logoVunoCore.webp" alt="" class="w-100 h-100 object-contain">
        <span class="font-bold text-2xl tracking-tight">PointOfSale<span class="text-brand-500">.</span></span>
      </div>

      <div class="relative z-10 max-w-md">
        <blockquote class="text-2xl font-medium leading-relaxed mb-6">
          "Sistema de gestión de punto de venta. Controla tu negocio de manera eficiente."
        </blockquote>
        <!-- <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-brand-400">
            V3
          </div>
          <div>
            <p class="font-semibold text-sm">Vue 3 + Tailwind</p>
            <p class="text-slate-400 text-xs">v1.0.0</p>
          </div>
        </div> -->
      </div>

      <p class="relative z-10 text-xs text-slate-500">© {{ new Date().getFullYear() }} Point Of Sale. Vunotek - All rights reserved</p>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
      <div class="w-full max-w-md space-y-8">
        <div class="lg:hidden flex justify-center mb-8">
          <div class="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            POS
          </div>
        </div>

        <div class="text-center lg:text-left">
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bienvenido
          </h1>
          <p class="mt-2 text-slate-500 dark:text-slate-400">
            Ingresa tus credenciales para acceder.
          </p>
        </div>

        <div v-if="error" class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle class="w-5 h-5 flex-shrink-0" />
          <span class="text-sm font-medium">{{ error }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Usuario</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail class="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              </div>
              <input
                v-model="username"
                type="text"
                required
                class="form-input pl-10"
                placeholder="admin"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              </div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="form-input pl-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <component :is="showPassword ? EyeOff : Eye" class="h-5 w-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full py-3.5"
          >
            <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
            <span v-else class="flex items-center">
              Iniciar Sesión <ArrowRight class="ml-2 w-4 h-4" />
            </span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

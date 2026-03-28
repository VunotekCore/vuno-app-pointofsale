<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlatformAuthStore } from '../stores/platform-auth.store.js'
import { Building2, Crown, LogOut, Loader2 } from 'lucide-vue-next'

const platformAuth = usePlatformAuthStore()
const router = useRouter()

const loading = ref(false)

onMounted(() => {
  if (!platformAuth.token || !platformAuth.isSuperAdmin) {
    router.push('/platform/login')
  }
})

function handleLogout() {
  platformAuth.logout()
  router.push('/platform/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Building2 class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-lg font-bold text-slate-900 dark:text-white">Gestión Multi Empresa.</h1>
              <p class="text-xs text-slate-500">Gestión de Empresas</p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Crown class="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span class="text-sm font-medium text-amber-700 dark:text-amber-300">
                {{ platformAuth.user?.name || 'Super Admin' }}
              </span>
            </div>
            <button
              @click="handleLogout"
              class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut class="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>
  </div>
</template>

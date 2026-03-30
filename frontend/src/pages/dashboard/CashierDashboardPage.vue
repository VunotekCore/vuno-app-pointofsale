<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { dashboardService } from '../../services/dashboard.service.js'
import {
  ShoppingCart,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Award
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const currencyStore = useCurrencyStore()

const loading = ref(true)
const dashboard = ref(null)

const today = new Date()
const formattedTime = today.toLocaleTimeString('es-ES', {
  hour: '2-digit',
  minute: '2-digit'
})
const formattedDate = today.toLocaleDateString('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short'
})

const formatCurrency = (value) => currencyStore.formatMoney(value)
const formatNumber = (value) => currencyStore.formatNumber(value)

const fetchDashboard = async () => {
  loading.value = true
  try {
    const response = await dashboardService.getCashierDashboard()
    dashboard.value = response.data.data
  } catch (error) {
    console.error('Error loading cashier dashboard:', error)
  } finally {
    loading.value = false
  }
}

const goToPOS = () => {
  router.push('/pos')
}

onMounted(async () => {
  await currencyStore.loadConfig()
  await fetchDashboard()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ formattedDate }}</p>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Hola, <span class="text-brand-500">{{ authStore.user?.username || 'Cajero' }}</span>
          </h1>
        </div>
        <div class="text-right">
          <p class="text-2xl md:text-3xl font-bold text-brand-600 dark:text-brand-400">{{ formattedTime }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">Punto de Venta</p>
        </div>
      </div>

      <button
        @click="goToPOS"
        class="w-full py-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-3 group"
      >
        <ShoppingCart class="w-8 h-8 group-hover:scale-110 transition-transform" />
        <span class="text-xl font-bold">VENDER AHORA</span>
      </button>

      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
      </div>

      <template v-else-if="dashboard">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="card p-5 bg-gradient-to-br from-brand-500 to-brand-600 text-white">
            <div class="flex items-center gap-2 mb-3">
              <Target class="w-5 h-5 opacity-80" />
              <span class="text-xs opacity-80">Ventas Hoy</span>
            </div>
            <p class="text-2xl md:text-3xl font-bold">{{ formatCurrency(dashboard.daily?.total_sales) }}</p>
            <p class="text-xs opacity-80 mt-1">{{ dashboard.daily?.transactions || 0 }} transacciones</p>
          </div>

          <div class="card p-5">
            <div class="flex items-center gap-2 mb-3">
              <TrendingUp class="w-5 h-5 text-green-500" />
              <span class="text-xs text-slate-500 dark:text-slate-400">Mes Actual</span>
            </div>
            <p class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{{ formatCurrency(dashboard.month?.total_sales) }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ dashboard.month?.transactions || 0 }} transacciones</p>
          </div>

          <div class="card p-5 col-span-2 md:col-span-1">
            <div class="flex items-center gap-2 mb-3">
              <Clock class="w-5 h-5 text-blue-500" />
              <span class="text-xs text-slate-500 dark:text-slate-400">Tiempo Promedio</span>
            </div>
            <p class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{{ dashboard.average_transaction_time?.average_formatted || '0m 0s' }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">por transacción</p>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap class="w-5 h-5 text-yellow-500" />
            Resumen Rápido
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
              <p class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">{{ dashboard.daily?.transactions || 0 }}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Transacciones Hoy</p>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
              <p class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">
                {{ formatCurrency(dashboard.daily?.total_sales && dashboard.daily?.transactions > 0 ? dashboard.daily.total_sales / dashboard.daily.transactions : 0) }}
              </p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Ticket Promedio</p>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Award class="w-5 h-5 text-purple-500" />
            Progreso del Mes
          </h3>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-600 dark:text-slate-400">Transacciones</span>
                <span class="font-medium text-slate-900 dark:text-white">{{ dashboard.month?.transactions || 0 }}</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  class="bg-brand-500 h-3 rounded-full transition-all"
                  style="width: 100%"
                ></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-600 dark:text-slate-400">Monto Total</span>
                <span class="font-medium text-slate-900 dark:text-white">{{ formatCurrency(dashboard.month?.total_sales) }}</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div
                  class="bg-green-500 h-3 rounded-full transition-all"
                  style="width: 100%"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="card p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
        <p class="text-sm text-brand-700 dark:text-brand-400 text-center">
          Usa el botón <strong>VENDER AHORA</strong> para iniciar una nueva transacción
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store.js'
import AdminDashboardPage from './dashboard/AdminDashboardPage.vue'

const router = useRouter()
const authStore = useAuthStore()

const today = new Date()
const formattedDate = today.toLocaleDateString('es-ES', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const greeting = computed(() => {
  const hour = today.getHours()
  if (hour < 12) return 'Buenos días '
  if (hour < 18) return 'Buenas tardes '
  return 'Buenas noches '
})

const userRole = computed(() => {
  return authStore.user?.role_name?.toLowerCase() || authStore.user?.role?.toLowerCase() || ''
})

const isAdmin = computed(() => {
  return authStore.user?.is_admin == 1 || userRole.value === 'admin'
})

const isManager = computed(() => {
  return userRole.value === 'manager' || isAdmin.value
})

const isCashier = computed(() => {
  return userRole.value === 'cashier' && !isManager.value
})

onMounted(() => {
  if (!isAdmin.value) {
    if (userRole.value === 'manager') {
      router.push('/dashboard/manager')
    } else if (userRole.value === 'cashier') {
      router.push('/dashboard/cashier')
    }
  }
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">
          {{ formattedDate }}
        </p>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
          {{ greeting }},&nbsp;<span class="text-brand-500">{{ authStore.user?.username || 'Usuario' }}</span>
        </h1>
      </div>
      
    </div>
    

    <AdminDashboardPage v-if="isAdmin" />

    <div v-if="!isAdmin" class="card p-8 text-center">
      <p class="text-slate-500">Redirigiendo a tu dashboard...</p>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeInUp 0.4s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

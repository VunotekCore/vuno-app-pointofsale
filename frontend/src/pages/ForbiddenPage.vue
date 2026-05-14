<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="text-center px-6">
      <div class="text-8xl font-bold text-red-500 dark:text-red-400 mb-4">403</div>
      <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Acceso denegado</h1>
      <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        No tienes permisos suficientes para acceder a esta página.
        Contacta al administrador si crees que esto es un error.
      </p>
      <button
        @click="goBack"
        class="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
      >
        Volver al inicio
      </button>
    </div>
  </div>
</template>

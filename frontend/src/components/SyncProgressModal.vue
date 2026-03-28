<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="handleClose"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl">
          <div class="text-center">
            <div v-if="status === 'syncing'" class="mb-4">
              <Loader2 class="w-16 h-16 text-brand-500 mx-auto animate-spin" />
            </div>
            <div v-else-if="status === 'success'" class="mb-4">
              <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle class="w-10 h-10 text-green-500" />
              </div>
            </div>
            <div v-else-if="status === 'error'" class="mb-4">
              <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle class="w-10 h-10 text-red-500" />
              </div>
            </div>

            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {{ title }}
            </h3>
            
            <p class="text-slate-600 dark:text-slate-400 mb-4">
              {{ message }}
            </p>

            <div v-if="status === 'syncing'" class="mb-4">
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div 
                  class="bg-brand-500 h-full rounded-full transition-all duration-300"
                  :style="{ width: `${progressPercent}%` }"
                ></div>
              </div>
              <p class="text-sm text-slate-500 mt-2">
                {{ progress }} de {{ total }}
              </p>
            </div>

            <div v-if="status === 'success' && stats" class="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div class="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p class="text-2xl font-bold text-green-600">{{ stats.synced }}</p>
                  <p class="text-xs text-slate-500">Sincronizadas</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-red-600">{{ stats.failed }}</p>
                  <p class="text-xs text-slate-500">Fallidas</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-slate-600">{{ stats.total }}</p>
                  <p class="text-xs text-slate-500">Total</p>
                </div>
              </div>
            </div>

            <div v-if="status === 'error' && errorMessage" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
            </div>

            <div class="flex gap-3">
              <button
                v-if="status !== 'syncing'"
                @click="handleClose"
                class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cerrar
              </button>
              <button
                v-if="status === 'error'"
                @click="$emit('retry')"
                class="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw class="w-4 h-4" />
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-vue-next'
import { useOfflineStore } from '../stores/offline.store.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  autoClose: {
    type: Boolean,
    default: true
  },
  autoCloseDelay: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close', 'retry'])

const offlineStore = useOfflineStore()

const status = computed(() => {
  if (offlineStore.isSyncing) return 'syncing'
  if (offlineStore.lastSyncResult) {
    return offlineStore.lastSyncResult.failed > 0 ? 'error' : 'success'
  }
  return 'idle'
})

const title = computed(() => {
  switch (status.value) {
    case 'syncing': return 'Sincronizando...'
    case 'success': return 'Sincronización Completa'
    case 'error': return 'Sincronización con Errores'
    default: return 'Estado de Sincronización'
  }
})

const message = computed(() => {
  switch (status.value) {
    case 'syncing': return 'Guardando ventas en el servidor...'
    case 'success': return 'Todas las ventas se han sincronizado correctamente.'
    case 'error': return 'Algunas ventas no pudieron sincronizarse.'
    default: return ''
  }
})

const progress = computed(() => {
  if (offlineStore.syncProgress.current > 0) {
    return offlineStore.syncProgress.current
  }
  return 0
})

const total = computed(() => {
  if (offlineStore.syncProgress.total > 0) {
    return offlineStore.syncProgress.total
  }
  if (offlineStore.lastSyncResult) {
    return offlineStore.lastSyncResult.synced + offlineStore.lastSyncResult.failed
  }
  return offlineStore.pendingCount
})

const progressPercent = computed(() => {
  if (total.value === 0) return 0
  return Math.round((progress.value / total.value) * 100)
})

const stats = computed(() => {
  if (offlineStore.lastSyncResult) {
    return {
      synced: offlineStore.lastSyncResult.synced,
      failed: offlineStore.lastSyncResult.failed,
      total: offlineStore.lastSyncResult.synced + offlineStore.lastSyncResult.failed
    }
  }
  return null
})

const errorMessage = computed(() => {
  if (status.value === 'error' && offlineStore.syncError) {
    return offlineStore.syncError
  }
  return null
})

function handleClose() {
  emit('close')
}

watch(() => props.show, (newVal) => {
  if (newVal && props.autoClose && status.value === 'success') {
    setTimeout(() => {
      emit('close')
    }, props.autoCloseDelay)
  }
})

onUnmounted(() => {
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative {
  transform: scale(0.95);
}

.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>

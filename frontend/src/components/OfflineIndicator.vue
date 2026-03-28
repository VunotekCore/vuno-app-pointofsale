<template>
  <Teleport to="body">
    <Transition name="slide">
      <div v-if="!isOnline" class="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
        <div class="flex items-center justify-center gap-2">
          <WifiOff :size="16" />
          <span>Modo offline - Las ventas se guardarán localmente</span>
          <span v-if="pendingCount > 0" class="ml-2 bg-amber-600 px-2 py-0.5 rounded text-xs">
            {{ pendingCount }} pendiente(s)
          </span>
        </div>
      </div>
    </Transition>
    
    <Transition name="slide">
      <div v-if="isOnline && showReconnected" class="fixed top-0 left-0 right-0 z-[9999] bg-green-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
        <div class="flex items-center justify-center gap-2">
          <Wifi :size="16" />
          <span>Conexión restaurada - {{ pendingCount }} venta(s) pendiente(s) de sincronizar</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Wifi, WifiOff } from 'lucide-vue-next'
import { useOfflineStore } from '../stores/offline.store.js'

const offlineStore = useOfflineStore()
const { isOnline, pendingCount } = storeToRefs(offlineStore)
const showReconnected = ref(false)

watch(isOnline, (newVal, oldVal) => {
  if (newVal && !oldVal && pendingCount.value > 0) {
    showReconnected.value = true
    setTimeout(() => {
      showReconnected.value = false
    }, 5000)
  }
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>

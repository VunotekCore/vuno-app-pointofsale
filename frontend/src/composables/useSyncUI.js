import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useOfflineStore } from '../stores/offline.store.js'

const showModal = ref(false)
const lastAutoClose = ref(null)

export function useSyncUI() {
  const offlineStore = useOfflineStore()

  function openModal() {
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
  }

  function retrySync() {
    offlineStore.syncPendingSales()
  }

  watch(() => offlineStore.isSyncing, (syncing) => {
    if (syncing) {
      showModal.value = true
    }
  })

  watch(() => offlineStore.lastSyncResult, (result) => {
    if (result) {
      showModal.value = true
      
      if (result.failed === 0) {
        lastAutoClose.value = setTimeout(() => {
          showModal.value = false
        }, 3000)
      }
    }
  })

  onUnmounted(() => {
    if (lastAutoClose.value) {
      clearTimeout(lastAutoClose.value)
    }
  })

  return {
    showModal,
    openModal,
    closeModal,
    retrySync
  }
}

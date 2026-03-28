import { useOfflineStore } from '../stores/offline.store.js'

export function useOfflinePlugin() {
  const offlineStore = useOfflineStore()
  
  offlineStore.initialize()
  
  return {
    isOnline: offlineStore.isOnline,
    hasPendingSync: offlineStore.hasPendingSync,
    pendingCount: offlineStore.pendingCount
  }
}

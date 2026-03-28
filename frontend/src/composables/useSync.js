import { ref, onMounted, onUnmounted } from 'vue'
import { syncManager } from '../lib/sync-manager.js'
import { cacheService } from '../services/cache.service.js'

export function useSync() {
  const isSyncing = ref(false)
  const syncProgress = ref({ synced: 0, failed: 0, total: 0 })
  const lastSyncResult = ref(null)
  const unsubscribe = ref(null)

  onMounted(() => {
    syncManager.initialize()
    
    unsubscribe.value = syncManager.onSyncProgress((event) => {
      switch (event.type) {
        case 'start':
          isSyncing.value = true
          syncProgress.value = { synced: 0, failed: 0, total: event.count }
          break
        case 'progress':
          syncProgress.value = {
            synced: event.synced,
            failed: event.failed,
            total: event.total
          }
          break
        case 'complete':
          isSyncing.value = false
          lastSyncResult.value = {
            synced: event.synced,
            failed: event.failed,
            timestamp: new Date()
          }
          break
        case 'error':
          console.error('Sync error:', event.error)
          break
      }
    })
  })

  onUnmounted(() => {
    if (unsubscribe.value) {
      unsubscribe.value()
    }
  })

  async function startSync() {
    return await syncManager.processQueue()
  }

  async function retryFailed() {
    return await syncManager.retryFailed()
  }

  async function getPendingCount() {
    const pending = await cacheService.getPendingSync()
    return pending.length
  }

  async function getSyncHistory() {
    return await cacheService.getSyncHistory()
  }

  return {
    isSyncing,
    syncProgress,
    lastSyncResult,
    startSync,
    retryFailed,
    getPendingCount,
    getSyncHistory
  }
}

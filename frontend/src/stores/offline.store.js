import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { cacheService } from '../services/cache.service.js'
import { syncManager } from '../lib/sync-manager.js'
import { getDatabaseSize } from '../lib/offline-db.js'

const isOnline = ref(navigator.onLine)

window.addEventListener('online', () => {
  isOnline.value = true
})

window.addEventListener('offline', () => {
  isOnline.value = false
})

export const useOfflineStore = defineStore('offline', () => {
  const isSyncing = ref(false)
  const lastSync = ref(null)
  const pendingCount = ref(0)
  const syncError = ref(null)
  const dbStats = ref({ items: 0, categories: 0, customers: 0, stock: 0 })
  const syncProgress = ref({ current: 0, total: 0, message: '' })
  const lastSyncResult = ref(null)

  const hasPendingSync = computed(() => pendingCount.value > 0)

  const syncStatus = computed(() => {
    if (isSyncing.value) return 'syncing'
    if (syncError.value) return 'error'
    if (hasPendingSync.value) return 'pending'
    return 'synced'
  })

  async function initialize() {
    isOnline.value = navigator.onLine
    await refreshStats()
    
    syncManager.initialize()
    syncManager.onSyncProgress(handleSyncProgress)
  }

  function handleSyncProgress(event) {
    switch (event.type) {
      case 'start':
        isSyncing.value = true
        syncProgress.value = { current: 0, total: event.count, message: 'Sincronizando ventas...' }
        break
      case 'progress':
        syncProgress.value = {
          current: event.synced + event.failed,
          total: event.total,
          message: `Sincronizando ${event.synced + event.failed}/${event.total}`
        }
        break
      case 'complete':
        isSyncing.value = false
        lastSyncResult.value = { synced: event.synced, failed: event.failed, timestamp: new Date() }
        syncProgress.value = { current: 0, total: 0, message: '' }
        refreshStats()
        break
      case 'error':
        syncError.value = event.error
        break
    }
  }

  async function refreshStats() {
    dbStats.value = await getDatabaseSize()
    const pending = await cacheService.getPendingSync()
    pendingCount.value = pending.length
    lastSync.value = await cacheService.getLastSyncInfo()
  }

  async function syncAll(locationId = null) {
    if (isSyncing.value) return { success: false, error: 'Ya hay una sincronización en progreso' }
    
    isSyncing.value = true
    syncError.value = null
    syncProgress.value = { current: 0, total: 4, message: 'Sincronizando...' }
    
    try {
      syncProgress.value.message = 'Sincronizando productos...'
      syncProgress.value.current = 1
      await cacheService.syncItems(locationId)
      
      syncProgress.value.message = 'Sincronizando categorías...'
      syncProgress.value.current = 2
      await cacheService.syncCategories()
      
      syncProgress.value.message = 'Sincronizando clientes...'
      syncProgress.value.current = 3
      await cacheService.syncCustomers()
      
      if (locationId) {
        syncProgress.value.message = 'Sincronizando inventario...'
        syncProgress.value.current = 4
        await cacheService.syncStock(locationId)
      }
      
      await refreshStats()
      
      syncProgress.value.message = 'Sincronización completa'
      return { success: true }
    } catch (error) {
      syncError.value = error.message
      return { success: false, error: error.message }
    } finally {
      isSyncing.value = false
      syncProgress.value = { current: 0, total: 0, message: '' }
    }
  }

  async function syncItems(locationId) {
    isSyncing.value = true
    try {
      const result = await cacheService.syncItems(locationId)
      await refreshStats()
      return result
    } finally {
      isSyncing.value = false
    }
  }

  async function syncPendingSales() {
    return await syncManager.processQueue()
  }

  return {
    isOnline: readonly(isOnline),
    isSyncing,
    lastSync,
    pendingCount,
    syncError,
    dbStats,
    syncProgress,
    hasPendingSync,
    syncStatus,
    lastSyncResult,
    initialize,
    refreshStats,
    syncAll,
    syncItems,
    syncPendingSales
  }
})
